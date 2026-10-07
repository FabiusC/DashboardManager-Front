import { useMemo, useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import { handleQuery, handleQueryPublic } from "@helpers/QueryManagerAPI/queryRequest";
import { convertStateToApiPayload } from "@helpers/filtersConverter";
import { useDictionaryMap } from "./useDictionaryMap";
import {
  evaluateDictionaryTranslation,
  isDictionaryTranslationUsable,
  isDictionaryRuleComplete,
  DICTIONARY_RECORDS_LIMIT,
  getOriginFieldValueCandidates,
  getUniqueValuesFromRawData,
  resolveOriginFieldAlias,
  resolveOriginFieldName,
  resolvePanelMainData,
} from "../utils/dictionaryUtils";

const EMPTY_DICTIONARY_MAP = Object.freeze({});

/**
 * Hook para detectar si un elemento está en el viewport usando Intersection Observer
 * Una vez que se detecta como visible, se mantiene visible (no se desactiva al salir del viewport)
 * @param {Object} elementRef - Referencia al elemento DOM
 * @param {string} resetKey - Key que cuando cambia, resetea el estado de visibilidad
 */

const parseTotalCount = (totalData, expectedKey) => {
  if (!Array.isArray(totalData) || totalData.length === 0) return null;
  const first = totalData[0];
  if (!first || typeof first !== "object") return null;
  const val = expectedKey ? first[expectedKey] : undefined;
  if (typeof val === "number" && Number.isFinite(val)) return val;
  const anyNum = Object.values(first).find(v => typeof v === "number" && Number.isFinite(v));
  return anyNum ?? null;
};
const useIntersectionObserver = (elementRef, resetKey = null) => {
  const [isVisible, setIsVisible] = useState(false);
  const hasBeenVisibleRef = useRef(false);
  const lastResetKeyRef = useRef(resetKey || null);
  const observerRef = useRef(null);
  // Resetear visibilidad cuando cambia el resetKey (por ejemplo, al cambiar filtros)
  useEffect(() => {
    if (resetKey !== null && resetKey !== lastResetKeyRef.current) {
      hasBeenVisibleRef.current = false;
      setIsVisible(false);
      lastResetKeyRef.current = resetKey;
    } else if (resetKey === null && lastResetKeyRef.current !== null) {
      // Si resetKey cambia a null, resetear
      hasBeenVisibleRef.current = false;
      setIsVisible(false);
      lastResetKeyRef.current = null;
    }
  }, [resetKey]);

  useEffect(() => {
    const element = elementRef?.current;
    if (!element) {
      return;
    }

    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          hasBeenVisibleRef.current = true;
          setIsVisible(true);
        }
      });
    };

    const observerOptions = {
      threshold: 0.15, // Trigger cuando el 15% del elemento es visible
      rootMargin: '100px', // Cargar 100px antes de que sea visible (preload)
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    observer.observe(element);
    observerRef.current = observer;

    
    const checkImmediateVisibility = () => {
      const records = observer.takeRecords();
      if (records.length > 0) {
        handleIntersection(records);
      }
    };

    // Verificar inmediatamente y también después del siguiente frame
    // para asegurar que el observer haya procesado el elemento
    checkImmediateVisibility();
    requestAnimationFrame(checkImmediateVisibility);

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [elementRef, resetKey]);

  // Si ya fue visible antes, mantenerlo visible (a menos que se haya reseteado)
  return hasBeenVisibleRef.current || isVisible;
};


const getSearchTableValue = (chartState) => {
  const value = chartState?.liveChartProps?.searchValue ?? chartState?.queryParameters?.searchValue
  return typeof value === "string" ? value.trim() : value;
} 

