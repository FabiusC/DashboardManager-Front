import Transformer from '../Transformer'
import merge from "lodash/merge";

export class TreeMapTransformedData extends Transformer {
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
    // Validaciones básicas del panel
    if (!this.validatePanel(panel)) {
      return {
        data: {
          name: "data",
          children: []
        }
      };
    }

    // Validación de datos raw
    if (!this.validateRawData(panel)) {
      return {
        data: {
          name: "data",
          children: []
        }
      };
    }

    // Validación de distribución de campos
    if (!this.validateQueryFieldsDistribution(panel)) {
      return {
        data: {
          name: "data",
          children: []
        }
      };
    }

    // Validación de campos de agrupación
    if (!this.validateGroupByFields(panel)) {
      return {
        data: {
          name: "data",
          children: []
        }
      };
    }

    // Validación de campos de agregación
    if (!this.validateAggregationFields(panel)) {
      return {
        data: {
          name: "data",
          children: []
        }
      };
    }

    // Inferir el campo de filtro a partir de los datos:
    // Tomamos los group_by_fields y elegimos el último que realmente existe en el rawData
    const rawData = panel?.queryParameters?.rawData || [];
    const groupByFields = panel?.queryParameters?.query_fields_distribution?.group_by_fields || [];
    const aggregationFields = panel?.queryParameters?.query_fields_distribution?.aggregation_fields || [];

    const groupFieldNames = (Array.isArray(groupByFields) ? groupByFields : [])
      .map(f => (typeof f === 'string' ? f : f?.name))
      .filter(Boolean);

    const fieldExistsInData = (name) =>
      Array.isArray(rawData) && rawData.some(row => Object.prototype.hasOwnProperty.call(row ?? {}, name));

    const inferredField = [...groupFieldNames].reverse().find(fieldExistsInData) || groupFieldNames[groupFieldNames.length - 1] || '';
    this.fieldFilter = inferredField;
    this.groupFieldNames = groupFieldNames;

    if (!Array.isArray(rawData) || rawData.length === 0) {
      return {
        name: "data",
        children: []
      };
    }

    const aggField = aggregationFields[0];
    const aggKey = `${aggField.name}__${aggField.metric}`;
    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const inferredFieldLocal = this.fieldFilter;
    function buildTree(data, groupFields) {
      if (!Array.isArray(groupFields) || groupFields.length === 0) {
        return data.map(item => ({
          name: item?.[inferredFieldLocal] ?? "(Sin Valor)",
          value: Number(item?.[aggKey]) || 0,
          fieldByFilter: inferredFieldLocal,
        }));
      }

    const [currentField, ...restFields] = groupFields;
    const fieldName = typeof currentField === 'string' ? currentField : currentField?.name;

    const groups = {};
    data.forEach(item => {
      const key = item?.[fieldName] ?? '(Sin valor)';
      (groups[key] ||= []).push(item);
    });

    return Object.entries(groups).map(([key, items]) => {
      const totalValue = items.reduce((sum, i) => sum + (Number(i?.[aggKey]) || 0), 0);

      // ✅ Si no hay más niveles: nodo hoja directo SIN children
      if (restFields.length === 0) {
        return {
          name: key,
          value: totalValue,
          fieldByFilter: fieldName,
        };
      }

      // Nodo intermedio con children
      return {
        name: key,
        fieldByFilter: fieldName,
        children: buildTree(items, restFields),
      };
    });
}
    return {
      data: {
        name: "data",
        fieldByFilter: this.fieldFilter,
        children: buildTree(rawData, groupByFields)
      },
    };
  }

  transformDataClick(datum, fieldFilter) {
    // Construir cadena recorriendo jerarquía via parent para mantener correspondencia exacta campo-valor
    const chainRaw = [];
    let node = datum;
    while (node && node.id !== 'data') {
      const fieldName = node?.data?.fieldByFilter ?? fieldFilter ?? this.fieldFilter;
      const valueRaw = node?.data?.name ?? node?.id;
      const value = valueRaw != null ? String(valueRaw) : undefined;
      const isMissing = value === '(Sin valor)' || value === '' || value == null;
      if (fieldName && !isMissing) {
        chainRaw.push({ field: fieldName, value });
      }
      node = node?.parent;
    }
    
    if (chainRaw.length > 0) {
      // raíz -> hoja preservando la relación exacta
      const reversed = chainRaw.reverse();
      
      // Crear la regla solo con el último nivel (el más específico)
      const lastItem = reversed[reversed.length - 1];
      this.filterManager.createRule(lastItem.field, lastItem.value, "EQUALS");
      
      return reversed;
    }
    
    // Fallback a un único filtro
    const nodeField = datum?.data?.fieldByFilter ?? fieldFilter ?? this.fieldFilter;
    if (datum?.id == "data") return null;
    
    const transformed = { field: nodeField, value: String(datum?.id ?? '') };
    this.filterManager.createRule(nodeField, String(datum?.id ?? ''), "EQUALS");
    return transformed;
  }

  
  transformChartProps(params) {
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
    const tooltip = ({ node }) => {
    if (!node) return null;

    const label = node.id ?? node.data?.name ?? '';
    const rawValue = node.value ?? node.data?.value ?? 0;
    const formattedValue = new Intl.NumberFormat('es-ES', { useGrouping: true }).format(rawValue);

    return (
      <div style={{
        background: 'white',
        padding: '9px 12px',
        borderRadius: '4px',
        fontSize: '11px',
        fontFamily: 'sans-serif',
      }}>
        <div><strong>{label}</strong>: {formattedValue}</div>
      </div>
    );
  };
  
    return {
    ...merge(
      {},
      { ...params.chart.defaultProps },
      params.chart_setup_styles ?? {},
      params.liveChartProps,
      onClick ? { onClick } : {},
      { updateLiveChartProps: params.updateLiveChartPropsMethods },
      { panel: params.chartData },
    ),
    identity: "name",
    value: "value",
    label: (node) => node.id,
    tooltip
    };
}
}

