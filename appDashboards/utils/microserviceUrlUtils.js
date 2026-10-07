/* 
Name: microserviceUrlUtils
Action: Utility functions for getting microservice base URLs
*/

import { getCurrentStore } from '../helpers/redux/store';
import { getBasePathByType } from '../constants/microserviceTypes';
import { normalizePath } from './urlUtils';

/**
 * Gets the base URL for a microservice from Redux state or falls back to default
 * @param {Object} options - Configuration options
 * @param {string|Array<string>} options.serviceTypes - Service type(s) to look for (can be array for fallback)
 * @param {string} options.hostName - Hostname for the URL
 * @returns {string} Base URL for the microservice
 */
export const getMicroserviceBaseUrl = ({ serviceTypes, hostName }) => {
    try {
        const store = getCurrentStore();
        if (!store) {
            console.warn('Store not available when getting microservice base URL');
            return undefined;
        }

        const state = store.getState();
        const microservices = state?.microservice;

        // Check if microservices is an array with items
        if (Array.isArray(microservices) && microservices.length > 0) {
            // Handle both single service type and array of service types (for fallback)
            const typesArray = Array.isArray(serviceTypes) ? serviceTypes : [serviceTypes];

            // Try each service type until we find one
            for (const serviceType of typesArray) {
                const basePath = getBasePathByType(microservices, serviceType);
                if (basePath) {
                    // base_path already includes version (e.g., "/dashboardAPI1/api/v1")
                    // Just normalize to ensure proper trailing slash
                    const normalizedPath = normalizePath(basePath);
                    return `https://${hostName}${normalizedPath}`;
                }
            }
            // Log warning if service type not found
            console.warn(`Microservice type(s) ${typesArray.join(', ')} not found in Redux store. Available types:`,
                microservices.map(ms => ms?.type).filter(Boolean));
        } else {
            console.warn('Microservices array is empty or not available in Redux store');
        }
    } catch (error) {
        console.error("Error getting microservice base URL", error);
        // Silently fall back to default path if Redux store is unavailable
        // This is expected in some SSR scenarios
    }

    return undefined;
};

/**
 * Gets the registry_service_id for a microservice from Redux state
 * @param {Object} options - Configuration options
 * @param {string|Array<string>} options.serviceTypes - Service type(s) to look for (can be array for fallback)
 * @returns {string|null} registry_service_id for the microservice
 */
export const getMicroserviceRegistryServiceId = ({ serviceTypes }) => {
    try {
        const store = getCurrentStore();
        if (!store) {
            console.warn('Store not available when getting microservice registry_service_id');
            return null;
        }

        const state = store.getState();
        const microservices = state?.microservice;

        // Check if microservices is an array with items
        if (Array.isArray(microservices) && microservices.length > 0) {
            // Handle both single service type and array of service types (for fallback)
            const typesArray = Array.isArray(serviceTypes) ? serviceTypes : [serviceTypes];

            // Try each service type until we find one
            for (const serviceType of typesArray) {
                const service = microservices.find(ms => ms && ms.type === serviceType);
                if (service) {
                    // Return registry_service_id or id if available
                    return service.registry_service_id || service.id || null;
                }
            }
        } else {
            console.warn('Microservices array is empty or not available in Redux store');
        }
    } catch (error) {
        console.error("Error getting microservice registry_service_id", error);
    }

    return null;
};
