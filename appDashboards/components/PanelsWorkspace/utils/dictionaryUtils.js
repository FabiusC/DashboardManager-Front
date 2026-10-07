import { handleQuery } from "@helpers/QueryManagerAPI/queryRequest";
import { resolveFieldType } from "@components/DashboardsWorkspace/hooks/useFields";

export const DICTIONARY_RECORDS_LIMIT = 30;
export const DICTIONARY_RECORDS_QUERY_KEY = "dictionary-records";
export const EMPTY_DICTIONARY_RULE = { is_dictionary: false };

export const EMPTY_DICTIONARY_DRAFT = {
  is_dictionary: false,
  datasource_id: "",
  key_field: "",
  value_field: "",
  origin_field: "",
};

export const ruleToDraft = (rule) => {
  if (!rule?.is_dictionary) {
    return { ...EMPTY_DICTIONARY_DRAFT };
  }

  return {
    is_dictionary: true,
    datasource_id: rule.datasource_id || "",
    key_field: getDictionaryKeyFieldId(rule) || "",
    value_field: rule.value_field || "",
    origin_field: getDictionaryOriginFieldId(rule) || "",
  };
};

export const areDictionaryDraftsEqual = (left, right) =>
  !!left?.is_dictionary === !!right?.is_dictionary &&
  String(left?.datasource_id || "") === String(right?.datasource_id || "") &&
  String(left?.key_field || "") === String(right?.key_field || "") &&
  String(left?.value_field || "") === String(right?.value_field || "") &&
  String(left?.origin_field || "") === String(right?.origin_field || "");

export const buildDictionaryRulePayload = (draft) => {
  if (!draft?.is_dictionary) {
    return { is_dictionary: false };
  }

  const payload = { is_dictionary: true };

  if (draft.datasource_id) payload.datasource_id = draft.datasource_id;
  if (draft.key_field) payload.key_field = draft.key_field;
  if (draft.value_field) payload.value_field = draft.value_field;
  if (draft.origin_field) payload.origin_field = draft.origin_field;

  return payload;
};

export const getDictionaryKeyFieldId = (dictionaryRule) =>
  dictionaryRule?.key_field || dictionaryRule?.field || "";

export const getDictionaryOriginFieldId = (dictionaryRule) =>
  dictionaryRule?.origin_field || "";

export const isDictionaryRuleComplete = (dictionaryRule) =>
  !!(
    dictionaryRule?.is_dictionary &&
    dictionaryRule?.datasource_id &&
    getDictionaryKeyFieldId(dictionaryRule) &&
    dictionaryRule?.value_field &&
    getDictionaryOriginFieldId(dictionaryRule)
  );

const findSelectedField = (originFieldId, selectedFields = []) => {
  if (!originFieldId) return null;
  const normalizedOriginId = String(originFieldId);
  return (
    selectedFields.find((item) => {
      const candidateId = item.field_id ?? item.id;
      return candidateId != null && String(candidateId) === normalizedOriginId;
    }) || null
  );
};

export const resolveOriginFieldName = (dictionaryRule, selectedFields = [], queryFieldsDistribution) => {
  const originFieldId = getDictionaryOriginFieldId(dictionaryRule);
  if (!originFieldId) return null;

  const groupByField = queryFieldsDistribution?.group_by_fields?.[0];
  const groupByFieldId = groupByField?.field_id ?? groupByField?.id;
  if (groupByFieldId != null && String(groupByFieldId) === String(originFieldId)) {
    return groupByField.name || findSelectedField(originFieldId, selectedFields)?.name || null;
  }

  return findSelectedField(originFieldId, selectedFields)?.name || null;
};

export const resolveOriginFieldAlias = (dictionaryRule, selectedFields = [], queryFieldsDistribution) => {
  const originFieldId = getDictionaryOriginFieldId(dictionaryRule);
  if (!originFieldId) return null;

  const selectedField = findSelectedField(originFieldId, selectedFields);
  const groupByField = queryFieldsDistribution?.group_by_fields?.[0];
  const groupByFieldId = groupByField?.field_id ?? groupByField?.id;
  if (groupByFieldId != null && String(groupByFieldId) === String(originFieldId)) {
    return groupByField.alias || groupByField.name || selectedField?.alias || selectedField?.name || null;
  }

  return selectedField?.alias || selectedField?.name || null;
};

