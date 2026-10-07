import Transformer from "../Transformer";
import merge from "lodash/merge";
import { buildLegendProps } from "../utils/ChartLegend";

export class WaffleTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);

  }

  transformData(panel) {
    // VALIDATIONS BASICS OF PANEL
    if (!this.validatePanel(panel)) {
      return { data: [] };
    }

    // VALIDATIONS PLAIN DATA
    if (!this.validateRawData(panel)) {
      return { data: [] };
    }

    // VALIDATION DISTRIBUTION FIELDS
    if (!this.validateQueryFieldsDistribution(panel)) {
      return { data: [] };
    }

    // VALIDATION FIELDS AGROUPED
    if (!this.validateGroupByFields(panel)) {
      return { data: [] };
    }

    const rawData = panel?.queryParameters?.rawData || [];
    
    if (!Array.isArray(rawData) || rawData.length === 0) return [];
    
    const dimensionField =
    panel?.queryParameters?.query_fields_distribution?.group_by_fields[0]
    .name;

    this.fieldFilter = dimensionField;
    
    const metricDataValid = rawData.find((d) => d[dimensionField] !== null);

    if (!metricDataValid) return [];

    const metricField = Object.keys(metricDataValid).find(
      (key) => key !== dimensionField,
    );

    if (!metricField) return []; 0

    const data = rawData
      .filter((d) => d[dimensionField] !== null && d[metricField] !== null)    
      .map((d) => {
        const valueDimensionField = d[dimensionField];
        return {
          id: valueDimensionField.toLowerCase(),
          label: valueDimensionField,
          value: d[metricField],
          filterValue: valueDimensionField,
          fieldByFilter: dimensionField,
        };
      });
  
    const dataCleanDuplicates = data.length !== 0 ?  Array.from(new Map(data.map(item => [item.id, item])).values()) : [];

    return {
      data: dataCleanDuplicates
    };
  }

  transformDataClick(datum, fieldFilter) {
    const fieldName = datum?.data?.fieldByFilter ?? fieldFilter ?? this.fieldFilter;
    
    const filterValue = datum?.data?.filterValue ?? datum?.id;
    const transformed = { field: fieldName, value: filterValue };
    
    this.filterManager.createRule(fieldName, filterValue, "EQUALS" );
    return transformed;
  }

  transformChartProps(params) {
    const onClick = !params.isEditionMode
      ? this.getOnClick(null, params.data)
      : undefined;
    const styles = params.chart_setup_styles ?? {};

    const legendProps = buildLegendProps({
      source: "waffle",
      styles,
      liveChartProps: params.liveChartProps,
    });

    const merged = merge(
      { ...params.chart.defaultProps },
      styles,
      params.liveChartProps,  
      onClick ? { onClick } : {},
      { updateLiveChartProps: params.updateLiveChartPropsMethods },
      { panel: params.data },
      { total: params.chartData.data.reduce((acc,data) => acc + data.value,0)}
    );
    
    return { ...merged, ...legendProps };
  }
}
