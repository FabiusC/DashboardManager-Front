import merge from "lodash/merge";
import Transformer from "../Transformer";
import { buildLegendProps } from "../utils/ChartLegend";

export class MarimekkoTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: "AND",
      acceptsSubgroups: false,
      allowMultipleRules: true,
      isCoupled: false,
    });
    this.segmentValuesByKey = {};
  }

  emptyData() {
    return { data: [], dimensions: [] };
  }

  transformData(panel) {
    if (!this.validateRawData(panel)) return this.emptyData();

    const distribution = panel.queryParameters.query_fields_distribution;
    const groupFields = distribution?.group_by_fields ?? [];
    const aggregationFields = distribution?.aggregation_fields ?? [];
    if (groupFields.length !== 2 || aggregationFields.length !== 1) return this.emptyData();

    const columnField = groupFields[0]?.name;
    const segmentField = groupFields[1]?.name;
    const metricField = aggregationFields[0];
    if (!columnField || !segmentField || !metricField?.name) return this.emptyData();

    this.fieldFilter = segmentField;
    const metricKey = `${metricField.name}__${metricField.metric}`;

    const columns = new Map();
    const segments = new Map();

    for (const row of panel.queryParameters.rawData) {
      const rawColumn = row?.[columnField];
      const rawSegment = row?.[segmentField];
      if (rawColumn == null || rawColumn === "" || rawSegment == null || rawSegment === "") {
        continue;
      }

      const columnId = String(rawColumn);
      const segmentId = String(rawSegment);
      const value = Number(row?.[metricKey]);
      const numericValue = Number.isFinite(value) ? value : 0;

      if (!columns.has(columnId)) {
        columns.set(columnId, {
          id: columnId,
          filterValue: rawColumn,
          segments: new Map(),
        });
      }
      if (!segments.has(segmentId)) {
        segments.set(segmentId, rawSegment);
      }

      const column = columns.get(columnId);
      column.segments.set(segmentId, (column.segments.get(segmentId) ?? 0) + numericValue);
    }

    if (!columns.size || !segments.size) return this.emptyData();

    this.segmentValuesByKey = Object.fromEntries(segments);
    const segmentKeys = [...segments.keys()];

    const data = [...columns.values()].map(({ segments: segmentValues, ...column }) => {
      const entry = { ...column };
      let total = 0;
      for (const key of segmentKeys) {
        const segmentValue = segmentValues.get(key) ?? 0;
        entry[key] = segmentValue;
        total += segmentValue;
      }
      entry.value = total;
      return entry;
    });

    return {
      data,
      dimensions: segmentKeys.map((key) => ({ id: key, value: key })),
    };
  }

  transformDataClick(datum, fieldFilter) {
    if (!this.filterManager) return null;

    const segmentId = datum?.id;
    const value = this.segmentValuesByKey[segmentId];
    const field = fieldFilter ?? this.fieldFilter;
    if (!field || value == null || value === "") return null;

    this.filterManager.createRule(field, value, "EQUALS");
    return { field, value };
  }

  transformChartProps(params) {
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
    const styles = params.chart_setup_styles ?? {};
    const chartData = params.chartData ?? this.emptyData();
    const legendProps = buildLegendProps({
      source: "marimekko",
      styles,
      liveChartProps: params.liveChartProps,
    });

    const merged = merge(
      {},
      { ...params.chart.defaultProps },
      styles,
      params.liveChartProps,
      onClick ? { onClick } : {},
      { updateLiveChartProps: params.updateLiveChartPropsMethods },
      { panel: params.data },
      {
        id: "id",
        value: "value",
        dimensions: chartData.dimensions ?? [],
      }
    );

    return { ...merged, ...legendProps };
  }
}
