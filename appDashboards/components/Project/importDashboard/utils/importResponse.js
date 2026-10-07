import { extractUniqueFieldNamesFromBoardJson } from './extractFieldNamesFromImportPayload';

function getPanelsArray(root) {
    if (!root || typeof root !== 'object') return [];
    if (Array.isArray(root.panels)) return root.panels;
    if (root.dashboard_data) return getPanelsArray(root.dashboard_data);
    const inner = root.data;
    if (inner && typeof inner === 'object' && Array.isArray(inner.panels)) return inner.panels;
    return [];
}

function panelTitleFromEntry(panel) {
    const def = panel?.panel;
    if (def && typeof def === 'object') {
        const title = def.title;
        if (typeof title === 'string' && title.trim()) return title.trim();
    }
    const ref = panel?.panel_ref;
    if (typeof ref === 'string' && ref.trim()) return ref.trim();
    return 'Panel sin título';
}

function panelDescriptionFromEntry(panel) {
    const def = panel?.panel;
    if (def && typeof def === 'object') {
        const desc = def.description;
        if (typeof desc === 'string' && desc.trim()) return desc.trim();
    }
    return '';
}

function chartTypeNameFromEntry(panel) {
    const ct = panel?.panel?.chart_type;
    if (ct && typeof ct === 'object' && ct.name) return String(ct.name).trim();
    return '';
}

function collectPanelFieldNames(panel) {
    const names = new Set();
    const query = panel?.query;
    if (!query || typeof query !== 'object') return names;
    for (const row of query.selected_fields || []) {
        if (!row || typeof row !== 'object') continue;
        const name = row.name;
        if (typeof name === 'string' && name.trim()) names.add(name.trim());
    }
    return names;
}

function panelDatasourceKey(panel) {
    const ref = panel?.datasource_ref && typeof panel.datasource_ref === 'object' ? panel.datasource_ref : {};
    const query = panel?.query && typeof panel.query === 'object' ? panel.query : {};
    const id = ref.datasource_id ?? query.datasource_id;
    const name = ref.datasource_name ?? query.datasource_name;
    if (id != null && String(id).trim()) {
        return { type: 'id', value: String(id).trim() };
    }
    if (typeof name === 'string' && name.trim()) {
        return { type: 'name', value: name.trim() };
    }
    return null;
}

export function buildDatasourceGroupsFromExport(dashboardData) {
    const panels = getPanelsArray(dashboardData);
    const grouped = new Map();

    panels.forEach((panel) => {
        if (!panel || typeof panel !== 'object') return;
        const key = panelDatasourceKey(panel);
        if (!key) return;
        const mapKey = `${key.type}\u0001${key.value}`;
        if (!grouped.has(mapKey)) {
            grouped.set(mapKey, {
                group_key: key,
                panel_refs: [],
                panel_items: [],
                field_names: new Set()
            });
        }
        const entry = grouped.get(mapKey);
        const panelRef = panel.panel_ref;
        if (typeof panelRef === 'string' && panelRef.trim()) {
            const ref = panelRef.trim();
            entry.panel_refs.push(ref);
            entry.panel_items.push({
                ref,
                title: panelTitleFromEntry(panel),
                description: panelDescriptionFromEntry(panel),
                chart_type: chartTypeNameFromEntry(panel)
            });
        }
        collectPanelFieldNames(panel).forEach((n) => entry.field_names.add(n));
    });

    return Array.from(grouped.values())
        .sort((a, b) => {
            const ak = `${a.group_key.type}:${a.group_key.value}`;
            const bk = `${b.group_key.type}:${b.group_key.value}`;
            return ak.localeCompare(bk);
        })
        .map((entry) => {
            const seenRefs = new Set();
            const panel_items = [];
            entry.panel_items.forEach((item) => {
                if (seenRefs.has(item.ref)) return;
                seenRefs.add(item.ref);
                panel_items.push(item);
            });
            panel_items.sort((a, b) => a.title.localeCompare(b.title, 'es'));
            return {
                group_key: entry.group_key,
                panel_refs: panel_items.map((p) => p.ref),
                panel_items,
                field_names: [...entry.field_names].sort()
            };
        });
}

