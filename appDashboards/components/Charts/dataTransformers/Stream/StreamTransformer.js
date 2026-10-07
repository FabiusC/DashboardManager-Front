import merge from "lodash/merge";
import Transformer from "../Transformer";
import { buildLegendProps } from "../utils/ChartLegend";

/**
 * Stream: una dimensión ordenada como posición y una o más métricas como bandas.
 */
export class StreamTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: "AND",
      acceptsSubgroups: false,
      allowMultipleRules: false,
      isCoupled: false,
    });
    this.positionValues = [];
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
    if (groupFields.length !== 1 || aggregationFields.length < 1) return this.emptyData();

    const positionField = groupFields[0]?.name;
    if (!positionField) return this.emptyData();

    this.fieldFilter = positionField;
    const metrics = aggregationFields.map((field) => ({
      key: `${field.name}__${field.metric}`,
      label: field.alias || field.name || `${field.name}__${field.metric}`,
    }));
    const positions = new Map();
    let hasNegativeValues = false;

    for (const row of panel.queryParameters.rawData) {
      const rawPosition = row?.[positionField];
      if (rawPosition == null || rawPosition === "") continue;

      const identity = String(rawPosition);
      if (!positions.has(identity)) {
        positions.set(identity, {
          rawValue: rawPosition,
          label: String(rawPosition),
          values: Object.fromEntries(metrics.map(({ key }) => [key, 0])),
        });
      }

      const position = positions.get(identity);
      for (const metric of metrics) {
        const value = Number(row?.[metric.key]);
        const numericValue = Number.isFinite(value) ? value : 0;
        position.values[metric.key] += numericValue;
        hasNegativeValues ||= numericValue < 0;
      }
    }

    const positionEntries = [...positions.values()];
    if (!positionEntries.length) return this.emptyData();

    this.positionValues = positionEntries.map(({ rawValue }) => rawValue);
    return {
      data: positionEntries.map(({ values }) => values),
      keys: metrics.map(({ key }) => key),
      positionLabels: positionEntries.map(({ label }) => label),
      seriesLabels: Object.fromEntries(metrics.map(({ key, label }) => [key, label])),
      hasNegativeValues,
    };
  }

  transformDataClick(datum, fieldFilter) {
    if (!this.filterManager) return null;

    const index = Number(
      datum?.index ??
      datum?.data?.index ??
      datum?.layer?.data?.[0]?.index ??
      datum?.data?.[0]?.index
    );
    const value = this.positionValues[index];
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
