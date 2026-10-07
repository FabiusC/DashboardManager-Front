import Transformer from "../Transformer";
import merge from "lodash/merge";

export class FacetTableTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: 'OR',
      acceptsSubgroups: false,
      allowMultipleRules: true,
      isCoupled: false
    });
  }

  transformData(panel) {
    // Validaciones básicas del panel
    if (!this.validatePanel(panel)) {
      return { data: [], columns: [] };
    }

    // Validación de datos raw
    if (!this.validateRawData(panel)) {
      return { data: [], columns: [] };
    }

    // Validación de campos seleccionados
    if (!this.validateSelectedFields(panel)) {
      return { data: [], columns: [] };
    }

    // Validación de distribución de campos
    if (!this.validateQueryFieldsDistribution(panel)) {
      return { data: [], columns: [] };
    }

    // Validación de campos de agregación
    if (!this.validateAggregationFields(panel)) {
      return { data: [], columns: [] };
    }

    // Guardar el campo de filtro para usar en transformDataClick
    const groupByFields = panel?.queryParameters?.query_fields_distribution?.group_by_fields;
    if (groupByFields && groupByFields.length > 0) {
      this.fieldFilter = groupByFields[0].name;
    }

    const data = panel.queryParameters?.rawData || [];
    if (!Array.isArray(data)) return [];
    const translateMetric = (metrica) =>{
      const metricDictionary = {
        'count': 'conteo',
        'sum': 'suma',
        'avg': 'promedio',
        'min': 'mínimo',
        'max': 'máximo'
      }
      return metricDictionary[metrica]
    }
    const aggregationFieldsIds = panel.queryParameters?.query_fields_distribution?.aggregation_fields.map(field => field.id) || [];
    const selectedFields = panel.queryParameters?.selected_fields || [];
    const newColumns = selectedFields.map(field => {
      if (aggregationFieldsIds.includes(field.id)) {
        return {
          accessorKey: `${field.name}__${field.metric}`,
          header: translateMetric(field.metric).toUpperCase(),
          valueFormatter: (value) => {
          return new Intl.NumberFormat('es-ES',{useGrouping: true}).format(value);
      }
        };
      }
      return {
        accessorKey: field.name,
        header: field.alias || field.name,
      };
    });

    // Obtener valores seleccionados desde Redux
    const selectedValues = this.getSelectedValuesFromStore(this.fieldFilter);

    return {
      data: data,
      columns: newColumns,
      selectedValues: selectedValues
    };
  }

  /**
   * Obtiene los valores seleccionados desde Redux para el campo de filtro
   */
  getSelectedValuesFromStore(filterField) {
    if (!filterField || !this.filterManager) {
      return [];
    }

    try {
      const store = this.filterManager._getStore();
      if (!store || !store.groups || !store.rules) {
        return [];
      }

      const mainGroupId = this.filterManager.mainGroupId;
      const mainGroup = store.groups[mainGroupId];

      if (!mainGroup) {
        return [];
      }

      const selectedValues = [];

      // Extraer reglas que coinciden con el campo de filtro
      const extractRules = (groupId) => {
        const group = store.groups[groupId];
        if (!group || !group.children || group.children.length === 0) {
          return;
        }

        group.children.forEach(childRef => {
          if (childRef.type === 'rule') {
            const rule = store.rules[childRef.id];
            if (rule && rule.field === filterField) {
              selectedValues.push(String(rule.value));
            }
          } else if (childRef.type === 'group') {
            extractRules(childRef.id);
          }
        });
      };

      extractRules(mainGroup.id);
      return selectedValues;
    } catch (error) {
      console.warn('Error obteniendo valores seleccionados:', error);
      return [];
    }
  }

  transformDataClick(datum, fieldFilter) {
    if (!this.filterManager) {
      console.warn('FilterManager no disponible');
      return [];
    }

    // Primero, limpiar TODOS los filtros del panel
    this.filterManager.clearPanelFilters();

    // Determinar el campo a usar
    const field = fieldFilter || datum?.field || this.fieldFilter;

    if (!field) {
      return [];
    }

    // Si no hay selecciones, solo limpiamos y terminamos
    if (!datum || (datum.isMultiple && (!datum.values || datum.values.length === 0))) {
      return [];
    }

    // Caso 1: Selecciones múltiples (checkboxes)
    if (datum.isMultiple && Array.isArray(datum.values)) {
      // Recrear cada regla individualmente (no acopladas)
      datum.values.forEach(item => {
        // Extraer el nombre del campo como string
        const itemField = typeof item.field === 'object' ? item.field.field : item.field;
        const itemValue = item.value ?? item.rawValue;

        if (itemField && itemValue != null) {
          this.filterManager._createRule({
            parentId: this.filterManager.mainGroupId,
            field: String(itemField),
            value: String(itemValue),
            operator: 'EQUALS'
          });
        }
      });

      return datum.values.map(item => {
        const itemField = typeof item.field === 'object' ? item.field.field : item.field;
        const itemValue = item.value ?? item.rawValue;
        return {
          field: String(itemField),
          value: String(itemValue)
        };
      }).filter(item => item.field && item.value);
    }

    // Caso 2: Selección simple (click en una fila)
    const value = datum.value ?? datum.rawValue ?? datum.id;
    if (value != null) {
      this.filterManager._createRule({
        parentId: this.filterManager.mainGroupId,
        field: String(field),
        value: String(value),
        operator: 'EQUALS'
      });

      return {
        field: String(field),
        value: String(value)
      };
    }

    return [];
  }

  transformChartProps(params){
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
  
    const styles = params.chart_setup_styles ?? {};    
    const merged = merge(
      {},
      { ...params.chart.defaultProps },
      { styles: styles },
      {styles: params.liveChartProps},
      onClick ? { onClick } : {},
      { updateLiveChartProps: params.updateLiveChartPropsMethods },
      { panel: params.data }
    );
    console.log(params.chartData,"records")

    merged.data= params.chartData?.data?? [];
    merged.columns = params.chartData?.columns ?? [];

    return merged;

  }


}

