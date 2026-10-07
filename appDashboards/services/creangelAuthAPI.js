/* 
Name: creangelAuthAPI
Action: endpoints for service related to authentication
*/

import axios from "axios";
import {
    getRequestGeneric,
    postRequestGeneric,
    putRequestGeneric,
    deleteRequestGeneric
} from "./_genericRequests";
import { generalRequest } from "./_centralizedAPI";

import { getHostName } from '../utils/hostnameUtils';

const hostName = getHostName();

const BASE_URL_API = `https://${hostName}/${process.env.NEXT_PUBLIC_AUTHENTICATION_BASE_API_PROXY}/api/${process.env.NEXT_PUBLIC_AUTHENTICATION_BASE_API_VERSION}/`;

export const URL_API_ROUTE_DICT = {
    //=====Organization
    "organizationData": `${BASE_URL_API}organization/info/`,
    "organizationCrud": `${BASE_URL_API}organization`,
    "organizationSearch": `${BASE_URL_API}organization/_search`,
    "organizationInfo": `${BASE_URL_API}organization/info`,
    "organizationList": `${BASE_URL_API}organization/list`,
    /* new authentication entity */
    "authenticationBase": `${BASE_URL_API}authentication`,
    "authenticationGenerateToken": `${BASE_URL_API}authentication/get_from_outside`,
    /* authenticator */
    "authenticatorBase": `${BASE_URL_API}authenticator`,

    //=====Authentication
    // "userLogin": `${BASE_URL_API}user/login_api`,
    "userLogin": `${BASE_URL_API}user/login`,
    "userRefresh": `${BASE_URL_API}user/refresh`,
    "userLogout": `${BASE_URL_API}user/logout`,
    //=====Captcha
    "captchaRequest": `${BASE_URL_API}captcha/request`,
    "captchaCrud": `${BASE_URL_API}captcha/config`,
    //=====Groups
    "groupActions": `${BASE_URL_API}group`,
    "disableGroup": `${BASE_URL_API}group/disable`,
    "getGroupsAvailable": `${BASE_URL_API}group/available/acl`,
    "addActionsGroup": `${BASE_URL_API}organization/actions`,
    "linkUser": `${BASE_URL_API}group/subscription`,
    "groupList": `${BASE_URL_API}group/list`,
    "groupMetadata": `${BASE_URL_API}group/metadata`,
    //=====Users
    "usersList": `${BASE_URL_API}user/list`,
    "emailsUsersList": `${BASE_URL_API}user/list_all`,
    "usersListUnlinked": `${BASE_URL_API}user/list_unlinked`,
    "userPermissions": `${BASE_URL_API}user/permissions`,
    "userRol": `${BASE_URL_API}rol`,
    "userActions": `${BASE_URL_API}user`,
    "userDisable": `${BASE_URL_API}user/disable`,
    "userInfo": `${BASE_URL_API}user/get_info`,
    "userCheck": `${BASE_URL_API}user/recovery`,
    "userAddSecurity": `${BASE_URL_API}user/recovery/set_question`,
    "userCheckSecurity": `${BASE_URL_API}user/recovery/has_question`,
    "userRecoveryCheck": `${BASE_URL_API}user/recovery/check`,
    "userUpdatePassword": `${BASE_URL_API}user/recovery/change_password`,
    "userGetAvailableActions": `${BASE_URL_API}actions/available`,
    "userActive": `${BASE_URL_API}user/active`,
    "usersMetadata": `${BASE_URL_API}user/metadata`,
    //=====ACL permissions
    "aclPermissions": `${BASE_URL_API}acl/permission`,
    "listAclObjects": `${BASE_URL_API}acl/meta`,
    "listAcl": `${BASE_URL_API}acl/list`,
    "aclCrud": `${BASE_URL_API}acl`,
    "getProductsByType": `${BASE_URL_API}acl/product`,
    "userValidateCreation": `${BASE_URL_API}user/validate/creation/acl`,
    //=====Logs
    "allUserLogs": `${BASE_URL_API}log`,
    "logsByUser": `${BASE_URL_API}log/user`,
    "statusLogs": `${BASE_URL_API}log/listStatus`,
    "logsByACL": `${BASE_URL_API}log/acl_object`,
    "customLogs": `${BASE_URL_API}log/custom`,
    "facetLogs": `${BASE_URL_API}log/facet`,
    //=====Actions
    "actionUserList": `${BASE_URL_API}actions/user/list`,
    "actionList": `${BASE_URL_API}actions/list`,
    "actionCrud": `${BASE_URL_API}actions`,
    "actionAvailable": `${BASE_URL_API}actions/available`,
    //======LDAP

    "configLDAP": `${BASE_URL_API}organization/ldap`,
    "syncLDAP": `${BASE_URL_API}organization/ldap/sync`,
    "testConnLDAP": `${BASE_URL_API}organization/ldap/connect`,
    //========Applications
    "applicationList": `${BASE_URL_API}application/list`,
    "applicationCRUD": `${BASE_URL_API}application`,
    "applicationTypes": `${BASE_URL_API}application/valid_application_types`,
    "applicationServices": `${BASE_URL_API}application/:id/get_applications_services`,
    // Public services endpoint differs by deployment; support both:
    // - /application/:id/get_applications_services/public  (legacy)
    // - /application/:id/get_applications_services_public  (current in ifindit.creangel.com)
    "applicationServicesPublic": `${BASE_URL_API}application/:id/get_applications_services_public`,
    //=====Services
    "serviceList": `${BASE_URL_API}service/list`,
    "serviceCRUD": `${BASE_URL_API}service`,
    "serviceTypes": `${BASE_URL_API}service/valid_service_types`,

    //======= Projects
    "getProject": `${BASE_URL_API}projects`,
    "projectList": `${BASE_URL_API}projects/list`,
    "createProject": `${BASE_URL_API}projects/_`,
    "deleteProject": `${BASE_URL_API}projects`,
    "editProject": `${BASE_URL_API}projects`,

    //======= Folders
    "folderList": `${BASE_URL_API}folders/list`,
    "getFolder": `${BASE_URL_API}folders`,
    "createFolder": `${BASE_URL_API}folders/_`,
    "deleteFolder": `${BASE_URL_API}folders`,
    "editFolder": `${BASE_URL_API}folders`,
};

