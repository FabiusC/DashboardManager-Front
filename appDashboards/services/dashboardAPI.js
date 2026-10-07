import { generalRequest } from './_centralizedAPI';
import { SERVICE_TYPE_DASHBOARD_MANAGER } from '../constants/microserviceTypes';
import { getMicroserviceBaseUrl } from '../utils/microserviceUrlUtils';
import { getHostName } from '../utils/hostnameUtils';

const hostName = getHostName();

/**
 * Gets the base URL for dashboard API from Redux state or falls back to env var
 * @returns {string} Base URL for dashboard API
 */
function getDashboardBaseUrl() {
    const msBase = getMicroserviceBaseUrl({
        serviceTypes: SERVICE_TYPE_DASHBOARD_MANAGER,
        hostName: hostName
    });
    if (msBase) return msBase;

    // Fallback for public access (no app_id / no microservices loaded yet)
    // Expect a full base URL that already includes the API version prefix, e.g.
    // https://ifindit.creangel.com/dashboardAPI1/api/v1/
    const envBase = process.env.NEXT_PUBLIC_DASHBOARD_MANAGER_BASE_URL;
    if (typeof envBase === "string" && envBase.trim() !== "") {
        const trimmed = envBase.trim();
        return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
    }

    return undefined;
}

/**
 * Builds the URL API route dictionary dynamically using the base path from Redux
 * @returns {Object} URL API route dictionary
 */
