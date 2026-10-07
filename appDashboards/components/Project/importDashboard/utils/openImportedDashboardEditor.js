
export function openImportedDashboardEditor(router, { dashboardId, dashboardName, destination }) {
    if (!router || !dashboardId) return false;

    const id = String(dashboardId);

    ['productId', 'productName', 'productType', 'dashboardId'].forEach((key) => {
        sessionStorage.removeItem(key);
    });

    sessionStorage.setItem('resourceId', id);
    sessionStorage.setItem('resourceType', 'dashboard');
    if (dashboardName) {
        sessionStorage.setItem('resourceName', String(dashboardName));
    }

    if (destination?.groupId) {
        sessionStorage.setItem('groupId', String(destination.groupId));
    }
    if (destination?.projectId) {
        sessionStorage.setItem('projectId', String(destination.projectId));
    }
    if (destination?.folderId) {
        sessionStorage.setItem('folderId', String(destination.folderId));
    }
    if (destination?.projectName) {
        sessionStorage.setItem('projectName', String(destination.projectName));
    }
    if (destination?.folderName) {
        sessionStorage.setItem('folderName', String(destination.folderName));
    }

    router.replace('/dashboardsWorkspace');
    return true;
}
