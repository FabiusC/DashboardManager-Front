import Transformer from '../Transformer'
import merge from "lodash/merge";

export class CalendarTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: 'AND',
      acceptsSubgroups: false,
      allowMultipleRules: false,
      isCoupled: false
    });
  }

  emptyData() {
    const today = this.toDay(new Date()) ?? new Date().toISOString().slice(0, 10);
    return { data: [], from: today, to: today };
  }

  toDay(value) {
    if (value == null || value === '') return null;

    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) return null;
      const y = value.getFullYear();
      const m = String(value.getMonth() + 1).padStart(2, '0');
      const d = String(value.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    if (typeof value === 'number') {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return null;
      return this.toDay(date);
    }

    const match = String(value).trim().match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : null;
  }

  transformData(panel) {
    if (!this.validatePanel(panel)) return this.emptyData();
    if (!this.validateRawData(panel)) return this.emptyData();
    if (!this.validateQueryFieldsDistribution(panel)) return this.emptyData();
    if (!this.validateGroupByFields(panel)) return this.emptyData();
    if (!this.validateAggregationFields(panel)) return this.emptyData();

    const { group_by_fields, aggregation_fields } = panel.queryParameters.query_fields_distribution;
    const rawData = panel.queryParameters.rawData;
    const groupField = group_by_fields[0]?.name;
    const aggField = aggregation_fields[0];

    if (!groupField || !aggField?.name) return this.emptyData();

    const aggKey = `${aggField.name}__${aggField.metric}`;
    this.fieldFilter = groupField;

    const byDay = new Map();

    for (const row of rawData) {
      const rawDay = row?.[groupField];
      const day = this.toDay(rawDay);
      if (!day) continue;

      const n = Number(row?.[aggKey]);
      if (!Number.isFinite(n)) continue;

      const prev = byDay.get(day);
      if (prev) {
        prev.value += n;
      } else {
        byDay.set(day, {
          day,
          value: n,
          filterValue: rawDay,
          fieldByFilter: groupField,
        });
      }
    }

    const data = Array.from(byDay.values()).sort((a, b) =>
      a.day.localeCompare(b.day)
    );

    if (data.length === 0) return this.emptyData();

    return {
      data,
      from: data[0].day,
      to: data[data.length - 1].day,
    };
  }

  transformDataClick(datum, fieldFilter) {
    if (!this.filterManager) return null;

    const nodeField = datum?.data?.fieldByFilter ?? fieldFilter ?? this.fieldFilter;
    const filterValue = datum?.data?.filterValue ?? datum?.day ?? datum?.data?.day;

    if (!nodeField || filterValue == null || filterValue === '') return null;

    this.filterManager.createRule(nodeField, filterValue, "EQUALS");
    return { field: nodeField, value: filterValue };
  }

  transformChartProps(params) {
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
    const styles = params.chart_setup_styles ?? {};
    const chartData = params.chartData ?? {};

    return merge(
      {},
      { ...params.chart.defaultProps },
      styles,
      params.liveChartProps,
      onClick ? { onClick } : {},
      { updateLiveChartProps: params.updateLiveChartPropsMethods },
      { panel: params.data },
      {
        from: chartData.from,
        to: chartData.to,
      }
    );
  }
}
