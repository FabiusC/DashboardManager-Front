export function getSourceRecordId(record) {
    if (record == null || typeof record !== 'object' || Array.isArray(record)) return null;
    const id =
        record.id ??
        record.data_source_id ??
        record.datasource_id ??
        record.source_id;
    if (id == null) return null;
    const s = String(id).trim();
    return s || null;
}
