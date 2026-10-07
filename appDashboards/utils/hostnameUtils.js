/**
 * Utility functions for hostname management
 */

/**
 * Gets the current hostname, with fallback for server-side rendering
 * Priority: window.location.hostname > NEXT_PUBLIC_AUTHENTICATION_BASE_API_HOSTNAME > default
 * @returns {string} The hostname
 */
export const getHostName = () => {
    if (typeof window !== 'undefined') {
        return window.location.hostname;
    }
    if (typeof process !== 'undefined' &&
        typeof process.env.NEXT_PUBLIC_AUTHENTICATION_BASE_API_HOSTNAME === 'string' &&
        process.env.NEXT_PUBLIC_AUTHENTICATION_BASE_API_HOSTNAME !== '') {
        return process.env.NEXT_PUBLIC_AUTHENTICATION_BASE_API_HOSTNAME;
    }
    return "ifindit.creangel.com";
};
