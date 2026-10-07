function unwrapImportRoot(value) {
    if (!value || typeof value !== 'object') return null;
    if (value.dashboard_data && typeof value.dashboard_data === 'object') {
        return value.dashboard_data;
    }
    if (value.data && typeof value.data === 'object') {
        const inner = value.data;
        if (inner.dashboard_data && typeof inner.dashboard_data === 'object') {
            return inner.dashboard_data;
        }
        if (inner.dashboard || Array.isArray(inner.panels)) return inner;
    }
    if (value.dashboard || Array.isArray(value.panels)) return value;
    return value;
}

export function normalizeDashboardDataForCreate(unzippedData) {
    const root = unwrapImportRoot(unzippedData);
    if (!root || typeof root !== 'object') return null;

    return {
        version: root.version ?? null,
        exported_at: root.exported_at ?? null,
        dashboard: root.dashboard ?? {},
        layout: Array.isArray(root.layout) ? root.layout : [],
        panels: Array.isArray(root.panels) ? root.panels : [],
        datasource_refs: Array.isArray(root.datasource_refs) ? root.datasource_refs : []
    };
}

function resolveOriginalKey(source, groupFallback) {
    const fromSelection = source?.originalKey || source?.original_key;
    if (fromSelection && typeof fromSelection === 'object' && fromSelection.type && fromSelection.value != null) {
        return {
            type: String(fromSelection.type),
            value: String(fromSelection.value)
        };
    }
    const fromGroup = groupFallback?.group_key;
    if (fromGroup && typeof fromGroup === 'object' && fromGroup.type && fromGroup.value != null) {
        return {
            type: String(fromGroup.type),
            value: String(fromGroup.value)
        };
    }
    return null;
}

export function buildDatasourceMapping(targetSource, { datasourceGroups = [], selections = [] } = {}) {
    const groups = Array.isArray(datasourceGroups) ? datasourceGroups : [];
    const picks = Array.isArray(selections) && selections.length > 0 ? selections : targetSource ? [targetSource] : [];

    if (groups.length > 1 && picks.length > 0) {
        return picks
            .map((source, index) => {
                const newDatasourceId = source?.id != null ? String(source.id) : '';
                const newInstanceId = source?.instance_id != null ? String(source.instance_id) : '';
                if (!newDatasourceId || !newInstanceId) return null;
                const original_key = resolveOriginalKey(source, groups[index]);
                const item = {
                    new_datasource_id: newDatasourceId,
                    new_instance_id: newInstanceId
                };
                if (original_key) item.original_key = original_key;
                if (source?.groupId) item.new_group_id = String(source.groupId);
                return item;
            })
            .filter(Boolean);
    }

    const source = picks[0] || targetSource;
    const newDatasourceId = source?.id != null ? String(source.id) : '';
    const newInstanceId = source?.instance_id != null ? String(source.instance_id) : '';
    if (!newDatasourceId || !newInstanceId) return [];

    const item = {
        new_datasource_id: newDatasourceId,
        new_instance_id: newInstanceId
    };
    if (source?.groupId) item.new_group_id = String(source.groupId);
    return [item];
}

export function resolveFolderRoleIds(folderPermissions) {
    const viewRoleId =
        folderPermissions?.view_role?.id ||
        folderPermissions?.view_permission?.rol?.id ||
        folderPermissions?.view_permission_id;
    const editRoleId =
        folderPermissions?.edit_role?.id ||
        folderPermissions?.edit_permission?.rol?.id ||
        folderPermissions?.edit_permission_id;

    return {
        view_permission_id: viewRoleId != null ? String(viewRoleId) : null,
        edit_permission_id: editRoleId != null ? String(editRoleId) : null
    };
}

export function buildCreateFromImportJsonPayload({
    unzippedData,
    importDestination,
    targetSource,
    importDatasourceMappings,
    applicationId,
    folderPermissions
}) {
    const dashboardData = normalizeDashboardDataForCreate(unzippedData);
    if (!dashboardData) {
        throw new Error('No hay datos del tablero para importar.');
    }

    const { groupId, projectId, folderId } = importDestination || {};
    if (!groupId || !projectId || !folderId) {
        throw new Error('Debes seleccionar grupo, proyecto y carpeta de destino.');
    }

    if (!applicationId) {
        throw new Error('Falta el identificador de la aplicación.');
    }

    const { view_permission_id, edit_permission_id } = resolveFolderRoleIds(folderPermissions);
    if (!view_permission_id || !edit_permission_id) {
        throw new Error(
            'No se pudieron obtener los permisos de la carpeta. Verifica que la carpeta tenga roles de vista y edición.'
        );
    }

    const datasourceGroups = unzippedData?.datasource_groups ?? [];
    const selections =
        Array.isArray(importDatasourceMappings) && importDatasourceMappings.length > 0
            ? importDatasourceMappings
            : targetSource
              ? [targetSource]
              : [];

    const datasource_mapping = buildDatasourceMapping(targetSource, {
        datasourceGroups,
        selections
    });
    if (datasource_mapping.length === 0) {
        throw new Error(
            'La fuente seleccionada no tiene instance_id. Elige otra fuente o contacta al administrador.'
        );
    }

    if (datasourceGroups.length > 1 && datasource_mapping.length !== datasourceGroups.length) {
        throw new Error('Debes asignar una fuente destino para cada grupo del tablero.');
    }

    if (datasourceGroups.length > 1) {
        const missingOriginalKey = datasource_mapping.some(
            (m) => !m?.original_key?.type || m?.original_key?.value == null
        );
        if (missingOriginalKey) {
            throw new Error(
                'Vuelve al paso de asignación e intenta de nuevo.'
            );
        }
    }

    const payload = {
        destination: {
            group_id: String(groupId),
            project_id: String(projectId),
            folder_id: String(folderId)
        },
        datasource_mapping,
        dashboard_data: dashboardData,
        application_id: String(applicationId),
        view_permission_id,
        edit_permission_id
    };

    return payload;
}
