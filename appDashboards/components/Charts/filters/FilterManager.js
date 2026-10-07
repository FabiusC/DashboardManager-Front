import { addGroup, addRule, deleteNode } from '@redux/actions'; 

export class FilterManager {

  constructor(dispatch, getState, uiContext_id = null , operator = "AND", acceptsSubgroups = true, allowMultipleRules = true, isCoupled = false) {
    this.dispatch = dispatch;
    this.getState = getState;
    this.uiContext_id = uiContext_id;
    this._groupSeq = 0;

    this.mainGroupId = this._createGroup({
        parentId: "root", 
        uiContext_id: this.uiContext_id, 
        operator, 
        acceptsSubgroups, 
        allowMultipleRules, 
        isCoupled 
    });
  }
  _generateRuleId(field, value, operator, parentId) {
    const cleanVal = String(value).replace(/\s+/g, '_');
    return `${parentId}::rule::${field}::${operator}::${cleanVal}`;
  }

  _generateGroupIdFromPath(rulesArray) {
    const sortedRules = [...rulesArray].sort((a, b) => a.field.localeCompare(b.field));
    
    const signature = sortedRules
      .map(r => `${r.field}:${String(r.value).replace(/\s+/g, '_')}`)
      .join('|');
      
    return `${this.uiContext_id}::group::${signature}`;
  }

  _getStore() {
    return this.getState()?.filters || {}; 
  }

  _findGroupByContext(uiContext_id) {
    const store = this._getStore();
    const groups = store?.groups || {};
    return Object.values(groups).find(g => g.uiContext_id === uiContext_id);
  }
  _findGroupById(groupId) {
    const store = this._getStore();
    const groups = store?.groups || {};
    return groups[groupId];
  }

  _createGroup({parentId, operator, acceptsSubgroups, allowMultipleRules, isCoupled, rules = []}) {
    const store = this._getStore();
    
    // Generar ID del grupo basado en las reglas o contexto
    let newGroupId;
    if (rules.length > 0) {
      newGroupId = this._generateGroupIdFromPath(rules);
    } else {
      const seq = this._groupSeq++;
      newGroupId = `${this.uiContext_id}::group::${parentId}::${operator}::${seq}`;
    }
    
    // Verificar si el grupo ya existe
    const existingGroup = store.groups[newGroupId];
    if (existingGroup) {
      return newGroupId;
    }

    if (parentId !== "root") {
      const parentGroup = this._findGroupById(parentId);
      if (!parentGroup) {
        throw new Error(`Parent group not found for context: ${parentId}`);
      }
      if (!parentGroup.acceptsSubgroups) {
        throw new Error(`Parent group does not accept subgroups: ${parentId}`);
      }
    }
    
    this.dispatch(addGroup({
      id: newGroupId,
      parentId: parentId,
      uiContext_id: this.uiContext_id,
      operator: operator,
      children: [],
      acceptsSubgroups: acceptsSubgroups,
      allowMultipleRules: allowMultipleRules,
      isCoupled: isCoupled
    }));
    return newGroupId;
  }

  _createRule({parentId = this.rootGroupId, field, value, operator = "EQUALS"}) {
    const store = this._getStore();
    const parentGroup = store.groups[parentId];
    
    if (!parentGroup) {
      return null;
    }

    // Verificar si ya existe una regla con los mismos valores en este grupo
    const existingRule = parentGroup.children.find(childRef => {
      if (childRef.type !== 'rule') return false;
      const rule = store.rules[childRef.id];
      return rule && 
             rule.field === field && 
             rule.value === value && 
             rule.operator === operator;
    });

    if (existingRule) {
      return existingRule.id;
    }

    // Crear nueva regla
    const ruleId = this._generateRuleId(field, value, operator, parentId);
    
    this.dispatch(addRule({
      id: ruleId,
      parentId: parentId,
      field: field,
      value: value,
      operator: operator
    }));
    return ruleId;
  }

  createSubGroup(parentId, operator, acceptsSubgroups, allowMultipleRules, isCoupled) {
    const newGroupId = this._createGroup({parentId, operator, acceptsSubgroups, allowMultipleRules, isCoupled});
    return newGroupId;
  }

  createSubRule(parentId, field, value, operator = "EQUALS") {
    const group = this._findGroupById(parentId);
    if (!parentId) {
      throw new Error("Parent ID is required");
    }
    
    // Si no permite múltiples reglas y ya tiene una, eliminar la existente
    if (!group.allowMultipleRules && group.children.length > 0) {
      const existingRuleRef = group.children[0];
      if (existingRuleRef.type === 'rule') {
        this.dispatch(deleteNode(existingRuleRef.id, false));
      }
    }
    
    const newRuleId = this._createRule({parentId, field, value, operator});
    return newRuleId;
  }

  createRule(field, value, operator = "EQUALS") {
    
    const group = this._findGroupById(this.mainGroupId);
    
    if (!group) {
      throw new Error(`FilterManager: No se encontró el grupo para el contexto ${this.uiContext_id}`);
    }
    
    if (!group.allowMultipleRules && group.children.length > 0) {
      const existingRuleRef = group.children[0];
      if (existingRuleRef.type === 'rule') {
        this.dispatch(deleteNode(existingRuleRef.id, false));
      }
    }
    
    const newRuleId = this._createRule({parentId: group.id, field, value, operator});
    return newRuleId;
  }

