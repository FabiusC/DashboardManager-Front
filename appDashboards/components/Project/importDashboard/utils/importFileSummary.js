export function formatBytes(bytes) {
    if (bytes == null || Number.isNaN(Number(bytes))) return '';
    const n = Number(bytes);
    if (n < 1024) return `${n} B`;
    const kb = n / 1024;
    if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
    const mb = kb / 1024;
    return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

export function countPanelsFromImportPayload(data) {
    if (!data || typeof data !== 'object') return null;
    if (data.dashboard_data) return countPanelsFromImportPayload(data.dashboard_data);
    if (Array.isArray(data.panels)) return data.panels.length;
    if (typeof data.panels_count === 'number') return data.panels_count;
    if (data.config && Array.isArray(data.config.panels)) return data.config.panels.length;
    if (data.dashboard && Array.isArray(data.dashboard.panels)) return data.dashboard.panels.length;
    return null;
}
