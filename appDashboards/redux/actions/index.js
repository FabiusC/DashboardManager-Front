/* 
Name: index
Action: index of reduxe actions
*/

import axios from 'axios';
import {URL_API_ROUTE_DICT, getApplicationServices, getApplicationServicesPublic, getOrganizationData, getOrganizationInfo} from '../../services/creangelAuthAPI.js'
import { ResponseAPIAdapter } from '@raiz/adapters/responseAPIAdapter';
import {
    DO_NOTHING,
    ADD_ORGANIZATION,
    ADD_USERINFO,
    REMOVE_USERINFO,
    ADD_PERMISSIONS,
    REMOVE_PERMISSIONS,
    PUSH_NOTIFICATION,
    REMOVE_NOTIFICATION,
    CLEAR_NOTIFICATIONS,
    SET_ENABLE_ACTIONS,
    CLEAR_ENABLE_ACTIONS,
    ADD_DIMENSION_OBJECT,
    REPLACE_DIMENSION_OBJECT,
    RESTAURE_DEFAULT_OBJECT,
    STATE_MAIN_BAR,
    CLEAR_STATE_MAIN_BAR,
    SET_DASHBOARD_LOADING,
    REMOVE_ORGANIZATION,
    SET_LANGUAGE,
    // Filter actions
    ADD_GROUP,
    ADD_RULE,
    UPDATE_RULE,
    UPDATE_GROUP,
    DELETE_NODE,
    RESET_FILTERS,
    CLEAN_BROKEN_REFERENCES,
    SET_SEARCH,
    // App ID actions
    SET_APP_ID,
    CLEAR_APP_ID,
    // Application Services actions
    SET_APPLICATION_SERVICES,
    CLEAR_APPLICATION_SERVICES
} from './types.js';

/**
 * Adds organization to Redux store
 * Can accept:
 * - undefined: fetches organization using NEXT_PUBLIC_ORGANIZATION_ID
 * - string/number: organization ID to fetch
 * - object: organization data object to use directly
 * 
 * @param {string|number|object|undefined} organizationDataOrId - Organization ID or data object
 * @returns {Function} Async thunk action
 */
export const addOrganization = (organizationDataOrId = undefined) => {
    return async dispatch => {
        try {
            let organizationData = null;
            const apiAdapter = new ResponseAPIAdapter();

            // If undefined, use default organization ID from env
            if (organizationDataOrId === undefined) {
                const organizationId = process.env.NEXT_PUBLIC_ORGANIZATION_ID;
                if (!organizationId) {
                    throw new Error('No organization ID provided');
                }
                const response = await getOrganizationData(organizationId);
                const [isValid, responseContent] = apiAdapter.checkResponse(response);

                if (isValid && responseContent?.status === "ok" && responseContent?.data?.[0]) {
                    organizationData = responseContent.data[0];
                } else {
                    throw new Error('Invalid organization response');
                }
            }
            // If it's a string or number, treat it as an organization ID
            else if (typeof organizationDataOrId === 'string' || typeof organizationDataOrId === 'number') {
                const response = await getOrganizationInfo(organizationDataOrId);
                const [isValid, responseContent] = apiAdapter.checkResponse(response);

                if (isValid && responseContent?.status === "ok" && responseContent?.data?.[0]) {
                    organizationData = responseContent.data[0];
                } else {
                    throw new Error('Invalid organization response');
                }
            }
            // If it's an object, use it directly
            else if (typeof organizationDataOrId === 'object' && organizationDataOrId !== null) {
                organizationData = organizationDataOrId;
            }
            else {
                throw new Error('Invalid organization data format');
            }

            if (organizationData) {
                const list = Array.isArray(organizationData) ? organizationData : [organizationData];
                const normalized = list.map(org => ({
                    ...org,
                    alias: org.alias || 'Creangel'
                }));
                dispatch({ type: ADD_ORGANIZATION, payload: normalized });
            } else {
                throw new Error('No organization data to add');
            }
        } catch (error) {
            dispatch({
                type: PUSH_NOTIFICATION,
                payload: {
                    msg: "Aplicación sin ID de organización. Contacte con su proveedor.",
                    status: "err"
                }
            });
        }
    }
}

export const removeOrganization = () => {
    return {
        type: REMOVE_ORGANIZATION
    }
}

export const addUserInfo = (userInfo) => {
    return {
        type: ADD_USERINFO,
        payload: userInfo
    }
};

