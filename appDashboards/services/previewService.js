import { captureElementAsBlob } from "../utils/previewCapture";
import { IMAGE_ENTITY_TYPES, uploadPreview } from "./imageServerAPI";

const DASHBOARD_PREVIEW_RATIO = 0.6;
const DASHBOARD_PREVIEW_WIDTH = 1920;
const PREVIEW_ELEMENT_TIMEOUT = 15_000;

export const PANEL_PREVIEW_SIZE = Object.freeze({
    width: 1920,
    height: 1200,
});

const waitForNextPaint = (
    view = typeof window !== "undefined" ? window : null
) =>
    new Promise((resolve) => {
        const requestFrame = view?.requestAnimationFrame;
        if (typeof requestFrame !== "function") {
            setTimeout(resolve, 0);
            return;
        }

        requestFrame.call(view, () => {
            requestFrame.call(view, resolve);
        });
    });

const getElement = ({ element, elementId }) => {
    if (element && typeof element.querySelectorAll === "function") {
        return element;
    }

    return elementId ? document.getElementById(elementId) : null;
};

const waitForPreviewElement = async ({ element, elementId, signal }) => {
    const deadline = Date.now() + PREVIEW_ELEMENT_TIMEOUT;

    while (Date.now() < deadline) {
        if (signal?.aborted) {
            const error = new Error("Preview capture was cancelled.");
            error.name = "AbortError";
            throw error;
        }

        const previewElement = getElement({ element, elementId });
        if (previewElement) return previewElement;

        await waitForNextPaint();
    }

    throw new Error(`Preview element "${elementId || "dashboard"}" was not found.`);
};

const getDashboardCaptureHeight = (element) => {
    const gridRoot = element.querySelector(".dashboard-grid-root");
    const elementTop = element.getBoundingClientRect().top;
    const panelBottom = Array.from(element.querySelectorAll(".grid-stack-item"))
        .reduce(
            (bottom, panel) =>
                Math.max(bottom, panel.getBoundingClientRect().bottom - elementTop),
            0
        );
    const fullHeight = Math.max(
        panelBottom,
        gridRoot?.getBoundingClientRect().height || 0
    );

    return Math.max(1, Math.ceil(fullHeight * DASHBOARD_PREVIEW_RATIO));
};

export const uploadDashboardPreview = async ({
    dashboardId,
    element,
    token,
    signal,
} = {}) => {
    if (dashboardId === undefined || dashboardId === null) {
        throw new TypeError("dashboardId is required to upload a preview.");
    }

    const previewElement = await waitForPreviewElement({
        element,
        elementId: `dashboard-capture-${dashboardId}`,
    });
    const ownerWindow = previewElement.ownerDocument?.defaultView || window;
    await waitForNextPaint(ownerWindow);
    await waitForNextPaint(ownerWindow);

    const captureHeight = getDashboardCaptureHeight(previewElement);
    const file = await captureElementAsBlob({
        element: previewElement,
        width: DASHBOARD_PREVIEW_WIDTH,
        height: captureHeight,
        windowHeight: captureHeight,
        excludedSelectors: [
            '[id^="actionsPanel-"]',
            ".ui-resizable-handle",
            ".react-resizable-handle",
            ".grid-stack-placeholder",
        ],
    });

    return uploadPreview({
        file,
        entityType: IMAGE_ENTITY_TYPES.DASHBOARD,
        entityId: String(dashboardId),
        token,
        signal,
    });
};

export const uploadPanelPreview = async ({
    panelId,
    element,
    elementId = `panel-capture-${panelId}`,
    token,
    signal,
    fixedSize = true,
} = {}) => {
    if (panelId === undefined || panelId === null) {
        throw new TypeError("panelId is required to upload a preview.");
    }

    const previewElement = await waitForPreviewElement({
        element,
        elementId,
        signal,
    });
    const ownerWindow = previewElement.ownerDocument?.defaultView || window;
    await waitForNextPaint(ownerWindow);

    const captureOptions = fixedSize
        ? {
            width: PANEL_PREVIEW_SIZE.width,
            height: PANEL_PREVIEW_SIZE.height,
            windowWidth: PANEL_PREVIEW_SIZE.width,
            windowHeight: PANEL_PREVIEW_SIZE.height,
        }
        : {};
    const file = await captureElementAsBlob({
        element: previewElement,
        ...captureOptions,
        excludedSelectors: [
            '[id^="actionsPanel-"]',
            ".react-resizable-handle",
            ".ui-resizable-handle",
        ],
    });

    return uploadPreview({
        file,
        entityType: IMAGE_ENTITY_TYPES.PANEL,
        entityId: String(panelId),
        token,
        signal,
    });
};
