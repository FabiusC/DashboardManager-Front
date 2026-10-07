import { dashboardGeneralRequest } from '@services/dashboardAPI';
import { getAclById } from '@services/creangelAuthAPI';
import { resolveFolderRoleIds } from '@components/Project/importDashboard/utils/buildCreateFromImportJsonPayload';
export async function duplicateDashboardInFolder({
    dashboardId,
    applicationId,
    folderId,
    userToken
}) {
    if (!dashboardId) {
        throw new Error('No se indicó el tablero a duplicar.');
    }
    if (!folderId) {
        throw new Error('No se pudo determinar la carpeta de destino.');
    }
    if (!userToken) {
        throw new Error('Sesión no válida. Vuelve a iniciar sesión.');
    }
    if (!applicationId) {
        throw new Error('Falta el identificador de la aplicación.');
    }

    const aclResponse = await getAclById(folderId, {
        Authorization: `Bearer ${userToken}`
    });
    const aclData = aclResponse?.data ?? aclResponse;

    if (!aclData || aclResponse?.status === 'error') {
        throw new Error('No se pudieron obtener los permisos de la carpeta.');
    }

    const { view_permission_id, edit_permission_id } = resolveFolderRoleIds(aclData);

    if (!view_permission_id || !edit_permission_id) {
        throw new Error(
            'No se pudieron obtener los permisos de la carpeta. Verifica que la carpeta tenga roles de vista y edición.'
        );
    }

    const response = await dashboardGeneralRequest({
        version: 'v1',
        typeRequest: 'POST',
        nameUrl: 'duplicateDashboard',
        dynamicParams: { id: dashboardId },
        body: {
            application_id: String(applicationId),
            view_permission_id,
            edit_permission_id
        },
        headers: {
            Authorization: `Bearer ${userToken}`
        }
    });

    if (response?.status !== 'success' && response?.status !== 'ok') {
        throw new Error(
            response?.msg || 'No se pudo duplicar el tablero.'
        );
    }

    return response;
}