  // BATCH METHODS
  createRuleGroup({parentId, operator, acceptsSubgroups , allowMultipleRules, isCoupled,  rules} , defaultParentId = true) {

    if (defaultParentId) {
      parentId = this.mainGroupId;
    }
    if (!parentId) {
      throw new Error("Parent ID is required");
    }
    
    const newGroupId = this._createGroup({parentId, operator, acceptsSubgroups, allowMultipleRules, isCoupled, rules});
    
    // Si no permite múltiples reglas, solo agregar la primera
    if (!allowMultipleRules && rules.length > 0) {
      this._createRule({parentId: newGroupId, ...rules[0]});
    } else {
      for (const rule of rules) {
        this._createRule({parentId: newGroupId, ...rule});
      }
    }
    return newGroupId;
  }

  upsertFilter(field, value, operator = "EQUALS", contextOverride = null) {
    const contextToUse = contextOverride || this.uiContext_id;
    if (!contextToUse) {
      console.error("Falta el contexto UI para aplicar el filtro.");
      return;
    }

    const store = this._getStore();
    let group = this._findGroupById(contextToUse);
    let groupId;

    // 1. Encontrar o Crear Grupo
    if (!group) {
      groupId = this._createGroup("root", contextToUse);
      group = this._findGroupById(contextToUse);
    } else {
      groupId = group.id;
    }

    // 2. Buscar o Crear Regla
    const existingRuleId = group.children.find(childId => {
       const r = store.rules[childId];
       return r && r.field === field;
    });

    if (existingRuleId) {
      // UPDATE
      this.dispatch(updateRule(existingRuleId, { value, operator }));
    } else {
      // INSERT
      const newRuleId = this._generateRuleId(field, value, operator, groupId);
      this.dispatch(addRule({
        id: newRuleId,
        parentId: groupId,
        field,
        value,
        operator
      }));
    }
  }


  getFilterValue(field) {
    const store = this._getStore();
    const group = this._findGroupByContext(this.uiContext_id);
    
    if (!group) return null;

    const ruleId = group.children.find(childId => store.rules[childId]?.field === field);
    return ruleId ? store.rules[ruleId].value : null;
  }

  getPanelRootGroup() {
    return this._findGroupByContext(this.uiContext_id);
  }

  getNode(id, isGroup) {
    const store = this._getStore();
    if (isGroup) {
      return store.groups ? store.groups[id] : null;
    } else {
      return store.rules ? store.rules[id] : null;
    }
  }

  deleteRule(ruleId) {
    const store = this._getStore();
    const rule = store.rules[ruleId];
    
    if (!rule) {
      console.warn(`FilterManager: Regla ${ruleId} no encontrada`);
      return false;
    }

    const parentGroup = store.groups[rule.parentId];
    if (!parentGroup) {
      console.warn(`FilterManager: Grupo padre ${rule.parentId} no encontrado`);
      return false;
    }

    if (parentGroup.isCoupled && parentGroup.id !== this.mainGroupId) {
      this.dispatch(deleteNode(parentGroup.id, true));
      return true;
    }

    // Si no está acoplado o es el grupo root, solo borrar la regla
    this.dispatch(deleteNode(ruleId, false));
    return true;
  }

  deleteGroup(groupId) {
    if (groupId === this.mainGroupId) {
      console.warn(`FilterManager: No se puede eliminar el grupo root del panel (${groupId})`);
      return false;
    }

    const store = this._getStore();
    const group = store.groups[groupId];
    
    if (!group) {
      console.warn(`FilterManager: Grupo ${groupId} no encontrado`);
      return false;
    }

    // El reducer elimina recursivamente todos los hijos (reglas y subgrupos)
    this.dispatch(deleteNode(groupId, true));
    return true;
  }

  clearAll() {
    const group = this._findGroupByContext(this.uiContext_id);
    if (!group) return;

    // Eliminar solo los hijos, no el grupo root
    if (group.children && group.children.length > 0) {
      group.children.forEach(childRef => {
        if (childRef.type === 'rule') {
          this.dispatch(deleteNode(childRef.id, false));
        } else if (childRef.type === 'group') {
          // Los subgrupos sí se pueden eliminar completamente
          this.dispatch(deleteNode(childRef.id, true));
        }
      });
    }
  }

  /**
   * Limpia todos los filtros de este panel específico
   * Mantiene el mainGroup pero elimina todos sus hijos
   */
  clearPanelFilters() {
    const store = this._getStore();
    const mainGroup = store.groups[this.mainGroupId];
    
    if (!mainGroup || !mainGroup.children || mainGroup.children.length === 0) {
      return;
    }

    // Crear copia del array de children para evitar modificar mientras iteramos
    const childrenToDelete = [...mainGroup.children];

    childrenToDelete.forEach(childRef => {
      if (childRef.type === 'rule') {
        this.dispatch(deleteNode(childRef.id, false));
      } else if (childRef.type === 'group') {
        this.dispatch(deleteNode(childRef.id, true));
      }
    });
  }

}