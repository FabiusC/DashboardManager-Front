// context/ChartContext.js
import createDataContextSelector from "../utils/createDataContextSelector";
import merge from 'lodash/merge';

/* ───────── Estado inicial ───────── */
const initialState = {
  /* Query & type */
  queryParameters: {
    selected_fields: [],
    fields_distribution: undefined,
    query_fields_distribution: undefined,
    raw_data: undefined,
  },
  chartType: undefined,
  chartTypeId: undefined,

  /* Style */
  colorStrategy: {},

  /* Live props */
  liveChartProps: {},
  reloadChartConfig: 0,

  /* Advanced chart components from BE */
  chartComponents: [],
};

/* ─── Helper de parsing ─── */
const parseChartPayload = (raw) => {
  const parsed = {
    queryParameters: raw.queryParameters ?? initialState.queryParameters,
    chartType: raw.chart_type ?? undefined,
    chartTypeId: raw.chartTypeId ?? undefined,
    colorStrategy: raw.color_strategy ?? {},
    liveChartProps: raw.liveChartProps ?? {},
    reloadChartConfig: raw.reloadChartConfig ?? 0,
    chartComponents:  [],
  };
  
  return parsed;
};

/* ───────── Reducer ───────── */
const reducer = (state, action) => {
  switch (action.type) {
    case "INIT_CHART":
      const updatedState = { ...state, ...action.payload };
      if (
        action.payload.chartComponents &&
        Array.isArray(action.payload.chartComponents) &&
        action.payload.chartComponents.length === 0 &&
        state.chartComponents &&
        Array.isArray(state.chartComponents) &&
        state.chartComponents.length > 0
      ) {
        // Preservar los componentes existentes si INIT_CHART trae array vacío
        updatedState.chartComponents = state.chartComponents;
      }
      return updatedState;

    case "SET_QUERY_PARAMS":
      return {
        ...state,
        queryParameters: { ...state.queryParameters, ...action.payload },
      };

    case "SET_CHART_TYPE":
      return { ...state, chartType: action.payload, chartTypeId: action.payload?.id };

    case "SET_COLOR_STRATEGY":
      return { ...state, colorStrategy: { ...state.colorStrategy, ...action.payload } };

    case "UPDATE_LIVE_PROPS": {
      const newProps = merge({}, state.liveChartProps || {}, action.payload);
      return { ...state, liveChartProps: newProps };
    }

    case "CLEAR_LIVE_PROPS":
      return { ...state, liveChartProps: {}, reloadChartConfig: state.reloadChartConfig + 1 };

    case "RELOAD_CHART_CONFIG":
      return { ...state, reloadChartConfig: state.reloadChartConfig + 1 };

    case "SET_CHART_COMPONENTS":
      return { ...state, chartComponents: action.payload };

    case "RESET_CHART_DATA":
      return {
        ...state,
        queryParameters: {
          ...initialState.queryParameters,
          datasource_id: state.queryParameters.datasource_id,
          selected_fields: state.queryParameters.selected_fields || [],
          sort_rule: state.queryParameters.sort_rule,
          filters: state.queryParameters.filters,
          limit: state.queryParameters.limit,
          dictionary_rule: state.queryParameters.dictionary_rule,
        }
      };

    default:
      return state;
  }
};

const initChart = (d) => (raw) => d({ type: "INIT_CHART", payload: parseChartPayload(raw) });
const setQueryParams = (d) => (params) => d({ type: "SET_QUERY_PARAMS", payload: params });
const setChartType = (d) => (chartType) => d({ type: "SET_CHART_TYPE", payload: chartType });
const setColorStrategy = (d) => (strategy) => d({ type: "SET_COLOR_STRATEGY", payload: strategy });
const updateLiveChartProps = (d) => (p) => d({ type: "UPDATE_LIVE_PROPS", payload: p });
const clearLiveChartProps = (d) => () => d({ type: "CLEAR_LIVE_PROPS" });
const reloadChartConfig = (d) => () => d({ type: "RELOAD_CHART_CONFIG" });
const setChartComponents = (d) => (c) => d({ type: "SET_CHART_COMPONENTS", payload: c });
const resetChartData = (d) => () => d({ type: "RESET_CHART_DATA" });

export const { Context: ChartContext, Provider: ChartProvider } =
  createDataContextSelector(
    reducer,
    {
      initChart,
      setQueryParams,
      setChartType,
      setColorStrategy,
      updateLiveChartProps,
      clearLiveChartProps,
      reloadChartConfig,
      setChartComponents,
      resetChartData,
    },
    initialState
  );
