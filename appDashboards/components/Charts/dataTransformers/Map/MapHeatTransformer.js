import Transformer from '../Transformer';
import colombiaGeoJson from '../../../../public/js/maps/departament_colombia.json';
import merge from "lodash/merge";

const parseFloatClean = (value) => {
    const cleaned = typeof value === 'string' ? value.replace(/,/g, '.') : value;
    return parseFloat(cleaned);
};

const calculateRange = (data, fieldName) => {
    const values = data
        .map(item => parseFloatClean(item[fieldName]))
        .filter(v => !isNaN(v));
    return {
        min: values.length ? Math.min(...values) : 0,
        max: values.length ? Math.max(...values) : 0,
    };
};


export class MapHeatTransformer extends Transformer {
    constructor(panel_id) {
        super(panel_id);
        this.initialize({
            operator_filter: 'AND',
            acceptsSubgroups: false,
            allowMultipleRules: false,
            isCoupled: false
        });
    }

    mapData = colombiaGeoJson;
    fieldFilter = '';

    transformData(panel, isEditionMode) {
        const empty = { data: [], heatData: [], calculatedRange: { min: 0, max: 0 }, panel, isEditionMode };

        if (!this.validatePanel(panel))                   return empty;
        if (!this.validateRawData(panel))                 return empty;
        if (!this.validateQueryFieldsDistribution(panel)) return empty;
        if (!this.validateGroupByFields(panel))           return empty;
        if (!this.validateAggregationFields(panel))       return empty;
        if (!this.mapData?.features?.length)              return empty;

        const selected_fields = panel?.queryParameters?.selected_fields ?? [];
        const raw = panel?.queryParameters?.rawData ?? [];
        const { aggregation_fields = [], group_by_fields = [] } =
            panel?.queryParameters?.query_fields_distribution ?? {};

        if (!raw.length) return empty;

        this.fieldFilter = group_by_fields?.[0]?.name ?? '';

        const latField  = selected_fields[1]?.name ;
        const lonField  = selected_fields[0]?.name;
        const firstMetric = aggregation_fields[0];
        const metricKey   = `${firstMetric.name}__${firstMetric.metric}`;
        const range = calculateRange(raw, metricKey);

        const heatData = raw
            .map(row => {
                const lat = parseFloatClean(row[latField]);
                const lon = parseFloatClean(row[lonField]);
                const intensity = parseFloatClean(row[metricKey]);
                if (isNaN(lat) || isNaN(lon)) return null;

                return { lat, lon, intensity: isNaN(intensity) ? 0.5 : intensity };
            })
            .filter(Boolean);
        

        const enriched = this.mapData.features.map(poly => ({
            ...poly,
            properties: { ...poly.properties, data: undefined, stats: undefined },
        }));

        return { data: enriched, heatData, calculatedRange: range, panel, isEditionMode };
    }

    transformDataClick(datum) {
        const nodeField = datum?.data?.fieldByFilter ?? this.fieldFilter;
        this.filterManager.createRule(nodeField, datum.code, 'EQUALS');
        return { field: nodeField, value: datum.code };
  
    }

   transformChartProps(params) {
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
    const styles =  params.chart_setup_styles ?? {}

  return merge(
    
    {},
    { ...params.chart.defaultProps },
    {styles},
    {styles: params.liveChartProps} ,
    { updateLiveChartProps: params.updateLiveChartPropsMethods },
    onClick ? { onClick } : {},
    { panel: params.data },
    {
      data: params.chartData?.data ?? [],
      heatData: params.chartData?.heatData ?? [],
      calculatedRange: params.chartData?.calculatedRange ?? {},
    }
  );
}

    
}