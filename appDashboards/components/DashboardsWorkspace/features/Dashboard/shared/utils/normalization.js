export const normalizePanelResponse = (raw) => { 
  /* ---------- Datos exclusivos de la gráfica ---------- */
  const chartData = {
    chartType: raw?.chart_type,
    colorStrategy: raw?.color_strategy,
    queryParameters: raw?.queryParameters,
    reloadChartConfig: raw?.reloadChartConfig,
    chartTypeId: raw?.chart_type?.id,
    components: raw?.components,
  };
  /* ---------- Datos generales del panel ---------- */
  const {
    chart_type,
    color_strategy,
    query_parameters,
    reloadChartConfig,
    ...panel
  } = raw;

  const panelData = {
    panel: panel,
    setUp: { current: panel.setUp }
  }

  return { panelData, chartData };
};

export const buildChartState = (chartData) => ({
    ...chartData,
    hasChartType: Boolean(chartData?.chartTypeId || chartData?.chart_type?.id),
  });