const buildSearchTableFilter = (selectedFields, searchValue) => {
  const searchField = selectedFields?.[0]?.name;
  if (!searchField || searchValue === null || searchValue === undefined || String(searchValue).trim() === "") {
    return null;
  }
  return {
    operator: "AND",
    conditions: [
      {
        operator: "EQUALS",
        field: searchField,
        value: String(searchValue).trim(),
      },
    ],
  };
};
const getGlobalFilterValueForField = (filtersState, fieldName, ownPanelId) => {
  const rules = filtersState?.rules;
  if (!rules || !fieldName) return null;

  const groups = filtersState?.groups;
  const ownId = ownPanelId != null ? String(ownPanelId) : null;
  let matchedValue = null;

  for (const rule of Object.values(rules)) {
    if (!rule || rule.operator !== "EQUALS" || rule.field !== fieldName) continue;

    if (ownId !== null) {
      const parentGroup = groups?.[rule.parentId];
      if (parentGroup && String(parentGroup.uiContext_id) === ownId) continue;
    }

    if (rule.value === null || rule.value === undefined || String(rule.value).trim() === "") continue;
    matchedValue = String(rule.value).trim();
  }

  return matchedValue;
};

//Esta función permite respetar filtros propios del panel
const mergeFiltersWithAnd = (...filters) => {
  const validFilters = filters.filter(Boolean);
  if (validFilters.length === 0) return null;
  if (validFilters.length === 1) return validFilters[0];

  return {
    operator: "AND",
    conditions: validFilters.flatMap((filter) =>
      filter.operator === "AND" && Array.isArray(filter.conditions) ? filter.conditions: [filter]
    ),
  };
};

/**
 * Hook para obtener los datos de un panel usando React Query
 * Se conecta automáticamente con los filtros de Redux y recarga cuando cambian
 * Solo carga los datos cuando el componente está en el viewport (lazy loading)
 * 
 * @param {Object} chartState - Estado del chart con información del panel
 * @param {string|number} idPanel - ID del panel
 * @param {Object} elementRef - Referencia al elemento DOM para detectar visibilidad
 * @param {boolean} shouldApplyFilters - Si debe aplicar filtros o no (por defecto true)
 * @param {boolean|string|number|null} enablePercentageOverride - Override para activar porcentaje (ej. desde setup)
 * @param {boolean} blockUntilPreFilter - Si true, no ejecuta query hasta que el pre-filtro esté aplicado
 * @param {boolean} useGlobalFilter - Si true (solo search_table), el filtro global del campo de búsqueda alimenta el input de la tabla
 * @param {boolean} useSearchFilterBar - Si true, aplica query_search_string del tablero (por defecto true si no viene en estilos)
 * @returns {Object} { rawData, isLoadingData, dataError, updatedChartState, elementRef }
 */
