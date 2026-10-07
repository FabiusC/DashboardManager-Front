// useChart.js
"use client";

import { useMemo } from "react";
import merge from "lodash/merge";
import { useStore, useDispatch, useSelector } from "react-redux";
import chartRegistry from "./chartRegistry";
import useChartSetup from "./useChartSetup";
import { useChartContext } from "@components/PanelsWorkspace/hooks/useChartContext";

const useChart = (
  chartType,
  data,
  isEditionMode,
  liveChartProps = {},
  idPanel,
  reloadChartConfig
) => {
  const dispatch = useDispatch();
  const store = useStore();
  const filtersState = useSelector((state) => state.filters || {});

  const chartContext = useChartContext();
  const { updateLiveProps, handleUpdateLiveChartProps, clearLiveProps } =
    chartContext.actions;

  const chart = useMemo(() => chartRegistry[chartType] || null, [chartType]);

  const { chart_setup_styles, isLoading, error } = useChartSetup(
    idPanel,
    chartType,
    chart,
    reloadChartConfig
  );
  const updateLiveChartPropsMethods = useMemo(() => ({
    updateLiveProps,
    updateProp: handleUpdateLiveChartProps,
    clearProps: clearLiveProps,
  }), [updateLiveProps, handleUpdateLiveChartProps, clearLiveProps]);

  const transformer = useMemo(() => {
    if (!chart) return null;
    const transformerInstance = new chart.transformerClass(idPanel);
    if (!isEditionMode) {
      transformerInstance.initializeFilterManager(dispatch, store.getState);
    }
    return transformerInstance;
  }, [chart, idPanel, dispatch, store, isEditionMode]);

  const chartData = useMemo(() => {
    if (!transformer || !data) return { data: [] };
    try {
      return transformer.transformData(data, isEditionMode);
    } catch (e) {
      console.error("Error transformando datos:", e);
      return { data: [] };
    }
  }, [transformer, data, isEditionMode, filtersState]);

  const colors = useMemo(() => {
    return data?.colorStrategy?.[`${data?.colorStrategy?.strategy_type}_palette`]?.colors || null;
  }, [data]);

  const chartProps = useMemo(() => {
    if (!chart || !transformer) return {};
    return (
      transformer.transformChartProps({
        chart,
        chart_setup_styles,
        data,
        liveChartProps,
        updateLiveChartPropsMethods,
        chartData,
        isEditionMode,
      }) || {}
    );
  }, [
    chart,
    chart_setup_styles,
    data,
    liveChartProps,
    updateLiveChartPropsMethods,
    chartData,
    isEditionMode,
  ]);
  return {
    ChartComponent: chart?.component || null,
    isCustom: chart?.isCustom ?? false,
    chartData,
    chartProps,
    colors,
    isLoading,
    error: error || (!chart ? `Tipo de gráfica inválido: ${chartType}` : null),
    updateLiveChartProps: updateLiveChartPropsMethods,
  };
};

export default useChart;