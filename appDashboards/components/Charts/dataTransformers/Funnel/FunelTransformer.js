import Transformer from "../Transformer";
import merge from "lodash/merge";
export class FunnelTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: 'AND',
      acceptsSubgroups: false,
      allowMultipleRules: true,
      isCoupled: false
    });
    this.groupKey = null;
  }

  transformData(panel) {
    if (!this.validatePanel(panel)) {
      this.groupKey = null;
      return { data: [] };
    }
    if (!this.validateRawData(panel)) {
      this.groupKey = null;
      return { data: [] };
    }

    const selection_fields = panel?.queryParameters?.selected_fields;
    if (!Array.isArray(selection_fields) || selection_fields.length < 2) {
      this.groupKey = null;
      return { data: [] };
    }

    const groupKey = selection_fields[0]?.name;
    const valueField = selection_fields[1]?.name;
    const valueFieldMetric = selection_fields[1]?.metric;
    if (!groupKey || !valueField) {
      this.groupKey = null;
      return { data: [] };
    }

    const raw = panel?.queryParameters?.rawData || [];
    if (!Array.isArray(raw) || raw.length === 0) {
      this.groupKey = null;
      return { data: [] };
    }
    
    const metricKey = valueFieldMetric ? `${valueField}__${valueFieldMetric}` : valueField;

    const byId = {};
    for (const row of raw) {
      if (row?.[groupKey] == null || row?.[metricKey] == null) continue;
      const id = row[groupKey];
      const v = row[metricKey];
      if (!Number.isFinite(v) || v < 0) continue;
      byId[id] = (byId[id] ?? 0) + v;
    }
    const groupedData = Object.entries(byId)
      .map(([id, value]) => ({ id, value, label: id }))
      .sort((a, b) => b.value - a.value);

    this.groupKey = groupKey;
    return { data: groupedData };
  }

  transformDataClick(datum, fieldFilter) {
    if (!this.filterManager) return null;
    
    const nodeField = this.groupKey || fieldFilter;
    if (!nodeField) return null;
    
    const groupValue = datum?.data?.id ?? datum?.id;
    if (groupValue == null || groupValue === '') return null;
    
    this.filterManager.clearPanelFilters();
    this.filterManager.createRule(nodeField, groupValue, 'EQUALS');
    
    return { field: nodeField, value: groupValue};
  }

  transformChartProps(params) {
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
    const motionConfigProps = {"motionConfig":{ mass: 1, tension: 170, friction: 26, clamp: true, precision: 1, velocity:0}}; // Config for correct animation
    return merge(
      {},
      { ...params.chart.defaultProps ?? {}},
      {...motionConfigProps},
      params.chart_setup_styles ?? {},
      params.liveChartProps,
      onClick ? { onClick } : {},
      { updateLiveChartProps: params.updateLiveChartPropsMethods },
      { panel: params.data }
    );
  }


}