export const usePanelData = (chartState, idPanel, elementRef = null, shouldApplyFilters = true, editionMode, enablePercentageOverride = null, blockUntilPreFilter = false, useGlobalFilter = false, manualSearchValue = undefined, useSearchFilterBar = true, captureMode = false
) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const enablePercentage = enablePercentageOverride === true || chartState?.queryParameters?.enablePercentage === true || chartState?.liveChartProps?.enablePercentage === true 
  // Crear referencia interna si no se proporciona una (usar useRef para mantener estabilidad)
  const internalRef = useRef(null);
  const ref = elementRef || internalRef;

  // Obtener userToken y filtros desde Redux
  const userToken = useSelector(state => state.user?.[0]?.userID || state.user?.userID);

  const dictionaryRule = chartState?.queryParameters?.dictionary_rule;
  const originFieldCandidatesForDictionary = useMemo(
    () =>
      getOriginFieldValueCandidates(
        dictionaryRule,
        chartState?.queryParameters?.selected_fields,
        chartState?.queryParameters?.query_fields_distribution
      ),
    [
      dictionaryRule,
      chartState?.queryParameters?.selected_fields,
      chartState?.queryParameters?.query_fields_distribution,
    ]
  );

  const filtersState = useSelector(state => ({
    groups: state.filters?.groups || {},
    rules: state.filters?.rules || {},
    search: state.filters?.search || "",
  }));
  const searchString = filtersState.search || "";
  const filtersApplyVersion = useSelector(state => state.filters?.runtime?.applyVersion || 0);

  const normalizeFilterNode = (node) => {
    if (!node || typeof node !== "object") return null;

    if (Array.isArray(node.conditions)) {
      const operator = node.operator === "OR" ? "OR" : "AND";
      let normalizedConditions = node.conditions
        .map((child) => normalizeFilterNode(child))
        .filter(Boolean);

      if (operator === "AND") {
        normalizedConditions = normalizedConditions.flatMap((child) =>
          child?.operator === "AND" && Array.isArray(child.conditions) ? child.conditions : [child]
        );
      }
      
      if (normalizedConditions.length === 0) return null;

      return {
        operator,
        conditions: normalizedConditions,
      };
    }

    if (!node.field || !node.operator) return null;

    if (node.operator === "BETWEEN") {
      let from;
      let to;
      if (Array.isArray(node.value)) {
        [from, to] = node.value;
      } else if (typeof node.value === "object" && node.value !== null) {
        from = node.value.from;
        to = node.value.to;
      }
      if (from == null || to == null || String(from).trim() === "" || String(to).trim() === "") {
        return null;
      }
      return { operator: node.operator, field: node.field, value: [String(from), String(to)] };
    }

    const primitiveValue = node.value;
    if (primitiveValue === null || primitiveValue === undefined || String(primitiveValue).trim() === "") return null;
    return { operator: node.operator, field: node.field, value: primitiveValue };
  };

  // Convertir filtros a formato API
  const filters = useMemo(() => {
    return convertStateToApiPayload(filtersState);
  }, [filtersState]);

  // Search table: campo usado en el input de búsqueda (primer campo seleccionado)
  const searchFieldName = chartState?.queryParameters?.selected_fields?.[0]?.name ?? null;
  const isSearchTableChart = chartState?.chartType?.name === "search_table";

  // Valor proveniente de un filtro global cuyo campo coincide con el de la search_table.
  // Solo aplica en modo visualización y cuando la propiedad useGlobalFilter está activa.
  const globalSearchValue = useMemo(() => {
    if (!useGlobalFilter || editionMode || !isSearchTableChart || !searchFieldName) return null;
    return getGlobalFilterValueForField(filtersState, searchFieldName, idPanel);
  }, [useGlobalFilter, editionMode, isSearchTableChart, searchFieldName, filtersState, idPanel]);

    // El filtro global tiene prioridad sobre el valor escrito manualmente mientras esté activo.
  const effectiveSearchValue = globalSearchValue ?? (manualSearchValue !== undefined ? manualSearchValue : getSearchTableValue(chartState));

  // Filtros persistidos en queryParameters del panel (deben aplicarse siempre)
  const queryParameterFilters = useMemo(() => {
    return normalizeFilterNode(chartState?.queryParameters?.filters);
  }, [chartState?.queryParameters?.filters]);

  // Combinar filtros del panel + filtros globales Redux con AND
  const combinedFilters = useMemo(() => {
    const shouldMergeReduxFilters = shouldApplyFilters && !editionMode;
    const reduxFilters = shouldMergeReduxFilters ? normalizeFilterNode(filters) : null;

    if (queryParameterFilters && reduxFilters) {
      if (queryParameterFilters.operator === "AND" && reduxFilters.operator === "AND") {
        return {
          operator: "AND",
          conditions: [...queryParameterFilters.conditions, ...reduxFilters.conditions],
        };
      }
      return {
        operator: "AND",
        conditions: [queryParameterFilters, reduxFilters],
      };
    }

    return queryParameterFilters || reduxFilters || null;
  }, [filters, queryParameterFilters, shouldApplyFilters, editionMode]);

  // Crear hash de filtros para detectar cambios
  const currentFiltersHash = useMemo(() => {
    return JSON.stringify({ 
      filtersState: shouldApplyFilters ? filtersState : null, 
      queryParameterFilters,
      combinedFilters,
      searchString,
      searchTableValue: isSearchTableChart ? effectiveSearchValue : null,
    });
  }, [filtersState, queryParameterFilters, combinedFilters, searchString, shouldApplyFilters, isSearchTableChart, effectiveSearchValue]);

  const lastLoadedHashRef = useRef(null);
  const previousFiltersHashRef = useRef(null);
  const previousBlockUntilPreFilterRef = useRef(blockUntilPreFilter);
  
  // Detectar si cambiaron los filtros
  const filtersChanged = previousFiltersHashRef.current !== null && 
                         previousFiltersHashRef.current !== currentFiltersHash;
  
  // Trackear el hash anterior para detectar cambios
  useEffect(() => {
    previousFiltersHashRef.current = currentFiltersHash;
  }, [currentFiltersHash]);
  
  // Estado para trackear si debemos ignorar isInViewport cuando cambian los filtros
  const [shouldIgnoreViewport, setShouldIgnoreViewport] = useState(false);
  
  // Resetear el estado cuando cambian los filtros
  useEffect(() => {
    if (filtersChanged) {
      lastLoadedHashRef.current = null;
      // Forzar ignorar viewport hasta que se detecte de nuevo después del cambio
      setShouldIgnoreViewport(true);
    }
  }, [filtersChanged]);

  useEffect(() => {
    const wasBlocked = previousBlockUntilPreFilterRef.current;
    previousBlockUntilPreFilterRef.current = blockUntilPreFilter;
    if (wasBlocked && !blockUntilPreFilter) {
      lastLoadedHashRef.current = null;
      setShouldIgnoreViewport(false);
    }
    if (!wasBlocked && blockUntilPreFilter && idPanel) {
      queryClient.cancelQueries({ queryKey: ["panelData", idPanel], exact: false });
    }
  }, [blockUntilPreFilter, idPanel, queryClient]);
  
  const hasLoadedCurrentFilters = !filtersChanged && lastLoadedHashRef.current === currentFiltersHash;
  
  // Detectar si el elemento está en el viewport (resetear cuando cambian los filtros para lazy loading)
  // Pasar currentFiltersHash como resetKey para que se resetee cuando cambian los filtros
  const isInViewportRaw = useIntersectionObserver(ref, shouldApplyFilters ? currentFiltersHash : null);
  
  // Cuando cambian los filtros, ignorar isInViewport hasta que se detecte de nuevo
  // Una vez que se detecta visibilidad después del cambio, permitir la carga
  useEffect(() => {
    if (shouldIgnoreViewport && isInViewportRaw) {
      setShouldIgnoreViewport(false);
    }
  }, [shouldIgnoreViewport, isInViewportRaw]);
  
  const isInViewport = shouldIgnoreViewport ? false : isInViewportRaw;

  // Construir el bodyQuery según el tipo de query
  const queryBody = useMemo(() => {
    if (!chartState?.chartType?.id || !chartState?.queryParameters) {
      return null;
    }

    const qp = chartState.queryParameters;
    const queryType = chartState.chartType.query_type;

    if (queryType === "none_query") return { query_type: "none_query" };

    // Los filtros de queryParameters se envían siempre; se combinan con Redux vía AND
    const shouldUseFilters = !!combinedFilters;

    // Priorizar sort_field/sort_direction/sort_criterion (UI) sobre sort_rule (API) para usar siempre lo último guardado
    const sortFieldId = qp.sort_field ?? qp.sort_rule?.field;
    const sortDirection = qp.sort_direction ?? qp.sort_rule?.direction;
    const sortOrder = qp.sort_criterion ?? qp.sort_rule?.order;
    const selectedFields = qp.selected_fields || [];
    const isSearchTable = chartState.chartType.name === "search_table";
    const searchTableFilter = isSearchTable ? buildSearchTableFilter(selectedFields, effectiveSearchValue) : null;

    const aggregation_fields = qp.query_fields_distribution?.aggregation_fields || [];

    let sortFieldName = sortFieldId
      ? (selectedFields?.find((field) => field.field_id === sortFieldId)?.name ?? sortFieldId)
      : null;
    const found_aggregation_field = aggregation_fields?.find((f) => f.name === sortFieldName)
    if (found_aggregation_field) {
      sortFieldName = `${found_aggregation_field.name}__${found_aggregation_field.metric}`
    }


    const sortRule =
      sortFieldName && sortDirection && sortOrder
        ? { field: sortFieldName, direction: sortDirection, order: sortOrder }
        : null;

    if (queryType === "aggregation") {
      const queryBody = {
        query_type: "aggregation",
        datasource_id: qp.datasource_id,
        group_by: qp.query_fields_distribution?.group_by_fields,
        aggregations: aggregation_fields ,
        limit: qp.limit,
        ...(shouldUseFilters && { filters: combinedFilters }),
        ...(sortRule && { sort_rule: sortRule })
      };
      if (searchString && useSearchFilterBar) {
        queryBody.query_search_string = searchString;
      }
      return queryBody;
    }

    if (queryType === "records") {
      if (isSearchTable && !searchTableFilter) {
        return null;
      }

      const recordsFilters = isSearchTable ? mergeFiltersWithAnd(queryParameterFilters, searchTableFilter) : combinedFilters;

      const queryBody = {
        query_type: "records",
        datasource_id: qp.datasource_id,
        showed_fields: qp.selected_fields,
        limit: qp.limit,
        offset: 15,
        ...(recordsFilters && { filters: recordsFilters }),
        ...(sortRule && { sort_rule: sortRule })
      };
      if (searchString && useSearchFilterBar) {
        queryBody.query_search_string = searchString;
      }
      return queryBody;
    }

    return null;
  }, [chartState, combinedFilters, searchString, useSearchFilterBar, shouldApplyFilters, editionMode, effectiveSearchValue]);

  const queryParamsSignature = useMemo(() => {
    const qp = chartState?.queryParameters;
    
    if (!qp) return '';
    return JSON.stringify({
      limit: qp.limit,
      sort_rule: qp.sort_rule,
      sort_field: qp.sort_field,
      sort_direction: qp.sort_direction,
      sort_criterion: qp.sort_criterion,
      query_fields_distribution: qp.query_fields_distribution,
      enablePercentage: qp.enablePercentage || chartState?.liveChartProps?.enablePercentage,
      selected_fields: qp.selected_fields
        ?.map((field) => ({
          id: field?.field_id ?? field?.id,
          metric: field?.metric ?? "count",
        }))
        .filter((field) => field.id != null),
    });
  }, [
    chartState?.queryParameters?.limit,
    chartState?.queryParameters?.sort_rule,
    chartState?.queryParameters?.sort_field,
    chartState?.queryParameters?.sort_direction,
    chartState?.queryParameters?.sort_criterion,
    chartState?.queryParameters?.query_fields_distribution,
    chartState?.queryParameters?.selected_fields,
    chartState?.liveChartProps?.enablePercentage,
  ]);

  const queryKey = useMemo(
    () => ['panelData', idPanel, currentFiltersHash, queryParamsSignature, queryBody, searchString],
    [idPanel, currentFiltersHash, queryParamsSignature, queryBody, searchString]
  );

  const isChartAffectedByFilters = !!(
    shouldApplyFilters &&
    chartState?.chartType?.affected_by_filters
  );

  const hasCachedDataForCurrentQuery = useMemo(() => {
    if (!queryBody) return false;
    const cached = queryClient.getQueryData(queryKey);
    return cached !== undefined;
  }, [queryClient, queryKey, queryBody]);

  // Cuando cambian los filtros, SOLO cargar si está en viewport (lazy loading)
  const isPublicMode = !userToken;
  const isQueryEnabled =
    !blockUntilPreFilter &&
    (captureMode || (filtersChanged ? isInViewport : (isInViewport || hasLoadedCurrentFilters))) &&
    !!queryBody &&
    (isPublicMode || !!userToken) &&
    !!chartState?.chartType?.id && (
      !!chartState?.queryParameters?.query_fields_distribution ||
      chartState?.chartType?.query_type === "records" ||
      chartState?.chartType?.query_type === "none_query"
    );

  // React Query para obtener los datos
  const { data: rawData, isLoading: isLoadingData, error: dataError, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!queryBody) {
        return null;
      }

      if (queryBody.query_type === "none_query") {
        return [];
      }
      const shouldFetchTotalCount = enablePercentage && queryBody.query_type === "aggregation";


      if (!userToken) {
        const dashboardId =
          chartState?.dashboard_id ||
          chartState?.dashboardId ||
          chartState?.queryParameters?.dashboard_id ||
          chartState?.queryParameters?.dashboardId;

        const [success, data] = await handleQueryPublic(
          dispatch,
          idPanel,
          dashboardId,
          "datos de la gráfica",
          queryBody,
          {}
        );

        if (!success) {
          throw new Error("Error al obtener los datos");
        }

        return data;
      }

      const [success, data] = await handleQuery(
        dispatch,
        userToken,
        'query',
        'datos de la gráfica',
        queryBody,
        {}
      );

      if (!success) {
        // Lanzar error para que React Query lo capture
        throw new Error('Error al obtener los datos');
      }

      if (!shouldFetchTotalCount) {
        return data;
      }

      const qp = chartState?.queryParameters;
      const baseAgg =
        qp?.query_fields_distribution?.aggregation_fields?.[0] ??
        qp?.query_fields_distribution?.group_by_fields?.[0];
      const countAgg = baseAgg ? { ...baseAgg, metric: "count", alias: "TOTAL" } : null;
      if (!countAgg) {
        return { mainData: data, totalCount: null };
      }
      const totalQuery = {
        ...queryBody,
        group_by: [],
        aggregations: [countAgg],
        limit: 1,
      };
      const [successTotal, totalData] = await handleQuery(
        dispatch,
        userToken,
        'query',
        'conteo total',
        totalQuery,
        {}
      );
      const totalCount = successTotal ? parseTotalCount(totalData,countAgg.name) : null;
      return { mainData: data, totalCount };
    },
    // Solo habilitar si está visible O si ya se cargaron datos para estos filtros
    // Cuando cambian los filtros, se resetea para forzar verificación de viewport (lazy loading)
    enabled: isQueryEnabled,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
    retry: 1, // Reintentar una vez en caso de error
    // Evitar reutilizar datos previos durante refresco de filtros
    placeholderData: undefined,
  });

  const originValuesForDictionary = useMemo(() => {
    if (!isDictionaryRuleComplete(dictionaryRule)) return [];

    const contextRawData = chartState?.queryParameters?.rawData;
    const resolved =
      editionMode && contextRawData !== undefined
        ? contextRawData
        : rawData !== undefined
          ? rawData
          : contextRawData;
    const mainData = resolvePanelMainData(resolved);
    return getUniqueValuesFromRawData(mainData, originFieldCandidatesForDictionary);
  }, [
    dictionaryRule,
    originFieldCandidatesForDictionary,
    rawData,
    chartState?.queryParameters?.rawData,
    editionMode,
  ]);

  const canFetchDictionaryForChart =
    isDictionaryRuleComplete(dictionaryRule) &&
    originFieldCandidatesForDictionary.length > 0 &&
    originValuesForDictionary.length > 0 &&
    originValuesForDictionary.length <= DICTIONARY_RECORDS_LIMIT;

  const { dictionaryMap, isLoading: isLoadingDictionaryMap } = useDictionaryMap(
    canFetchDictionaryForChart ? dictionaryRule : null,
    userToken
  );

  // Actualizar el hash cuando se cargan los datos nuevos (solo para el hash actual)
  useEffect(() => {
    if (rawData !== undefined && !isLoadingData && !filtersChanged) {
      lastLoadedHashRef.current = currentFiltersHash;
    }
  }, [rawData, isLoadingData, currentFiltersHash, filtersChanged]);

  // Determinar si hay error real (solo si falló y no está cargando)
  const hasDataError = !isLoadingData && isError;

  const [showGlobalFilterLoader, setShowGlobalFilterLoader] = useState(false);
  const [isPendingFilterRefresh, setIsPendingFilterRefresh] = useState(false);
  const lastSeenApplyVersionRef = useRef(filtersApplyVersion);

  // Señal global de "aplicación de filtro":
  // - Solo para charts afectados por filtros
  // - Si hay cache para la combinación actual, no mostrar loader
  useEffect(() => {
    if (filtersApplyVersion === lastSeenApplyVersionRef.current) return;
    lastSeenApplyVersionRef.current = filtersApplyVersion;

    if (!isChartAffectedByFilters) {
      setShowGlobalFilterLoader(false);
      setIsPendingFilterRefresh(false);
      return;
    }

    if (!queryBody) {
      setShowGlobalFilterLoader(false);
      setIsPendingFilterRefresh(false);
      return;
    }

    if (!hasCachedDataForCurrentQuery) {
      setShowGlobalFilterLoader(true);
      setIsPendingFilterRefresh(true);
    } else {
      setShowGlobalFilterLoader(false);
      setIsPendingFilterRefresh(false);
    }
  }, [filtersApplyVersion, isChartAffectedByFilters, hasCachedDataForCurrentQuery, queryBody]);

  // Cerrar loader global cuando termina la resolución de datos
  useEffect(() => {
    if (!showGlobalFilterLoader) return;
    if (!isLoadingData && (rawData !== undefined || hasDataError)) {
      setShowGlobalFilterLoader(false);
    }
  }, [showGlobalFilterLoader, isLoadingData, rawData, hasDataError]);

  // Mientras haya un refresh de filtros pendiente sin cache, no reutilizar data vieja
  useEffect(() => {
    if (!isPendingFilterRefresh) return;
    if (!isLoadingData && (rawData !== undefined || hasDataError)) {
      setIsPendingFilterRefresh(false);
    }
  }, [isPendingFilterRefresh, isLoadingData, rawData, hasDataError]);
  
  // Mostrar loading cuando:
  // 1. Está cargando y no hay datos nuevos aún
  // 2. Cambiaron los filtros (para no mostrar data vieja, mostrar loading)
  // 3. Señal global de aplicación de filtros (sin cache)
  const shouldShowLoading =
    isLoadingData ||
    (filtersChanged && rawData === undefined) ||
    showGlobalFilterLoader ||
    isPendingFilterRefresh;

  // Actualizar chartState con los datos obtenidos
  const updatedChartState = useMemo(() => {
    if (!chartState) return chartState;

    const contextRawData = chartState.queryParameters?.rawData;
    const contextTotalCount = chartState.queryParameters?.queryMeta?.totalCount ?? null;
    const resolved = isPendingFilterRefresh
      ? (rawData !== undefined ? rawData : undefined)
      : filtersChanged
      ? (rawData !== undefined ? rawData : undefined)
      : (rawData !== undefined ? rawData : contextRawData);

    // Soportar retorno del queryFn:
    // - data normal (legacy): array|object
    // - data con extra query: { mainData, totalCount }
    const mainData =
      resolved && typeof resolved === "object" && !Array.isArray(resolved) && "mainData" in resolved
        ? resolved.mainData
        : resolved;
    const totalCount =
      resolved && typeof resolved === "object" && !Array.isArray(resolved) && "totalCount" in resolved
        ? resolved.totalCount
        : contextTotalCount;

    const queryFieldsDistribution = chartState.queryParameters?.query_fields_distribution;
    const groupByFieldName = queryFieldsDistribution?.group_by_fields?.[0]?.name;
    const originFieldName = resolveOriginFieldName(
      dictionaryRule,
      chartState.queryParameters?.selected_fields,
      queryFieldsDistribution
    );
    const originFieldAlias = resolveOriginFieldAlias(
      dictionaryRule,
      chartState.queryParameters?.selected_fields,
      queryFieldsDistribution
    );
    const dictionaryTranslation = evaluateDictionaryTranslation({
      rawData: mainData,
      originFieldName,
      originFieldAlias,
      originFieldCandidates: originFieldCandidatesForDictionary,
      dictionaryMap,
      isDictionaryLoading: isLoadingDictionaryMap,
    });
    const effectiveDictionaryMap =
      dictionaryRule?.is_dictionary &&
      isDictionaryRuleComplete(dictionaryRule) &&
      !isLoadingDictionaryMap &&
      isDictionaryTranslationUsable(dictionaryTranslation) &&
      originFieldName === groupByFieldName
        ? dictionaryMap
        : EMPTY_DICTIONARY_MAP;

    // Reflejar el valor del filtro global en el input de la search_table (solo display).
        const liveChartProps = isSearchTableChart && effectiveSearchValue
      ? { ...chartState.liveChartProps, searchValue: effectiveSearchValue }
      : chartState.liveChartProps;

    return {
      ...chartState,
      liveChartProps,
      queryParameters: {
        ...chartState.queryParameters,
        rawData: mainData,
        dictionaryMap: effectiveDictionaryMap,
        queryMeta: {
          ...(chartState.queryParameters?.queryMeta || {}),
          totalCount,
        },
      },
      state: {
        ...chartState.state,
        isLoadingData: shouldShowLoading,
        dataError: hasDataError
      }
    };
  }, [chartState, rawData, dictionaryMap, isLoadingDictionaryMap, dictionaryRule, shouldShowLoading, hasDataError, filtersChanged, isPendingFilterRefresh, editionMode, isSearchTableChart, effectiveSearchValue]);

  return {
    rawData,
    isLoadingData: shouldShowLoading,
    dataError: hasDataError,
    updatedChartState,
    elementRef: ref
  };
};
