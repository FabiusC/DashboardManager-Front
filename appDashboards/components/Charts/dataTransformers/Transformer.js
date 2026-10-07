import { FilterManager } from '../filters/FilterManager';

class Transformer {
  fieldFilter = ''
  panel_id = ''
  is_multiple_filters = false
  operator_filter = 'AND'
  filterManager = null
  dispatch = null
  getState = null
  
  constructor(panel_id) {
    // panel_id debe ser enviado siempre
    if (!panel_id) {
      throw new Error("panel_id es requerido en el constructor de Transformer");
    }
    this.panel_id = panel_id;
    
    if (this.constructor === Transformer) {
      throw new Error("Transformer es una clase abstracta y no puede ser instanciada directamente.");
    }

    if (this.transformData === Transformer.prototype.transformData) {
      throw new Error("La subclase debe implementar transformData()");
    }

    if (this.transformDataClick === Transformer.prototype.transformDataClick) {
      throw new Error("La subclase debe implementar transformDataClick()");
    }
  }

  initialize({
    operator_filter = 'AND',
    acceptsSubgroups = false,
    allowMultipleRules = true,
    isCoupled = false
  }) {
    this.operator_filter = operator_filter;
    this.acceptsSubgroups = acceptsSubgroups;
    this.allowMultipleRules = allowMultipleRules;
    this.isCoupled = isCoupled;
  }

  // Método para inicializar el FilterManager con dispatch y getState
  initializeFilterManager(dispatch, getState) {
    this.dispatch = dispatch;
    this.getState = getState;
    
    // Crear instancia de FilterManager con los parámetros del transformer
    this.filterManager = new FilterManager(
      dispatch,
      getState,
      this.panel_id,
      this.operator_filter,
      this.acceptsSubgroups,
      this.allowMultipleRules,
      this.isCoupled
    );
  }

  // Validación básica de datos
  validateData(data) {
    return (Array.isArray(data) && data.length > 0);
  }

  // Validación de panel completo
  validatePanel(panel) {
    if (!panel) {
      console.warn('Transformer: Panel es null o undefined');
      return false;
    }

    if (!panel.queryParameters) {
      console.warn('Transformer: queryParameters es requerido en el panel');
      return false;
    }

    return true;
  }

  // Validación de datos raw
  validateRawData(panel) {
    const rawData = panel?.queryParameters?.rawData;
    if (!this.validateData(rawData)) {
      console.warn('Transformer: rawData es inválido o está vacío' , panel);
      return false;
    }
    return true;
  }

  // Validación de campos seleccionados
  validateSelectedFields(panel) {
    const selectedFields = panel?.queryParameters?.selected_fields;
    if (!Array.isArray(selectedFields) || selectedFields.length === 0) {
      console.warn('Transformer: selected_fields es requerido y debe ser un array no vacío');
      return false;
    }
    return true;
  }

  // Validación de distribución de campos
  validateQueryFieldsDistribution(panel) {
    const queryFieldsDistribution = panel?.queryParameters?.query_fields_distribution;
    if (!queryFieldsDistribution) {
      console.warn('Transformer: query_fields_distribution es requerido');
      return false;
    }
    return true;
  }

  // Validación de campos de agrupación
  validateGroupByFields(panel) {
    const groupByFields = panel?.queryParameters?.query_fields_distribution?.group_by_fields;
    if (!Array.isArray(groupByFields) || groupByFields.length === 0) {
      console.warn('Transformer: group_by_fields es requerido y debe ser un array no vacío');
      return false;
    }
    return true;
  }

  // Validación de campos de agregación
  validateAggregationFields(panel) {
    const aggregationFields = panel?.queryParameters?.query_fields_distribution?.aggregation_fields;
    if (!Array.isArray(aggregationFields) || aggregationFields.length === 0) {
      console.warn('Transformer: aggregation_fields es requerido y debe ser un array no vacío');
      return false;
    }
    return true;
  }

  transformData() {
    throw new Error("transformData() debe implementarse en la subclase");
  }

  transformDataClick(datum) {
    throw new Error("transformDataClick() debe implementarse en la subclase");
  }

  getOnClick(callback , data) {
    return (datum, event) => {
      event?.stopPropagation?.();
      const transformed = this.transformDataClick(datum , this.fieldFilter);
      if (transformed == null) return;

      // Enviar metadatos del panel y config de filtros
      const withMeta = (item) => ({
        ...item,
        id_panel: this.panel_id,
        panel_operator: this.operator_filter,
        action: item?.action || datum?.action || 'add' // permitir indicar si es add/remove desde el transformer o datum
      });

      if (Array.isArray(transformed)) {
        transformed.forEach(item => callback?.(withMeta(item)));
        return;
      }

      callback?.(withMeta(transformed));
    };
  }


  transformChartProps(params){
    throw new Error("TransformChartProps() debe implementarse en la subclase");
  }

}
export default Transformer