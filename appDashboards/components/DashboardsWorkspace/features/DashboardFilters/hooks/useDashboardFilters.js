import { useMemo, useCallback } from 'react';
import { deleteNode, resetFilters } from '@redux/actions';

export const useDashboardFilters = (filtersState, dispatch) => {
  const { groups = {}, rules = {} } = filtersState;

  // Verificar si hay filtros activos (grupos que no sean root y tengan hijos)
  const hasActiveFilters = useMemo(() => {
    return Object.values(groups).some(
      group => group.id !== 'root' && group.children && group.children.length > 0
    );
  }, [groups]);

  // Contar el número total de reglas activas
  const activeRulesCount = useMemo(() => {
    return Object.keys(rules).length;
  }, [rules]);

  // Recursive function to build group structure with nested groups
  const buildGroupStructure = useCallback((groupId, parentOperator = null) => {
    const group = groups[groupId];
    if (!group || !group.children || group.children.length === 0) {
      return null;
    }

    const rulesData = [];
    const childGroups = [];
    
    group.children.forEach(childRef => {
      if (childRef.type === 'rule') {
        const rule = rules[childRef.id];
        if (rule) {
          rulesData.push(rule);
        }
      } else if (childRef.type === 'group') {
        const childGroup = buildGroupStructure(childRef.id, group.operator);
        if (childGroup && (childGroup.rulesData.length > 0 || childGroup.childGroups.length > 0)) {
          childGroups.push(childGroup);
        }
      }
    });

    // Only return group if it has rules or child groups
    if (rulesData.length === 0 && childGroups.length === 0) {
      return null;
    }

    return {
      ...group,
      isMainRoot: group.id === 'root',
      rulesData,
      childGroups,
      parentOperator
    };
  }, [groups, rules]);

  const activeGroups = useMemo(() => {
    // Start from root and build the structure recursively
    const rootStructure = buildGroupStructure('root');
    if (!rootStructure) {
      return [];
    }

    // If root has direct rules, include it
    // Otherwise, return its child groups
    if (rootStructure.rulesData.length > 0 || rootStructure.childGroups.length > 0) {
      // If root has child groups, return them (they represent panel filters)
      // If root has direct rules, return root itself
      if (rootStructure.childGroups.length > 0) {
        return rootStructure.childGroups;
      }
      return [rootStructure];
    }
    
    return [];
  }, [buildGroupStructure]);

  // Get root group operator to determine how groups are combined
  const rootOperator = useMemo(() => {
    const rootGroup = groups['root'];
    return rootGroup?.operator || 'AND';
  }, [groups]);

  const handleDeleteGroup = useCallback((groupId, mainGroupId) => {
    if (groupId === mainGroupId) {
      console.warn('No se puede eliminar el grupo root del panel');
      return;
    }
    dispatch(deleteNode(groupId, true));
  }, [dispatch]);

  const handleDeleteRule = useCallback((ruleId, parentGroupId, isCoupled, mainGroupId) => {
    if (isCoupled && parentGroupId !== mainGroupId) {
      dispatch(deleteNode(parentGroupId, true));
    } else {
      dispatch(deleteNode(ruleId, false));
    }
  }, [dispatch]);

  const handleClearAll = useCallback(() => {
    dispatch(resetFilters());
  }, [dispatch]);

  return {
    activeGroups,
    hasActiveFilters,
    activeRulesCount,
    rootOperator,
    handleDeleteGroup,
    handleDeleteRule,
    handleClearAll
  };
};

export default useDashboardFilters;