export class RecordsTableTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: 'AND',
      acceptsSubgroups: false,
      allowMultipleRules: true,
      isCoupled: false
    });
  }

  transformData(panel) {
    if (!this.validatePanel(panel)) {
      return { data: [], columns: [] };
    }

    // Validación de datos raw
    if (!this.validateRawData(panel)) {
      return { data: [], columns: [] };
    }

    // Validación de distribución de campos
    if (!this.validateQueryFieldsDistribution(panel)) {
      return { data: [], columns: [] };
    }

    const data = panel.queryParameters?.rawData || [];
    if (!Array.isArray(data)) return [];

    const showed_fields = panel.queryParameters?.query_fields_distribution?.showed_fields || [];
    if (!Array.isArray(showed_fields) || showed_fields.length === 0) {
      console.warn('RecordsTableTransformer: showed_fields es requerido y debe ser un array no vacío');
      return { data: [], columns: [] };
    }

    const newColumns = showed_fields?.map((field) => {
      return {
        accessorKey: field.name,
        header: field.alias || field.name,
        size: field.size || 150,
      }
    })
    return { data: data, columns: newColumns }
  }

  transformDataClick(datum, fieldFilter) {
    if (!this.filterManager) {
      console.warn('FilterManager no disponible');
      return [];
    }

    // Primero, limpiar TODOS los filtros del panel
    this.filterManager.clearPanelFilters();

    // Determinar el campo a usar
    const field = fieldFilter || datum?.field || this.fieldFilter;

    if (!field) {
      return [];
    }

    // Si no hay datos, solo limpiamos y terminamos
    if (!datum) {
      return [];
    }

    // Selección simple (click en una fila) - solo una selección, no múltiple
    const value = datum.value ?? datum.rawValue ?? datum.id;
    if (value != null) {
      this.filterManager._createRule({
        parentId: this.filterManager.mainGroupId,
        field: String(field),
        value: value,
        operator: 'EQUALS'
      });

      return {
        field: String(field),
        value: String(value)
      };
    }

    return [];
  }

  
