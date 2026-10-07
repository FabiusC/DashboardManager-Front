import { useEffect, useState } from 'react';

/**
 * Hook que devuelve un valor debounceado (solo cambia después del delay especificado)
 * @param {*} value Valor que deseas debouncear
 * @param {number} delay Tiempo de espera en milisegundos
 * @returns {*} Valor actualizado después del delay
 */
export default function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Si el valor cambia antes de que termine el delay, se limpia el timeout
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
