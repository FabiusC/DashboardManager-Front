import {
  handleAsociateChartTypeToPanel,
  handleGetFieldsDistribution,
} from "../../../helpers/dashboardAPI/chartRequest";
import {
  getRequest,
  handleEditItemEntity,
} from "../../../helpers/dashboardAPI/genericRequest";
import { handleQuery } from "../../../helpers/QueryManagerAPI/queryRequest";
import { normalizePanelResponse } from "../utils/normalizePanelResponse";
import { pushNotification } from "../../../redux/actions";
import { resolveFieldType } from "@components/DashboardsWorkspace/hooks/useFields";

export const FIELD_METRIC_OPTIONS = Object.freeze([
  { value: "count", label: "CONTEO", menuLabel: "Conteo" },
  { value: "count_distinct", label: "RECUENTO DISTINTO", menuLabel: "Recuento distinto" },
  { value: "sum", label: "SUMA", menuLabel: "Suma" },
  { value: "avg", label: "PROM", menuLabel: "Promedio" },
  { value: "min", label: "MÍN", menuLabel: "Mínimo" },
  { value: "max", label: "MÁX", menuLabel: "Máximo" },
]);

export const DIMENSION_METRIC_OPTIONS = Object.freeze(
  FIELD_METRIC_OPTIONS.filter(
    (option) => option.value === "count" || option.value === "count_distinct"
  )
);

export const getMetricOptionsForField = (field) =>
  resolveFieldType(field) === "dimension"
    ? DIMENSION_METRIC_OPTIONS
    : FIELD_METRIC_OPTIONS;

export const isSupportedFieldMetric = (metric, field) => {
  const options = field ? getMetricOptionsForField(field) : FIELD_METRIC_OPTIONS;
  return options.some((option) => option.value === metric);
};

const normalizeFieldsForDistribution = (fields = []) =>
  (Array.isArray(fields) ? fields : []).map((field) => ({
    ...field,
    id: field?.field_id ?? field?.id,
  }));

export const associateChartType = async ({
  dispatch,
  userID,
  panelId,
  chartTypeInformation,
  chartActions,
  setHasChartTypeState,
  setError,
  panel,
  changeSideTabState,
}) => {
  const [ok] = await handleAsociateChartTypeToPanel(
    dispatch,
    userID,
    "associateChartTypeToPanel",
    "tipo de gráfica",
    { chart_type_id: chartTypeInformation.id },
    {},
    { panel_id: panelId }
  );

  if (ok) {
    chartActions.changeChartType(chartTypeInformation);
    setHasChartTypeState(true);
    await fetchPanel({
      dispatch,
      userID,
      panelId: panelId,
      panelActions: panel.actions,
      chartActions: chartActions,
      changeSideTabState: changeSideTabState,
      setError: setError,
    });
    return true;
  }
  setError("chart", "Error al asociar el tipo de gráfica");
  return false;
};


export const fetchFieldsDistribution = async ({
  dispatch,
  userID,
  chartTypeId,
  selectedFields,
  chartActions,
  setFieldConfigurationError,
}) => {
  const [ok, data] = await handleGetFieldsDistribution(
    dispatch,
    userID,
    "getFieldsDistributionChartType",
    "distribución de campos",
    { fields: normalizeFieldsForDistribution(selectedFields) },
    {},
    { chart_type_id: chartTypeId }
  );

  if (ok) {
    chartActions.updateQueryParams({ fields_distribution: data });
    return true;
  }
  setFieldConfigurationError(true);
  return false;
};


export const fetchQueryFieldsDistribution = async ({
  dispatch,
  userID,
  chartTypeId,
  selectedFields,
  chartActions,
  setFieldConfigurationError,
}) => {
  const [ok, data] = await handleGetFieldsDistribution(
    dispatch,
    userID,
    "getFieldsQueryDistributionChartType",
    "distribución de campos de la consulta",
    { fields: normalizeFieldsForDistribution(selectedFields) },
    {},
    { chart_type_id: chartTypeId }
  );

  if (ok) {
    chartActions.updateQueryParams({ query_fields_distribution: data });
    return true;
  }
  setFieldConfigurationError(true);
  return false;
};


