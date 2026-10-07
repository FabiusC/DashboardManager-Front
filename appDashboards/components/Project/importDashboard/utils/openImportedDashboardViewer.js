
export function openImportedDashboardViewer(router, { dashboardId }) {
    if (!router || !dashboardId) return false;

    router.replace(`/dashboard/${String(dashboardId)}`);
    return true;
}