//=====Organization

export async function getOrganizationData(id) {
    return await getRequestGeneric(URL_API_ROUTE_DICT["organizationData"] + `/${id}`)
}

export async function getOrganizationList(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["organizationList"], data, header)
}

export async function editOrganization(data, header) {
    return await putRequestGeneric(URL_API_ROUTE_DICT["organizationCrud"], data, header)
}

export async function deleteOrganization(data, header) {
    return await deleteRequestGeneric(URL_API_ROUTE_DICT["organizationCrud"], data, header)
}

export async function createOrganization(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["organizationCrud"], data, header)
}

export async function getOrganizations(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["organizationSearch"], data, header)
}

export async function getOrganizationInfo(id) {
    return await getRequestGeneric(URL_API_ROUTE_DICT["organizationInfo"] + `/${id}`)
}
//=====Authenticator

export async function getAuthenticatorPublicInfo(id) {
    return await getRequestGeneric(URL_API_ROUTE_DICT["authenticatorBase"] + `/${id}`)
}

export async function generateRedirectAuthenticationID(payload, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["authenticationBase"] + '/_', payload, header)
}
export async function generateAuthenticationToken(id) {
    return await getRequestGeneric(URL_API_ROUTE_DICT["authenticationGenerateToken"] + `/${id}`)
}
//=====Authentication

export async function getUserLogin(data) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["userLogin"], data)
}

export async function getUserRefresh(header) {
    return await getRequestGeneric(URL_API_ROUTE_DICT["userRefresh"], header)
}

export async function getUserLogout(header) {
    return await getRequestGeneric(URL_API_ROUTE_DICT["userLogout"], {}, header)
}

//=======Captcha

export async function requestCaptcha(data) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["captchaRequest"], data)
}

export async function checkCaptcha(data, id) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["captchaRequest"] + `/${id}/check`, data)
}

export async function captchaConfigCreate(data, header) {
    return await postRequestGeneric(`${URL_API_ROUTE_DICT["captchaCrud"]}/_`, data, header)
}

export async function captchaConfigList(id, header) {
    return await getRequestGeneric(URL_API_ROUTE_DICT["captchaCrud"] + `/${id}`, header)
}

export async function captchaConfigEdit(id, data, header) {
    return await putRequestGeneric(URL_API_ROUTE_DICT["captchaCrud"] + `/${id}`, data, header)
}

