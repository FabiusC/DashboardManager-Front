// src/components/PanelCanva.jsx
import React, { useEffect, useMemo, useCallback, useRef,useState } from "react";
import { Box, Paper, CircularProgress, Typography, IconButton, Tooltip } from "@mui/material";
import { Responsive as ResponsiveReactGridLayout } from "react-grid-layout";
import PanelItem from "../components/PanelItem";
import { useChartContext } from "../hooks/useChartContext";
import usePanelsWorkspaceActions from "../hooks/usePanelsWorkspaceActions";
import useTabs from "../hooks/useTabsContext";

const PanelCanva = ({
  size,
  panel,
  layouts,
  handleLayoutChange,
  editionMode,
  panelPreviewRef,
  setFieldToCreate,
  user,
}) => {
  const chart = useChartContext();
  const { tabsSetupMenu, changeSetupTabState } = useTabs();

  const {
    /* acciones */
    handleSelectedChartType,
    getFieldsDistribution,
    getQueryFieldsDistribution,
    getChartComponent,
    /* estados */
    isLoadingPanels,
  } = usePanelsWorkspaceActions(user[0].userID, { editionMode });
  
  const [localLoading, setLocalLoading] = useState(true);
  useEffect(() => {
    if (panel.state?.panel?.id) {
      setLocalLoading(false);
    }
  }, [panel.state?.panel?.id]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!chart.state.chartType) return;
    getFieldsDistribution();
  }, [chart.state.chartType]);

  useEffect(() => {
    if (!chart.state.queryParameters?.fields_distribution) return;
    getQueryFieldsDistribution();
  }, [chart.state.queryParameters?.fields_distribution]);

  useEffect(() => {

    if (!chart.state.queryParameters?.query_fields_distribution) return;
    // getDataFromQuery();
  }, [chart.state.queryParameters?.query_fields_distribution, chart.state.queryParameters?.limit, chart.state.queryParameters?.sort_field, chart.state.queryParameters?.sort_direction, chart.state.queryParameters?.sort_criterion]);

  useEffect(() => {

    if (!chart.state.chartTypeId) return;
    getChartComponent();
  }, [chart.state.chartTypeId]);

  /* Same calculated width as main container: from measured size, with max in x */
  const gridWidth = useMemo(() => {
    let widthToUse = 800; // Valor por defecto

    if (size?.width != null && !isNaN(size.width)) {
      widthToUse = Math.floor(size.width);
    }

    const padding = 5;

    const calculatedWidth = Math.max(0, widthToUse - padding);

    const maxScreen = typeof window !== 'undefined' ? window.innerWidth - 20 : 2000;

    return Math.min(calculatedWidth, maxScreen);
  }, [size?.width]);

  const onLayoutChangeStable = useCallback(
    (l, allLayouts) => {
      handleLayoutChange?.(l, allLayouts);
    },
    [handleLayoutChange]
  );

  const handleOpenTab = useCallback(
    (name) => changeSetupTabState?.(name, "isActive", true),
    [changeSetupTabState]
  );

  return (
    <Paper
      variant="outlined"
      id="canvas"
      sx={{
        position: "relative",
        height: "100%",
        borderLeft: "0px solid #e2e8f0",
        borderTop: "0px solid #e2e8f0",
        borderBottom: "0px solid #e2e8f0",
        borderRight: "1px solid #e2e8f0",
        width: "100%",
        maxWidth: gridWidth,
        overflow: "hidden",
        borderRadius: "1px",

        backgroundColor: "#f9fafb",
        backgroundImage:
          "radial-gradient(circle, rgba(148,163,184,0.3) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
        '& .react-resizable-handle': {
          zIndex: 6000,
          pointerEvents: 'auto',
        },
      }}
    >
      {/* Botones del SetupMenu - Posicionados verticalmente en el centro derecho */}
      {editionMode && tabsSetupMenu.length > 0 && (
        <Box
          sx={{
            position: "absolute",
            right: 16,
            top: "40%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column-reverse",
            gap: 1.5,
            zIndex: 1000,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(8px)",
            borderRadius: 2,
            padding: 1,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            border: "1px solid rgba(226, 232, 240, 0.8)",
            boxSizing: "border-box",
          }}
        >
          {tabsSetupMenu.map((action) => {
            const isActive = action?.state?.isActive === true;
            return (
              <Tooltip key={action.name} title={action.description} arrow placement="left">
                <IconButton
                  size="large"
                  className="no-drag"
                  onClick={() => handleOpenTab(action.name)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.3,
                    flexDirection: "column",
                    backgroundColor: isActive
                      ? "primary.main"
                      : "rgba(255, 255, 255, 0.9)",
                    border: isActive
                      ? (theme) => `2px solid ${theme.palette.primary.main}`
                      : "1px solid rgba(226, 232, 240, 0.6)",
                    color: isActive ? "white" : "primary.main",
                    transition: "all 0.2s ease-in-out",
                    boxShadow: isActive
                      ? "0 4px 8px rgba(25, 118, 210, 0.3)"
                      : "none",
                    "&:hover": {
                      backgroundColor: isActive
                        ? "primary.dark"
                        : "primary.main",
                      color: "white",
                      transform: "scale(1.01)",
                      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                    },
                    // "&:active": {
                    //   transform: "scale(0.95)",
                    // },
                    borderRadius: "6px",
                  }}
                >
                  {action.icon}
                  {/* <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: "0.75rem",
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {action.label}
                  </Typography> */}
                </IconButton>
              </Tooltip>
            );
          })}
        </Box>
      )}

      {isLoadingPanels || localLoading ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            width: "100%",
          }}
        >
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Cargando panel...
          </Typography>
        </Box>
      ) : panel.state.panel?.id ? (
        <ResponsiveReactGridLayout
          width={gridWidth}
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 15, md: 8, sm: 6, xs: 6, xxs: 3 }}
          rowHeight={30}
          colWidth={25}
          onLayoutChange={onLayoutChangeStable}
          isDraggable={false}
          isResizable
          compactType={null}
          draggableCancel=".no-drag"
        >
          <div key={panel.state.panel.id}>
            <PanelItem
              key={panel.state.panel.id}
              isEditing={panel.state.panel.id}
              user={user[0]}
              onSelectedChartType={handleSelectedChartType}
              editionMode={editionMode}
              panelPreviewRef={panelPreviewRef}
              setFieldToCreate={setFieldToCreate}
              panel={panel.state}
              chartState={chart.state}
              reloadTrigger={chart.state.reloadChartConfig}
            />
          </div>
        </ResponsiveReactGridLayout>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            width: "100%",
          }}
        >
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No hay panel disponible
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Selecciona un panel para comenzar
          </Typography>
        </Box>
      )}
      {/* </Box> */}
    </Paper>
  );
};

export default PanelCanva;
