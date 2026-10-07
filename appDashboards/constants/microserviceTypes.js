/* 
Name: microserviceTypes
Action: Constants for microservice types
*/

// Service type constants
export const SERVICE_TYPE_DASHBOARD_MANAGER = 'analytics_dashboard_manager_api';
export const SERVICE_TYPE_QUERY_MANAGER = 'analytics_query_api';
export const SERVICE_TYPE_DATA_SOURCE_MANAGER = 'analytics_data_source_manager_api';
export const SERVICE_TYPE_IMAGE_SERVER = 'image_server_api';

// Helper function to get base_path from microservices array by type
export const getBasePathByType = (microservices, serviceType) => {
    if (!microservices || !Array.isArray(microservices) || microservices.length === 0) {
        return null;
    }

    const service = microservices.find(ms => ms && ms.type === serviceType);
    if (!service || !service.base_path) {
        return null;
    }
    // Return base_path if it's valid (not placeholder)
    const basePath = service.base_path;
    if (basePath && basePath !== 'base_path' && typeof basePath === 'string' && basePath.trim() !== '') {
        return basePath.trim();
    }

    return null;
};
