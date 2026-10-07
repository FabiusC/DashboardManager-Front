import { getSourceRecordId } from '../utils/getSourceRecordId';
import { resolveGroupFromSourceRecord } from '../utils/resolveSourceGroup';

export function normalizeToSourceIdList(raw) {
    if (raw == null) return [];
    if (typeof raw === 'string' || typeof raw === 'number') {
        const s = String(raw).trim();
        return s ? [s] : [];
    }
    if (Array.isArray(raw)) {
        const ids = [];
        raw.forEach((item) => {
            ids.push(...normalizeToSourceIdList(item));
        });
        return [...new Set(ids)];
    }
    if (typeof raw === 'object') {
        const key = getSourceRecordId(raw);
        return key ? [key] : [];
    }
    return [];
}
function isSourceLikeObject(o) {
    return getSourceRecordId(o) != null;
}
export function parseGlobalAvailableSourcesFromValidation(validationResponse) {
    const data = validationResponse?.data;
    if (!data || typeof data !== 'object') return { items: [] };

    const toItem = (raw) => {
        if (raw == null) return null;
        if (typeof raw === 'string' || typeof raw === 'number') {
            const id = String(raw).trim();
            return id ? { id, label: id, raw } : null;
        }
        if (typeof raw === 'object' && isSourceLikeObject(raw)) {
            const id = getSourceRecordId(raw);
            if (!id) return null;
            const label = String(raw.alias || raw.name || raw.title || raw.datasource_name || id).trim();
            return { id, label: label || id, raw };
        }
        return null;
    };

    const tryArray = (arr) => {
        if (!Array.isArray(arr) || arr.length === 0) return null;
        const items = [];
        arr.forEach((entry) => {
            const it = toItem(entry);
            if (it) items.push(it);
        });
        const seen = new Set();
        const deduped = items.filter((it) => {
            if (seen.has(it.id)) return false;
            seen.add(it.id);
            return true;
        });
        return deduped.length ? deduped : null;
    };

    const arrayKeys = [
        'results',
        'available_sources',
        'validated_sources',
        'validated_data_sources',
        'data_sources',
        'compatible_data_sources',
        'sources',
        'list',
        'compatible_sources'
    ];

    for (let i = 0; i < arrayKeys.length; i += 1) {
        const key = arrayKeys[i];
        const candidate = data[key];
        if (Array.isArray(candidate)) {
            const got = tryArray(candidate);
            if (got) return { items: got };
        }
    }

    if (Array.isArray(data)) {
        const got = tryArray(data);
        if (got) return { items: got };
    }

    const inner = data.data;
    if (inner && typeof inner === 'object') {
        for (let i = 0; i < arrayKeys.length; i += 1) {
            const key = arrayKeys[i];
            const candidate = inner[key];
            if (Array.isArray(candidate)) {
                const got = tryArray(candidate);
                if (got) return { items: got };
            }
        }
    }

    return { items: [] };
}

export function parseCompatibleSourceIdsByFieldName(validationResponse, fieldNames) {
    const names = Array.isArray(fieldNames) ? fieldNames : [];
    const out = {};
    names.forEach((f) => {
        out[f] = [];
    });

    const data = validationResponse?.data;
    if (!data || typeof data !== 'object') return out;

    if (Array.isArray(data)) {
        data.forEach((item) => {
            const fn = item?.field_name ?? item?.fieldName;
            if (typeof fn !== 'string' || !names.includes(fn)) return;
            const merged = [
                ...normalizeToSourceIdList(item.compatible_sources),
                ...normalizeToSourceIdList(item.sources),
                ...normalizeToSourceIdList(item.data_sources),
                ...normalizeToSourceIdList(item.datasource_ids),
                ...normalizeToSourceIdList(item.data_source_ids),
                ...normalizeToSourceIdList(item.ids),
            ];
            out[fn] = [...new Set(merged)];
        });
        if (names.some((f) => out[f].length > 0)) return out;
    }

    const nestedKeys = ['compatible_sources', 'field_sources', 'sources_by_field', 'validations', 'fields'];
    for (let i = 0; i < nestedKeys.length; i += 1) {
        const nested = data[nestedKeys[i]];
        if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
            names.forEach((fn) => {
                if (nested[fn] != null) {
                    out[fn] = normalizeToSourceIdList(nested[fn]);
                }
            });
            if (names.some((f) => out[f].length > 0)) return out;
        }
    }

    names.forEach((fn) => {
        if (data[fn] != null) {
            out[fn] = normalizeToSourceIdList(data[fn]);
        }
    });

    const sharedFromResults = Array.isArray(data.results) ? normalizeToSourceIdList(data.results) : [];
    if (sharedFromResults.length > 0) {
        names.forEach((fn) => {
            if (!out[fn].length) {
                out[fn] = [...sharedFromResults];
            }
        });
    }

    return out;
}

export function buildSourcesByIdMap(allSources) {
    const map = new Map();
    for (const s of allSources ?? []) {
        const key = getSourceRecordId(s);
        if (!key) continue;
        map.set(key, { ...s, id: key, ...resolveGroupFromSourceRecord(s) });
    }
    return map;
}

export function listCompatibleSources(sourcesById, validationResponse) {
    const rows = validationResponse?.data?.results;
    if (!Array.isArray(rows)) return [];
    const map = new Map(sourcesById);
    const orderedIds = [];
    const seen = new Set();
    for (const row of rows) {
        const keys = normalizeToSourceIdList(row);
        for (let i = 0; i < keys.length; i += 1) {
            const key = keys[i];
            const prev = map.get(key) ?? { id: key };
            const record = typeof row === 'object' && row != null && !Array.isArray(row) ? row : null;
            map.set(key, {
                ...prev,
                name: record?.name != null ? String(record.name) : prev.name ?? key,
                alias: record?.alias != null ? String(record.alias).trim() : prev.alias ?? '',
                ...(record ? resolveGroupFromSourceRecord(record) : {})
            });
            if (!seen.has(key)) {
                seen.add(key);
                orderedIds.push(key);
            }
        }
    }
    return orderedIds.map((id) => map.get(id)).filter(Boolean);
}

export function getSourceGroupId(source) {
    if (!source || typeof source !== 'object') return null;
    const fromFields = resolveGroupFromSourceRecord(source);
    const gid = fromFields?.groupId ?? source.groupId;
    if (gid == null || String(gid).trim() === '') return null;
    return String(gid).trim();
}

export function getMultiSourceSharedGroupIds(compatLists) {
    const lists = (compatLists ?? []).filter((list) => Array.isArray(list) && list.length > 0);
    if (!lists.length) return new Set();

    let shared = null;
    for (const list of lists) {
        const groupIds = new Set();
        list.forEach((source) => {
            const gid = getSourceGroupId(source);
            if (gid) groupIds.add(gid);
        });
        if (!groupIds.size) return new Set();
        if (shared === null) {
            shared = groupIds;
        } else {
            shared = new Set([...shared].filter((gid) => groupIds.has(gid)));
        }
    }
    return shared ?? new Set();
}

export function filterCompatibleByGroupIds(sources, allowedGroupIds) {
    if (!(allowedGroupIds instanceof Set) || allowedGroupIds.size === 0) return [];
    return (sources ?? []).filter((source) => {
        const gid = getSourceGroupId(source);
        return gid != null && allowedGroupIds.has(gid);
    });
}
