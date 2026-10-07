import Transformer from "../Transformer";
import merge from "lodash/merge";

/**
 * SwarmTransformer - Transformador para crear grafica del tipo Swarm
 * 
 .
 */
export class SwarmTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: 'AND',
      acceptsSubgroups: false,
      allowMultipleRules: true,
      isCoupled: false
    });
  }

  

  /**
   * No transforma datos, simplemente retorna una estructura vacía válida
   */
  transformData(panel) {
    //Validaciones básicas del panel
    if (!this.validatePanel(panel)) {
      return { data: [] };
    }

    // // Validación de datos raw
    if (!this.validateRawData(panel)) {
      return { data: [] };
    }

    // // Validación de distribución de campos
    if (!this.validateQueryFieldsDistribution(panel)) {
      return { data: [] };
    }

    // // Validación de campos de agrupación
    if (!this.validateGroupByFields(panel)) {
      return { data: [] };
    }

    const selection_fields = panel?.queryParameters?.selected_fields
    if(!Array.isArray(selection_fields)){
        return {data : []}
    }
    if(selection_fields.length == 0 || selection_fields == undefined ){
        return {data : []}
    }
    const fieldFilter = selection_fields[0];
    const valueFilter = selection_fields[1];
    const volumeFilter = selection_fields[2] || selection_fields[1];

    const valueKey = `${valueFilter.name}__${valueFilter.metric}`;
    const volumeKey = `${volumeFilter.name}__${volumeFilter.metric}`;
    
    const data = panel?.queryParameters?.rawData || [];

    if (!Array.isArray(data) || data.length === 0) return {data:[]}
    const groupedData =  data.filter( 
        row => row[fieldFilter.name] !== null && row[valueKey] !== null)
        .map((row,index) => ({
            id: index,
            group: row[fieldFilter.name],
            value: row[valueKey],
            volume : row[volumeKey] ,
            fieldByFilter: fieldFilter.name,

        }))
    

    return { data : groupedData };
   


}

    transformDataClick(datum, fieldFilter) {

    const nodeField = datum?.data?.fieldByFilter ?? fieldFilter ?? this.fieldFilter;
    const groupValue = datum?.data.group;
    if (!nodeField || !groupValue) return null;
    this.filterManager.createRule(nodeField, groupValue, "EQUALS");
    
    return { field: nodeField,value: groupValue };
    }

    
    transformChartProps(params) {
      const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
      const { data: chartData } = params.chartData;
      const styles = params.chart_setup_styles ?? {};

      const enableCustomScale = params.liveChartProps?.enableCustomScale ?? styles.enableCustomScale ?? false;
      const customScaleValue = params.liveChartProps?.scaleValue ?? styles.scaleValue;
      const customMinScaleValue = params.liveChartProps?.scaleMinValue ?? styles.scaleMinValue;
      let maxValue = chartData.length > 0 ? Math.max(...chartData.map(d => d.value)) : 0
      let finalMaxScale = maxValue * 1.1
      let finalMinScale = 0

      if (enableCustomScale == true) {
      const parsedScale = Number(customScaleValue);
      const parsedMinScale = Number(customMinScaleValue)

      if (!isNaN(parsedScale)) {
        finalMaxScale = parsedScale;
        
      }
      if(!isNaN(parsedMinScale)){
        finalMinScale = parsedMinScale
      }
      

    }
      const dynamicValue = {
        type: 'linear',
        min: finalMinScale,
        max: finalMaxScale,
        reverse: false
      }
      let max = chartData[0]?.volume;
      let min = chartData[0]?.volume;
      for (let i = 0; i < chartData.length; i++) {
        if (chartData[i].volume > max) max = chartData[i].volume;
        if (chartData[i].volume < min) min = chartData[i].volume;
      }
      const maxRangeSizeNode = params.liveChartProps?.rangeSize ?? styles.rangeSize; 
      const minSizeRangeNode = params.liveChartProps?.rangeMinSize ?? styles.rangeMinSize;
      const valuesVolume = chartData[0]?.volume != null? { key: 'volume', values: [min, max], sizes: [minSizeRangeNode, maxRangeSizeNode] } : null;
      
        
      const tooltip = (props) => {
        const formattedValue = new Intl.NumberFormat('es-ES',{useGrouping: true}).format(props.data.volume);
        const node = props;
        if (!node) return null;
        
        return (
          <div style={{
            background: 'white',
            padding: '9px 12px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'sans-serif'
          }}>
            <div><strong>{node.data?.group}</strong>: {formattedValue}</div>
          </div>
        );
      }

      return merge(
        { ...params.chart.defaultProps },
        styles,
        {
          groups: chartData.map((row) => row.group),
          size: valuesVolume,
          tooltip,
          valueScale: dynamicValue,
        },
        {size: params.liveChartProps},
        params.liveChartProps,
        onClick ? { onClick } : {},
        { updateLiveChartProps: params.updateLiveChartPropsMethods },
        { panel: params.data }
      );
    }


  
}