export const savePanelQueryParameters = async ({
  dispatch,
  userID,
  panelId,
  selectedFields,
  sortRule,
  filters,
  dictionaryRule,
}) => {
  const GROUP_OPERATORS = new Set(["AND", "OR"]);
  const CONDITION_OPERATORS = new Set(["EQUALS", "NOT_EQUALS", "BETWEEN"]);
  const hasValue = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
  };

  const normalizeFilterNode = (node) => {
    if (!node || typeof node !== "object") return null;

    const isGroup = Array.isArray(node.conditions);
    if (isGroup) {
      const operator = GROUP_OPERATORS.has(node.operator) ? node.operator : "AND";
      const normalizedConditions = node.conditions
        .map((child) => normalizeFilterNode(child))
        .filter(Boolean);

      // Un grupo sin condiciones válidas no debe enviarse
      if (normalizedConditions.length === 0) return null;

      return {
        operator,
        conditions: normalizedConditions,
      };
    }

    const operator = CONDITION_OPERATORS.has(node.operator) ? node.operator : "EQUALS";
    const field = typeof node.field === "string" ? node.field : "";
    if (!field || !hasValue(node.operator)) return null;

    let value = node.value;
    if (operator === "BETWEEN") {
      const range = typeof value === "object" && value !== null ? value : {};
      const from = range.from ?? "";
      const to = range.to ?? "";
      if (!hasValue(from) || !hasValue(to)) return null;
      value = { from, to };
    } else if (typeof value === "object" && value !== null) {
      return null;
    }

    if (!hasValue(value)) return null;

    return {
      operator,
      field,
      value: value ?? "",
    };
  };

  const hasSelectedFields = selectedFields !== undefined;
  const hasSortRule = sortRule !== undefined;
  const hasFilters = filters !== undefined;
  const hasDictionaryRule = dictionaryRule !== undefined;

  const body = {};

  if (hasSelectedFields) {
    const fields = Array.isArray(selectedFields) ? selectedFields : [];
    const payload = fields.map((f) => {
      const fieldId = f.field_id ?? f.id;
      return {
        field_id: fieldId,
        name: f.name,
        alias: f.alias || f.name,
        metric: f.metric || "count",
        type: resolveFieldType(f),
      };
    });
    const hasMissingFieldId = payload.some((p) => p.field_id == null);
    if (hasMissingFieldId) return;
    body.selected_fields = payload;
  }

  if (hasSortRule) {
    body.sort_rule = sortRule;
  }

  if (hasFilters) {
    const normalizedFilters = normalizeFilterNode(filters);
    const hasNormalizedConditions =
      normalizedFilters &&
      Array.isArray(normalizedFilters.conditions) &&
      normalizedFilters.conditions.length > 0;
    const isExplicitClear =
      filters &&
      typeof filters === "object" &&
      Array.isArray(filters.conditions) &&
      filters.conditions.length === 0;

    if (hasNormalizedConditions) {
      body.filters = normalizedFilters;
    } else if (isExplicitClear) {
      body.filters = { operator: "AND", conditions: [] };
    }
  }

  if (hasDictionaryRule) {
    body.dictionary_rule = dictionaryRule;
  }

  if (Object.keys(body).length === 0) return;

  return handleEditItemEntity(
    userID,
    "updatePanelQueryParameters",
    "parámetros de la consulta",
    { panel_id: panelId },
    body,
    dispatch
  );
};

export const updateSelectedFieldMetric = async ({
  dispatch,
  userID,
  panelId,
  selectedFieldId,
  metric,
}) => {
  if (
    panelId == null ||
    selectedFieldId == null ||
    !isSupportedFieldMetric(metric)
  ) {
    return [false, null];
  }

  return handleEditItemEntity(
    userID,
    "updateOperationField",
    "métrica del campo",
    {
      panel_id: panelId,
      selected_field_id: selectedFieldId,
    },
    { metric },
    dispatch
  );
};

export const fetchPanelQueryParameters = async ({
  dispatch,
  userID,
  panelId,
}) => {
  const panelInfo = await getRequest(
    dispatch,
    userID,
    "",
    "",
    "panelEditionGet",
    "panel",
    { id: panelId }
  );

  return panelInfo?.query_parameters ?? null;
};