export const resolvePanelMainData = (rawData) => {
  if (Array.isArray(rawData)) return rawData;
  if (rawData?.mainData && Array.isArray(rawData.mainData)) return rawData.mainData;
  return [];
};

export const getOriginFieldValueCandidates = (
  dictionaryRule,
  selectedFields = [],
  queryFieldsDistribution
) => {
  const originFieldId = getDictionaryOriginFieldId(dictionaryRule);
  if (!originFieldId) return [];

  const candidates = [];
  const selectedField = findSelectedField(originFieldId, selectedFields);
  const groupByField = queryFieldsDistribution?.group_by_fields?.[0];
  const groupByFieldId = groupByField?.field_id ?? groupByField?.id;

  if (selectedField?.name) candidates.push(selectedField.name);
  if (selectedField?.alias) candidates.push(selectedField.alias);

  if (groupByFieldId != null && String(groupByFieldId) === String(originFieldId)) {
    if (groupByField?.name) candidates.push(groupByField.name);
    if (groupByField?.alias) candidates.push(groupByField.alias);
  }

  return [...new Set(candidates.filter(Boolean))];
};

export const getUniqueValuesFromRawData = (rawData, fieldNameOrCandidates, fieldAlias) => {
  const candidates = Array.isArray(fieldNameOrCandidates)
    ? fieldNameOrCandidates
    : [fieldNameOrCandidates, fieldAlias].filter(Boolean);

  const rows = resolvePanelMainData(rawData);
  if (rows.length === 0 || candidates.length === 0) return [];

  const values = new Set();
  for (const row of rows) {
    let value;
    for (const key of candidates) {
      if (row[key] !== undefined) {
        value = row[key];
        break;
      }
    }
    if (value === null || value === undefined || String(value).trim() === "") continue;
    values.add(String(value));
  }
  return Array.from(values);
};

/**
 * Comprueba que todos los valores del campo origen existan en el campo clave.
 * El campo clave puede tener valores adicionales sin invalidar la compatibilidad.
 */
export const evaluateOriginKeyCompatibility = (originValues, dictionaryMap) => {
  const dictionaryKeys = Object.keys(dictionaryMap || {});
  const dictionaryKeySet = new Set(dictionaryKeys);
  const originSet = new Set(originValues);

  const missingKeys = originValues.filter((value) => !dictionaryKeySet.has(value));
  const extraKeys = dictionaryKeys.filter((key) => !originSet.has(key));

  return {
    isCompatible: missingKeys.length === 0,
    missingKeys,
    extraKeys,
    originCount: originValues.length,
    dictionaryKeyCount: dictionaryKeys.length,
  };
};

/**
 * Evalúa si el diccionario puede usarse para traducir el campo origen del panel.
 */
export const evaluateDictionaryTranslation = ({
  rawData,
  originFieldName,
  originFieldAlias,
  originFieldCandidates,
  dictionaryMap,
  isDictionaryLoading = false,
}) => {
  if (isDictionaryLoading) {
    return { isValid: false, reason: "loading", canUse: false };
  }

  const candidates =
    originFieldCandidates?.length > 0
      ? originFieldCandidates
      : [originFieldName, originFieldAlias].filter(Boolean);

  if (candidates.length === 0) {
    return { isValid: false, reason: "missing_origin_field", canUse: false };
  }

  const originValues = getUniqueValuesFromRawData(rawData, candidates);
  if (originValues.length === 0) {
    return {
      isValid: false,
      reason: "no_origin_data",
      canUse: false,
      originValues,
    };
  }

  if (originValues.length > DICTIONARY_RECORDS_LIMIT) {
    return {
      isValid: false,
      reason: "exceeds_limit",
      canUse: false,
      uniqueCount: originValues.length,
      originValues,
    };
  }

  const dictionaryKeys = Object.keys(dictionaryMap || {});
  if (dictionaryKeys.length === 0) {
    return {
      isValid: false,
      reason: "no_dictionary",
      canUse: false,
      originValues,
    };
  }

  const compatibility = evaluateOriginKeyCompatibility(originValues, dictionaryMap);
  if (!compatibility.isCompatible) {
    return {
      isValid: false,
      reason: "missing_keys",
      canUse: false,
      uniqueCount: originValues.length,
      originValues,
      missingKeys: compatibility.missingKeys,
      extraKeys: compatibility.extraKeys,
      dictionaryKeyCount: compatibility.dictionaryKeyCount,
    };
  }

  return {
    isValid: true,
    reason: "ok",
    canUse: true,
    uniqueCount: originValues.length,
    originValues,
    dictionaryKeyCount: compatibility.dictionaryKeyCount,
    extraKeys: compatibility.extraKeys,
  };
};

