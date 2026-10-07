import { getCurrentStore } from '../helpers/redux/store';
import {
    getRequestGeneric, 
    postRequestGeneric, 
    putRequestGeneric, 
    uploadFileFormRequestGeneric, 
    deleteRequestGeneric
} from "./_genericRequests";

const GENERIC_ERROR_MSG = "some error happens during request";

function buildUrlWithParams(url, dynamicParams = {}) {
    let finalUrl = url.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
        if (dynamicParams.hasOwnProperty(key)) {
            return dynamicParams[key];
        }
        return `:${key}`; 
    });

    if (Object.keys(dynamicParams).length > 0 && !url.includes("/:")) {
        finalUrl = finalUrl.endsWith("/") ? finalUrl + dynamicParams.id : finalUrl + "/" + dynamicParams.id;
    }

    return finalUrl;
}

export async function generalRequest({
    serviceBaseUrl,
    version = 'v1', 
    typeRequest = 'GET', 
    nameUrl = '', 
    body = {}, 
    headers = {}, 
    parameters = {}, 
    dynamicParams = {}, 
    useJWT = true, 
    enableNotification = false, 
    nameMessage = "entity"
}) {
    // Add JWT token if required
    if (useJWT) {
        try {
            const jwt = getCurrentStore().getState().user[0].userID;
            headers = {
                ...headers,
                'Authorization': `Bearer ${jwt}`
            };
        } catch (error) {
            console.warn('Could not get JWT token:', error);
        }
    }

    // Build the URL
    let rawUrl = serviceBaseUrl[version][nameUrl];
    if (!rawUrl) {
        throw new Error(`URL not found for version: ${version}, nameUrl: ${nameUrl}`);
    }
    
    const finalUrl = buildUrlWithParams(rawUrl, dynamicParams);

    // Route to appropriate HTTP method
    switch (typeRequest.toUpperCase()) {
        case 'GET':
            return await getRequestGeneric(finalUrl, parameters, headers, enableNotification, nameMessage);
        case 'POST':
            if (typeof FormData !== 'undefined' && body instanceof FormData) {
                return await uploadFileFormRequestGeneric(finalUrl, body, headers, enableNotification, nameMessage);
            }
            return await postRequestGeneric(finalUrl, body, headers, enableNotification, nameMessage);
        case 'PUT':
            return await putRequestGeneric(finalUrl, body, headers, enableNotification, nameMessage);
        case 'DELETE':
            return await deleteRequestGeneric(finalUrl, body, headers, enableNotification, nameMessage);
        default:
            return await getRequestGeneric(finalUrl, parameters, headers, enableNotification, nameMessage);
    }
} 