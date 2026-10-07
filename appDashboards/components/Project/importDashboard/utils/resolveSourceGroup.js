import { dataSourceManagerGeneralRequest } from '@services/dataSourceManagerAPI';
import { fetchGroupDisplayName } from '../services/fetchGroupDisplayName';
import { getSourceRecordId } from './getSourceRecordId';
export function resolveGroupFromSourceRecord(record) {
    if (!record || typeof record !== 'object') return null;

    const groupId =
        record.group_id ??
        record.groupId ??
        record.group?.id ??
        null;
    if (groupId == null || String(groupId).trim() === '') return null;

    const groupName =
        record.group_name ??
        record.groupName ??
        record.group?.name ??
        record.group?.showed_name ??
        record.group?.label ??
        '';

    return {
        groupId: String(groupId).trim(),
        groupName: groupName != null ? String(groupName).trim() : ''
    };
}
function sourceAlias(source) {
    const raw = source?.alias;
    return raw != null ? String(raw).trim() : '';
}

export async function resolveImportSourceSelection(picked, validationResponse, userToken) {
    const idStr = String(picked.id);
    let instanceId = picked.instance_id != null ? String(picked.instance_id) : null;
    let groupId = picked.groupId != null ? String(picked.groupId) : null;
    let groupName = picked.groupName != null ? String(picked.groupName) : '';

    const validationRow = findValidationRowBySourceId(validationResponse, idStr);
    if (validationRow) {
        const g = resolveGroupFromSourceRecord(validationRow);
        if (g) {
            groupId = groupId || g.groupId;
            groupName = g.groupName || groupName;
        }
    }

    if (userToken && (!instanceId || !groupId)) {
        try {
            const dsResp = await dataSourceManagerGeneralRequest({
                version: 'v1',
                typeRequest: 'GET',
                nameUrl: 'dataSourceById',
                dynamicParams: { id: idStr }
            });
            if (dsResp?.status === 'success' || dsResp?.status === 'ok') {
                const data = dsResp.data;
                if (!instanceId && data?.instance_id != null) instanceId = String(data.instance_id);
                if (!groupId) {
                    const g = resolveGroupFromSourceRecord(data);
                    if (g) {
                        groupId = g.groupId;
                        groupName = g.groupName || groupName;
                    }
                }
            }
        } catch (e) {
            console.warn('[ImportDashboard] No se pudo obtener detalle de la fuente:', e);
        }
    }

    if (!groupId) {
        throw new Error(
            'La fuente seleccionada no tiene grupo asociado. Elige otra fuente o revisa la configuración en el administrador.'
        );
    }
    if (!instanceId) {
        throw new Error(
            'La fuente seleccionada no es valida. Elige otra fuente o contacta al administrador.'
        );
    }
    if (!groupName?.trim() && userToken) {
        groupName = await fetchGroupDisplayName(groupId, userToken);
    }

    return {
        id: idStr,
        alias: sourceAlias(picked),
        instance_id: instanceId,
        groupId,
        groupName: groupName?.trim() || undefined
    };
}

export function findValidationRowBySourceId(validationResponse, sourceId) {
    const rows = validationResponse?.data?.results;
    if (!Array.isArray(rows) || sourceId == null) return null;
    const idStr = String(sourceId);
    return rows.find((row) => getSourceRecordId(row) === idStr) || null;
}