//=====Actions
export async function actionUserList(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["actionUserList"], data, header)
}

export async function actionsList(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["actionList"], data, header)
}

export async function actionsEdit(data, header, id) {
    return await putRequestGeneric(URL_API_ROUTE_DICT["actionCrud"] + `/${id}`, data, header)
}

export async function actionsCreate(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["actionCrud"] + "/_", data, header)
}

export async function actionsDelete(data, header, id) {
    return await deleteRequestGeneric(URL_API_ROUTE_DICT["actionCrud"] + `/${id}`, data, header)
}

export async function getActionsAvailable(header) {
    return await getRequestGeneric(URL_API_ROUTE_DICT["actionAvailable"], {}, header)
}

export async function bannedGroupsAction(data, header, id) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["actionCrud"] + `/${id}/access/ban_group`, data, header)
}
export async function unBannedGroupsAction(data, header, id) {
    return await deleteRequestGeneric(URL_API_ROUTE_DICT["actionCrud"] + `/${id}/access/ban_group`, data, header)
}

export async function admittedGroupsAction(data, header, id) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["actionCrud"] + `/${id}/access/admit_group`, data, header)
}

export async function expelGroupsAction(data, header, id) {
    return await deleteRequestGeneric(URL_API_ROUTE_DICT["actionCrud"] + `/${id}/access/admit_group`, data, header)
}

export async function toggleAccessAction(header, id) {
    return await getRequestGeneric(URL_API_ROUTE_DICT["actionCrud"] + `/${id}/access/toggle_method`, header)
}


//=====Logs
export async function statusLogs(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["statusLogs"], data, header)
}

export async function customLogs(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["customLogs"], data, header)
}

export async function facetLogs(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["facetLogs"], data, header)
}

//=====ACL permissions

export async function updateACLPermissions(data, header, id) {
    return await putRequestGeneric(URL_API_ROUTE_DICT["aclPermissions"] + `/${id}`, data, header)
}

export async function updateACL(data, header, id) {
    return await putRequestGeneric(URL_API_ROUTE_DICT["aclCrud"] + `/${id}`, data, header)
}

export async function createACL(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["aclCrud"] + "/_", data, header)
}

export async function getTypesACL(header) {
    return await getRequestGeneric(URL_API_ROUTE_DICT["listAclObjects"], header)
}

export async function getAclById(id, header) {
    return await getRequestGeneric(URL_API_ROUTE_DICT["aclCrud"] + `/${id}`, {}, header)
}

export async function getProductsByType(product, data, header) {
    return await postRequestGeneric(`${URL_API_ROUTE_DICT["getProductsByType"]}/${product}/list`, data, header)
}

export async function getACLList(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["listAcl"], data, header)
}

export async function deleteACL(data, header, id) {
    return await deleteRequestGeneric(URL_API_ROUTE_DICT["aclCrud"] + `/${id}`, data, header)
}

export async function userValidateCreation(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["userValidateCreation"], data, header)
}
export async function getUserMetadata(userIds, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["usersMetadata"], userIds, header)
}
export async function getGroupMetadata(groupIds, header){
    return await postRequestGeneric(URL_API_ROUTE_DICT["groupMetadata"], groupIds, header)
}
//=====Group

export async function getGroupsAvaiable(header) {
    return await postRequestGeneric(
        URL_API_ROUTE_DICT["getGroupsAvailable"],
        {
            "limit": 1000,
            "offset": 0,
            "q": "",
            "filter": [{
                "field": "ldap_id",
                "value": null,
            }],
            "order_by": "asc",
            "order_field": "name"
        },
        header)
}

export async function getGroupList(data, header) {
    return await axios.post(URL_API_ROUTE_DICT["groupList"], data, { headers: header })
}

export async function createGroup(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["groupActions"], data, header)
}

export async function addActionsGroup(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["addActionsGroup"], data, header)
}

export async function linkUser(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["linkUser"], data, header)
}

export async function unlinkUser(data, header) {
    return await deleteRequestGeneric(URL_API_ROUTE_DICT["linkUser"], data, header)
}

export async function disableGroup(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["disableGroup"], data, header)
}

export async function deleteGroup(data, header) {
    return await deleteRequestGeneric(URL_API_ROUTE_DICT["groupActions"], data, header)
}

//=====Users

