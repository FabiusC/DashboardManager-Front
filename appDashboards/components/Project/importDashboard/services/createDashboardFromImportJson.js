import { handleCreateDashboardFromJson } from '@components/DashboardsWorkspace/features/Dashboard/shared/utils/dashboardActions';
import { buildCreateFromImportJsonPayload } from '../utils/buildCreateFromImportJsonPayload';
export async function createDashboardFromImportJson({
    unzippedData,
    importDestination,
    targetSource,
    importDatasourceMappings,
    applicationId,
    folderPermissions,
    userToken
}) {
    const body = buildCreateFromImportJsonPayload({
        unzippedData,
        importDestination,
        targetSource,
        importDatasourceMappings,
        applicationId,
        folderPermissions
    });

    return handleCreateDashboardFromJson(body, userToken);
}
