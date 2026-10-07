import { ADD_GROUP, ADD_RULE, DELETE_NODE, RESET_FILTERS, CLEAN_BROKEN_REFERENCES, SET_SEARCH } from '../actions/types';

const initialState = {
  groups: {
    "root": {
      id: "root",
      operator: "AND",
      children: [],
      parentId: null,
      uiContext_id: "root",
      acceptsSubgroups: true,
      allowMultipleRules: true,
      isCoupled: false
    }
  },
  rules: {},
  search: "", // TODO: Implement search functionality
  // Estado runtime (no persistente) para sincronizar loaders de filtros
  runtime: {
    applyVersion: 0
  }
};

// Función para limpiar referencias rotas en children
const cleanBrokenReferences = (state) => {
  const cleanedGroups = {};

  Object.entries(state.groups).forEach(([groupId, group]) => {
    const validChildren = group.children.filter(childRef => {
      if (childRef.type === 'rule') {
        return state.rules[childRef.id] !== undefined;
      } else if (childRef.type === 'group') {
        return state.groups[childRef.id] !== undefined;
      }
      return false;
    });

    cleanedGroups[groupId] = {
      ...group,
      children: validChildren
    };
  });

  return {
    ...state,
    groups: cleanedGroups
  };
};

// Función auxiliar para eliminar recursivamente un grupo y todos sus hijos
const deleteGroupRecursively = (groupId, groups, rules) => {
  const group = groups[groupId];
  if (!group) return { groups, rules };

  const newGroups = { ...groups };
  const newRules = { ...rules };

  // Eliminar todos los hijos recursivamente
  if (group.children && group.children.length > 0) {
    group.children.forEach(childRef => {
      if (childRef.type === 'rule') {
        // Eliminar regla
        delete newRules[childRef.id];
      } else if (childRef.type === 'group') {
        // Eliminar subgrupo recursivamente
        const result = deleteGroupRecursively(childRef.id, newGroups, newRules);
        Object.assign(newGroups, result.groups);
        Object.assign(newRules, result.rules);
      }
    });
  }

  // Eliminar el grupo
  delete newGroups[groupId];

  return { groups: newGroups, rules: newRules };
};

export default function filterReducer(state = initialState, action) {
  switch (action.type) {

    case ADD_GROUP: {
      const { id, parentId } = action.payload;
      const parentGroup = state.groups[parentId];

      if (!parentGroup) {
        console.error('ADD_GROUP - Grupo padre no encontrado:', parentId);
        return state;
      }

      // Verificar si el grupo ya existe
      if (state.groups[id]) {
        return state;
      }

      // Verificar si ya existe una referencia a este grupo en el padre
      const alreadyInParent = parentGroup.children.some(child => child.id === id);
      if (alreadyInParent) {
        return state;
      }

      const pointer = { type: 'group', id: id };

      return {
        ...state,
        groups: {
          ...state.groups,
          [id]: action.payload,
          [parentId]: {
            ...parentGroup,
            children: [...parentGroup.children, pointer]
          }
        }
      };
    }

    case ADD_RULE: {
      const { id, parentId } = action.payload;
      const parentGroup = state.groups[parentId];

      if (!parentGroup) {
        console.error('ADD_RULE - Grupo padre no encontrado:', parentId);
        return state;
      }

      // Verificar si la regla ya existe
      if (state.rules[id]) {
        return state;
      }

      // Verificar si ya existe una referencia a esta regla en el padre
      const alreadyInParent = parentGroup.children.some(child => child.id === id);
      if (alreadyInParent) {
        return state;
      }

      const pointer = { type: 'rule', id: id };

      return {
        ...state,
        rules: {
          ...state.rules,
          [id]: action.payload
        },
        groups: {
          ...state.groups,
          [parentId]: {
            ...parentGroup,
            children: [...parentGroup.children, pointer]
          }
        },
        runtime: {
          ...state.runtime,
          applyVersion: (state.runtime?.applyVersion || 0) + 1
        }
      };
    }

    case DELETE_NODE: {
      const { id, isGroup } = action.payload;

      if (isGroup) {
        // No permitir eliminar el grupo root global
        if (id === 'root') {
          console.warn('No se puede eliminar el grupo root global');
          return state;
        }

        // Eliminar grupo recursivamente con todos sus hijos
        const group = state.groups[id];
        if (!group) return state;

        const parentId = group.parentId;
        const result = deleteGroupRecursively(id, state.groups, state.rules);

        // Actualizar el padre para eliminar la referencia al grupo eliminado
        if (parentId && result.groups[parentId]) {
          result.groups[parentId] = {
            ...result.groups[parentId],
            children: result.groups[parentId].children.filter(child => child.id !== id)
          };
        }

        return {
          ...state,
          groups: result.groups,
          rules: result.rules,
          runtime: {
            ...state.runtime,
            applyVersion: (state.runtime?.applyVersion || 0) + 1
          }
        };
      } else {
        // Eliminar regla simple
        const rule = state.rules[id];
        if (!rule) return state;

        const parentId = rule.parentId;
        const newRules = { ...state.rules };
        delete newRules[id];

        const newGroups = { ...state.groups };
        if (parentId && newGroups[parentId]) {
          newGroups[parentId] = {
            ...newGroups[parentId],
            children: newGroups[parentId].children.filter(child => child.id !== id)
          };
        }

        return {
          ...state,
          groups: newGroups,
          rules: newRules,
          runtime: {
            ...state.runtime,
            applyVersion: (state.runtime?.applyVersion || 0) + 1
          }
        };
      }
    }

    case RESET_FILTERS: {
      const newGroups = {};
      const mainPanelGroupIds = [];

      Object.values(state.groups).forEach(group => {
        if (group.id === 'root') {
          newGroups[group.id] = {
            ...group,
            children: []
          };
        }
        else if (group.parentId === 'root' && group.uiContext_id && group.uiContext_id !== 'root') {
          newGroups[group.id] = {
            ...group,
            children: []
          };
          mainPanelGroupIds.push(group.id);
        }
      });

      if (newGroups['root']) {
        newGroups['root'].children = mainPanelGroupIds.map(id => ({
          type: 'group',
          id: id
        }));
      }

      const resetState = {
        ...state,
        groups: newGroups,
        rules: {},
        search: "" 
      };

      const cleaned = cleanBrokenReferences(resetState);
      return {
        ...cleaned,
        runtime: {
          ...state.runtime,
          applyVersion: (state.runtime?.applyVersion || 0) + 1
        }
      };
    }

    case CLEAN_BROKEN_REFERENCES: {
      return cleanBrokenReferences(state);
    }

    case SET_SEARCH: {
      return {
        ...state,
        search: action.payload,
        runtime: {
          ...state.runtime,
          applyVersion: (state.runtime?.applyVersion || 0) + 1
        }
      };
    }

    default:
      return state;
  }
}