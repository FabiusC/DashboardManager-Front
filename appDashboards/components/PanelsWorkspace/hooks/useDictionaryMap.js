import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import {
  useFieldsByDataSourceId,
  useFieldById,
} from "@components/DashboardsWorkspace/hooks/useFields";
import {
  buildDictionaryMapFromRecords,
  fetchDictionaryRecords,
  getDictionaryKeyFieldId,
  getDictionaryRecordsQueryKey,
  isDictionaryRuleComplete,
} from "../utils/dictionaryUtils";

const EMPTY_ARRAY = [];
const EMPTY_MAP = {};

/**
 * Resuelve dictionaryMap a partir de dictionary_rule (config persistente).
 * Comparte caché React Query con DictionaryConfiguration vía getDictionaryRecordsQueryKey.
 */
export const useDictionaryMap = (dictionaryRule, userToken) => {
  const dispatch = useDispatch();
  const isComplete = isDictionaryRuleComplete(dictionaryRule);

  const datasourceId = dictionaryRule?.datasource_id;
  const keyFieldId = getDictionaryKeyFieldId(dictionaryRule);
  const valueFieldId = dictionaryRule?.value_field;

  const { data: sourceFields = [] } = useFieldsByDataSourceId(
    isComplete ? datasourceId : undefined
  );

  const { data: keyFieldById } = useFieldById(isComplete && keyFieldId ? keyFieldId : null);
  const { data: valueFieldById } = useFieldById(isComplete && valueFieldId ? valueFieldId : null);

  const keyField = useMemo(() => {
    if (!keyFieldId) return null;
    return sourceFields.find((field) => field.id === keyFieldId) ?? keyFieldById ?? null;
  }, [sourceFields, keyFieldId, keyFieldById]);

  const valueField = useMemo(() => {
    if (!valueFieldId) return null;
    return sourceFields.find((field) => field.id === valueFieldId) ?? valueFieldById ?? null;
  }, [sourceFields, valueFieldId, valueFieldById]);

  const {
    data: dictionaryRecords = EMPTY_ARRAY,
    isLoading,
    isError,
  } = useQuery({
    queryKey: getDictionaryRecordsQueryKey(dictionaryRule),
    enabled: isComplete && !!userToken && !!keyField && !!valueField,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    queryFn: () =>
      fetchDictionaryRecords({
        dispatch,
        userToken,
        datasourceId,
        keyField,
        valueField,
      }),
  });

  const dictionaryMap = useMemo(() => {
    if (!isComplete || !keyField || !valueField) return EMPTY_MAP;
    return buildDictionaryMapFromRecords(dictionaryRecords, keyField, valueField);
  }, [isComplete, keyField, valueField, dictionaryRecords]);

  return { dictionaryMap, isLoading, isError };
};

export default useDictionaryMap;
