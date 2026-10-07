export function extractCreatedDashboardId(response) {
    const data = response?.data;
    if (data == null) return null;

    const candidates = [
        data?.dashboard?.id,
        data?.dashboard?.dashboard_id,
        typeof data?.dashboard === 'string' ? data.dashboard : null,
        data?.id,
        data?.dashboard_id,
        data?.resource_id,
        data?.resource?.id
    ];

    for (const value of candidates) {
        if (value != null && String(value).trim() !== '') {
            return String(value);
        }
    }

    return null;
}
