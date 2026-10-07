const STORAGE_KEY = 'dashboardCopyClipboard';

function parseClipboard(raw) {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        const dashboardId = parsed.dashboardId != null ? String(parsed.dashboardId) : '';
        const folderId = parsed.folderId != null ? String(parsed.folderId) : '';
        if (!dashboardId || !folderId) return null;
        return {
            dashboardId,
            dashboardName:
                typeof parsed.dashboardName === 'string' ? parsed.dashboardName : '',
            folderId,
            copiedAt: typeof parsed.copiedAt === 'number' ? parsed.copiedAt : null
        };
    } catch {
        return null;
    }
}

export function setDashboardClipboard({ dashboardId, dashboardName, folderId }) {
    if (typeof window === 'undefined') return;
    if (!dashboardId || !folderId) return;

    sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
            dashboardId: String(dashboardId),
            dashboardName: dashboardName != null ? String(dashboardName) : '',
            folderId: String(folderId),
            copiedAt: Date.now()
        })
    );
}

export function getDashboardClipboard() {
    if (typeof window === 'undefined') return null;
    return parseClipboard(sessionStorage.getItem(STORAGE_KEY));
}

export function clearDashboardClipboard() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(STORAGE_KEY);
}

export function canPasteInFolder(folderId) {
    if (!folderId) return false;
    const clipboard = getDashboardClipboard();
    if (!clipboard) return false;
    return clipboard.folderId === String(folderId);
}
