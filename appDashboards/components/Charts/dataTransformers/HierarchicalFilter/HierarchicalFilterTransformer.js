import Transformer from '../Transformer';
import { generateFieldId } from '@utils/fieldIdUtils';
import merge from "lodash/merge";

/**
 * Transformer para filtros jerárquicos
 * Convierte datos planos con campos jerárquicos a estructura de árbol
 * 
 * La data debe llegar como un array de objetos donde cada campo representa un nivel jerárquico.
 * El orden de los campos en el objeto determina el orden de anidación.
 */
export class HierarchicalFilterTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: 'OR',
      acceptsSubgroups: true,
      allowMultipleRules: true, // Múltiple selección con OR por defecto
      isCoupled: false,
      // uiContext_id: panel_id
    });
  }

  transformData(panel) {
    if (!this.validatePanel(panel)) {
      return { data: [] };
    }

    if (!this.validateRawData(panel)) {
      return { data: [] };
    }

    const rawData = panel?.queryParameters?.rawData || [];
    if (!Array.isArray(rawData) || rawData.length === 0) {
      return { data: [] };
    }


    const selectedFields = panel?.queryParameters?.selected_fields || [];
    let hierarchicalFields = [];

    if (selectedFields.length > 0) {
      hierarchicalFields = selectedFields.map(field => field.name || field);
    } else {
      const sampleEntry = rawData[0];
      if (sampleEntry) {
        hierarchicalFields = Object.keys(sampleEntry)
          .filter(key => key.endsWith('_str') || key.includes('_'))
          .sort();
      }
    }

    if (hierarchicalFields.length === 0) {
      console.warn('HierarchicalFilterTransformer: No se encontraron campos jerárquicos');
      return { data: [] };
    }

    const hierarchicalData = this.buildHierarchicalTree(rawData, hierarchicalFields);

    // Obtener paths de reglas seleccionadas del estado de Redux
    const rulePaths = this.getSelectedFieldsFromStore();

    // Buscar los field IDs en el árbol que corresponden a cada path
    const selectedValues = this.findFieldIdsInTree(hierarchicalData, rulePaths);

    return { 
      data: hierarchicalData,
      selectedValues: selectedValues
    };
  }

  /**
   * Obtiene los valores seleccionados desde el estado de Redux
   * Retorna un array de "cadenas" (paths), donde cada cadena es un array de reglas
   * que pertenecen al mismo grupo acoplado
   */
  getSelectedFieldsFromStore() {
    if (!this.filterManager) {
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

      const rulePaths = []; // Array de arrays de reglas
      
      // Función recursiva para extraer cadenas de reglas de grupos acoplados
      const extractRulesFromGroup = (groupId) => {
        const group = store.groups[groupId];
        if (!group || !group.children || group.children.length === 0) {
          return;
        }

        // Si el grupo es acoplado, extraer todas sus reglas como una cadena
        if (group.isCoupled && group.id !== mainGroupId) {
          const rulesInGroup = [];
          group.children.forEach(childRef => {
            if (childRef.type === 'rule') {
              const rule = store.rules[childRef.id];
              if (rule && rule.field && rule.value != null) {
                rulesInGroup.push({
                  fieldName: rule.field,
                  value: rule.value
                });
              }
            }
          });
          
          if (rulesInGroup.length > 0) {
            rulePaths.push(rulesInGroup);
          }
        } else {
          // Si no es acoplado, procesar cada hijo recursivamente
          group.children.forEach(childRef => {
            if (childRef.type === 'group') {
              extractRulesFromGroup(childRef.id);
            }
          });
        }
      };

      extractRulesFromGroup(mainGroup.id);
      return rulePaths;
    } catch (error) {
      console.warn('Error obteniendo valores seleccionados:', error);
      return [];
    }
  }

  /**
   * Busca en el árbol jerárquico los field IDs que corresponden a los paths de reglas
   * Cada path representa una cadena jerárquica completa (ej: Caldas > Aranzazu)
   */
  findFieldIdsInTree(hierarchicalData, rulePaths) {
    const fieldIds = new Set();
    
    // Para cada path de reglas (grupo acoplado)
    rulePaths.forEach(rulesInPath => {
      // Si solo hay una regla en el path (padre completo seleccionado)
      if (rulesInPath.length === 1) {
        const rule = rulesInPath[0];
        // Buscar el nodo y agregar él + todos sus descendientes
        this.findAndAddNodeWithDescendants(hierarchicalData, rule, fieldIds);
      } else {
        // Si hay múltiples reglas (selección específica con padres)
        // Solo agregar el nodo más específico (el último de la cadena)
        const lastRule = rulesInPath[rulesInPath.length - 1];
        this.findAndAddNode(hierarchicalData, lastRule, fieldIds);
      }
    });
    
    return Array.from(fieldIds);
  }
  
  /**
   * Busca un nodo y agrega su ID + todos sus descendientes
   */
  findAndAddNodeWithDescendants(nodes, rule, fieldIds) {
    for (const node of nodes) {
      if (node.fieldName === rule.fieldName && String(node.value) === String(rule.value)) {
        // Encontrado: agregar este nodo y todos sus descendientes
        this.addNodeAndDescendants(node, fieldIds);
        return true;
      }
      
      if (node.children && node.children.length > 0) {
        if (this.findAndAddNodeWithDescendants(node.children, rule, fieldIds)) {
          return true;
        }
      }
    }
    return false;
  }
  
  /**
   * Busca un nodo y agrega solo su ID (no descendientes)
   */
  findAndAddNode(nodes, rule, fieldIds) {
    for (const node of nodes) {
      if (node.fieldName === rule.fieldName && String(node.value) === String(rule.value)) {
        fieldIds.add(node.field);
        return true;
      }
      
      if (node.children && node.children.length > 0) {
        if (this.findAndAddNode(node.children, rule, fieldIds)) {
          return true;
        }
      }
    }
    return false;
  }
  
  /**
   * Agrega un nodo y todos sus descendientes al Set
   */
  addNodeAndDescendants(node, fieldIds) {
    fieldIds.add(node.field);
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => this.addNodeAndDescendants(child, fieldIds));
    }
  }

  buildHierarchicalTree(flatData, fields, parentPath = '', parentFieldName = null) {
    if (fields.length === 0) {
      return [];
    }

    const [currentField, ...remainingFields] = fields;
    const tree = {};
    const result = [];

    flatData.forEach(item => {
      const fieldValue = item[currentField];
      if (fieldValue == null || fieldValue === '') {
        return; // Saltar valores nulos o vacíos
      }

      const uniqueKey = `${currentField}_${fieldValue}`;
      
      if (!tree[uniqueKey]) {
        const fieldId = generateFieldId(fieldValue, currentField, parentPath);
        const currentPath = parentPath ? `${parentPath}_${fieldId}` : fieldId;
        
        tree[uniqueKey] = {
          field: fieldId,
          value: fieldValue,
          fieldName: currentField, 
          children: [],
          _rawData: [], 
          _currentPath: currentPath, 
          _fieldName: currentField 
        };
      }

      tree[uniqueKey]._rawData.push(item);
    });

    Object.values(tree).forEach(node => {
      if (remainingFields.length > 0) {
        node.children = this.buildHierarchicalTree(
          node._rawData, 
          remainingFields, 
          node._currentPath
        );
      }
      
      delete node._rawData;
      delete node._currentPath;
      delete node._fieldName;
      result.push(node);
    });

    result.sort((a, b) => {
      const valueA = a.value || '';
      const valueB = b.value || '';
      return valueA.localeCompare(valueB, 'es', { sensitivity: 'base' });
    });

    return result;
  }


  transformDataClick(datum, fieldFilter) {
    if (!this.filterManager) {
      console.warn('FilterManager no disponible');
      return [];
    }

    // Primero, limpiar TODOS los filtros del panel
    this.filterManager.clearPanelFilters();

    // Si no hay selecciones, solo limpiamos y terminamos
    if (!datum || (Array.isArray(datum) && datum.length === 0)) {
      return [];
    }

    const selections = Array.isArray(datum) ? datum : [datum];
    const validSelections = selections.filter(sel => sel?.field && sel?.value != null);
    
    // Si no hay selecciones válidas, solo limpiamos y terminamos
    if (validSelections.length === 0) {
      return [];
    }

    // Recrear los filtros con las selecciones actuales
    validSelections.forEach(sel => {
      const rules = [];
      
      // Agregar reglas de los padres primero
      if (sel.parents && Array.isArray(sel.parents) && sel.parents.length > 0) {
        sel.parents.forEach(parent => {
          if (parent?.field && parent?.value != null) {
            rules.push({
              field: parent.field,
              value: parent.value,
              operator: 'EQUALS'
            });
          }
        });
      }
      
      // Agregar la regla del nodo seleccionado
      rules.push({
        field: sel.field,
        value: sel.value,
        operator: 'EQUALS'
      });

      this.filterManager.createRuleGroup({
        parentId: this.filterManager.mainGroupId,
        operator: 'AND',
        acceptsSubgroups: false,
        allowMultipleRules: true,
        isCoupled: true,
        rules: rules
      });
    });

    return validSelections;
  }

transformChartProps(params) {
  const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;

  return merge(
    
    {},
    { ...params.chart.defaultProps },
    {styles: params.chart_setup_styles},
    {styles: params.liveChartProps},
    onClick ? { onClick } : {},
    { updateLiveChartProps: params.updateLiveChartPropsMethods },
    { panel: params.data }
  );
}
}