export const removeUserInfo = () => {
    return {
        type: REMOVE_USERINFO
    }
};

export const addPermissions = (userSession) => {
    return async dispatch => {
        try {
            let url = URL_API_ROUTE_DICT["userPermissions"]
            let requestHeader = {
                'Authorization': 'Bearer ' + userSession,
                'Content-Type': 'application/json'
            }
            const responsePermissionsRequest = await axios.get(url, { "headers": { ...requestHeader } });
            if (responsePermissionsRequest !== undefined) {
                if (responsePermissionsRequest?.data?.status === "ok" && responsePermissionsRequest?.data?.data !== undefined && responsePermissionsRequest?.data?.data.length !== 0) {
                    let auxDispatchGroups = [];
                    responsePermissionsRequest.data.data.map((eachGroup) => {
                        auxDispatchGroups.push({ "id": eachGroup.group.id, "name": eachGroup.group.name, "rol": eachGroup.rol.value });
                    });
                    dispatch({ type: ADD_PERMISSIONS, payload: auxDispatchGroups });
                } else {
                    dispatch({ type: REMOVE_PERMISSIONS });
                }
            }
        } catch (error) {
            dispatch({ type: PUSH_NOTIFICATION, payload: { "msg": "Usuario sin grupo. Contacte con su proveedor.", "status": "err" } });
        }
    }
}

export const removePermission = () => {
    return {
        type: REMOVE_PERMISSIONS
    }
};

export const pushNotification = (notification_object) => {
    return {
        type: PUSH_NOTIFICATION,
        payload: notification_object
    }
}

export const removeNotification = () => {
    return {
        type: REMOVE_NOTIFICATION
    }
}

export const clearNotifications = () => {
    return {
        type: CLEAR_NOTIFICATIONS
    }
}

export const setEnableAction = (enableActionsList) => {
    return {
        type: SET_ENABLE_ACTIONS,
        payload: enableActionsList
    }
}

export const clearEnableActions = () => {
    return {
        type: CLEAR_ENABLE_ACTIONS
    }
}

export const addDimensionObject = (dimensionObject) => {
    return {
        type: ADD_DIMENSION_OBJECT,
        payload: dimensionObject
    }
}

export const replaceDimensionObject = (dimensionObject) => {
    return {
        type: REPLACE_DIMENSION_OBJECT,
        payload: dimensionObject
    }
}

export const restaureDefaultObject = () => {
    return {
        type: RESTAURE_DEFAULT_OBJECT
    }
}

export const stateMainMenu = (stateMenu) => {
    return {
        type: STATE_MAIN_BAR,
        payload: stateMenu
    }
}

export const clearStateMainMenu = () => {
    return {
        type: CLEAR_STATE_MAIN_BAR
    }
}

export const setSelectedOptionBar = (optionId) => {
    return {
        type: 'SET_SELECTED_OPTION',
        payload: optionId,
    };
};

export const setDashboardLoading = (loading) => {
    return {
        type: SET_DASHBOARD_LOADING,
        payload: loading,
    };
};

export const setLanguage = (language) => {
    return {
        type: SET_LANGUAGE,
        payload: language
    }
}

// Filter Actions
export const addGroup = (groupData) => ({
    type: ADD_GROUP,
    payload: groupData // { id, parentId, operator, uiContext, children: [] , acceptsSubgroups, maxRules, isCoupled}
});

export const addRule = (ruleData) => ({
    type: ADD_RULE,
    payload: ruleData // { id, parentId, field, value, operator }
});

export const deleteNode = (id, isGroup) => ({
    type: DELETE_NODE,
    payload: { id, isGroup }
});

export const resetFilters = () => ({
    type: RESET_FILTERS
});

export const cleanBrokenReferences = () => ({
    type: CLEAN_BROKEN_REFERENCES
});

export const setSearch = (searchString) => ({
    type: SET_SEARCH,
    payload: searchString
});

// App ID Actions
export const setAppId = (appId) => {
    return {
        type: SET_APP_ID,
        payload: appId
    }
}

export const clearAppId = () => {
    return {
        type: CLEAR_APP_ID
    }
}

// Application Services Actions
/**
 * Fetches application services from the auth endpoint
 * @param {string} appId - The application ID
 * @returns {Function} Async thunk action
 */
