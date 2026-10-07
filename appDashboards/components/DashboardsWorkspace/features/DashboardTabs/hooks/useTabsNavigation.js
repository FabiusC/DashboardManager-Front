import { useMemo, useCallback } from 'react';

const BASE_TAB_WIDTH = 45;
const EXPANDED_WIDTH = 220;

/**
 * Hook personalizado para manejar la lógica de navegación de las tabs
 * @param {Array} tabs - Array de tabs del menú
 * @param {Function} changeTabSideState - Función para cambiar el estado de las tabs
 * @returns {Object} Objeto con handlers y valores calculados
 */
export const useTabsNavigation = (tabs, changeTabSideState) => {
  const activeCount = useMemo(() => {
    return tabs.filter((tab) => tab?.state?.isActive).length;
  }, [tabs]);

  const inactiveCount = useMemo(() => {
    return tabs.length - activeCount;
  }, [tabs.length, activeCount]);

  const totalWidth = useMemo(() => {
    return (inactiveCount * BASE_TAB_WIDTH) + (activeCount * EXPANDED_WIDTH);
  }, [inactiveCount, activeCount]);

  const handleClick = useCallback((name, key, value) => {
    const selectedTab = tabs.find((tab) => tab.name === name);
    if (selectedTab) {
      if (!selectedTab.state["isDisabled"]) {
        // Si estamos activando una tab (isActive = true)
        if (key === "isActive" && value === true) {
          // Primero desactivar todas las demás tabs
          tabs.forEach((tab) => {
            if (tab.name !== name && tab.state.isActive) {
              changeTabSideState(tab.name, "isActive", false);
            }
          });
        }
        // Luego cambiar el estado de la tab seleccionada
        changeTabSideState(name, key, value);
      }
    }
  }, [tabs, changeTabSideState]);

  return {
    activeCount,
    inactiveCount,
    totalWidth,
    handleClick,
    baseTabWidth: BASE_TAB_WIDTH,
    expandedWidth: EXPANDED_WIDTH,
  };
};

export default useTabsNavigation;

