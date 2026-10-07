export function mapRecordToSelectOption(entity) {
    if (!entity || typeof entity !== 'object') return null;
    const id =
        entity.id ??
        entity.group_id ??
        entity.project_id ??
        entity.folder_id 
    if (id == null || id === '') return null;
    const label =
        entity.name ??
        String(id);
    return { id, label };
}
