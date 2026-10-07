import Transformer from '../Transformer'
import merge from "lodash/merge";


export class ComposedIndicatorTransformed extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: 'AND',
      acceptsSubgroups: false,
      allowMultipleRules: false,
      isCoupled: false
    });
  }

  transformData(panel) {
    // Validaciones básicas del panel
    if (!this.validatePanel(panel)) {
      return { data: [] };
    }

    // Validación de datos raw
    if (!this.validateRawData(panel)) {
      return { data: [] };
    }

    // Validación de campos seleccionados
    if (!this.validateSelectedFields(panel)) {
      return { data: [] };
    }

    // Validación de distribución de campos
    if (!this.validateQueryFieldsDistribution(panel)) {
      return { data: [] };
    }

    // // Validación de campos de agrupación
    // if (!this.validateGroupByFields(panel)) {
    //   return { data: [] };
    // }

    // this.fieldFilter = panel?.queryParameters?.query_fields_distribution?.group_by_fields[0]?.name;

    const parseMetric = (metric) => {
      switch (metric) {
          case "sum":
              return "sum";
          case "avg":
              return "prom";
          case "count":
              return "conteo";
          case "min":
              return "mín";
          case "max":
              return "máx";
          default:
              return metric;
      }
    }

    const rawData = panel?.queryParameters?.rawData || [];
    const queryFields = panel?.queryParameters?.selected_fields || [];
    const data = rawData.map((item) => {

      return queryFields.map((field) => {
        const key = Object.keys(item).find((k) => k.startsWith(field.name));
        const value = key ? item[key] : 0;
        let formattedValue = Number(value).toLocaleString('es-CO', {
          minimumFractionDigits: 0, maximumFractionDigits: 0
        });
        return {
          title: parseMetric(field.metric) + `(${field.name})` || "Composed Indicator",
          value: formattedValue,
        };
      });
    }).flat();
    return { data }
  }

  transformDataClick(datum, fieldFilter) {
    const nodeField = datum?.data?.fieldByFilter ?? fieldFilter ?? this.fieldFilter;
    const transformed = { field: nodeField, value: datum.id };

    this.filterManager.createRule(nodeField, datum.id, "EQUALS");
    return transformed;
  }

  
  transformChartProps(params) {
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;

  return merge(
    {},
    params.chart_setup_styles ?? {},
    { ...params.chart.defaultProps },
    params.liveChartProps,
    { updateLiveChartProps: params.updateLiveChartPropsMethods },  
    onClick ? { onClick } : {},
    { panel: params.data },
    
  );
}
}

