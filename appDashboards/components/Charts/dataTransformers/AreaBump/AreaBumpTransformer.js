import merge from "lodash/merge";
import Transformer from "../Transformer";
import { buildLegendProps } from "../utils/ChartLegend";

export class AreaBumpTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: "AND",
      acceptsSubgroups: false,
      allowMultipleRules: false,
      isCoupled: false,
    });
    this.categoryValuesById = {};
  }

  emptyData() {
    return { data: [] };
  }

  transformData(panel) {
    if (!this.validatePanel(panel)) return this.emptyData();
    if (!this.validateRawData(panel)) return this.emptyData();
    if (!this.validateQueryFieldsDistribution(panel)) return this.emptyData();
    if (!this.validateGroupByFields(panel)) return this.emptyData();
    if (!this.validateAggregationFields(panel)) return this.emptyData();

    const distribution = panel.queryParameters.query_fields_distribution;
    const groupFields = distribution.group_by_fields ?? [];
    const aggregationFields = distribution.aggregation_fields ?? [];
    if (groupFields.length !== 2 || aggregationFields.length !== 1) return this.emptyData();

    const positionField = groupFields[0]?.name;
    const categoryField = groupFields[1]?.name;
    const metricField = aggregationFields[0];
    if (!positionField || !categoryField || !metricField?.name) return this.emptyData();

    this.fieldFilter = categoryField;
    const metricKey = `${metricField.name}__${metricField.metric}`;

    const positions = new Map();
    const series = new Map();

    for (const row of panel.queryParameters.rawData) {
      const rawPosition = row?.[positionField];
      const rawCategory = row?.[categoryField];
      if (rawPosition == null || rawPosition === "" || rawCategory == null || rawCategory === "") {
        continue;
      }

      const positionId = String(rawPosition);
      const categoryId = String(rawCategory);

      if (!positions.has(positionId)) {
        positions.set(positionId, rawPosition);
      }

      if (!series.has(categoryId)) {
        series.set(categoryId, {
          id: categoryId,
          rawValue: rawCategory,
          values: new Map(),
        });
      }

      const value = Number(row?.[metricKey]);
      const numericValue = Number.isFinite(value) ? value : 0;
      const serie = series.get(categoryId);
      serie.values.set(positionId, (serie.values.get(positionId) ?? 0) + numericValue);
    }

    if (!positions.size || !series.size) return this.emptyData();

    this.categoryValuesById = Object.fromEntries(
      [...series.values()].map(({ id, rawValue }) => [id, rawValue])
    );

    const positionIds = [...positions.keys()];
    const seriesList = [...series.values()];
    const isBump = panel?.chartType?.name === "bump";

    const ranksByPosition = {};
    if (isBump) {
      for (const positionId of positionIds) {
        const ranked = seriesList.map(({ id, values }) => ({ id, value: values.get(positionId) ?? 0 })).sort((a, b) => b.value - a.value);
        ranksByPosition[positionId] = {};
        ranked.forEach(({ id }, i) => {
          ranksByPosition[positionId][id] = i + 1;
        });
      }
    }

    return {
      data: seriesList.map(({ id, values }) => ({
        id,
        data: positionIds.map((positionId) => ({
          x: positions.get(positionId),
          y: isBump ? ranksByPosition[positionId][id] : values.get(positionId) ?? 0,
        })),
      })),
    };
  }

  transformDataClick(datum, fieldFilter) {
    if (!this.filterManager) return null;

    const serieId = datum?.id ?? datum?.serie?.id ?? datum?.data?.id;
    const value = this.categoryValuesById[serieId];
    const field = fieldFilter ?? this.fieldFilter;
    if (!field || value == null || value === "") return null;

    this.filterManager.createRule(field, value, "EQUALS");
    return { field, value };
  }

  transformChartProps(params) {
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
    const styles = params.chart_setup_styles ?? {};
    const legendSource = params.data?.chartType?.name === "bump" ? "bump" : "areabump";
    const legendProps = buildLegendProps({
      source: legendSource,
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
      { panel: params.data }
    );

    return {
      ...merged,
      ...legendProps,
      startLabel: typeof merged.startLabel === "object" ? true : merged.startLabel ?? false,
      endLabel: typeof merged.endLabel === "object" ? true : merged.endLabel ?? false,
      startLabelPadding: merged.startLabel?.startLabelPadding ?? merged.startLabelPadding,
      endLabelPadding: merged.endLabel?.endLabelPadding ?? merged.endLabelPadding,
    };
  }
}
