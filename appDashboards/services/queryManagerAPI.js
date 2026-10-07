import { generalRequest } from './_centralizedAPI';
import { SERVICE_TYPE_QUERY_MANAGER } from '../constants/microserviceTypes';
import { getMicroserviceBaseUrl } from '../utils/microserviceUrlUtils';
import { getHostName } from '../utils/hostnameUtils';

/**
 * Gets the base URL for query manager API from Redux state or falls back to env var
 * @returns {string} Base URL for query manager API
 */
function getQueryManagerBaseUrl() {
    const hostName = getHostName();
    const msBase = getMicroserviceBaseUrl({
        serviceTypes: SERVICE_TYPE_QUERY_MANAGER,
        hostName
    });
    if (msBase) return msBase;
    return undefined;
}

/**
 * Builds the URL API route dictionary dynamically using the base path from Redux
 * @returns {Object} URL API route dictionary
 */
function buildURLApiRouteDict() {
    const BASE_URL_API = getQueryManagerBaseUrl();

    if (!BASE_URL_API) {
        const errorMsg = "Query Manager base URL is not available. Please ensure application services were loaded and contain analytics_query_api.";
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    const baseUrl = BASE_URL_API;

    return {
        "v1": {
            "query": `${baseUrl}api/v1/query/`,
            "queryPublic": `${baseUrl}api/v1/query/public`,
        }
    };
}

// Export a wrapper function that provides the serviceBaseUrl
export async function queryManagerGeneralRequest(params) {
    const URL_API_ROUTE_DICT = buildURLApiRouteDict();
    return await generalRequest({
        ...params,
        serviceBaseUrl: URL_API_ROUTE_DICT
    });
}
