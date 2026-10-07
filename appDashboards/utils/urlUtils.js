/* 
Name: urlUtils
Action: Utility functions for URL normalization
*/

/**
 * Normalizes a URL path to ensure it starts with / and ends with /
 * @param {string} path - The path to normalize
 * @returns {string} Normalized path
 * @example
 * normalizePath('dashboardAPI1') // returns '/dashboardAPI1/'
 * normalizePath('/dashboardAPI1') // returns '/dashboardAPI1/'
 * normalizePath('dashboardAPI1/') // returns '/dashboardAPI1/'
 * normalizePath('/dashboardAPI1/') // returns '/dashboardAPI1/'
 */
export const normalizePath = (path) => {
    if (!path || typeof path !== 'string') {
        return '/';
    }

    // Ensure path starts with /
    const pathWithSlash = path.startsWith('/') ? path : `/${path}`;

    // Ensure path ends with /
    return pathWithSlash.endsWith('/') ? pathWithSlash : `${pathWithSlash}/`;
};