function buildURLApiRouteDict() {
    const BASE_URL_API = getDashboardBaseUrl();

    // Validate that BASE_URL_API is defined
    if (!BASE_URL_API) {
        const errorMsg = "Dashboard Manager base URL is not available. Microservices may still be loading. Please ensure the microservice is properly configured in Redux store.";
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    // base_path already includes version path (e.g., "/dashboardAPI1/api/v1")
    // So endpoints are relative to that base
    return {
        "v1": {
            "project": `${BASE_URL_API}project/`,
            "projectList": `${BASE_URL_API}project/list`,
            "projectListWithPanels": `${BASE_URL_API}project/list_projects_with_panel`,
            "folderList": `${BASE_URL_API}folder/list`,
            "folderListWithPanels": `${BASE_URL_API}folder/list_folders_with_panel`,
            "folder": `${BASE_URL_API}folder/`,
            "folderResources": `${BASE_URL_API}folder/:id/resources`,
            "dashboardList": `${BASE_URL_API}dashboard/list`,
            "dashboard": `${BASE_URL_API}dashboard/`,
            "dashboardEditionGet": `${BASE_URL_API}dashboard/:id`,
            "dashboardAddPanel": `${BASE_URL_API}dashboard/:id/panel/:panel_id`,
            "dashboardUpdatePanels": `${BASE_URL_API}dashboard/:id/panels/position`,
            "dashboardConfiguration": `${BASE_URL_API}dashboard/configuration/:id`,
            "panel": `${BASE_URL_API}panel/`,
            "panelViewMode": `${BASE_URL_API}panel/:panel_id/view_mode`,
            "panelByFolder": `${BASE_URL_API}panel/list_panels_by_folder`,
            "panelEditionGet": `${BASE_URL_API}panel/:id/edition_mode`,
            "panelList": `${BASE_URL_API}panel/list`,
            "panelComponent": `${BASE_URL_API}panel/:panel_id/component/:component_id`,
            "delatePanelUnassign_chart_type": `${BASE_URL_API}panel/:id/unassign_chart_type`,
            "chartFamilyList": `${BASE_URL_API}chart_family/list`,
            "chartTypesPerFamily": `${BASE_URL_API}chart_family/:chart_family_id/chart_types`,
            "chartTypeList": `${BASE_URL_API}chart_type/list`,
            "chartTypeListByFamily": `${BASE_URL_API}chart_type/list_by_family`,
            "associateChartTypeToPanel": `${BASE_URL_API}panel/:panel_id/assign_chart_type`,
            "panelContent": `${BASE_URL_API}panel/component/:component_id/content/:content_id`,
            "panelContentChildren": `${BASE_URL_API}panel/component/:component_id/content/:content_id/children`,
            "getPanelSetUp": `${BASE_URL_API}panel/setup/:panel_id`,
            "getChartSetUp": `${BASE_URL_API}panel/:panel_id/chart_parameter_component/setup`,
            "getChartSetUpPublic": `${BASE_URL_API}panel/:panel_id/chart_parameter_component/setup/public`,
            "getFieldsDistributionChartType": `${BASE_URL_API}chart_type/:chart_type_id/fields/distribution`,
            "getFieldsQueryDistributionChartType": `${BASE_URL_API}chart_type/:chart_type_id/fields/query/distribution`,
            "updatePanelQueryParameters": `${BASE_URL_API}panel/:panel_id/query_parameters`,
            "getProducsList": `${BASE_URL_API}product/list`,
            "updatePanelColorStrategy": `${BASE_URL_API}panel/:panel_id/color_strategy`,
            "chartEditionGet": `${BASE_URL_API}panel/:panel_id/chart_parameter_component/edition_mode`,
            "chartComponent": `${BASE_URL_API}panel/:panel_id/chart_parameter_component/:component_id`,
            "panelChartContentChildren": `${BASE_URL_API}panel/chart_parameter_component/:component_id/content/:content_id/children`,
            "panelChartContent": `${BASE_URL_API}panel/chart_parameter_component/:component_id/content/:content_id`,
            "savePalette": `${BASE_URL_API}color_palette/`,
            "getPalettesByProject": `${BASE_URL_API}project/:project_id/color_palettes`,
            "editPalette": `${BASE_URL_API}color_palette/:palette_id`,
            "deletePalette": `${BASE_URL_API}color_palette/:palette_id`,
            "getPaletteUsedBy": `${BASE_URL_API}color_palette/:palette_id/used_by`,
            "trashDashboard": `${BASE_URL_API}dashboard/:dashboard_id/trash`,
            "restoreDashboard": `${BASE_URL_API}dashboard/:dashboard_id/restore`,
            "trashPanel": `${BASE_URL_API}panel/:panel_id/trash`,
            "restorePanel": `${BASE_URL_API}panel/:panel_id/restore`,
            "deletePanel": `${BASE_URL_API}panel/:panel_id`,
            "deleteDashboard": `${BASE_URL_API}dashboard/:dashboard_id`,
            "listScheduleTaskTypes": `${BASE_URL_API}schedule_task_type/list`,
            "listScheduleList": `${BASE_URL_API}report/list`,
            "createSchedule": `${BASE_URL_API}dashboard/:dashboard_id/report`,
            "getFiltersReport": `${BASE_URL_API}report/:report_id/filters`,
            "updateGeneralSchedule": `${BASE_URL_API}report/:report_id`,
            "deleteSchedule": `${BASE_URL_API}report/:report_id`,
            "scheduleDetail": `${BASE_URL_API}report/:report_id`,
            "updateScheduleSchedule": `${BASE_URL_API}report/:report_id/schedule`,
            "deleteRecipient": `${BASE_URL_API}report/:report_id/recipients/:recipient_id`,
            "createRecipient": `${BASE_URL_API}report/:report_id/recipients`,
            "updateRecipient": `${BASE_URL_API}report/:report_id/recipients/:recipient_id`,
            "dashboardVisibility": `${BASE_URL_API}dashboard/:id/visibility`,
            "dashboardPublic": `${BASE_URL_API}dashboard/:id/public`,
            "dashboardPanels": `${BASE_URL_API}dashboard/:id/panels`,
            "dashboardPanelsPublic": `${BASE_URL_API}dashboard/:id/panels/public`,
            "deleteFilters": `${BASE_URL_API}report/:report_id/filters`,
            "exportDashboard": `${BASE_URL_API}dashboard/:id/export`,
            "importDashboard": `${BASE_URL_API}dashboard/import`,
            "validateSources": `${BASE_URL_API}dashboard/validate_datasource`,
            "createDashboardFromJson": `${BASE_URL_API}dashboard/create_from_import_json`,
            "duplicateDashboard": `${BASE_URL_API}dashboard/:id/duplicate`,
            "listDashboardCategories": `${BASE_URL_API}dashboard_category/`,
            "createDashboardCategory": `${BASE_URL_API}dashboard_category/`,
            "updateDashboardCategory": `${BASE_URL_API}dashboard_category/:category_id`,
            "deleteDashboardCategory": `${BASE_URL_API}dashboard_category/:category_id`,
            "listDashboardsByCategory": `${BASE_URL_API}dashboard_category/:category_id/dashboards`,
            "updateDashboardCategories": `${BASE_URL_API}dashboard/:id/categories`,
            "listAuthorizedDashboardsByCategory": `${BASE_URL_API}dashboard_category/:category_id/dashboards/accessible`,
            "listAuthorizedDashboardsGroupedByCategory":`${BASE_URL_API}dashboard_category/dashboards/grouped`,
            "updateOperationField": `${BASE_URL_API}panel/:panel_id/query_parameters/selected_field/:selected_field_id`
        }
    };
}

// Export a wrapper function that provides the serviceBaseUrl
export async function dashboardGeneralRequest(params) {
    const URL_API_ROUTE_DICT = buildURLApiRouteDict();
    return await generalRequest({
        ...params,
        serviceBaseUrl: URL_API_ROUTE_DICT
    });
}
