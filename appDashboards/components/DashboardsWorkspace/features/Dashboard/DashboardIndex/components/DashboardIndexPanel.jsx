import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Box, Typography } from "@mui/material";
import { LoadingAssembly } from "@creangel/ifindit-ui";
import { useDashboardIndex } from "../hooks/useDashboardIndex";
import { useDashboardIndexGrouped } from "../hooks/useDashboardIndexGrouped";
import { DASHBOARD_INDEX_VIEW } from "../services/dashboardIndexService";
import DashboardIndexSearch from "./DashboardIndexSearch";
import DashboardIndexTagFilter from "./DashboardIndexTagFilter";
import DashboardIndexViewToggle from "./DashboardIndexViewToggle";
import DashboardIndexList from "./DashboardIndexList";
import DashboardIndexGroupedList from "./DashboardIndexGroupedList";
import DashboardIndexCarousel from "./DashboardIndexCarousel";

const buildDashboardViewerUrl = (dashboardId) => {
  const staticPrefix = process.env.staticPrefix || "";
  return `${window.location.origin}${staticPrefix}/dashboard/${dashboardId}`;
};

const DashboardIndexPanel = ({ open, currentDashboardId, onClose }) => {
  const userToken = useSelector((state) => state.user?.[0]?.userID);
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);
  const [viewMode, setViewMode] = useState(DASHBOARD_INDEX_VIEW.GROUPED);

  const isAllView = viewMode === DASHBOARD_INDEX_VIEW.ALL;

  useEffect(() => {
    if (!open) {
      setDashboardSearch("");
      setSelectedTag(null);
      setViewMode(DASHBOARD_INDEX_VIEW.GROUPED);
    }
  }, [open]);

  const handleViewModeChange = useCallback((nextView) => {
    setDashboardSearch("");
    setSelectedTag(null);
    setViewMode(nextView);
  }, []);

  const {
    setCurrentPage: setAllCurrentPage,
    dashboards,
    pagination: allPagination,
    isLoading: isAllLoading,
    isError: isAllError,
  } = useDashboardIndex(userToken, open && isAllView, dashboardSearch);

  const {
    categories,
    categoryOptions,
    totalDashboards,
    totalCategories,
    pagination: groupedPagination,
    setCurrentPage: setGroupedCurrentPage,
    setCategoryDashboardPage,
    isLoading: isGroupedLoading,
    isError: isGroupedError,
  } = useDashboardIndexGrouped(userToken, open && !isAllView, selectedTag);

  const isLoading = isAllView ? isAllLoading : isGroupedLoading;
  const isError = isAllView ? isAllError : isGroupedError;

  const handleSelectDashboard = useCallback(
    (dashboardId) => {
      if (String(dashboardId) === String(currentDashboardId)) {
        onClose?.();
        return;
      }
      onClose?.();
      window.open(buildDashboardViewerUrl(dashboardId), "_blank", "noopener,noreferrer");
    },
    [currentDashboardId, onClose],
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          px: 3,
          pt: 2.5,
          pb: 2,
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            mb: 2,
          }}
        >
          <Typography
            variant="overline"
            sx={{
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "text.primary",
              fontSize: "0.7rem",
            }}
          >
            ÍNDICE DE TABLEROS
          </Typography>

          {!isLoading && !isError && (
            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
              {isAllView
                ? `${allPagination.totalItems} tableros`
                : `${totalDashboards} tableros · ${totalCategories} etiquetas`}
            </Typography>
          )}
        </Box>

        {isAllView && (
          <Box sx={{ mb: 2 }}>
            <DashboardIndexSearch value={dashboardSearch} onChange={setDashboardSearch} />
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "flex-end" },
            justifyContent: isAllView ? "flex-end" : "space-between",
            gap: 2,
            minWidth: 0,
          }}
        >
          {!isAllView && (
            <DashboardIndexTagFilter
              userToken={userToken}
              panelOpen={open}
              categories={categoryOptions}
              selectedTag={selectedTag}
              onSelectTag={setSelectedTag}
            />
          )}

          <Box
            sx={{
              display: "flex",
              width: { xs: "100%", sm: "auto" },
              maxWidth: "100%",
              minWidth: 0,
            }}
          >
            <DashboardIndexViewToggle value={viewMode} onChange={handleViewModeChange} />
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          overscrollBehavior: "contain",
          px: 2.5,
          py: 1.5,
        }}
      >
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <LoadingAssembly
              state={{
                message: "Cargando índice...",
                borderRadius: false,
                boxShadow: false,
                size: 40,
              }}
            />
          </Box>
        )}

        {isError && (
          <Typography variant="body2" color="error" sx={{ py: 4, textAlign: "center" }}>
            No se pudo cargar el índice de tableros.
          </Typography>
        )}

        {!isLoading && !isError && isAllView && (
          <DashboardIndexList
            dashboards={dashboards}
            currentDashboardId={currentDashboardId}
            onSelectDashboard={handleSelectDashboard}
          />
        )}

        {!isLoading && !isError && !isAllView && (
          <DashboardIndexGroupedList
            categories={categories}
            currentDashboardId={currentDashboardId}
            onSelectDashboard={handleSelectDashboard}
            onDashboardPageChange={setCategoryDashboardPage}
          />
        )}
      </Box>

      {!isLoading && !isError && isAllView && (
        <Box sx={{ flexShrink: 0 }}>
          <DashboardIndexCarousel
            currentPage={allPagination.currentPage}
            totalPages={allPagination.totalPages}
            startItem={allPagination.startItem}
            endItem={allPagination.endItem}
            totalItems={allPagination.totalItems}
            onPageChange={setAllCurrentPage}
            itemLabel="tableros"
          />
        </Box>
      )}

      {!isLoading && !isError && !isAllView && (
        <Box sx={{ flexShrink: 0 }}>
          <DashboardIndexCarousel
            currentPage={groupedPagination.currentPage}
            totalPages={groupedPagination.totalPages}
            startItem={groupedPagination.startItem}
            endItem={groupedPagination.endItem}
            totalItems={groupedPagination.totalItems}
            onPageChange={setGroupedCurrentPage}
            itemLabel="etiquetas"
          />
        </Box>
      )}
    </Box>
  );
};

export default DashboardIndexPanel;
