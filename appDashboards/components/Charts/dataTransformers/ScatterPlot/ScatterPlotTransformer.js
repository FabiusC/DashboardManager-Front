import Transformer from '../Transformer'
import merge from "lodash/merge";

export class ScatterPlotTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: 'AND',
      acceptsSubgroups: false,
      allowMultipleRules: false,
      isCoupled: false
    });
  }

  transformData(panel) {
    if (!this.validatePanel(panel)) {
      return { data: [] };
    }

    if (!this.validateRawData(panel)) {
      return { data: [] };
    }

    const selected_fields = panel?.queryParameters?.selected_fields;
    if (!Array.isArray(selected_fields) || selected_fields.length < 3) {
      return { data: [] };
    }

    const serieField = selected_fields[0];
    const xField = selected_fields[1];
    const yField = selected_fields[2];

    this.fieldFilter = serieField.name;

    const data = panel?.queryParameters?.rawData || [];
    if (!Array.isArray(data) || data.length === 0) return { data: [] };

    const seriesMap = new Map();

    data.forEach((row) => {
      const serieId = row[serieField.name];
      const x = row[xField.name];
      const y = row[yField.name];
      if (serieId == null || x == null || y == null) return;

      if (!seriesMap.has(serieId)) {
        seriesMap.set(serieId, { id: serieId, data: [] });
      }

      seriesMap.get(serieId).data.push({
        x,
        y,
        fieldByFilter: serieField.name,
      });
    });

    return { data: Array.from(seriesMap.values()) };
  }

  transformDataClick(datum, fieldFilter) {
    if (!this.filterManager) return null;

    const nodeField = datum?.data?.fieldByFilter ?? fieldFilter ?? this.fieldFilter;
    const filterValue = datum?.data?.serieId ?? datum?.serieId;

    if (!nodeField || filterValue == null || filterValue === '') return null;

    this.filterManager.createRule(nodeField, filterValue, "EQUALS");
    return { field: nodeField, value: filterValue };
  }

  transformChartProps(params) {
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
    const styles = params.chart_setup_styles ?? {};
    const autoScale = { type: 'linear', min: 'auto', max: 'auto' };

    const merged = merge(
      {},
      { ...params.chart.defaultProps },
      styles,
      params.liveChartProps,
      onClick ? { onClick } : {},
      { updateLiveChartProps: params.updateLiveChartPropsMethods },
      { panel: params.data }
    );

    const legends = merged.legends ? [merged.legends] : [];
    const xScale = typeof merged.xScale === 'object' && merged.xScale ? merged.xScale : autoScale;
    const yScale = typeof merged.yScale === 'object' && merged.yScale ? merged.yScale : autoScale;

    return { ...merged, legends, xScale, yScale };
  }
}
