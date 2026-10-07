const formatNumberSpanish = (num, decimals = 0) => {
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  
  // Verificar que sea un número válido
  if (isNaN(numValue)) return "0";
  
  if (decimals > 0) {
    const fixed = numValue.toFixed(decimals);
    const parts = fixed.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const decimalPart = parts[1];
    return `${integerPart},${decimalPart}`;
  } else {
    // Para enteros, no aplicar decimales
    const rounded = Math.round(numValue).toString();
    return rounded.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
};


export const formatNumberWithShortScale = (num, decimals = 0) => {
  if (num === 0) return decimals > 0 ? "0," + "0".repeat(decimals) : "0";
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  
  // Definir las unidades en español (escala corta)
  const units = [
    { value: 1e12, label: "billón", plural: "billones" },
    { value: 1e9, label: "mil millones", plural: "mil millones" },
    { value: 1e6, label: "millón", plural: "millones" },
    { value: 1e3, label: "mil", plural: "mil" },
  ];
  
  // Encontrar la unidad apropiada
  for (const unit of units) {
    if (absNum >= unit.value) {
      const divided = absNum / unit.value;
      let formatted;
      
      if (decimals > 0) {
        // Formatear con decimales usando formato español
        formatted = formatNumberSpanish(divided, decimals);
      } else {
        // Redondear a entero y formatear con separador de miles
        const rounded = Math.round(divided);
        formatted = formatNumberSpanish(rounded, 0);
      }
      
      const roundedValue = parseFloat(formatted.replace(/\./g, '').replace(',', '.'));
      const label = Math.abs(roundedValue) === 1 ? unit.label : unit.plural;
      return `${sign}${formatted} ${label}`;
    }
  }
  
  // Si es menor a mil, retornar el número formateado con decimales en formato español
  if (decimals > 0) {
    return `${sign}${formatNumberSpanish(absNum, decimals)}`;
  }
  return `${sign}${formatNumberSpanish(absNum, 0)}`;
};

export const formatNumber = (value, options = {}) => {
  const { decimalPlaces = 0, shortScale = false } = options;
  
  // Asegurarse de que value sea un número válido
  let numValue;
  if (typeof value === 'string') {
    // Remover puntos y comas que puedan estar formateando el número
    const cleanedValue = value.replace(/\./g, '').replace(',', '.');
    numValue = parseFloat(cleanedValue);
  } else {
    numValue = value;
  }
  
  if (isNaN(numValue)) return "0";
  
  if (shortScale) {
    return formatNumberWithShortScale(numValue, decimalPlaces);
  } else {
    // Formatear con formato español (punto para miles, coma para decimales)
    return formatNumberSpanish(numValue, decimalPlaces);
  }
};

export const nivoNumberFormat = (options = {}) => {
  return (value) =>
    formatNumber(value, {
      shortScale: true,
      decimalPlaces: 0,
      ...options
    });
};
