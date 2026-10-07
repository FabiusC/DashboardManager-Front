function addTrimmedString(s, into) {
    if (typeof s !== 'string') return;
    const t = s.trim();
    if (t) into.add(t);
}

function collectFilterFieldNames(node, into) {
    if (node == null || typeof node !== 'object') return;
    if (typeof node.field === 'string') addTrimmedString(node.field, into);
    if (Array.isArray(node.conditions)) {
        node.conditions.forEach((c) => collectFilterFieldNames(c, into));
    }
}

function collectSelectedFieldNames(fields, into) {
    if (!Array.isArray(fields)) return;
    fields.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        addTrimmedString(item.name, into);
        addTrimmedString(item.field_name, into);
    });
}


function getPanelsArray(root) {
    if (!root || typeof root !== 'object') return [];
    if (root.dashboard_data) return getPanelsArray(root.dashboard_data);
    if (Array.isArray(root.panels)) return root.panels;
    const inner = root.data;
    if (inner && typeof inner === 'object' && Array.isArray(inner.panels)) return inner.panels;
    return [];
}

function addDatasourceName(str, into) {
    if (typeof str !== 'string') return;
    const t = str.trim();
    if (t) into.add(t);
}
export function extractUniqueDatasourceNamesFromImport(value) {
    const into = new Set();
    const panels = getPanelsArray(value);
    panels.forEach((entry) => {
        if (!entry || typeof entry !== 'object') return;
        const q = entry.query;
        if (q && typeof q === 'object') addDatasourceName(q.datasource_name, into);
        const dr = entry.datasource_ref;
        if (dr && typeof dr === 'object') addDatasourceName(dr.datasource_name, into);
    });
    const roots = [value, value && typeof value === 'object' ? value.data : null].filter(
        (r) => r && typeof r === 'object'
    );
    roots.forEach((root) => {
        if (!Array.isArray(root.datasource_refs)) return;
        root.datasource_refs.forEach((r) => {
            if (r && typeof r === 'object') addDatasourceName(r.datasource_name, into);
        });
    });
    return Array.from(into).sort();
}

function walkLegacyFieldNameKeys(node, into) {
    if (node == null) return;
    if (Array.isArray(node)) {
        node.forEach((n) => walkLegacyFieldNameKeys(n, into));
        return;
    }
    if (typeof node !== 'object') return;
    Object.entries(node).forEach(([key, v]) => {
        if (key === 'field_name') addTrimmedString(v, into);
        walkLegacyFieldNameKeys(v, into);
    });
}
export function extractUniqueFieldNamesFromBoardJson(value) {
    const into = new Set();

    const panels = getPanelsArray(value);
    panels.forEach((entry) => {
        if (!entry || typeof entry !== 'object') return;
        const query = entry.query;
        if (query && typeof query === 'object') {
            collectSelectedFieldNames(query.selected_fields, into);
            collectFilterFieldNames(query.filters, into);
        }
    });

    walkLegacyFieldNameKeys(value, into);

    return Array.from(into).sort();
}
