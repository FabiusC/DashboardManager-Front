import merge from "lodash/merge";
import Transformer from "../Transformer";
import { resolveDictionaryLabel } from "@components/PanelsWorkspace/utils/dictionaryUtils";

const EMPTY_DATA = {
  data: [],
  leftSeries: null,
  rightSeries: null,
};

const BUCKET_SIZE = 5;
const DEFAULT_SORT_DIRECTION = "desc";

const getFieldName = (field) => {
  if (typeof field === "string" || typeof field === "number") {
    return String(field);
  }
  return field?.name ?? field?.field_name ?? field?.fieldName ?? "";
};

const valueKey = (value) =>
  value === null || value === undefined ? "" : String(value);

const toFiniteNumber = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const readMetricValue = (row, field) => {
  if (!field || !row) return null;
  const name = getFieldName(field);
  const metric = field?.metric || "count";
  const identifier = field?.field_id ?? field?.id ?? name;
  const key = [
    name && `${name}__${metric}`,
    identifier && `${identifier}__${metric}`,
    name,
    field?.alias,
  ]
    .filter(Boolean)
    .find((candidate) =>
      Object.prototype.hasOwnProperty.call(row, candidate)
    );
  if (!key) return null;
  const value = toFiniteNumber(row[key]);
  return value !== null && value >= 0 ? value : null;
};

const getDistinctFieldValues = (rawData, fieldName, dictionaryMap = {}) => {
  if (!Array.isArray(rawData) || !fieldName) return [];

  const values = new Map();
  rawData.forEach((row) => {
    const rawValue = row?.[fieldName];
    const key = valueKey(rawValue);
    if (!key || values.has(key)) return;
    values.set(key, {
      key,
      rawValue,
      label: String(resolveDictionaryLabel(rawValue, dictionaryMap) || key),
    });
  });

  return [...values.values()].sort((a, b) =>
    a.label.localeCompare(b.label, "es", {
      numeric: true,
      sensitivity: "base",
    })
  );
};

const getNumericBucket = (value, fieldName) => {
  const numericValue = toFiniteNumber(value);
  if (numericValue === null) return null;

  const bucketStart = Math.floor(numericValue / BUCKET_SIZE) * BUCKET_SIZE;
  const integerBounds =
    Number.isInteger(numericValue) && Number.isInteger(bucketStart);
  const bucketEnd = integerBounds
    ? bucketStart + BUCKET_SIZE - 1
    : bucketStart + BUCKET_SIZE;

  return {
    key: `${fieldName || "value"}-${bucketStart}`,
    label: `${bucketStart}–${bucketEnd}`,
    start: bucketStart,
    end: bucketEnd,
    filterFrom: bucketStart,
    filterTo: bucketEnd,
  };
};

const resolveSortSettings = (panel) => {
  const qp = panel?.queryParameters || {};
  const direction = String(
    qp.sort_direction ?? qp.sort_rule?.direction ?? DEFAULT_SORT_DIRECTION
  ).toLowerCase();
  const order = String(
    qp.sort_criterion ?? qp.sort_rule?.order ?? "numeric"
  ).toLowerCase();
  return {
    direction: direction === "asc" ? "asc" : "desc",
    order,
  };
};

const compareLabels = (leftLabel, rightLabel, order) => {
  const left = String(leftLabel ?? "");
  const right = String(rightLabel ?? "");

  if (order === "lexicographic") {
    return left.localeCompare(right, "es", { sensitivity: "base" });
  }

  if (order === "numeric") {
    const leftNumber = toFiniteNumber(left);
    const rightNumber = toFiniteNumber(right);
    if (leftNumber != null && rightNumber != null) {
      return leftNumber - rightNumber;
    }
  }

  return left.localeCompare(right, "es", {
    numeric: true,
    sensitivity: "base",
  });
};

