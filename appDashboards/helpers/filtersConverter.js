/**
 * Transforma el estado normalizado de Redux al formato anidado de la API.
 * @param {Object} state - El objeto completo { groups: {...}, rules: {...} }
 * @param {string} rootId - El ID del grupo raíz (por defecto "root")
 * @returns {Object|null} El payload JSON listo para la API.
 */
export const convertStateToApiPayload = (state, rootId = "root") => {
  console.log('🔄 convertStateToApiPayload - Estado recibido:', state);
  
  // Validar que el estado tenga la estructura correcta
  if (!state || !state.groups || !state.rules) {
    console.log('⚠️ Estado de filtros vacío o inválido');
    return { operator: "AND", conditions: [] };
  }

  const { groups, rules } = state;
  console.log('📊 Grupos:', Object.keys(groups).length, 'Reglas:', Object.keys(rules).length);

  // Función recursiva interna
  const processNode = (groupId) => {
    const group = groups[groupId];
    if (!group) return null;

    // 1. Mapeamos los hijos del grupo
    const conditions = group.children
      .map(childPointer => {
        
        // CASO A: Es una REGLA
        if (childPointer.type === 'rule') {
          const rule = rules[childPointer.id];
          if (!rule) return null; // Protección contra reglas huérfanas

          return {
            operator: rule.operator,
            field: rule.field,
            value: rule.operator === 'BETWEEN' ? rule.value : rule.value.toString(),
          };
        }

        // CASO B: Es un SUBGRUPO (Recursividad)
        if (childPointer.type === 'group') {
          return processNode(childPointer.id);
        }

        return null;
      })
      // 2. Limpieza: Filtramos nulos (grupos vacíos o errores)
      .filter(item => item !== null);

    // 3. Optimización: Si un subgrupo (que no sea root) queda vacío, lo ignoramos.
    // Esto evita enviar { operator: "OR", conditions: [] } que suele romper APIs.
    if (conditions.length === 0 && groupId !== rootId) {
      return null; 
    }

    // 4. Retornamos la estructura de Grupo
    return {
      operator: group.operator,
      conditions: conditions
    };
  };

  // Iniciamos el proceso desde la raíz
  const result = processNode(rootId);
  
  console.log('✅ Resultado de conversión:', JSON.stringify(result, null, 2));
  
  // Si el resultado es null (grupo root vacío), retornar estructura vacía válida
  return result || { operator: "AND", conditions: [] };
};

