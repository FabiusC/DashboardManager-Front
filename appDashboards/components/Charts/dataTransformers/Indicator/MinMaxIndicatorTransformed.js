import Transformer from '../Transformer'
import merge from "lodash/merge";

export class MinMaxIndicatorTransformer extends Transformer {
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

    // Validación de campos de agrupación
    if (!this.validateGroupByFields(panel)) {
      return { data: [] };
    }
    

    this.fieldFilter = panel?.queryParameters?.query_fields_distribution?.group_by_fields[0]?.name;
    const rawData = panel?.queryParameters?.rawData || [];
    const queryFields = panel?.queryParameters?.selected_fields || [];
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
    // Validar que hay datos
    if (!rawData || rawData.length === 0) {
      return { data: [] };
    }

    const firstRow = rawData[0];
    const metricKey = Object.keys(firstRow).find(key => key.includes("count"));
    const dimensionKey = Object.keys(firstRow).find(key => key !== metricKey);
    const metricValue = firstRow[metricKey] || 0;
    const dimensionValue = firstRow[dimensionKey] || "";
    const isNumric = !isNaN(parseFloat(dimensionValue)) && isFinite(dimensionValue)
    const formattedValue = isNumric ? new Intl.NumberFormat('es-ES',{useGrouping: true}).format(dimensionValue) : dimensionValue

    // Retornar en formato de array como espera el componente
    return {
      data: [{
        title: "",
        metric: formattedValue,
        value: metricValue
      }]
    };
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
      { ...params.chart.defaultProps },
      { styles: params.chart_setup_styles },
    {styles: params.liveChartProps},
      onClick ? { onClick } : {},
      { updateLiveChartProps: params.updateLiveChartPropsMethods },
      { panel: params.data }
    );
  }
}

