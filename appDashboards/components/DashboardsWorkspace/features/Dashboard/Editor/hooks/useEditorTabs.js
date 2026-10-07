import { useMemo, useCallback } from "react"
import { Addchart, DashboardRounded, LocalOfferRounded, Settings as SettingsIcon } from "@mui/icons-material"
import { DashboardSidebarPanel, PanelLibrary, Settings, Categories } from "../../../DashboardTabs"

/**
 * Configures the side-menu tabs for the dashboard editor.
 *
 * @param {Object} params - Hook parameters
 * @param {Object} params.dashboard - Dashboard object
 * @param {Function} params.setDashboard - Setter to update the dashboard
 * @param {Array} params.user - User info array
 *
 * @returns {Object} Tab configuration
 */
export const useEditorTabs = ({
  dashboard,
  setDashboard,
  user,
  selectDashboard,
}) => {
  // Stabilize setDashboard to avoid unnecessary recreations
  const memoizedSetDashboard = useCallback(setDashboard, [setDashboard])

  // Memoize Settings and skip settingsChanged so editing settings does not remount/close the tab.
  // Depend only on stable dashboard fields.
  const dashboardId = dashboard?.id;
  const dashboardName = dashboard?.name;
  const dashboardDescription = dashboard?.description;
  const dashboardIsPublic = dashboard?.is_public;
  const dashboardIsPublished = dashboard?.is_published;
  const dashboardUseIndex = dashboard?.use_index;
  const dashboardConfigId = dashboard?.configuration?.id;
  const dashboardFunctions = dashboard?.functions;

  const settingsComponent = useMemo(() => {
    const userToken = Array.isArray(user) && user.length > 0 ? user[0]?.userID : null;
    return (
      <Settings
        dashboard={dashboard}
        setDashboard={memoizedSetDashboard}
        userToken={userToken}
      />
    );
  }, [dashboardId, dashboardName, dashboardDescription, dashboardIsPublic, dashboardIsPublished, dashboardUseIndex, dashboardConfigId, dashboardFunctions, memoizedSetDashboard, user, dashboard,
  ])

  const dashboardPanelIds = Array.isArray(dashboard?.panels)
    ? dashboard.panels.map((panel) => panel?.id).filter(Boolean).join(",")
    : "";
  const panelLibraryComponent = useMemo(
    () => (
      <PanelLibrary
        dashboard={dashboard}
      />
    ),
    [dashboardId, dashboardPanelIds, dashboard]
  );

  const categoriesComponent = useMemo(() => {
    const userToken = Array.isArray(user) && user.length > 0 ? user[0]?.userID : null;
    return (
      <Categories
        dashboard={dashboard}
        setDashboard={memoizedSetDashboard}
        userToken={userToken}
      />
    );
  }, [dashboardId, memoizedSetDashboard, user, dashboard]);

  const dashboardsComponent = useMemo(() => {
    const userToken = Array.isArray(user) && user.length > 0 ? user[0]?.userID : null;
    return (
      <DashboardSidebarPanel
        currentDashboard={dashboard}
        userToken={userToken}
        onSelectDashboard={selectDashboard}
      />
    );
  }, [dashboardId, dashboard, selectDashboard, user]);

  // Stable no-op for tab active-state changes
  const changeActiveState = useCallback(() => { }, [])

  // Default side-menu tabs
  const tabs = useMemo(() => [
    {
      name: "panels",
      label: "Paneles",
      changeActiveState: changeActiveState,
      description: "Selector del tipo del panel",
      icon: <Addchart sx={{ fontSize: 22, color: 'primary.main' }} />,
      state: { isLoading: false, isDisabled: false, isActive: false },
      component: panelLibraryComponent,
    },
    {
      name: "dashboards",
      label: "Tableros",
      changeActiveState: changeActiveState,
      description: "Cambiar de tablero",
      expandedWidth: 220,
      icon: <DashboardRounded sx={{ fontSize: 22, color: 'primary.main' }} />,
      state: { isLoading: false, isDisabled: false, isActive: false },
      component: dashboardsComponent,
    },
    {
      name: "categories",
      label: "Etiquetas",
      changeActiveState: changeActiveState,
      description: "Etiquetas del tablero",
      icon: <LocalOfferRounded sx={{ fontSize: 22, color: 'primary.main' }} />,
      state: { isLoading: false, isDisabled: false, isActive: false },
      component: categoriesComponent,
    },
    {
      name: "settings",
      label: "Configuración",
      changeActiveState: changeActiveState,
      description: "Configuración del tablero",
      icon: <SettingsIcon sx={{ fontSize: 22, color: 'primary.main' }}/>,
      state: { isLoading: false, isDisabled: false, isActive: false },
      component: settingsComponent,
    },
  ], [changeActiveState, panelLibraryComponent, dashboardsComponent, categoriesComponent, settingsComponent])

  return {
    tabs,
  }
}
