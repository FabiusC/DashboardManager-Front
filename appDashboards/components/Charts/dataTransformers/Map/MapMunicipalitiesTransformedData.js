import Transformer from '../Transformer';
import municipiosGeoJson from '../../../../public/js/maps/municipalities_colombia.json';
import merge from "lodash/merge";

const calculateRange = (data, fieldName) => {
    const values = data.map(item => parseFloat(item[fieldName])).filter(v => !isNaN(v));
    return {
        min: values.length ? Math.min(...values) : 0,
        max: values.length ? Math.max(...values) : 0,
    };
};

export class MunicipalityTransformedData extends Transformer {
    constructor(panel_id) {
        super(panel_id);
        this.initialize({
            operator_filter: 'AND',
            acceptsSubgroups: false,
            allowMultipleRules: false,
            isCoupled: false
        });
    }
    
    mapData = municipiosGeoJson;
    fieldFilter = '';

    transformData(panel, isEditionMode) {
        if (!this.validatePanel(panel)) return this.emptyResult(panel, isEditionMode);
        if (!this.validateRawData(panel)) return this.emptyResult(panel, isEditionMode);
        
        const raw = panel?.queryParameters?.rawData ?? [];
        const { aggregation_fields = [], group_by_fields = [] } =
            panel?.queryParameters?.query_fields_distribution ?? {};

        if (!raw.length) return this.emptyResult(panel, isEditionMode);

        this.fieldFilter = group_by_fields?.[0]?.name ?? '';

        // -----------------------------------------------------------
        // 1. CREAR MAPA DE DATOS Y DETECTAR DEPARTAMENTOS (OPTIMIZADO)
        // -----------------------------------------------------------
        const dataByMunicipality = {};
        let singleDepartmentCode = null;
        let hasMultipleDepartments = false;
        let firstDeptCode = null;
        
        // Recorrido optimizado: detecta múltiples departamentos mientras crea el mapa
        console.log('----------------------------------------');
        for (const record of raw) {
            const code = String(record[this.fieldFilter] || '');
            if (!code || code.length < 2) continue;
            console.log('code', code);
            dataByMunicipality[code] = record;
            
            // Solo verificar departamentos si aún no hemos detectado múltiples
            if (!hasMultipleDepartments) {
                const deptCode = code.substring(0, 2);
                
                if (firstDeptCode === null) {
                    firstDeptCode = deptCode;
                } else if (firstDeptCode !== deptCode) {
                    // ¡Encontramos un segundo departamento! → Dejar de verificar
                    hasMultipleDepartments = true;
                    singleDepartmentCode = null;
                }
            }
        }
        
        // Si nunca encontramos múltiples departamentos, entonces es solo uno
        if (!hasMultipleDepartments && firstDeptCode !== null) {
            singleDepartmentCode = firstDeptCode;
        }

        console.log('singleDepartmentCode', singleDepartmentCode);
        console.log('hasMultipleDepartments', hasMultipleDepartments);
        console.log('firstDeptCode', firstDeptCode);

        // -----------------------------------------------------------
        // 2. FILTRAR GEOMETRÍAS SEGÚN EL CASO
        // -----------------------------------------------------------
        let featuresToProcess;
        
        if (singleDepartmentCode !== null) {
            // CASO 1: Solo un departamento → Filtrar solo ese departamento
            featuresToProcess = this.mapData.features.filter(
                f => f.properties.DPTO === singleDepartmentCode
            );
        } else {
            // CASO 2: Múltiples departamentos → Mostrar TODOS los municipios
            featuresToProcess = this.mapData.features;
        }

        if (!featuresToProcess.length) return this.emptyResult(panel, isEditionMode);

        // -----------------------------------------------------------
        // 3. CÁLCULO DE RANGO (Con todos los datos)
        // -----------------------------------------------------------
        const firstMetric = aggregation_fields[0];
        const metricKey = `${firstMetric.name}__${firstMetric.metric}`;
        
        const range = calculateRange(raw, metricKey);

        // -----------------------------------------------------------
        // 4. ENRIQUECIMIENTO DE LAS GEOMETRÍAS SELECCIONADAS
        // -----------------------------------------------------------
        const enriched = featuresToProcess.map(poly => {
            const code = String(poly.properties.MPIOS); 
            
            // Búsqueda O(1) en el objeto
            const match = dataByMunicipality[code];

            // Si no hay match, marcar como sin datos
            if (!match) {
                return {
                    ...poly,
                    properties: { 
                        ...poly.properties, 
                        data: undefined, 
                        stats: undefined 
                    },
                };
            }

            // Si hay match, enriquecer con los datos
            const metricValue = match[metricKey];
            const areaKm2 = poly.properties.AREA ? poly.properties.AREA / 1_000_000 : null;

            const stats = {
                name: poly.properties.NOMBRE_MPI,
                population: metricValue,
                populationFormatted: metricValue?.toLocaleString() ?? 'N/A',
                area: areaKm2 ? `${areaKm2.toFixed(2)} km²` : 'N/A',
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
                properties: { 
                    ...poly.properties, 
                    data: { ...match, fieldByFilter: this.fieldFilter }, 
                    stats 
                },
            };
        });

        return { 
            data: enriched, 
            calculatedRange: range, 
            panel, 
            isEditionMode,
            singleDepartment: singleDepartmentCode, // Info para que el componente haga zoom (null si hay múltiples)
            hasMultipleDepartments: hasMultipleDepartments
        };
    }

    transformDataClick(datum) {
        const nodeField = datum?.data?.fieldByFilter ?? this.fieldFilter;
        const transformed = { field: nodeField, value: datum.code };

        this.filterManager.createRule(nodeField, datum.code, "EQUALS");
        return transformed;
    }

    emptyResult(panel, isEditionMode) {
        return { data: [], calculatedRange: { min: 0, max: 0 }, panel, isEditionMode };
    }

    
    transformChartProps(params) {
  
    return merge(
        {},
        { styles: params.chart_setup_styles ?? {} },
        params.liveChartProps,
        { updateLiveChartProps: params.updateLiveChartPropsMethods },
        { panel: params.data },

    );
    }

    transformChartProps(params) {
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
    const chartData = params.chartData ?? {};
  
  return merge(
    
    { styles: params.chart_setup_styles ?? {} },
    { styles: params.liveChartProps},
    onClick ? { onClick } : {},
    { updateLiveChartProps: params.updateLiveChartPropsMethods },
    {
        panel: params.data,
        calculatedRange: chartData.calculatedRange ?? { min: 0, max: 0 },
        singleDepartment: chartData.singleDepartment ?? null,
        hasMultipleDepartments: chartData.hasMultipleDepartments ?? false,
    },

  );
}
}