const processValue = (config) => {
  if (!config?.value_type) return config;
  
  const { value_type, value } = config;
  
  switch (value_type) {
    case 'integer':
      return parseInt(value);
    case 'boolean':
      return value === 'true' || value === true;
    case 'color_hex':
    case 'color_rgba':
    case 'string':
    case 'box_shadow':
    case 'list_text':
      if (value_type === 'list_text') {
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      }
      return value;
    default:
      return value;
  }
};

// Función para convertir a formato MUI (camelCase)
const toMuiFormat = (str) => {
  return str
    .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase()) // Convertir snake_case a camelCase
    .replace(/-([a-z])/g, (match, letter) => letter.toUpperCase()) // Convertir kebab-case a camelCase
    .replace(/^[A-Z]/, (match) => match.toLowerCase()); // Primera letra en minúscula
};

const processConfig = (config) => {
  if (!config || typeof config !== 'object') return config;
  
  const processed = {};
  
  for (const [key, value] of Object.entries(config)) {
    if (key === 'multiple_parents' || key === 'is_active' || key === 'is_enabled' || key === 'is_parent') {
      continue; // No incluir estas propiedades en el resultado
    }

    const isActive = value?.is_active !== false; 
    const isVisible = value?.is_visible !== false; 
    
    if (!isActive || !isVisible) {
      continue;
    }

    // Convertir el nombre de la propiedad a formato MUI
    const muiKey = toMuiFormat(key);

    if (value?.value_type) {
      if (value.is_parent === true) {
        // Si es padre, procesar recursivamente los hijos
        const nestedProcessed = processConfig(value);
        
        // Solo agregar si hay propiedades procesadas
        if (Object.keys(nestedProcessed).length > 0) {
          processed[muiKey] = nestedProcessed;
        }
      } else {
        // Si no es padre, procesar normalmente
        processed[muiKey] = processValue(value);
      }
    } 
    else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const processedNested = processConfig(value);
      // Solo agregar si el objeto anidado tiene propiedades procesadas
      if (Object.keys(processedNested).length > 0) {
        processed[muiKey] = processedNested;
      }
    } 
    else {
      processed[muiKey] = value;
    }
  }
  
  return processed;
};

export default processConfig;