export async function getUserPermissions(header) {
    return await getRequestGeneric(URL_API_ROUTE_DICT["userPermissions"], header)
}

export async function getUsersList(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["usersList"], data, header)
}

export async function getEmailsUsersList(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["emailsUsersList"], data, header)
}

export async function getUnlinkedUsersList(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["usersListUnlinked"], data, header)
}

export async function getUserRol(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["userRol"], data, header)
}

export async function createUser(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["userActions"], data, header)
}

export async function editUser(data, header) {
    return await putRequestGeneric(URL_API_ROUTE_DICT["userActions"], data, header)
}

export async function disableUser(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["userDisable"], data, header)
}

export async function activeUser(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["userActive"], data, header)
}

export async function deleteUser(data, header) {
    return await deleteRequestGeneric(URL_API_ROUTE_DICT["userActions"], data, header)
}

export async function getUserInfo(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["userInfo"], data, header)
}

export async function getCheckUser(data) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["userCheck"], data)
}

export async function addSecurityInformation(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["userAddSecurity"], data, header)
}

export async function checkSecurityInformation(data) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["userCheckSecurity"], data)
}

export async function checkSecurityAnswer(data) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["userRecoveryCheck"], data)
}

export async function updateUserPassword(data) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["userUpdatePassword"], data)
}

export async function getAvailableEnableActions(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["userGetAvailableActions"], data, header)
}

export async function allUserLogs(header) {
    return await getRequestGeneric(URL_API_ROUTE_DICT["allUserLogs"], header)
}
//=====LDAP

export async function createLDAP(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["configLDAP"], data, header)
}

export async function getLDAP(header) {
    return await getRequestGeneric(URL_API_ROUTE_DICT["configLDAP"], header)
}

export async function editLDAP(data, header) {
    return await putRequestGeneric(URL_API_ROUTE_DICT["configLDAP"], data, header)
}

export async function deleteLDAP(data, header) {
    return await deleteRequestGeneric(URL_API_ROUTE_DICT["configLDAP"], data, header)
}

export async function syncUsersLDAP(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["syncLDAP"], data, header)
}

export async function testConnLDAP(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["testConnLDAP"], data, header)
}

//======Applications

export async function getApplications(header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["applicationList"], {}, header)
}

export async function createApplication(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["applicationCRUD"] + "/_", data, header)
}

export async function editApplication(data, header, id) {
    return await putRequestGeneric(URL_API_ROUTE_DICT["applicationCRUD"] + `/${id}`, data, header)
}

export async function deleteApplication(data, header, id) {
    return await deleteRequestGeneric(URL_API_ROUTE_DICT["applicationCRUD"] + `/${id}`, data, header)
}

export async function bannedGroupsApplication(data, header, id) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["applicationCRUD"] + `/${id}/access/ban_group`, data, header)
}
export async function unBannedGroupsApplication(data, header, id) {
    return await deleteRequestGeneric(URL_API_ROUTE_DICT["applicationCRUD"] + `/${id}/access/ban_group`, data, header)
}

export async function admittedGroupsApplication(data, header, id) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["applicationCRUD"] + `/${id}/access/admit_group`, data, header)
}

export async function expelGroupsApplication(data, header, id) {
    return await deleteRequestGeneric(URL_API_ROUTE_DICT["applicationCRUD"] + `/${id}/access/admit_group`, data, header)
}

export async function toggleAccessApplication(header, id) {
    return await getRequestGeneric(URL_API_ROUTE_DICT["applicationCRUD"] + `/${id}/access/toggle_method`, header)
}

export async function getApplicationTypes(header) {
    return await getRequestGeneric(URL_API_ROUTE_DICT["applicationTypes"], header)
}

/**
 * Fetches application services for a given application ID.
 * @param {string} appId - The application ID
 * @param {Object} header - Request headers (e.g. Authorization)
 * @returns {Promise<Object>} API response
 */
export async function getApplicationServices(appId, header) {
    const url = URL_API_ROUTE_DICT["applicationServices"].replace(':id', appId);
    return await getRequestGeneric(url, {}, header);
}

/**
 * Fetches application services for a given application ID (public endpoint, no Authorization).
 * Used to discover microservice base_path for public dashboard viewer.
 * @param {string} appId - The application ID
 * @returns {Promise<Object>} API response
 */
