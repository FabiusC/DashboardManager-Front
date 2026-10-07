import { generalRequest } from './_centralizedAPI';
import { SERVICE_TYPE_DATA_SOURCE_MANAGER } from '../constants/microserviceTypes';
import { getMicroserviceBaseUrl } from '../utils/microserviceUrlUtils';
import { getHostName } from '../utils/hostnameUtils';

const hostName = getHostName();

/**
 * Gets the base URL for data source manager API from Redux state or falls back to env var
 * @returns {string} Base URL for data source manager API
 */
function getDataSourceManagerBaseUrl() {
    return getMicroserviceBaseUrl({
        serviceTypes: SERVICE_TYPE_DATA_SOURCE_MANAGER,
        hostName: hostName
    });
}

/**
 * Builds the URL API route dictionary dynamically using the base path from Redux
 * @returns {Object} URL API route dictionary
 */
function buildURLApiRouteDict() {
    const BASE_URL_API = getDataSourceManagerBaseUrl();

    // Validate that BASE_URL_API is defined
    if (!BASE_URL_API) {
        const errorMsg = "Data Source Manager base URL is not available. Microservices may still be loading. Please ensure the microservice is properly configured in Redux store.";
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    // base_path already includes version path (e.g., "/dashboardAPI1/api/v1")
    // So endpoints are relative to that base
    return {
        "v1": {

            // Data Source Manager API
            dataSourceById: `${BASE_URL_API}api/v1/data_source/:id`,
            dataSourceList: `${BASE_URL_API}api/v1/data_source/list`,

            // FIELDS MANAGER API
            fieldById: `${BASE_URL_API}api/v1/field/:id`,
            fieldList: `${BASE_URL_API}api/v1/field/list`,
            fieldListByDataSource: `${BASE_URL_API}api/v1/field/data_source/:data_source_id/list`,
        }
    };
}

// Export a wrapper function that provides the serviceBaseUrl
export async function dataSourceManagerGeneralRequest(params) {
    const URL_API_ROUTE_DICT = buildURLApiRouteDict();
    return await generalRequest({
        ...params,
        serviceBaseUrl: URL_API_ROUTE_DICT
    });
}
