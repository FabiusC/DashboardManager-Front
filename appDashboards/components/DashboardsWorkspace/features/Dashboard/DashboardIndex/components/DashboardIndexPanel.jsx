import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText, Typography } from "@mui/material";
import { LoadingAssembly } from "@creangel/ifindit-ui";
import { useQueryClient } from "@tanstack/react-query";
import { pushNotification } from "@redux/actions";
import { useDispatch } from "react-redux";
import { handleUpdateDashboardCategories } from "../../shared/utils/dashboardActions";
import CreateDashboard from "../../../CreateDashboard";
import { useDashboardIndex } from "../hooks/useDashboardIndex";
import { useDashboardIndexGrouped } from "../hooks/useDashboardIndexGrouped";
import { DASHBOARD_INDEX_VIEW } from "../services/dashboardIndexService";
import DashboardIndexSearch from "./DashboardIndexSearch";
import DashboardIndexTagFilter from "./DashboardIndexTagFilter";
import DashboardIndexViewToggle from "./DashboardIndexViewToggle";
import DashboardIndexList from "./DashboardIndexList";
import DashboardIndexGroupedList from "./DashboardIndexGroupedList";
import DashboardIndexCarousel from "./DashboardIndexCarousel";
import DashboardCategorySideMenu from "./DashboardCategorySideMenu";

const buildDashboardViewerUrl = (dashboardId) => {
  const staticPrefix = process.env.staticPrefix || "";
  return `${window.location.origin}${staticPrefix}/dashboard/${dashboardId}`;
};

