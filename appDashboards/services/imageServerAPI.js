import axios from "axios";
import { getCurrentStore } from "../helpers/redux/store";
import { SERVICE_TYPE_IMAGE_SERVER } from "../constants/microserviceTypes";
import { getMicroserviceBaseUrl } from "../utils/microserviceUrlUtils";
import { getHostName } from "../utils/hostnameUtils";

const IMAGE_SERVER_API_PATH = "/api/v1";

export const IMAGE_ENTITY_TYPES = Object.freeze({
    DASHBOARD: "dashboard",
    PANEL: "panel",
});

export const IMAGE_REFERENCE_PURPOSE = Object.freeze({
    CONTENT: "content",
    PREVIEW: "preview",
});

const imageServerClient = axios.create({
    timeout: 30_000,
    headers: { Accept: "application/json" },
});

const getImageServerApiBaseUrl = () => {
    const configuredRoot =
        getMicroserviceBaseUrl({
            serviceTypes: SERVICE_TYPE_IMAGE_SERVER,
            hostName: getHostName(),
        }) || process.env.NEXT_PUBLIC_IMAGE_SERVER_BASE_URL;

    if (!configuredRoot) {
        throw new Error("Image Server base URL is not available.");
    }

    const root = configuredRoot.replace(/\/+$/, "");
    return root.endsWith(IMAGE_SERVER_API_PATH)
        ? `${root}/`
        : `${root}${IMAGE_SERVER_API_PATH}/`;
};

const getAuthToken = (token) => {
    if (token) return token;

    const storeToken = getCurrentStore()?.getState()?.user?.[0]?.userID;
    if (storeToken) return storeToken;

    throw new Error("An authenticated user token is required.");
};

const getErrorMessage = (error) =>
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.response?.data?.msg ||
    "The Image Server request failed.";

const request = async ({
    method,
    path,
    data,
    params,
    token,
    signal,
    returnResponse = false,
}) => {
    try {
        const response = await imageServerClient.request({
            method,
            url: `${getImageServerApiBaseUrl()}${path}`,
            data,
            params,
            signal,
            headers: {
                Authorization: `Bearer ${getAuthToken(token)}`,
            },
        });
        return returnResponse ? response : response.data;
    } catch (error) {
        if (axios.isCancel(error) || error?.code === "ERR_CANCELED") {
            throw error;
        }
        throw new Error(getErrorMessage(error));
    }
};

export const uploadImage = async ({
    file,
    token,
    signal,
} = {}) => {
    if (!file || typeof file.size !== "number" || typeof file.type !== "string") {
        throw new TypeError("file must be a valid image Blob.");
    }

    const formData = new FormData();
    formData.append("file", file, file.name || "upload");

    return request({
        method: "POST",
        path: "images",
        data: formData,
        token,
        signal,
    });
};

export const listImages = async ({
    offset = 0,
    limit = 50,
    q = "",
    processingProfile = "generic",
    token,
    signal,
} = {}) => {
    const search = typeof q === "string" ? q.trim() : "";
    const response = await request({
        method: "GET",
        path: "images",
        params: {
            offset,
            limit,
            ...(search ? { q: search } : {}),
            ...(processingProfile ? { processing_profile: processingProfile } : {}),
        },
        token,
        signal,
        returnResponse: true,
    });
    const total = Number(response.headers?.["x-total-count"]);

    return {
        images: Array.isArray(response.data) ? response.data : [],
        total: Number.isFinite(total) ? total : 0,
    };
};

export const getImageFileUrl = (imageId) => {
    if (
        imageId === undefined ||
        imageId === null ||
        String(imageId).trim() === ""
    ) {
        throw new TypeError("imageId is required to build an image URL.");
    }

    return `${getImageServerApiBaseUrl()}images/${encodeURIComponent(String(imageId))}/file`;
};