export const fetchApplicationServices = (appId) => {
    return async (dispatch, getState) => {
        try {
            if (!appId) {
                console.warn('No app_id provided to fetchApplicationServices');
                return { success: false, error: 'No app_id provided' };
            }

            const header = {};
            try {
                const userID = getState()?.user?.[0]?.userID;
                if (userID) header.Authorization = `Bearer ${userID}`;
            } catch (_) { }

            const response = await getApplicationServices(appId, header);

            if (response?.status === "success" && response?.data) {
                const services = response.data;
                dispatch({
                    type: SET_APPLICATION_SERVICES,
                    payload: services
                });
                return { success: true, data: services };
            } else {
                const msg = typeof response?.msg === "string" ? response.msg : (typeof response?.message === "string" ? response.message : "");
                if (msg && /not found|no existe|does not exist|inexistente/i.test(msg)) {
                    dispatch({ type: SET_APPLICATION_SERVICES, payload: [] });
                    return { success: false, notFound: true, error: msg || "Application not found" };
                }
                dispatch({
                    type: PUSH_NOTIFICATION,
                    payload: {
                        msg: "Error al obtener servicios de la aplicación",
                        status: "err"
                    }
                });
                return { success: false, error: "Invalid response format" };
            }
        } catch (error) {
            if (error?.response?.status === 404) {
                dispatch({
                    type: SET_APPLICATION_SERVICES,
                    payload: []
                });
                return { success: false, notFound: true, error: "Application not found" };
            }
            dispatch({
                type: PUSH_NOTIFICATION,
                payload: {
                    msg: "Error al obtener servicios de la aplicación. Contacte con su proveedor.",
                    status: "err"
                }
            });
            dispatch({
                type: SET_APPLICATION_SERVICES,
                payload: []
            });
            return { success: false, error: error.message };
        }
    }
}
export const fetchApplicationServicesPublic = (appId) => {
    return async (dispatch) => {
        try {
            if (!appId) {
                console.warn('No app_id provided to fetchApplicationServicesPublic');
                return { success: false, error: 'No app_id provided' };
            }

            const response = await getApplicationServicesPublic(appId);

            if (response?.status === "success" && response?.data) {
                const services = response.data;
                dispatch({
                    type: SET_APPLICATION_SERVICES,
                    payload: services
                });
                return { success: true, data: services };
            }

            const msg = typeof response?.msg === "string" ? response.msg : (typeof response?.message === "string" ? response.message : "");
            if (msg && /not found|no existe|does not exist|inexistente/i.test(msg)) {
                dispatch({ type: SET_APPLICATION_SERVICES, payload: [] });
                return { success: false, notFound: true, error: msg || "Application not found" };
            }
            const hasStatusErr =
                typeof response?.status === "string" && /err|error/i.test(response.status) && response.status !== "success";
            const data = response?.data;
            const isEmptyData =
                data == null ||
                (Array.isArray(data) && data.length === 0) ||
                (typeof data === "object" && !Array.isArray(data) && Object.keys(data).length === 0);
            if (hasStatusErr && isEmptyData && !msg) {
                dispatch({ type: SET_APPLICATION_SERVICES, payload: [] });
                return { success: false, notFound: true, error: "Application not found" };
            }

            dispatch({
                type: PUSH_NOTIFICATION,
                payload: {
                    msg: "Error al obtener servicios públicos de la aplicación",
                    status: "err"
                }
            });
            return { success: false, error: "Invalid response format" };
        } catch (error) {
            if (error?.response?.status === 404) {
                dispatch({
                    type: SET_APPLICATION_SERVICES,
                    payload: []
                });
                return { success: false, notFound: true, error: "Application not found" };
            }
            dispatch({
                type: PUSH_NOTIFICATION,
                payload: {
                    msg: "Error al obtener servicios públicos de la aplicación. Contacte con su proveedor.",
                    status: "err"
                }
            });
            dispatch({
                type: SET_APPLICATION_SERVICES,
                payload: []
            });
            return { success: false, error: error.message };
        }
    }
}

/**
 * Sets application services directly (setter)
 * @param {Array} services - The application services array to set
 * @returns {Object} Action object
 */
export const setApplicationServices = (services) => {
    return {
        type: SET_APPLICATION_SERVICES,
        payload: services
    }
}

/**
 * Clears application services from the store
 * @returns {Object} Action object
 */
export const clearApplicationServices = () => {
    return {
        type: CLEAR_APPLICATION_SERVICES
    }
}