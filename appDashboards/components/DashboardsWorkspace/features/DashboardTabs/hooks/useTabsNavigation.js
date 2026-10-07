import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardIndexGrouped } from '../../Dashboard/DashboardIndex/services/dashboardIndexService';
import useDashboardsMetadata from './useDashboardsMetadata';

const BASE_TAB_WIDTH = 45;
const EXPANDED_WIDTH = 220;

/**
 * Hook personalizado para manejar la lógica de navegación de las tabs
 */
export const useTabsNavigation = (tabs, changeTabSideState) => {
  const activeCount = useMemo(() => {
    return tabs.filter((tab) => tab?.state?.isActive).length;
  }, [tabs]);

  const inactiveCount = useMemo(() => {
    return tabs.length - activeCount;
  }, [tabs.length, activeCount]);

  const totalWidth = useMemo(() => {
    const activeWidth = tabs
      .filter((tab) => tab?.state?.isActive)
      .reduce((width, tab) => width + (tab.expandedWidth ?? EXPANDED_WIDTH), 0);

    return (inactiveCount * BASE_TAB_WIDTH) + activeWidth;
  }, [tabs, inactiveCount]);

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

export const useDashboardTabsNavigation = (userToken, dashboard, mode = 'viewer') => {
  const { data, isLoading: isIndexLoading } = useQuery({
    queryKey: ['dashboardViewerTabs', userToken, dashboard?.id],
    queryFn: () => fetchDashboardIndexGrouped(userToken),
    enabled: Boolean(userToken && dashboard),
    staleTime: 60_000,
  });

  const isEditor = mode === 'editor';
  const { data: aclData, isLoading: isAclLoading } = useDashboardsMetadata(userToken, {
    onlyPublished: !isEditor,
  });

  const dashboardMetaMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(aclData)) {
      aclData.forEach((item) => {
        if (item?.id) {
          map.set(String(item.id), item);
        }
      });
    }
    return map;
  }, [aclData]);

  const categories = dashboard?.categories ?? [];

  const categoryKeys = useMemo(() => {
    const keys = new Set();
    categories.forEach((cat) => {
      if (cat.id !== undefined && cat.id !== null) keys.add(String(cat.id));
      if (cat.name) keys.add(String(cat.name).toLowerCase().trim());
    });
    return keys;
  }, [categories]);

  const tabs = useMemo(() => {
    const dashboardsById = new Map();

    const addDashboard = (item) => {
      if (!item || !item.id) return;

      const idStr = String(item.id);
      const meta = dashboardMetaMap.get(idStr);
      
      if (!meta) return;

      if (!dashboardsById.has(idStr)) {
        dashboardsById.set(idStr, {
          id: idStr,
          name: meta.name || item.name || 'Tablero sin nombre',
          ...meta,
        });
      }
    };

    if (mode === 'editor') {
      categories.forEach((category) => {
        const items = category.dashboards || category.items || [];
        items.forEach(addDashboard);
      });
      if (Array.isArray(dashboard?.dashboards)) {
        dashboard.dashboards.forEach(addDashboard);
      }
    }

    const apiCategories = Array.isArray(data?.categories) ? data.categories : [];
    const apiUncategorized = Array.isArray(data?.uncategorized) ? data.uncategorized : [];

    apiCategories.forEach((apiCat) => {
      const catId = apiCat.id !== undefined && apiCat.id !== null ? String(apiCat.id) : null;
      const catName = apiCat.name ? String(apiCat.name).toLowerCase().trim() : null;

      const isMatch = (catId && categoryKeys.has(catId)) || (catName && categoryKeys.has(catName));

      if (isMatch) {
        const items = apiCat.dashboards || apiCat.items || apiCat.resources || [];
        items.forEach(addDashboard);
      }
    });

    const currentDashboardId = String(dashboard?.id || '');
    const isCurrentInUncategorized = apiUncategorized.some(
      (item) => String(item.id) === currentDashboardId
    );

    if (isCurrentInUncategorized) {
      apiUncategorized.forEach(addDashboard);
    }

    if (dashboardsById.size === 0 && dashboard?.id) {
      addDashboard(dashboard);
    }

    return [...dashboardsById.values()];
  }, [data, dashboardMetaMap, categoryKeys, categories, dashboard, mode]);

  return { tabs, isLoading: isIndexLoading || isAclLoading };
};

export default useTabsNavigation;