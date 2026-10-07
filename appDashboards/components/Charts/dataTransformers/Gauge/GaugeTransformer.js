import Transformer from "../Transformer";
import merge from "lodash/merge";

// Calculate average value
const calculateAVG = (data, fieldName) => {
  console.log(data);
  console.log(fieldName);
  const values = data
    .map((item) => parseFloat(item[fieldName]))
    .filter((v) => !isNaN(v));

  if (!values.length) {
    return 0;
  }

  const total = values.reduce((sum, v) => sum + v, 0);

  return total / values.length;
};

// Calulate total range
const calculateRange = (data, fieldName) => {
  const values = data
    .map((item) => parseFloat(item[fieldName]))
    .filter((v) => !isNaN(v));

  if (!values.length) {
    return {
      min: 0,
      max: 100,
    };
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
};

export class GaugeTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);

    this.initialize({
      operator_filter: "AND",
      acceptsSubgroups: false,
      allowMultipleRules: false,
      isCoupled: false,
    });

    this.gaugeRange = null;
    this.gaugeRangeMetric = null;
  }

  transformData(panel, isEditionMode) {
    // Extract data
    if (!this.validatePanel(panel))
      return this.emptyResult(panel, isEditionMode);

    if (!this.validateRawData(panel))
      return this.emptyResult(panel, isEditionMode);

    const query = panel?.queryParameters?.query_fields_distribution;

    const rawData = panel?.queryParameters?.rawData ?? [];

    const aggregationFields = query?.aggregation_fields ?? [];

    // Get the metric to be displayed
    const firstMetric = aggregationFields[0];

    if (!firstMetric) {
      return this.emptyResult(panel, isEditionMode);
    }

    // Form the metric key, its the same as in the data
    const metricKey = `${firstMetric.name}__${firstMetric.metric}`;

    // --------------------------------------------------
    // VALUES
    // --------------------------------------------------

    // Calculate value for the chart
    const values = rawData
      .map((item) => parseFloat(item[metricKey]))
      .filter((v) => !isNaN(v));

    let value = 0;

    // IF there is more than one value in data, calculate avg
    if (values.length > 1) {
      // Multiple rows -> AVG
      value = calculateAVG(rawData, metricKey);
    } else if (values.length === 1) {
      // Single row -> selected value
      value = values[0];
    }

    // --------------------------------------------------
    // RANGE
    // --------------------------------------------------


    // Calculate only once the range (When there is no filters)
    if (this.gaugeRange === null || this.gaugeRangeMetric !== metricKey) {
      this.gaugeRange = calculateRange(rawData, metricKey);

      this.gaugeRangeMetric = metricKey;
    }

    return {
      data: rawData,
      calculatedRange: this.gaugeRange,
      isEditionMode,
      value,
    };
  }

  // This chart doesn't transform when click
  transformDataClick(datum) {
    return null;
  }

  // Return empty
  emptyResult(panel, isEditionMode) {
    return {
      data: [],
      calculatedRange: {
        min: 0,
        max: 100,
      },
      panel,
      isEditionMode,
      value: 0,
    };
  }

  // Allows control the live changes and return the data
  transformChartProps(params) {
    const onClick = !params.isEditionMode
      ? this.getOnClick(null, params.data)
      : undefined;

    const chartData = params.chartData ?? {};
    const styles = params.chart_setup_styles ?? {};

    // Priorities, lower=latest to load or replace in the chart
    return merge(
      {},
      params.chart?.defaultProps ?? {},
      styles,
      params.liveChartProps ?? {},

      onClick ? { onClick } : {},
      {
        value: chartData.value,
        calculatedRange: chartData.calculatedRange,
        updateLiveChartProps: params.updateLiveChartPropsMethods,
      },
      { panel: params.data },
    );
  }
}