export const isDictionaryTranslationUsable = (translationResult) =>
  !!translationResult?.canUse;

/** Solo permite guardar si la configuración está completa y origen ↔ clave son compatibles. */
export const canSaveDictionaryRule = (draft, translationResult) => {
  if (!draft?.is_dictionary || !isDictionaryRuleComplete(draft)) return false;
  if (!translationResult || translationResult.reason === "loading") return false;
  return isDictionaryTranslationUsable(translationResult);
};

export const getDictionaryValidationMessage = (translationResult) => {
  const reason = typeof translationResult === "string" ? translationResult : translationResult?.reason;

  if (reason === "missing_origin_field") {
    return "No se pudo resolver el campo origen en los datos del panel.";
  }

  if (reason === "no_origin_data") {
    return "No hay datos de la gráfica para el campo origen. Espera a que cargue el panel o verifica que el campo esté en la consulta.";
  }

  if (reason === "exceeds_limit") {
    return "Traducción fuera de rango: el campo origen tiene más de 30 valores únicos.";
  }

  if (reason === "no_dictionary") {
    return "No hay registros válidos en el campo clave del diccionario.";
  }

  if (reason === "missing_keys" || reason === "no_equivalence") {
    const missingCount = translationResult?.missingKeys?.length || 0;
    if (missingCount > 0) {
      return `Origen y clave no son compatibles: el campo clave no incluye ${missingCount} valor(es) del campo origen.`;
    }
    return "Origen y clave no son compatibles: faltan valores del campo origen en el campo clave.";
  }

  return null;
};

export const getDictionaryRecordsQueryKey = (dictionaryRule) => [
  DICTIONARY_RECORDS_QUERY_KEY,
  dictionaryRule?.datasource_id,
  getDictionaryKeyFieldId(dictionaryRule),
  dictionaryRule?.value_field,
];

export const buildDictionaryShowedField = (field) => ({
  id: field.id,
  field_id: field.id,
  name: field.name,
  alias: field.alias,
  metric: field.metric || "count",
  type: resolveFieldType(field),
});

export const getFieldCellValue = (row, field) => {
  if (!row || !field) return undefined;
  return row[field.name] ?? row[field.alias];
};

export const buildDictionaryMapFromRecords = (records, keyField, valueField) => {
  if (!Array.isArray(records) || !keyField || !valueField) return {};

  return records.reduce((map, row) => {
    const key = getFieldCellValue(row, keyField);
    const value = getFieldCellValue(row, valueField);
    if (key === null || key === undefined || String(key).trim() === "") return map;
    if (value === null || value === undefined || String(value).trim() === "") return map;
    map[String(key)] = String(value);
    return map;
  }, {});
};

export const resolveDictionaryLabel = (rawValue, dictionaryMap) => {
  if (rawValue === null || rawValue === undefined) return "";
  const key = String(rawValue);
  return dictionaryMap?.[key] ?? key;
};

/**
 * Consulta los registros del diccionario.
 * Los campos (keyField, valueField) deben venir ya resueltos vía useFieldsByDataSourceId.
 */
export const fetchDictionaryRecords = async ({
  dispatch,
  userToken,
  datasourceId,
  keyField,
  valueField,
}) => {
  if (!datasourceId || !keyField || !valueField) return [];

  const body = {
    query_type: "records",
    datasource_id: datasourceId,
    showed_fields: [
      buildDictionaryShowedField(keyField),
      buildDictionaryShowedField(valueField),
    ],
    limit: DICTIONARY_RECORDS_LIMIT,
    offset: 0,
  };

  const [success, data] = await handleQuery(
    dispatch,
    userToken,
    "query",
    "registros del diccionario",
    body,
    {}
  );
  return success && Array.isArray(data) ? data : [];
};
