import Transformer from "../Transformer";
import merge from "lodash/merge";
import { buildLegendProps } from "../utils/ChartLegend";
import { sortByCalendarOrder } from "../utils/categoryOrderUtils";
import { buildAxisValueFormatProps } from "../utils/axisValueFormat";
/**
 * LineTransformer - Transformador para data dummy de la grafica de linea
 * 
 */
export class LineTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: 'AND',
      acceptsSubgroups: false,
      allowMultipleRules: false,
      isCoupled: false
    });
  }

  /**
   * No transforma datos, simplemente retorna una estructura vacía válida
   */
  transformData(panel) {
    
    const selected_fields = panel?.queryParameters?.selected_fields
    if(!Array.isArray(selected_fields)){
      return {data: []}
    }
    if(selected_fields.length == 0 || selected_fields == undefined){
      return {data:[]}
    }

    if (!this.validatePanel(panel)) {
      return { data: [] };
    }

    // Validación de datos raw
    if (!this.validateRawData(panel)) {
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


    const data = panel?.queryParameters?.rawData || [];
    if (!Array.isArray(data) || data.length === 0) return { data: [] };

    
    const groupField = selected_fields[0]
    const xKey = groupField.name;
    this.fieldFilter = xKey;
    const fieldsY = selected_fields.slice(1)

    const transformed = fieldsY.map(field => {
      const metricKey = `${field.name}__${field.metric}`;
    
      const seriesData = data.map(item => {
        const filterValue = item[xKey];

        return {
          x: filterValue,
          y: item[metricKey],
          filterValue,
          fieldByFilter: xKey,
        };
      });

      return {
        id: field.name,
        data: sortByCalendarOrder(seriesData, point => point.x),
      };

      
    });
    return {data:transformed} 
    }

  /**
   * Procesa el click del slice/point de Nivo Line.
   * datum puede ser: slice { points: [{ data: { x, y } }] } o point { data: { x, y }, id }
   */
  transformDataClick(datum, fieldFilter) {
    const points = datum?.points;
    const firstPoint = points?.[0];
    const pointData = firstPoint?.data ?? datum?.data;
    const nodeField = pointData?.fieldByFilter ?? fieldFilter ?? this.fieldFilter;
    if (!nodeField || !this.filterManager) return null;

    const xValue = pointData?.filterValue ?? pointData?.x ?? pointData?.xFormatted ?? firstPoint?.id?.split('.')?.[1] ?? datum?.id;
    if (xValue == null || xValue === '') return null;

    this.filterManager.createRule(nodeField, xValue, "EQUALS");
    return { field: nodeField, value: xValue };
  }

  transformChartProps(params) {
  const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;

  const styles = params.chart_setup_styles ?? {};
  const liveChartProps = params.liveChartProps ?? {};
  const axisFormatProps = buildAxisValueFormatProps({
    styles,
    liveChartProps,
  });
  const legendProps = buildLegendProps({
    source: 'line',
    styles,
    liveChartProps,
  });

  const merged = merge(
    {},
    { ...params.chart.defaultProps },
    styles,
    liveChartProps,
    axisFormatProps,
    { enableSlices: false },
    onClick ? { onClick } : {},
    { updateLiveChartProps: params.updateLiveChartPropsMethods },
    { panel: params.data }
  );

  return { ...merged, ...legendProps };
}
}