transformChartProps(params) {
  const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
  const styles = params.chart_setup_styles ?? {};
  const isActiveFormat = params.liveChartProps?.activeFormat ?? styles?.activeFormat
  const baseColum = params.chartData?.columns ?? []
  const formatColumns = isActiveFormat ? baseColum.map(col =>({
    ...col,
    Cell:({cell}) =>{
      const value = cell.getValue()
      const isNumeric = value != null && value != '' && !isNaN(Number(value))
      if(isNumeric){
        return new Intl.NumberFormat('es-ES',{useGrouping:true}).format(value)
      }
      return value
    }
  })) : baseColum

  const merged = merge(
    {},
    { ...params.chart.defaultProps },
    { styles: styles },
    { styles: params.liveChartProps },
    onClick ? { onClick } : {},
    { updateLiveChartProps: params.updateLiveChartPropsMethods },
    { panel: params.data },
    { data: params.chartData?.data ?? [] },
    { columns: formatColumns }
    );
  return merged;
}
}

export class SearchTableTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: 'AND',
      acceptsSubgroups: false,
      allowMultipleRules: true,
      isCoupled: false
    });
  }

  transformData(panel) {
    if (!this.validatePanel(panel)) {
      return { data: [], columns: [] };
    }

    if (!this.validateQueryFieldsDistribution(panel)) {
      return { data: [], columns: [] };
    }

    const data = panel.queryParameters?.rawData || [];
    const showed_fields = panel.queryParameters?.query_fields_distribution?.showed_fields || [];
    if (!Array.isArray(showed_fields) || showed_fields.length === 0) {
      console.warn('SearchTableTransformer: showed_fields es requerido y debe ser un array no vacío');
      return { data: [], columns: [] };
    }

    const columns = showed_fields.map((field) => ({
      accessorKey: field.name,
      header: field.alias || field.name,
      size: field.size || 150,
    }));

    const searchValue = panel.liveChartProps?.searchValue ?? panel.queryParameters?.searchValue;
    if (searchValue === null || searchValue === undefined || String(searchValue).trim() === "") {
      return { data: [], columns };
    }

    return { data: Array.isArray(data) ? data : [], columns };
  }

  transformDataClick(datum, fieldFilter) {
    if (!this.filterManager) {
      console.warn('FilterManager no disponible');
      return [];
    }

    this.filterManager.clearPanelFilters();

    const field = fieldFilter || datum?.field || this.fieldFilter;
    if (!field || !datum) {
      return [];
    }

    const value = datum.value ?? datum.rawValue ?? datum.id;
    if (value == null) {
      return [];
    }

    this.filterManager._createRule({
      parentId: this.filterManager.mainGroupId,
      field: String(field),
      value,
      operator: 'EQUALS'
    });

    return {
      field: String(field),
      value: String(value)
    };
  }

  transformChartProps(params) {
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
    const styles = params.chart_setup_styles ?? {};
    const isActiveFormat = params.liveChartProps?.activeFormat ?? styles?.activeFormat;
    const baseColumns = params.chartData?.columns ?? [];
    const columns = isActiveFormat ? baseColumns.map(col => ({
      ...col,
      Cell: ({ cell }) => {
        const value = cell.getValue();
        const isNumeric = value != null && value !== '' && !isNaN(Number(value));
        return isNumeric ? new Intl.NumberFormat('es-ES', { useGrouping: true }).format(value) : value;
      }
    })) : baseColumns;
    const selectedFields = params.data?.queryParameters?.selected_fields || [];
    const searchField = selectedFields[0] || null;

    return merge(
      {},
      { ...params.chart.defaultProps },
      { styles },
      { styles: params.liveChartProps },
      onClick ? { onClick } : {},
      { updateLiveChartProps: params.updateLiveChartPropsMethods },
      { panel: params.data },
      { data: params.chartData?.data ?? [] },
      { columns },
      { searchField },
      { searchValue: params.data?.liveChartProps?.searchValue ?? params.data?.queryParameters?.searchValue ?? "" }
    );
  }
}