/** Todos los paneles del export con título (vista de una sola fuente). */
export function getAllPanelItemsFromImport(unzippedData) {
    const dashboardData = unzippedData?.dashboard_data ?? unzippedData;
    return getPanelsArray(dashboardData)
        .filter((p) => p && typeof p === 'object' && p.panel_ref)
        .map((panel) => ({
            ref: String(panel.panel_ref).trim(),
            title: panelTitleFromEntry(panel),
            description: panelDescriptionFromEntry(panel),
            chart_type: chartTypeNameFromEntry(panel)
        }))
        .sort((a, b) => a.title.localeCompare(b.title, 'es'));
}

export function getGroupPanelItems(group, unzippedData = null) {
    const fromGroup = group?.panel_items;
    const hasRichItems =
        Array.isArray(fromGroup) &&
        fromGroup.length > 0 &&
        fromGroup.some((p) => p?.title && p.title !== p.ref);

    if (hasRichItems) return fromGroup;

    const refs = group?.panel_refs?.length
        ? group.panel_refs
        : fromGroup?.map((p) => p.ref) || [];

    if (unzippedData && refs.length) {
        const byRef = new Map();
        getPanelsArray(unzippedData?.dashboard_data ?? unzippedData).forEach((panel) => {
            const ref = panel?.panel_ref;
            if (typeof ref !== 'string' || !ref.trim()) return;
            byRef.set(ref.trim(), {
                ref: ref.trim(),
                title: panelTitleFromEntry(panel),
                description: panelDescriptionFromEntry(panel),
                chart_type: chartTypeNameFromEntry(panel)
            });
        });
        const resolved = refs
            .map((r) => byRef.get(String(r).trim()))
            .filter(Boolean);
        if (resolved.length) return resolved.sort((a, b) => a.title.localeCompare(b.title, 'es'));
    }

    if (Array.isArray(fromGroup) && fromGroup.length > 0) return fromGroup;

    return refs.map((ref) => ({
        ref: String(ref),
        title: String(ref),
        description: '',
        chart_type: ''
    }));
}

/** Resumen corto para la tarjeta (títulos, no refs). */
export function formatGroupPanelsPreview(group, maxTitles = 2, unzippedData = null) {
    const items = getGroupPanelItems(group, unzippedData);
    if (!items.length) return null;
    if (items.length === 1) return items[0].title;
    const shown = items.slice(0, maxTitles).map((p) => p.title);
    const rest = items.length - shown.length;
    if (rest > 0) return `${shown.join(' · ')} y ${rest} más`;
    return shown.join(' · ');
}

export function parseImportUploadResponse(apiData) {
    if (!apiData || typeof apiData !== 'object') {
        return { dashboardData: null, datasourceGroups: [] };
    }
    if (apiData.dashboard_data) {
        return {
            dashboardData: apiData.dashboard_data,
            datasourceGroups: Array.isArray(apiData.datasource_groups)
                ? apiData.datasource_groups
                : buildDatasourceGroupsFromExport(apiData.dashboard_data)
        };
    }
    if (apiData.dashboard || Array.isArray(apiData.panels)) {
        return {
            dashboardData: apiData,
            datasourceGroups: buildDatasourceGroupsFromExport(apiData)
        };
    }
    return { dashboardData: null, datasourceGroups: [] };
}

export function buildWizardImportPayload(dashboardData, datasourceGroups) {
    return { dashboard_data: dashboardData, datasource_groups: datasourceGroups };
}

export function getImportDatasourceGroups(unzippedData) {
    const groups = unzippedData?.datasource_groups;
    return Array.isArray(groups) && groups.length > 0 ? groups : [];
}

export function isMultiSourceImport(unzippedData) {
    return getImportDatasourceGroups(unzippedData).length > 1;
}

export function groupFieldNames(group) {
    if (!group?.field_names?.length) return [];
    return group.field_names.map((f) => String(f).trim()).filter(Boolean);
}

export function groupOriginLabel(group) {
    const key = group?.group_key;
    if (key?.type === 'name' && key?.value) return String(key.value);
    if (key?.value) return String(key.value);
    return 'Fuente de origen';
}

export function groupPanelRefsLine(group) {
    return formatGroupPanelsPreview(group, 3);
}

export function getLegacyFieldNames(unzippedData) {
    const dashboardData = unzippedData?.dashboard_data ?? unzippedData;
    return extractUniqueFieldNamesFromBoardJson(dashboardData);
}
