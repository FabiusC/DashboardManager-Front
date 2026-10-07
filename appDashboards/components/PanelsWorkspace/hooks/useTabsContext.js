import { useContext, useCallback, useMemo } from 'react';
import { TabsContext } from '../context/TabsContext';

export default function useTabsContext() {
  const { state, changeSideTabState, changeSetupTabState , initTabs } =
    useContext(TabsContext);

  const memoizedChangeSideTabState = useCallback(changeSideTabState, [changeSideTabState]);
  const memoizedChangeSetupTabState = useCallback(changeSetupTabState, [changeSetupTabState]);
  const memoizedInitTabs = useCallback(initTabs, [initTabs]);

  const tabsState = useMemo(() => ({
    tabsSideMenu: state.tabsSideMenu,
    tabsSetupMenu: state.tabsSetupMenu,
  }), [state.tabsSideMenu, state.tabsSetupMenu]);

  const tabsActions = useMemo(() => ({
    changeSideTabState: memoizedChangeSideTabState,
    changeSetupTabState: memoizedChangeSetupTabState,
    initTabs: memoizedInitTabs,
  }), [memoizedChangeSideTabState, memoizedChangeSetupTabState, memoizedInitTabs]);

  return {
    ...tabsState,
    ...tabsActions,
  };
}
