import { useContext, useCallback, useMemo } from 'react';
import { DashboardTabsContext } from '../context/DashboardTabsContext';

export default function useDashboardTabsContext() {
  const { state, changeSideTabState, initTabs } = useContext(DashboardTabsContext);

  const memoizedChangeSideTabState = useCallback(changeSideTabState, [changeSideTabState]);
  const memoizedInitTabs = useCallback(initTabs, [initTabs]);

  const tabsState = useMemo(() => ({
    tabsSideMenu: state.tabsSideMenu,
  }), [state.tabsSideMenu]);

  const tabsActions = useMemo(() => ({
    changeSideTabState: memoizedChangeSideTabState,
    initTabs: memoizedInitTabs,
  }), [memoizedChangeSideTabState, memoizedInitTabs]);

  return {
    ...tabsState,
    ...tabsActions,
  };
} 