export async function getApplicationServicesPublic(appId) {
    const primaryUrl = URL_API_ROUTE_DICT["applicationServicesPublic"].replace(':id', appId);
    try {
        const res = await getRequestGeneric(primaryUrl);
        if (res?.status === "success" || res?.status === "ok") return res;
    } catch (_) { }

    // Fallback to legacy path if primary is not available
    const legacyUrl = `${BASE_URL_API}application/${appId}/get_applications_services/public`;
    return await getRequestGeneric(legacyUrl);
}

//======Services

export async function getServices(header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["serviceList"], {}, header)
}

export async function createService(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["serviceCRUD"] + "/_", data, header)
}

export async function editService(data, header, id) {
    return await putRequestGeneric(URL_API_ROUTE_DICT["serviceCRUD"] + `/${id}`, data, header)
}

export async function deleteService(data, header, id) {
    return await deleteRequestGeneric(URL_API_ROUTE_DICT["serviceCRUD"] + `/${id}`, data, header)
}

export async function bannedGroupsService(data, header, id) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["serviceCRUD"] + `/${id}/access/ban_group`, data, header)
}
export async function unBannedGroupsService(data, header, id) {
    return await deleteRequestGeneric(URL_API_ROUTE_DICT["serviceCRUD"] + `/${id}/access/ban_group`, data, header)
}

export async function admittedGroupsService(data, header, id) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["serviceCRUD"] + `/${id}/access/admit_group`, data, header)
}

export async function expelGroupsService(data, header, id) {
    return await deleteRequestGeneric(URL_API_ROUTE_DICT["serviceCRUD"] + `/${id}/access/admit_group`, data, header)
}

export async function toggleAccessService(header, id) {
    return await getRequestGeneric(URL_API_ROUTE_DICT["serviceCRUD"] + `/${id}/access/toggle_method`, header)
}

export async function getServicesTypes(header) {
    return await getRequestGeneric(URL_API_ROUTE_DICT["serviceTypes"], header)
}


//======= Projects

export async function getProject(id, header) {
    return await getRequestGeneric(URL_API_ROUTE_DICT["getProject"] + `/${id}`, {}, header)
}

export async function getProjects(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["projectList"], data, header)
}

export async function createProject(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["createProject"], data, header)
}

export async function deleteProject(id, header) {
    return await deleteRequestGeneric(URL_API_ROUTE_DICT["deleteProject"] + `/${id}`, {}, header)
}

export async function trashProject(id, header) {
    return await deleteRequestGeneric(URL_API_ROUTE_DICT["deleteProject"] + `/${id}/trash`, {}, header)
}

export async function editProject(data, header, id) {
    return await putRequestGeneric(URL_API_ROUTE_DICT["editProject"] + `/${id}`, data, header)
}

export async function restoreProject(data, header, id) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["editProject"] + `/${id}/restore`, data, header)
}

//======= Folders

export async function getFolder(id, header) {
    return await getRequestGeneric(URL_API_ROUTE_DICT["getFolder"] + `/${id}`, {}, header)
}

export async function getFolders(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["folderList"], data, header)
}

export async function createFolder(data, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["createFolder"], data, header)
}

export async function deleteFolder(id, header) {
    return await deleteRequestGeneric(URL_API_ROUTE_DICT["deleteFolder"] + `/${id}`, {}, header)
}

export async function trashFolder(id, header) {
    return await deleteRequestGeneric(URL_API_ROUTE_DICT["deleteFolder"] + `/${id}/trash`, {}, header)
}

export async function editFolder(data, header, id) {
    return await putRequestGeneric(URL_API_ROUTE_DICT["editFolder"] + `/${id}`, data, header)
}

export async function restoreFolder(id, header) {
    return await postRequestGeneric(URL_API_ROUTE_DICT["editFolder"] + `/${id}/restore`, {}, header)
}

// Wrapper for using creangelAuthAPI with generalRequest
// Converts flat URL_API_ROUTE_DICT to nested structure expected by generalRequest
export const CREANGEL_AUTH_API_ROUTE_DICT = {
    "v1": URL_API_ROUTE_DICT
};

// Export a wrapper function that provides the serviceBaseUrl for creangelAuthAPI
export async function creangelAuthGeneralRequest(params) {
    return await generalRequest({
        ...params,
        serviceBaseUrl: CREANGEL_AUTH_API_ROUTE_DICT
    });
}