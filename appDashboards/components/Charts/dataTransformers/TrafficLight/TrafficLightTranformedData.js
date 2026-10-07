import { FIELD_METRIC_OPTIONS } from "@components/PanelsWorkspace/services/panelsWorkspaceApi";
import Transformer from "../Transformer";
import merge from "lodash/merge";

export class TrafficLightTranformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.customRanges = {};
    this.isDefaultRange = true;
    this.firstColumn = null;
    this.ranges = {};
    this.evalRules = {};
    this.defaultRanges = {};
  }

  transformData(panel) {
    const defualtData = { data: [], columns: [] };
    if (!this.validatePanel(panel)) return defualtData;
    if (!this.validateRawData(panel)) return defualtData;
    if (!this.validateQueryFieldsDistribution(panel)) return defualtData;

    const rawData = panel.queryParameters?.rawData || [];
    if (!Array.isArray(rawData)) return [];

    const selectedFields = panel.queryParameters?.selected_fields || [];
    if (!Array.isArray(selectedFields) || selectedFields.length === 0) {
      console.warn(
        "RecordsTableTransformer: showed_fields es requerido y debe ser un array no vacío",
      );
      return defualtData;
    }

    this.firstColumn = selectedFields[0].name;
    this.evalRules = {field:selectedFields[1].name,metric:selectedFields[1].metric,rule:FIELD_METRIC_OPTIONS.find(({value}) => value === selectedFields[1].metric ).menuLabel};
    
    const newData = this.setConfigTrafficLight(rawData);
    const newColumns = selectedFields?.map((field) => {
      const fieldName = field.type === "measure" ?  `${field.name}__${field.metric}` : field.name;
      return {
        accessorKey: fieldName,
        header: field.alias || field.name,
        size: field.size || 150,
      };
    });

    return { data: newData, columns: newColumns };
  }
  
  calcRangeLight(value,ranges){
    if(value > ranges.unique_green_min &&  value <= ranges.unique_green_max){
      return 'green';
    }else if(value > ranges.unique_yellow_min && value <= ranges.unique_yellow_max){
      return 'yellow'
    }else{
      return 'red';
    }
  }

  setCustomRanges(params){
    const styles = params.chart_setup_styles ?? {};
    const liveChartProps = params.liveChartProps ?? {};


    //BUILD CUSTOM RANGES DINAMIC
    this.customRanges.unique_green_max = Number((styles.rangeGreen?.rangeGreenMax || null ) ?? liveChartProps.rangeGreen?.rangeGreenMax ?? this.defaultRanges.unique_green_max);
    this.customRanges.unique_green_min = Number((styles.rangeGreen?.rangeGreenMin || null ) ?? liveChartProps.rangeGreen?.rangeGreenMin ??  this.defaultRanges.unique_green_min);

    this.customRanges.unique_yellow_max = Number((styles.rangeYellow?.rangeYellowMax || null) ?? liveChartProps.rangeYellow?.rangeYellowMax ?? this.defaultRanges.unique_yellow_max);
    this.customRanges.unique_yellow_min = Number((styles.rangeYellow?.rangeYellowMin || null) ?? liveChartProps.rangeYellow?.rangeYellowMin ??  this.defaultRanges.unique_yellow_min);

    this.customRanges.unique_red_max = Number((styles.rangeRed?.rangeRedMax || null) ?? liveChartProps.rangeRed?.rangeRedMax ??  this.defaultRanges.unique_red_max);
    this.customRanges.unique_red_min = Number((styles.rangeRed?.rangeRedMin || null) ?? liveChartProps.rangeRed?.rangeRedMin ?? this.defaultRanges.unique_red_min);

    this.isDefaultRange = false;
  }

  setConfigTrafficLight(data) {
    const newData = structuredClone(data);
    const [firtsKey, ...restKeys] = Object.keys(newData[0]);

    //BUILD DEFAULT RANGES
    restKeys.forEach((key) => {
      newData.forEach((obj) => {
        this.defaultRanges[`${key}_max`] = Math.max(this.defaultRanges[`${key}_max`] ?? obj[key],obj[key]);
        this.defaultRanges[`${key}_min`] = Math.min(this.defaultRanges[`${key}_min`] ?? obj[key],obj[key]);   
        this.defaultRanges[`${key}_result`] = (this.defaultRanges[`${key}_max`] - this.defaultRanges[`${key}_min`]) / 3 ;   
        
        //RED
        this.defaultRanges['unique_red_min'] =  Math.round(this.defaultRanges[`${key}_min`])
        this.defaultRanges['unique_red_max'] =  Math.round(this.defaultRanges['unique_red_min'] + this.defaultRanges[`${key}_result`]);

        //YELLOW
        this.defaultRanges['unique_yellow_min'] =  Math.round(this.defaultRanges['unique_red_max']);
        this.defaultRanges['unique_yellow_max'] =  Math.round(this.defaultRanges['unique_yellow_min'] + this.defaultRanges[`${key}_result`] );
      
        //GREEN
        this.defaultRanges['unique_green_min'] =  Math.round(this.defaultRanges['unique_yellow_max']);
        this.defaultRanges['unique_green_max'] =  Math.round(this.defaultRanges[`${key}_max`]);
      });
    });
        
    this.ranges = this.isDefaultRange ? this.defaultRanges : this.customRanges;
    
    return this.buildData(newData,restKeys,this.ranges);
  }

  buildData(data,keys,ranges){
    data.forEach((obj) => {
      keys.forEach((key) => {
        if (!obj[`${key}_traffic`] && !key.includes("traffic")) {
          const value = obj[key];
          const light = this.calcRangeLight(value,ranges);
          obj[`${key}_traffic`] = light;
        }
      });
    });
    return data;
  }

  transformDataClick(datum, fieldFilter) {
    const field = fieldFilter || datum?.field || this.fieldFilter;
    const value = datum.value ?? datum.rawValue ?? datum.id;
    if(this.firstColumn === field){
      const transformed = { field: field, value: value };
      this.filterManager.createRule(field, value, "EQUALS");
      return transformed;
    }
    return [];
  }

  transformChartProps(params) {
    const onClick = !params.isEditionMode
    ? this.getOnClick(null, params.data)
    : undefined;
    const styles = params.chart_setup_styles ?? {};
    this.setCustomRanges(params);
    const baseColumns = params.chartData?.columns ?? [];

    const merged = merge(
        {},
        { ...params.chart.defaultProps },
        { styles: styles },
        { styles: params.liveChartProps },
        onClick ? { onClick } : {},
        { updateLiveChartProps: params.updateLiveChartPropsMethods },
        { panel: params.data },
        { data: params.chartData?.data ?? [] },
        { ranges:this.ranges},
        { columns:baseColumns },
        { evalRules:this.evalRules}
    );

    return merged;
  }
}
