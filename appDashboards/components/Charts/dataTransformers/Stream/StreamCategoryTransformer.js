import merge from "lodash/merge";
import Transformer from "../Transformer";
import { buildLegendProps } from "../utils/ChartLegend";

/**
 * Stream categórico: posición × categoría pivotado con una métrica por banda.
 */
export class StreamCategoryTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: "AND",
      acceptsSubgroups: false,
      allowMultipleRules: true,
      isCoupled: false,
    });
    this.categoryValuesByKey = {};
  }

  emptyData() {
    return {
      data: [],
      keys: [],
      positionLabels: [],
      seriesLabels: {},
      hasNegativeValues: false,
    };
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
    const categories = new Map();
    let hasNegativeValues = false;

    for (const row of panel.queryParameters.rawData) {
      const rawPosition = row?.[positionField];
      const rawCategory = row?.[categoryField];
      if (rawPosition == null || rawPosition === "" || rawCategory == null || rawCategory === "") {
        continue;
      }

      const positionId = String(rawPosition);
      const categoryId = String(rawCategory);
      if (!positions.has(positionId)) {
        positions.set(positionId, {
          label: String(rawPosition),
          values: new Map(),
        });
      }
      if (!categories.has(categoryId)) {
        categories.set(categoryId, {
          key: categoryId,
          label: categoryId,
          rawValue: rawCategory,
        });
      }

      const value = Number(row?.[metricKey]);
      const numericValue = Number.isFinite(value) ? value : 0;
      const position = positions.get(positionId);
      position.values.set(categoryId, (position.values.get(categoryId) ?? 0) + numericValue);
      hasNegativeValues ||= numericValue < 0;
    }

    const positionEntries = [...positions.values()];
    const categoryEntries = [...categories.values()];
    if (!positionEntries.length || !categoryEntries.length) return this.emptyData();

    this.categoryValuesByKey = Object.fromEntries(
      categoryEntries.map(({ key, rawValue }) => [key, rawValue])
    );

    return {
      data: positionEntries.map(({ values }) =>
        Object.fromEntries(
          [...categories.entries()].map(([categoryId, { key }]) => [key, values.get(categoryId) ?? 0])
        )
      ),
      keys: categoryEntries.map(({ key }) => key),
      positionLabels: positionEntries.map(({ label }) => label),
      seriesLabels: Object.fromEntries(
        categoryEntries.map(({ key, label }) => [key, label])
      ),
      hasNegativeValues,
    };
  }

  transformDataClick(datum, fieldFilter) {
    if (!this.filterManager) return null;

    const layerId =
      datum?.id ??
      datum?.layerId ??
      datum?.layer?.id ??
      datum?.data?.layerId ??
      datum?.data?.id;
    const value = this.categoryValuesByKey[layerId];
    const field = fieldFilter ?? this.fieldFilter;
    if (!field || value == null || value === "") return null;

    this.filterManager.createRule(field, value, "EQUALS");
    return { field, value };
  }

  transformChartProps(params) {
    const styles = params.chart_setup_styles ?? {};
    const liveProps = params.liveChartProps ?? {};
    const chartData = params.chartData ?? this.emptyData();
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
    const legendProps = buildLegendProps({
      source: "stream",
      styles,
      liveChartProps: liveProps,
    });
    const fallbackOffset =
      chartData.hasNegativeValues &&
      styles.offsetType == null &&
      liveProps.offsetType == null
        ? { offsetType: "diverging" }
        : {};

    const merged = merge(
      {},
      params.chart.defaultProps,
      styles,
      liveProps,
      fallbackOffset,
      onClick ? { onClick } : {},
      { updateLiveChartProps: params.updateLiveChartPropsMethods },
      { panel: params.data },
      {
        axisBottom: {
          format: (index) => chartData.positionLabels?.[Number(index)] ?? "",
        },
        label: (layer) => chartData.seriesLabels?.[layer?.id] ?? layer?.id,
      },
      { keys: chartData.keys ?? [] }
    );

    return { ...merged, ...legendProps };
  }
}
