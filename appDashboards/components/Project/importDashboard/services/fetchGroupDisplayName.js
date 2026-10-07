import { getGroupsAvaiable } from '@services/creangelAuthAPI';
export async function fetchGroupDisplayName(groupId, userToken) {
    if (!groupId || !userToken) return '';

    try {
        const response = await getGroupsAvaiable({
            Authorization: `Bearer ${userToken}`
        });

        const results = response?.data?.results ?? response?.data ?? [];
        if (!Array.isArray(results)) return '';

        const match = results.find((g) => g?.id != null && String(g.id) === String(groupId));
        if (!match) return '';

        const name = match.name ?? match.showed_name ?? match.label;
        return name != null ? String(name).trim() : '';
    } catch (e) {
        console.warn('[ImportDashboard] No se pudo resolver nombre del grupo:', e);
        return '';
    }
}
