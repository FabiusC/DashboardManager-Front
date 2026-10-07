import { useState, useEffect, useRef, useMemo } from "react"
import { Box, Paper } from "@mui/material"
import SideMenu from "../../DashboardTabs"
import CreateDashboard from "../../CreateDashboard"
import { useDispatch } from "react-redux"
import Header from "../shared/components/Header"
import DashboardFilters from "../../DashboardFilters"
import { handleAddDashboard } from "../shared/utils/dashboardActions"
import UnsavedChangesModal from "@components/DashboardsWorkspace/components/Modals/UnsavedChangesModal"
import { normalizePanelResponse, buildChartState } from "../shared/utils/normalization"
import DashboardGrid from "../shared/components/DashboardGrid"
import { useEditorLogic } from "./hooks/useEditorLogic"
import useDashboardTabsContext from "../../../hooks/useDashboardTabsContext"

export default function DashboardEditor({
  dashboard,
  setDashboard,
  panels,
  setPanels,
  layout,
  setLayout,
  user,
  id,
}) {
  const [mounted, setMounted] = useState(false)
  const [isCreateModal, setIsCreateModal] = useState(false)
  const [shouldShowCreateModal, setShouldShowCreateModal] = useState(false)
  const [editionDashboard, setEditionDashboard] = useState(undefined)
  const [editionMode, setEditionMode] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isPreviewCapturing, setIsPreviewCapturing] = useState(false)
  const dispatch = useDispatch()
  const dashboardCaptureRef = useRef(null)

  const editorLogic = useEditorLogic({
    dashboard,
    panels,
    layout,
    setDashboard,
    setPanels,
    setLayout,
    user,
    id,
    previewElementRef: dashboardCaptureRef,
    setPreviewCapturing: setIsPreviewCapturing,
  })

  const { tabsSideMenu, initTabs, changeSideTabState } = useDashboardTabsContext()

  useEffect(() => {
    setMounted(true)
    let sessionProjectId = sessionStorage.getItem('projectId');
    let sessionFolderId = sessionStorage.getItem('folderId');
    let sessionDashboardId = sessionStorage.getItem('resourceId');

    if (id) {
      setIsInitialized(true);
      return;
    }

    if (sessionProjectId && sessionFolderId) {
      if (sessionDashboardId) {
        setEditionMode(true);
        setEditionDashboard(sessionDashboardId);
      }
    }
    setIsInitialized(true);
  }, [id])

  useEffect(() => {
    if (isInitialized && editionDashboard == undefined && !editionMode && !id) {
      setShouldShowCreateModal(true);
    }
  }, [isInitialized, editionDashboard, id, editionMode]);

  useEffect(() => {
    if (shouldShowCreateModal) {
      const timer = setTimeout(() => {
        setIsCreateModal(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldShowCreateModal]);

  // Seed tab *navigation* state only when dashboard.id changes.
  const lastDashboardIdForTabsRef = useRef(undefined);
  const openPanelsAfterCreateRef = useRef(false);

  useEffect(() => {
    const currentDashboardId = dashboard?.id;
    if (lastDashboardIdForTabsRef.current === currentDashboardId) return;
    lastDashboardIdForTabsRef.current = currentDashboardId;

    const currentTabs = editorLogic.sideTabs;
    if (currentTabs?.length) {
      initTabs(
        currentTabs.map(({ component: _component, ...tabMeta }) => tabMeta)
      );
    }

    if (openPanelsAfterCreateRef.current) {
      openPanelsAfterCreateRef.current = false;
      changeSideTabState('settings', 'isActive', false);
      changeSideTabState('panels', 'isActive', true);
    }
    // initTabs y editorLogic.sideTabs omitidos de dependencias a propósito: solo re-ejecutar cuando cambia dashboard.id
  }, [dashboard?.id])

  const tabsForSideMenu = useMemo(() => {
    const liveTabs = editorLogic.sideTabs;
    if (!liveTabs?.length) return tabsSideMenu;

    const stateByName = new Map(
      (tabsSideMenu || []).map((tab) => [tab.name, tab.state])
    );

    return liveTabs.map((liveTab) => ({
      ...liveTab,
      state: stateByName.get(liveTab.name) ?? liveTab.state,
    }));
  }, [editorLogic.sideTabs, tabsSideMenu]);

  const changeTabSideState = (name, key, value) => {
    changeSideTabState(name, key, value);
  };

  const configuration = useMemo(
    () => ({ ...dashboard.configuration, ...dashboard.settingsChanged?.configuration }),
    [dashboard.configuration, dashboard.settingsChanged?.configuration],
  );

  const preparedPanels = useMemo(() => {
    return panels?.map((rawPanel) => {
      const { panelData, chartData } = normalizePanelResponse(rawPanel);
      const chartState = buildChartState(chartData);
      return {
        id: rawPanel.id,
        width: rawPanel.width,
        height: rawPanel.height,
        panelData,
        chartState
      };
    }) || [];
  }, [panels]);

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, height: "calc(100vh)", overflow: "hidden" }}>
        <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, height: "100%" }}>
          <Paper variant="outlined" sx={{ display: "flex", flexDirection: "row", height: "100%", flexGrow: 1 }}>
            <SideMenu
              tabs={tabsForSideMenu}
              changeTabSideState={changeTabSideState}
            />

            <Box sx={{
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
            }}>
              <Header
                dashboard={dashboard}
                isReadOnly={false}
                actions={editorLogic.actions}
                id={id}
              />

              <Box sx={{
                overflowY: "auto",
                height: "100%",
              }}>
                <DashboardFilters position="left" isReadOnly={false} />

                <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  {mounted && (
                    <DashboardGrid
                      layout={layout}
                      panels={preparedPanels}
                      configuration={configuration}
                      isReadOnly={false}
                      onLayoutChange={editorLogic.onLayoutChange}
                      onDropPanel={editorLogic.onDropPanel}
                      onDeletePanel={editorLogic.handleDeletePanel}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
      {mounted && isPreviewCapturing && (dashboard?.id || id) && (
        <Box
          aria-hidden="true"
          sx={{
            position: "fixed",
            top: 0,
            left: "-100000px",
            width: "1920px",
            height: "auto",
            overflow: "visible",
            pointerEvents: "none",
            zIndex: -1,
          }}
        >
          <DashboardGrid
            ref={dashboardCaptureRef}
            previewId={`dashboard-capture-${dashboard?.id || id}`}
            layout={layout}
            panels={preparedPanels}
            configuration={configuration}
            isReadOnly={true}
            captureMode
          />
        </Box>
      )}
      <CreateDashboard
        open={isCreateModal}
        onClose={() => setIsCreateModal(false)}
        user={user[0]}
        onDashboardCreated={() => {
          openPanelsAfterCreateRef.current = true;
        }}
        handleAddDashboard={(dashboardInformation) => {
          handleAddDashboard(
            dashboardInformation,
            setDashboard,
            setLayout,
            setPanels,
            user[0].userID,
            false
          )
        }}
      />
      <UnsavedChangesModal
        {...editorLogic.unsavedModalProps}
      />
    </>
  )
}