const DashboardIndexPanel = ({ open, currentDashboardId, onClose }) => {
  const userToken = useSelector((state) => state.user?.[0]?.userID);
  const user = useSelector((state) => state.user?.[0]);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState(DASHBOARD_INDEX_VIEW.GROUPED);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [linkingDashboardId, setLinkingDashboardId] = useState(null);

  const isAllView = viewMode === DASHBOARD_INDEX_VIEW.ALL;

  useEffect(() => {
    if (!open) {
      setDashboardSearch("");
      setSelectedTag(null);
      setSelectedCategory(null);
      setViewMode(DASHBOARD_INDEX_VIEW.GROUPED);
    }
  }, [open]);

  const handleViewModeChange = useCallback((nextView) => {
    setDashboardSearch("");
    setSelectedTag(null);
    setSelectedCategory(null);
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
  } = useDashboardIndexGrouped(userToken, open && !isAllView, selectedTag, selectedCategory);

  const {
    setCurrentPage: setLinkableDashboardPage,
    dashboards: linkableDashboards,
    pagination: linkableDashboardPagination,
    isLoading: isLoadingLinkableDashboards,
  } = useDashboardIndex(
    userToken,
    open && !isAllView && isLinkDialogOpen,
    "",
  );

  const isLoading = isAllView ? isAllLoading : isGroupedLoading;
  const isError = isAllView ? isAllError : isGroupedError;

  const linkedDashboardIds = useMemo(
    () => new Set((categories[0]?.dashboards ?? []).map((dashboard) => String(dashboard.id))),
    [categories],
  );

  const availableDashboardsToLink = useMemo(
    () => linkableDashboards.filter((dashboard) => !linkedDashboardIds.has(String(dashboard.id))),
    [linkableDashboards, linkedDashboardIds],
  );

  const createInitialCategories = useMemo(
    () => (selectedCategory ? [selectedCategory.name] : []),
    [selectedCategory?.name],
  );

  const updateGroupedIndex = useCallback((dashboard, category) => {
    if (!dashboard?.id || !category?.id || category.id === "__uncategorized__") return;
    queryClient.setQueryData(["dashboardIndexGrouped", userToken], (previous) => {
      if (!previous) return previous;
      const categories = (previous.categories ?? []).map((item) => {
        if (String(item.id) !== String(category.id)) return item;
        const dashboards = item.dashboards ?? [];
        if (dashboards.some((itemDashboard) => String(itemDashboard.id) === String(dashboard.id))) {
          return item;
        }
        return { ...item, dashboards: [...dashboards, dashboard] };
      });
      return { ...previous, categories };
    });
    queryClient.invalidateQueries({ queryKey: ["dashboardViewerTabs", userToken] });
  }, [queryClient, userToken]);

  const handleLinkDashboard = useCallback(async (dashboard) => {
    if (!selectedCategory?.id || selectedCategory.id === "__uncategorized__" || !dashboard?.id) return;
    setLinkingDashboardId(dashboard.id);
    try {
      await handleUpdateDashboardCategories(
        dashboard.id,
        { category_ids: [selectedCategory.id], category_names: [selectedCategory.name] },
        userToken,
      );
      updateGroupedIndex(dashboard, selectedCategory);
      queryClient.invalidateQueries({ queryKey: ["dashboardIndexGrouped", userToken] });
      setIsLinkDialogOpen(false);
      dispatch(pushNotification({ msg: "Tablero vinculado correctamente.", status: "ok" }));
    } catch (error) {
      dispatch(pushNotification({ msg: error?.message || "No se pudo vincular el tablero.", status: "err" }));
    } finally {
      setLinkingDashboardId(null);
    }
  }, [dispatch, queryClient, selectedCategory, updateGroupedIndex, userToken]);

  const handleCreatedDashboard = useCallback((createdDashboard) => {
    updateGroupedIndex(createdDashboard, selectedCategory);
    queryClient.invalidateQueries({ queryKey: ["dashboardIndexGrouped", userToken] });
    queryClient.invalidateQueries({ queryKey: ["dashboardViewerTabs", userToken] });
    setIsCreateDialogOpen(false);
  }, [queryClient, selectedCategory, updateGroupedIndex, userToken]);

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
        <Box sx={{ display: "flex", minHeight: "100%", alignItems: "stretch" }}>
          {!isAllView && !isLoading && !isError && (
            <DashboardCategorySideMenu
              categories={categoryOptions}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onLinkDashboards={() => setIsLinkDialogOpen(true)}
              onCreateDashboard={() => setIsCreateDialogOpen(true)}
            />
          )}

          <Box sx={{ flex: 1, minWidth: 0 }}>
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
                selectedCategory={selectedCategory}
                currentDashboardId={currentDashboardId}
                onSelectDashboard={handleSelectDashboard}
                onSelectCategory={setSelectedCategory}
                onBackToCategories={() => setSelectedCategory(null)}
                onDashboardPageChange={setCategoryDashboardPage}
              />
            )}
          </Box>
        </Box>
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

      <Dialog
        open={isLinkDialogOpen}
        onClose={() => setIsLinkDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Vincular tablero a {selectedCategory?.name}</DialogTitle>
        <DialogContent dividers>
          {isLoadingLinkableDashboards ? (
            <LoadingAssembly state={{ message: "Cargando tableros...", borderRadius: false, boxShadow: false, size: 36 }} />
          ) : availableDashboardsToLink.length === 0 ? (
            <Typography color="text.secondary">No hay tableros disponibles para vincular.</Typography>
          ) : (
            <List disablePadding>
              {availableDashboardsToLink.map((dashboard) => (
                <ListItem key={dashboard.id} disablePadding>
                  <Checkbox
                    edge="start"
                    checked={linkingDashboardId === dashboard.id}
                    disabled={Boolean(linkingDashboardId)}
                    onChange={() => handleLinkDashboard(dashboard)}
                  />
                  <ListItemText primary={dashboard.name} secondary={dashboard.group_name} />
                </ListItem>
              ))}
            </List>
          )}
          {!isLoadingLinkableDashboards && linkableDashboardPagination.totalPages > 1 && (
            <DashboardIndexCarousel
              currentPage={linkableDashboardPagination.currentPage}
              totalPages={linkableDashboardPagination.totalPages}
              startItem={linkableDashboardPagination.startItem}
              endItem={linkableDashboardPagination.endItem}
              totalItems={linkableDashboardPagination.totalItems}
              onPageChange={setLinkableDashboardPage}
              itemLabel="tableros"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsLinkDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <CreateDashboard
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        user={user}
        initialCategories={createInitialCategories}
        onDashboardCreated={handleCreatedDashboard}
      />
    </Box>
  );
};

export default DashboardIndexPanel;
