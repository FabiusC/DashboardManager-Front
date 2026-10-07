import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Box, Paper } from "@mui/material";
import Header from "../shared/components/Header";
import DashboardFilters from "../../DashboardFilters";
import {
  normalizePanelResponse,
  buildChartState,
} from "../shared/utils/normalization";
import DashboardGrid from "../shared/components/DashboardGrid";
import ScrollToTopButton from "./ScrollToTopButton";
import ScheduleReportMUI from "@components/Scheduling/components/createReportModal";
import { useDispatch } from "react-redux";
import { resetReport } from "@components/Scheduling/components/store/scheduleSlice";

export default function DashboardViewer({ dashboard, panels, layout, id }) {
  const [mounted, setMounted] = useState(false);
  //Variables de la creación de reportes programados
  const [scheduleModalIsOpen, setSheduleModalIsOpen] = useState(false);
  const [preFilterReports, setPreFilterReports] = useState({});
  const [preFilterUnlocked, setPreFilterUnlocked] = useState(false);
  const dispatch = useDispatch();

  const filterSelectPanelIds = useMemo(
    () =>
      (panels ?? [])
        .filter((p) => {
          const name = p?.chart_type?.name ?? p?.chartType?.name;
          return name === "filter_select" || name === "filter_select_affected";
        })
        .map((p) => p.id)
        .filter(Boolean),
    [panels],
  );

  const reportPreFilterConfig = useCallback((panelId, config) => {
    if (!panelId) return;
    setPreFilterReports((prev) => {
      const current = prev[panelId];
      if (current?.isActive === config?.isActive && current?.ready === config?.ready) {
        return prev;
      }
      return { ...prev, [panelId]: config };
    });
  }, []);

  useEffect(() => {
    setPreFilterReports({});
    setPreFilterUnlocked(false);
  }, [id]);

  const hasActivePreFilters = useMemo(
    () => Object.values(preFilterReports).some((c) => c?.isActive),
    [preFilterReports],
  );

  const allFilterSelectReported =
    filterSelectPanelIds.length === 0 ||
    filterSelectPanelIds.every((panelId) => preFilterReports[panelId]?.ready === true);

  const dashboardPreFilterBlocked = useMemo(() => {
    if (filterSelectPanelIds.length > 0 && !allFilterSelectReported) {
      return true;
    }
    return hasActivePreFilters && !preFilterUnlocked;
  }, [hasActivePreFilters, preFilterUnlocked, filterSelectPanelIds.length, allFilterSelectReported]);

  const handlePreFilterApplied = useCallback(() => {
    setPreFilterUnlocked(true);
  }, []);

  const handlePreFilterCleared = useCallback(() => {
    setPreFilterUnlocked(false);
  }, []);

  const scrollableBodyRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpenScheduleModal = () => {
    setSheduleModalIsOpen(true);
  };
  const handleCloseScheduleModal = () => {
    dispatch(resetReport());
    setSheduleModalIsOpen(false);
  };

  const configuration = useMemo(
    () => ({ ...dashboard.configuration, ...dashboard.settingsChanged?.configuration }),
    [dashboard.configuration, dashboard.settingsChanged?.configuration],
  );

  const preparedPanels = useMemo(() => {
    return (
      panels?.map((rawPanel) => {
        const { panelData, chartData } = normalizePanelResponse(rawPanel);
        const chartState = buildChartState(chartData);
        return { id: rawPanel.id, width: rawPanel.width, height: rawPanel.height, panelData, chartState };
      }) || []
    );
  }, [panels]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        height: "calc(100vh - 66px)",
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          display: "flex",
          flexDirection: "row",
          height: "100%",
          flexGrow: 1,
        }}
      >
        <Box
          id="dashboard-container"
          sx={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            backgroundColor: configuration?.background_color || "#F5F5F5",
          }}
        >
          <Header
            dashboard={dashboard}
            isReadOnly={true}
            id={id}
            handleOpenScheduleModal={handleOpenScheduleModal}
          />
          <Box
            id="scrollable-body"
            ref={scrollableBodyRef}
            sx={{
              overflowY: "auto",
              height: "100%",
              position: "relative",
            }}
          >
            <ScrollToTopButton scrollRef={scrollableBodyRef} />
            <DashboardFilters position="left" isReadOnly={true} />
            <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {mounted && (
                <DashboardGrid
                  layout={layout}
                  panels={preparedPanels}
                  configuration={configuration}
                  isReadOnly={true}
                  reportPreFilterConfig={reportPreFilterConfig}
                  dashboardPreFilterBlocked={dashboardPreFilterBlocked}
                  onPreFilterApplied={handlePreFilterApplied}
                  onPreFilterCleared={handlePreFilterCleared}
                />
              )}
            </Box>
          </Box>
          <ScheduleReportMUI
            open={scheduleModalIsOpen}
            handleClose={handleCloseScheduleModal}
            panels={panels}
          />
        </Box>
      </Paper>
    </Box>
  );
}