const createBucketComparator = (
  direction = DEFAULT_SORT_DIRECTION,
  order = "numeric"
) => {
  const directionFactor = direction === "asc" ? 1 : -1;

  return (left, right) => {
    if (left.start != null && right.start != null) {
      return (Number(left.start) - Number(right.start)) * directionFactor;
    }
    if (left.start != null) return -1 * directionFactor;
    if (right.start != null) return 1 * directionFactor;
    return compareLabels(left.label, right.label, order) * directionFactor;
  };
};

export class PopulationPyramidTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: "AND",
      acceptsSubgroups: false,
      allowMultipleRules: true,
      isCoupled: false,
    });
    this.dimensionField = null;
    this.seriesByKey = new Map();
    this.bucketByLabel = new Map();
  }

  emptyData() {
    return { ...EMPTY_DATA, data: [] };
  }

  transformData(panel) {
    this.dimensionField = null;
    this.seriesByKey = new Map();
    this.bucketByLabel = new Map();

    if (!this.validatePanel(panel)) return this.emptyData();
    if (!this.validateRawData(panel)) return this.emptyData();
    if (!this.validateQueryFieldsDistribution(panel)) return this.emptyData();
    if (!this.validateGroupByFields(panel)) return this.emptyData();
    if (!this.validateAggregationFields(panel)) return this.emptyData();

    const distribution = panel.queryParameters.query_fields_distribution;
    const groupByFields = distribution.group_by_fields || [];
    const aggregationFields = distribution.aggregation_fields || [];
    if (groupByFields.length < 2 || aggregationFields.length < 1) {
      return this.emptyData();
    }

    const dimensionField = groupByFields[0];
    const comparisonField = groupByFields[1];
    const metricField = aggregationFields[0];
    const dimensionName = getFieldName(dimensionField);
    const comparisonName = getFieldName(comparisonField);
    if (!dimensionName || !comparisonName) return this.emptyData();

    this.dimensionField = dimensionName;
    this.fieldFilter = dimensionName;

    const rawData = panel.queryParameters.rawData || [];
    const dictionaryMap = panel.queryParameters.dictionaryMap ?? {};
    const comparisonOptions = getDistinctFieldValues(
      rawData,
      comparisonName,
      dictionaryMap
    ).slice(0, 2);
    if (comparisonOptions.length === 0) return this.emptyData();

    const leftOption = comparisonOptions[0];
    const rightOption = comparisonOptions[1] || null;
    const leftSeries = {
      key: "left",
      label: leftOption.label || valueKey(leftOption.rawValue),
      rawValue: leftOption.rawValue,
      field: comparisonName,
    };
    const rightSeries = rightOption
      ? {
          key: "right",
          label: rightOption.label || valueKey(rightOption.rawValue),
          rawValue: rightOption.rawValue,
          field: comparisonName,
        }
      : null;

    this.seriesByKey.set("left", leftSeries);
    if (rightSeries) this.seriesByKey.set("right", rightSeries);

    const buckets = new Map();
    let hasPopulatedData = false;

    const ensureBucket = (bucket, rawDimensionValue = null) => {
      if (!bucket) return null;
      if (!buckets.has(bucket.key)) {
        buckets.set(bucket.key, {
          ...bucket,
          left: 0,
          right: 0,
          rawDimensionValue,
        });
      }
      return buckets.get(bucket.key);
    };

    rawData.forEach((row) => {
      const rawDimensionValue = row?.[dimensionName];
      if (
        rawDimensionValue === null ||
        rawDimensionValue === undefined ||
        String(rawDimensionValue).trim() === ""
      ) {
        return;
      }

      const selectedOption = comparisonOptions.find(
        (option) => option.key === valueKey(row?.[comparisonName])
      );
      if (!selectedOption) return;

      const numericDimensionValue = toFiniteNumber(rawDimensionValue);
      const metricValue = readMetricValue(row, metricField) ?? 1;
      const bucket =
        numericDimensionValue !== null
          ? getNumericBucket(rawDimensionValue, dimensionName)
          : {
              key: `category-${valueKey(rawDimensionValue)}`,
              label: String(
                resolveDictionaryLabel(rawDimensionValue, dictionaryMap) ||
                  rawDimensionValue
              ),
              start: null,
              end: null,
              filterType: "EQUALS",
              filterValue: rawDimensionValue,
            };

      const bucketEntry = ensureBucket(bucket, rawDimensionValue);
      if (!bucketEntry) return;

      const seriesIndex = comparisonOptions.findIndex(
        (option) => option.key === selectedOption.key
      );
      if (seriesIndex === 0) bucketEntry.left += metricValue;
      else if (seriesIndex === 1) bucketEntry.right += metricValue;
      hasPopulatedData = true;
    });

    if (!hasPopulatedData) return this.emptyData();

    const { direction, order } = resolveSortSettings(panel);
    const compareBuckets = createBucketComparator(direction, order);

    const data = [...buckets.values()].sort(compareBuckets).map((bucket) => {
      const filterType =
        bucket.filterType ||
        (bucket.filterFrom != null && bucket.filterTo != null
          ? "BETWEEN"
          : null);
      const pyramidMeta = {
        field: dimensionName,
        filterType,
        filterFrom: bucket.filterFrom,
        filterTo: bucket.filterTo,
        filterValue: bucket.filterValue ?? bucket.rawDimensionValue,
      };
      this.bucketByLabel.set(bucket.label, pyramidMeta);
      return {
        label: bucket.label,
        left: bucket.left,
        right: bucket.right,
        __populationPyramid: pyramidMeta,
      };
    });

    return {
      data,
      leftSeries,
      rightSeries,
    };
  }

  transformDataClick(datum) {
    if (!this.filterManager) return null;

    const row = datum?.data ?? {};
    const bucketMeta =
      row.__populationPyramid ?? this.bucketByLabel.get(datum?.indexValue);
    const seriesMeta = this.seriesByKey.get(String(datum?.id));
    if (!bucketMeta || !this.dimensionField) return null;

    const filters = [];
    if (
      bucketMeta.filterType === "BETWEEN" &&
      bucketMeta.filterFrom != null &&
      bucketMeta.filterTo != null
    ) {
      const value = [bucketMeta.filterFrom, bucketMeta.filterTo];
      this.filterManager.createRule(this.dimensionField, value, "BETWEEN");
      filters.push({
        field: this.dimensionField,
        value,
        operator: "BETWEEN",
      });
    } else if (
      bucketMeta.filterValue != null &&
      bucketMeta.filterValue !== ""
    ) {
      this.filterManager.createRule(
        this.dimensionField,
        bucketMeta.filterValue,
        "EQUALS"
      );
      filters.push({
        field: this.dimensionField,
        value: bucketMeta.filterValue,
        operator: "EQUALS",
      });
    }

    if (
      seriesMeta?.field &&
      seriesMeta.rawValue != null &&
      seriesMeta.rawValue !== ""
    ) {
      this.filterManager.createRule(
        seriesMeta.field,
        seriesMeta.rawValue,
        "EQUALS"
      );
      filters.push({
        field: seriesMeta.field,
        value: seriesMeta.rawValue,
        operator: "EQUALS",
      });
    }

    return filters.length > 0 ? filters : null;
  }

  transformChartProps(params) {
    const onClick = !params.isEditionMode
      ? this.getOnClick(null, params.data)
      : undefined;
    const chartData = params.chartData ?? this.emptyData();

    return merge(
      {},
      { ...params.chart.defaultProps },
      { styles: params.chart_setup_styles },
      { styles: params.liveChartProps },
      onClick ? { onClick } : {},
      { updateLiveChartProps: params.updateLiveChartPropsMethods },
      { panel: params.data },
      {
        leftSeries: chartData.leftSeries,
        rightSeries: chartData.rightSeries,
      }
    );
  }
}