export const fetchDataFromQuery = async ({
  dispatch,
  userID,
  chartState,
  chartActions,
  setError,
  filters = null,
  editionMode = true,
}) => {
  let bodyQuery;
  const { query_type } = chartState.chartType;
  const qp = chartState.queryParameters;
  const shouldUseFilters = chartState.chartType?.affected_by_filters && !editionMode && filters != null;

  if (query_type === "aggregation") {
    bodyQuery = {
      query_type: "aggregation",
      datasource_id: qp.datasource_id,
      group_by: qp.query_fields_distribution.group_by_fields,
      aggregations: qp.query_fields_distribution.aggregation_fields,
      limit: qp.limit,
      ...(shouldUseFilters && { filters }),
    };
  } else if (query_type === "records") {
    bodyQuery = {
      query_type: "records",
      datasource_id: qp.datasource_id,
      showed_fields: qp.selected_fields,
      limit: qp.limit,
      offset: 0,
      ...(shouldUseFilters && { filters }),
    };
  } else if (query_type === "none_query") {
    bodyQuery = {
      query_type: "none_query",
    };
  }

  // Priorizar sort_field/sort_direction/sort_criterion (UI) sobre sort_rule (API)
  const sortFieldId = qp.sort_field ?? qp.sort_rule?.field;
  const sortDirection = qp.sort_direction ?? qp.sort_rule?.direction;
  const sortOrder = qp.sort_criterion ?? qp.sort_rule?.order;
  if (sortFieldId && sortDirection && sortOrder) {
    const selectedFields = qp.selected_fields || [];
    const sortFieldName =
      selectedFields.find(
        (field) =>
          String(field?.field_id ?? field?.id) === String(sortFieldId)
      )?.name ?? sortFieldId;
    bodyQuery = {
      ...bodyQuery,
      sort_rule: {
        field: sortFieldName,
        direction: sortDirection,
        order: sortOrder
      }
    };
  }

  const [ok, data] = await handleQuery(
    dispatch,
    userID,
    "query",
    "datos de la gráfica",
    bodyQuery,
    {}
  );

  if (ok) {
    chartActions.updateQueryParams({ rawData: data });
    return true;
  }
  setError("data", "Error al obtener los datos de la consulta");
  chartActions.updateQueryParams({ rawData: undefined });
  if (bodyQuery?.sort_rule) {
    dispatch(pushNotification({
      msg: "No se pudo aplicar el ordenamiento con los parámetros seleccionados. Por favor, cambie el campo, la dirección o el criterio de ordenamiento.",
      status: "err",
    }));
  }
  return false;
};


export const fetchPanel = async ({
  dispatch,
  userID,
  panelId,
  panelActions,
  chartActions,
  changeSideTabState,
  setError,
}) => {
  const panelInfo = await getRequest(
    dispatch,
    userID,
    "",
    "",
    "panelEditionGet",
    "paneles",
    { id: panelId }
  );
  const setUpInfo = await getRequest(
    dispatch,
    userID,
    "",
    "",
    "getPanelSetUp",
    "configuración del panel",
    { panel_id: panelId }
  );

  if (panelInfo) {
    const data = { ...panelInfo, setUp: setUpInfo };
    const { panelData, chartData } = normalizePanelResponse(data);

    panelActions.initializePanel(panelData);
    chartActions.initializeChart(chartData);

    changeSideTabState("data", "isDisabled", false);
    changeSideTabState("data", "isActive", true);

    // layout que el componente deberá usar
    return {
      i: panelData.id.toString(),
      x: 0,
      y: 0,
      w: panelData.width || 12,
      h: panelData.height || 8,
      minW: 2,
      minH: 2,
      maxW: 12,
      maxH: 20,
    };
  }

  setError("panels", "Error al obtener la información del panel");
  return null;
};


export const fetchChartComponent = async ({
  dispatch,
  userID,
  panelId,
  chartActions,
  setError,
}) => {
  const chartInfo = await getRequest(
    dispatch,
    userID,
    "",
    "",
    "chartEditionGet",
    "componentes de la gráfica",
    { panel_id: panelId }
  );

  if (chartInfo) {
    // console.log("bbbb chartInfo", chartInfo)
    chartActions.updateChartComponent(chartInfo);
    return chartInfo; // Retornar el valor actualizado
  }
  setError("chart", "Error al obtener el componente de gráfica");
  return null;
};


export const updatePanelSize = async ({
  dispatch,
  userID,
  panelId,
  changedFields,
  panelActions,
}) => {
  await handleEditItemEntity(
    userID,
    "panel",
    "panel",
    { id: panelId },
    changedFields,
    dispatch,
    false
  );
  // panelActions.updatePanel(changedFields);
};