const validateImageReference = ({
    imageId,
    entityType,
    entityId,
    purpose,
}) => {
    if (imageId === undefined || imageId === null || String(imageId).trim() === "") {
        throw new TypeError("imageId is required.");
    }
    if (!Object.values(IMAGE_ENTITY_TYPES).includes(entityType)) {
        throw new TypeError(
            `entityType must be one of: ${Object.values(IMAGE_ENTITY_TYPES).join(", ")}.`
        );
    }
    if (
        entityId === undefined ||
        entityId === null ||
        String(entityId).trim() === ""
    ) {
        throw new TypeError("entityId is required.");
    }
    if (!Object.values(IMAGE_REFERENCE_PURPOSE).includes(purpose)) {
        throw new TypeError(
            `purpose must be one of: ${Object.values(IMAGE_REFERENCE_PURPOSE).join(", ")}.`
        );
    }
};

export const linkImage = async ({
    imageId,
    entityType,
    entityId,
    purpose,
    token,
    signal,
} = {}) => {
    validateImageReference({ imageId, entityType, entityId, purpose });

    return request({
        method: "POST",
        path: `images/${encodeURIComponent(String(imageId))}/references`,
        data: {
            entity_type: entityType,
            entity_id: String(entityId),
            purpose,
        },
        token,
        signal,
    });
};

export const unlinkImage = async ({
    imageId,
    entityType,
    entityId,
    purpose,
    token,
    signal,
} = {}) => {
    validateImageReference({ imageId, entityType, entityId, purpose });

    return request({
        method: "DELETE",
        path: `images/${encodeURIComponent(String(imageId))}/references`,
        params: {
            entity_type: entityType,
            entity_id: String(entityId),
            purpose,
        },
        token,
        signal,
    });
};

export const listPanelContentReferences = async ({
    entityId,
    token,
    signal,
} = {}) => {
    if (
        entityId === undefined ||
        entityId === null ||
        String(entityId).trim() === ""
    ) {
        throw new TypeError("entityId is required.");
    }

    return request({
        method: "GET",
        path: "images/references/panels",
        params: {
            offset: 0,
            limit: 1,
            purpose: IMAGE_REFERENCE_PURPOSE.CONTENT,
            entity_id: String(entityId),
        },
        token,
        signal,
    });
};

export const uploadPreview = async ({
    file,
    entityType,
    entityId,
    token,
    signal,
} = {}) => {
    if (!file || typeof file.size !== "number" || typeof file.type !== "string") {
        throw new TypeError("file must be a valid image Blob.");
    }

    const extension = file.type.split("/")[1]?.split("+")[0] || "png";
    const formData = new FormData();
    formData.append("file", file, `${entityId}_${entityType}.${extension}`);
    formData.append("entity_type", entityType);
    formData.append("entity_id", String(entityId));

    return request({
        method: "POST",
        path: "images/previews",
        data: formData,
        token,
        signal,
    });
};

export const deletePreview = async ({
    entityType,
    entityId,
    token,
    signal,
} = {}) => {
    if (!Object.values(IMAGE_ENTITY_TYPES).includes(entityType)) {
        throw new TypeError(
            `entityType must be one of: ${Object.values(IMAGE_ENTITY_TYPES).join(", ")}.`
        );
    }

    if (
        entityId === undefined ||
        entityId === null ||
        String(entityId).trim() === ""
    ) {
        throw new TypeError("entityId is required to delete a preview.");
    }

    return request({
        method: "DELETE",
        path: `images/previews/${encodeURIComponent(entityType)}/${encodeURIComponent(String(entityId))}`,
        token,
        signal,
    });
};

export const getPreviewUrl = ({
    entityType,
    entityId,
} = {}) => {
    if (!Object.values(IMAGE_ENTITY_TYPES).includes(entityType)) {
        throw new TypeError(
            `entityType must be one of: ${Object.values(IMAGE_ENTITY_TYPES).join(", ")}.`
        );
    }

    if (
        entityId === undefined ||
        entityId === null ||
        String(entityId).trim() === ""
    ) {
        throw new TypeError("entityId is required to build a preview URL.");
    }

    return `${getImageServerApiBaseUrl()}images/previews/${encodeURIComponent(entityType)}/${encodeURIComponent(String(entityId))}/file`;
};
