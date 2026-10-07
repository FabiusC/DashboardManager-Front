// Function to check if the chart type is available
export function triggerChartType(chartTypeInformation, dimensionFields, measureFields) {
  const totalDimensions = dimensionFields.length;
  const totalMeasures = measureFields.length;
  const totalFields = totalDimensions + totalMeasures;

  const isWithinDimensionRange =
    (chartTypeInformation.min_dimensions_trigger != null
      ? totalDimensions >= chartTypeInformation.min_dimensions_trigger
      : true) &&
    (chartTypeInformation.max_dimensions_trigger != null
      ? totalDimensions <= chartTypeInformation.max_dimensions_trigger
      : true);

  const isWithinMeasureRange =
    (chartTypeInformation.min_measures_trigger != null
      ? totalMeasures >= chartTypeInformation.min_measures_trigger
      : true) &&
    (chartTypeInformation.max_measures_trigger != null
      ? totalMeasures <= chartTypeInformation.max_measures_trigger
      : true);

  const isWithinTotalFieldsRange =
    (chartTypeInformation.min_total_fields_trigger != null
      ? totalFields >= chartTypeInformation.min_total_fields_trigger
      : true) &&
    (chartTypeInformation.max_total_fields_trigger != null
      ? totalFields <= chartTypeInformation.max_total_fields_trigger
      : true);

  return isWithinDimensionRange && isWithinMeasureRange && isWithinTotalFieldsRange;
}