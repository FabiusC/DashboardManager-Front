import { useContext, useCallback, useMemo } from 'react';
import { DashboardTabsContext } from '../context/DashboardTabsContext';

export default function useDashboardTabsContext() {
  const { state, changeSideTabState, initTabs, setDashboardTabs, selectDashboard } = useContext(DashboardTabsContext);

  const memoizedChangeSideTabState = useCallback(changeSideTabState, [changeSideTabState]);
  const memoizedInitTabs = useCallback(initTabs, [initTabs]);
  const memoizedSetDashboardTabs = useCallback(setDashboardTabs, [setDashboardTabs]);
  const memoizedSelectDashboard = useCallback(selectDashboard, [selectDashboard]);

  const tabsState = useMemo(() => ({
    tabsSideMenu: state.tabsSideMenu,
    dashboardTabs: state.dashboardTabs,
    selectedDashboardId: state.selectedDashboardId,
  }), [state.tabsSideMenu, state.dashboardTabs, state.selectedDashboardId]);

  const tabsActions = useMemo(() => ({
    changeSideTabState: memoizedChangeSideTabState,
    initTabs: memoizedInitTabs,
    setDashboardTabs: memoizedSetDashboardTabs,
    selectDashboard: memoizedSelectDashboard,
  }), [memoizedChangeSideTabState, memoizedInitTabs, memoizedSetDashboardTabs, memoizedSelectDashboard]);

  return {
    ...tabsState,
    ...tabsActions,
  };
} 