import Transformer from '../Transformer';
import colombiaGeoJson from '../../../../public/js/maps/departament_colombia.json';
import merge from "lodash/merge";
// ---------- utilidades internas ----------
const calculateRange = (data, fieldName) => {
    const values = data
        .map(item => parseFloat(item[fieldName]))
        .filter(v => !isNaN(v));
    return {
        min: values.length ? Math.min(...values) : 0,
        max: values.length ? Math.max(...values) : 0,
    };
};

export class MapTransformedData extends Transformer {
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
        // Validaciones básicas del panel
        if (!this.validatePanel(panel)) {
            return { data: [], calculatedRange: { min: 0, max: 0 }, panel, isEditionMode };
        }

        // Validación de datos raw
        if (!this.validateRawData(panel)) {
            return { data: [], calculatedRange: { min: 0, max: 0 }, panel, isEditionMode };
        }

        // Validación de distribución de campos
        if (!this.validateQueryFieldsDistribution(panel)) {
            return { data: [], calculatedRange: { min: 0, max: 0 }, panel, isEditionMode };
        }

        // Validación de campos de agrupación
        if (!this.validateGroupByFields(panel)) {
            return { data: [], calculatedRange: { min: 0, max: 0 }, panel, isEditionMode };
        }

        // Validación de campos de agregación
        if (!this.validateAggregationFields(panel)) {
            return { data: [], calculatedRange: { min: 0, max: 0 }, panel, isEditionMode };
        }

        // Validación de datos del mapa
        if (!this.mapData?.features?.length) {
            console.warn('MapTransformedData: mapData no está disponible o no tiene features');
            return { data: [], calculatedRange: { min: 0, max: 0 }, panel, isEditionMode };
        }

        const raw = panel?.queryParameters?.rawData ?? [];
        const { aggregation_fields = [], group_by_fields = [] } =
            panel?.queryParameters?.query_fields_distribution ?? {};

        if (!raw.length || !this.mapData?.features?.length) return [];

        this.fieldFilter = group_by_fields?.[0]?.name ?? '';

        const firstMetric = aggregation_fields[0];
        const metricKey = `${firstMetric.name}__${firstMetric.metric}`;
        const range = calculateRange(raw, metricKey);

        const enriched = this.mapData.features.map(poly => {
            const code = String(poly.properties.DPTO);
            const match = raw.find(d => String(d[this.fieldFilter]) === code);

            if (!match) {
                return {
                    ...poly,
                    properties: { ...poly.properties, data: undefined, stats: undefined },
                };
            }

            const metricValue = match[metricKey];
            const areaKm2 = poly.properties.AREA
                ? poly.properties.AREA / 1_000_000
                : null;

            const stats = {
                name: poly.properties.NOMBRE_DPT,
                population: metricValue,
                populationFormatted: metricValue?.toLocaleString() ?? 'N/A',
                area: areaKm2 ? `${areaKm2.toFixed(2)} km²` : 'N/A',
                density:
                    metricValue && areaKm2
                        ? `${(metricValue / areaKm2).toFixed(2)} hab/km²`
                        : 'N/A',
                aggregationData: aggregation_fields.map(f => {
                    const key = `${f.name}__${f.metric}`;
                    const val = match[key];
                    return {
                        alias: f.alias ?? f.name,
                        value: val !== undefined ? val.toLocaleString() : 'N/A',
                        rawValue: val,
                    };
                }),
            };

            return {
                ...poly,
                properties: { ...poly.properties, data: { ...match, fieldByFilter: this.fieldFilter }, stats },
            };
        });

        return { data: enriched, calculatedRange: range, panel, isEditionMode };
    }

transformDataClick(datum) {
    this.filterManager.clearPanelFilters();
    const nodeField = datum?.data?.fieldByFilter ?? this.fieldFilter;
    const value = datum.code;

    if (!nodeField || value == null) {
        return [];
    }
    this.filterManager.createRule(nodeField, value, "EQUALS");

    return {
        field: String(nodeField),
        value: String(value)
    };
}

transformChartProps(params) {
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;

  return merge(
    { styles: params.chart_setup_styles ?? {} },
    { styles: params.liveChartProps},
    { updateLiveChartProps: params.updateLiveChartPropsMethods },
    onClick ? { onClick } : {},
    { panel: params.panel, 
      calculatedRange: params.chartData.calculatedRange,
      data: params.data           
        }
  );
}
}
