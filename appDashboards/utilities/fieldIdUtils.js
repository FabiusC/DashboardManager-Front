/**
 * Utilidades para generar y normalizar identificadores de campos
 * Preserva tildes y caracteres acentuados mientras sanitiza valores problemáticos
 */

export const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; 
  }
  return Math.abs(hash).toString(36).substring(0, 8);
};


export const sanitizeFieldValue = (value) => {
  return String(value)
    .replace(/\s+/g, '_')  // Reemplazar espacios con guiones bajos
    .replace(/[^\w\-áéíóúÁÉÍÓÚñÑüÜ]/g, '_')  // Mantener letras, números, guiones y caracteres acentuados
    .replace(/_+/g, '_')  // Reemplazar múltiples guiones bajos con uno solo
    .replace(/^_|_$/g, '');  // Eliminar guiones bajos al inicio y final
};


export const generateFieldId = (value, fieldName = '', parentPath = '', options = {}) => {
  const {
    maxLength = 50,
    hashPrefixLength = 40
  } = options;

  const sanitizedValue = sanitizeFieldValue(value);
  
  // Si hay un parentPath, concatenarlo
  if (parentPath) {
    return `${parentPath}_${sanitizedValue}`;
  }
  
  // Si el valor sanitizado es muy largo, usar hash
  if (sanitizedValue.length > maxLength) {
    const hash = simpleHash(`${fieldName}_${value}`);
    return `${sanitizedValue.substring(0, hashPrefixLength)}_${hash}`;
  }
  
  return sanitizedValue;
};

export const isSameSelectedField = (left, right) => {
  if (left === right) return true;

  const leftFieldId = left?.field_id;
  const rightFieldId = right?.field_id;
  if (leftFieldId != null && rightFieldId != null) {
    return String(leftFieldId) === String(rightFieldId);
  }

  const leftSelectedId = left?.id;
  const rightSelectedId = right?.id;
  if (leftSelectedId != null && rightSelectedId != null) {
    return String(leftSelectedId) === String(rightSelectedId);
  }

  if (leftFieldId != null && rightSelectedId != null) {
    return String(leftFieldId) === String(rightSelectedId);
  }

  if (leftSelectedId != null && rightFieldId != null) {
    return String(leftSelectedId) === String(rightFieldId);
  }

  return Boolean(left?.name && right?.name && left.name === right.name);
};

