import { useMemo, useEffect } from "react";
import useTabs from "./useTabsContext";

export default function useTabsLayout() {
  const {
    tabsSideMenu,
    tabsSetupMenu,
    changeSideTabState,
    changeSetupTabState,
  } = useTabs();

  const sideWidth = useMemo(() => {
    const active = tabsSideMenu.filter(t => t.state?.isActive).length;
    const inactive = tabsSideMenu.length - active;
    const baseTabWidth = 45;
    const expandedWidth = 190;
    if (active === 0) return 0;
    return inactive * baseTabWidth + active * expandedWidth;
  }, [tabsSideMenu]);

  const setupWidth = useMemo(
    () => (tabsSetupMenu.some(t => t.state?.isActive) ? 305 : 0),
    [tabsSetupMenu],
  );

  /* ---------- sincronizar efectos secundarios ---------- */
  /* Cuando el side menu está activo, desactiva pestañas de setup */
  useEffect(() => {
    if (sideWidth > 0) {
      changeSetupTabState('setupPanel', 'isActive', false);
      changeSetupTabState('publication', 'isActive', false);
      changeSetupTabState('setupChart', 'isActive', false);
      changeSetupTabState('setupQuery', 'isActive', false);
    }
  }, [sideWidth, changeSetupTabState]);

  /* Cuando algún setup tab está activo, oculta activaciones en el side */
  useEffect(() => {
    if (setupWidth > 0) {
      changeSideTabState('data', 'isActive', false);
      changeSideTabState('setup', 'isActive', false);
      changeSideTabState('publication', 'isActive', false);
    }
  }, [setupWidth, changeSideTabState]);

  return { sideWidth, setupWidth };
}