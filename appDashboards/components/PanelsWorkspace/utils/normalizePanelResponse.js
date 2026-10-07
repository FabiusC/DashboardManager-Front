export const normalizePanelResponse = (raw) => {
  /* ---------- Datos exclusivos de la gráfica ---------- */
  const chartData = {
    chart_type:       raw?.chart_type,
    color_strategy:   raw?.color_strategy,
    queryParameters:  raw?.query_parameters,
    reloadChartConfig: raw?.reloadChartConfig,
    chartTypeId:     raw?.chart_type?.id,
    components: raw?.components,
  };

  /* ---------- Datos generales del panel ---------- */
  const {
    chart_type,
    color_strategy,
    query_parameters,
    reloadChartConfig,
    ...panelData
  } = raw;

  return { panelData, chartData };
};
