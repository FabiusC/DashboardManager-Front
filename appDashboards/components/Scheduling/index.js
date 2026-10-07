"use client";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/router";
import { connect, useDispatch } from "react-redux";
import {
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import {
  CalendarMonth,
  Edit,
  Visibility,
  DeleteOutlineRounded,
  Person,
  Group,
  LockRounded,
  ChevronRight,
  ChevronLeft,
  DeleteOutline,
  Launch,
  DashboardRounded,
} from "@mui/icons-material";
import ExplorerView from "@components/Base/ExplorerView";
import { useExplorerConfig } from "@components/Base/ExplorerView/useExplorerConfig";
import {
  ensureItemsHaveColors,
  ensureItemsHaveTags,
} from "@components/Base/ExplorerView/explorerUtils";
import DetailsSidebar from "@components/Base/DetailsSidebar";
import {
  getScheduleReportsList,
  deleteScheduleMutation,
  useUsersMetadata,
  useGroupsMetadata,
  useDashboardData,
} from "@components/PanelsWorkspace/hooks/useScheduleData";
import SchedulingBreadcrumb from "./components/SchedulingBreadcrumb";
import RestoreModal from "@components/Project/Trash/components/RestoreModal";
import useDebounce from "hooks/useDebounce";
import moment from "moment";
import "moment/locale/es";
import { pushNotification } from "@redux/actions";
import ErrorComponent from "@components/Base/Error";
moment.locale("es");

function Reports(props) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [schedules, setSchedules] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [totalSchedules, setTotalSchedules] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const debouncedSearchValue = useDebounce(searchValue, 500);
  const isInitialLoad = useRef(true);
  const resourcesRef = useRef([]);
  const prevUserIdRef = useRef(null);
  const { getExplorerConfig, getTableColumns, getTableRows } =
    useExplorerConfig("resource", {
      icon: CalendarMonth,
    });
  const userId = props.user?.[0]?.userID;
  const columns = getTableColumns([]);
  const userIdRef = useRef(userId);
  const explorerConfig = getExplorerConfig({
    menu: {
      title: "Mis reportes",
      buttonLabel: "Nuevo",
      showButton: false,
      showOptions: false,
      showTitle: false,
    },
    viewMode: {
      defaultValue: sessionStorage.getItem("viewMode") || "large-icons",
      persist: true,
    },
    sort: {
      defaultField: "name",
      defaultDirection: "asc",
    },
    show: {
      search: true,
      viewMode: true,
      sort: true,
    },
    cards: {
      icon: CalendarMonth,
      showContextMenu: true,
      contextMenuItems: [
        { id: "delete", label: "Eliminar", icon: <DeleteOutline /> },
      ],
    },
    emptyState: {
      title: "No existen reportes programados",
      description:
        "Los reportes programados aparecerán aquí cuando se empiecen a crear.",
    },
    titleConfig: {
      title: "Reportes programados",
      description: "",
      icon: <CalendarMonth sx={{ color: "primary.main" }} />,
    },
  });

  const handleGetScheduleList = useCallback(
    async (showLoading = false, append = false) => {
      const currentUserId = userIdRef.current;
      if (!currentUserId) return;
      if (showLoading && !append) setIsLoadingList(true);
      else if (append) setIsLoadingMore(true);

      const currentOffset = append ? resourcesRef.current.length : 0;
      const limit = 500;

      const { results, count, error } = await getScheduleReportsList({
        limit,
        offset: currentOffset,
        order_by: sortDirection,
        order_field: sortField,
        field_str_search: ["name"],
        field_str_q: debouncedSearchValue,
        filters: [
          {
            field: "creator_user_id",
            value: currentUserId,
          },
        ],
      });

      if (error) {
        if (!append) {
          setSchedules([]);
          resourcesRef.current = [];
          setTotalSchedules(0);
        }
        setHasMore(false);
        setIsLoadingList(false);
        setIsLoadingMore(false);
        return;
      }

      const newSchedules = append
        ? [...resourcesRef.current, ...results]
        : results;
      resourcesRef.current = newSchedules;
      setSchedules(newSchedules);
      setTotalSchedules(count);
      setHasMore(results.length === limit && currentOffset + limit < count);
      setIsLoadingList(false);
      setIsLoadingMore(false);
    },
    [debouncedSearchValue, sortField, sortDirection],
  );
  const handleSearch = useCallback((value) => setSearchValue(value), []);
  const handleSortChange = useCallback((sort) => {
    setSortField(sort.field);
    setSortDirection(sort.direction);
  }, []);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);
  useEffect(() => {
    if (!userId) return;
    if (prevUserIdRef.current === userId) return;
    prevUserIdRef.current = userId;
    handleGetScheduleList(true);
    setTimeout(() => {
      isInitialLoad.current = false;
    }, 0);
  }, [userId]);

  useEffect(() => {
    if (isInitialLoad.current || !userId) return;
    handleGetScheduleList(true);
  }, [debouncedSearchValue, sortField, sortDirection]);

  const usersPayload = selectedSchedule
    ? {
        user_ids: [
          selectedSchedule.creator_user_id,
          selectedSchedule.last_editor_user_id,
        ],
      }
    : null;

  const { data: metadataUsers = [], isLoading: isLoadingUsers } =
    useUsersMetadata(usersPayload, Boolean(selectedSchedule), {
      Authorization: `Bearer ${userId}`,
    });
  const { data: dataDashboard = [], isLoading: isLoadingDataDashboard } =
    useDashboardData(selectedSchedule?.dashboard_id);
  const groupsPayload = useMemo(
    () =>
      selectedSchedule ? { group_ids: [selectedSchedule.group_id] } : null,
    [selectedSchedule?.group_id],
  );

  const { data: metadataGroups = [], isLoading: isLoadingGroups } =
    useGroupsMetadata(groupsPayload, Boolean(selectedSchedule), {
      Authorization: `Bearer ${userId}`,
    });

  const schedulesWithColors = useMemo(() => {
    const withColors = ensureItemsHaveColors(schedules);
    const withTags = ensureItemsHaveTags(withColors, "resource");
    return withTags.map((item) => ({
      ...item,
      icon: <CalendarMonth sx={{ color: item.color || "#7F77DD" }} />,
    }));
  }, [schedules]);

  const { mutate: deleteSchedule, isLoading: isLoadingDelete } =
    deleteScheduleMutation(selectedSchedule?.id);

  const handleDeleteSchedule = useCallback(() => {
    deleteSchedule(undefined, {
      onSuccess: () => {
        (handleGetScheduleList(true),
          setIsDeleteModal(false),
          dispatch(
            pushNotification({
              msg: "Reporte programado eliminado con exito",
              status: "ok",
            }),
          ));
      },
      onError: (error) =>
        dispatch(
          pushNotification({
            msg: "Ocurrio un error al intentar eliminar el reporte programado",
            status: "err",
          }),
        ),
    });
  }, [deleteSchedule, handleGetScheduleList]);

  const handleToggleSidebar = useCallback(
    () => setIsSidebarOpen((prev) => !prev),
    [],
  );
  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
    setSelectedSchedule(null);
  }, []);

  const handleItemClick = useCallback((item) => setSelectedSchedule(item), []);

  const handleItemDoubleClick = useCallback(
    (item) => {
      sessionStorage.setItem("reportId", item.id);
      sessionStorage.setItem("reportName", item.name);
      router.push(`/reports/report`);
    },
    [router],
  );

  const handleRowClick = useCallback((params) => {
    setSelectedSchedule(params.row);
  }, []);

  const handleRowDoubleClick = useCallback(
    (params) => {
      sessionStorage.setItem("reportId", params.row.id);
      sessionStorage.setItem("reportName", params.row.name);
      router.push(`/reports/report`);
    },
    [router],
  );
  const handleOpenDetails = useCallback(() => {
    sessionStorage.setItem("reportId", selectedSchedule.id);
    sessionStorage.setItem("reportName", selectedSchedule.name);
    router.push(`/reports/report`);
  }, [router, selectedSchedule]);
  const handleView = useCallback(
    (item) => {
      setSelectedSchedule(item);
      if (!isSidebarOpen) setIsSidebarOpen(true);
    },
    [isSidebarOpen],
  );

  const handleDelete = useCallback((item) => {
    setSelectedSchedule(item);
    setIsDeleteModal(true);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !isLoadingList)
      handleGetScheduleList(false, true);
  }, [hasMore, isLoadingMore, isLoadingList, handleGetScheduleList]);

  const contextMenuActions = {
    view: handleView,
    delete: handleDelete,
  };

  const scheduleCustomFields = useMemo(() => {
    if (!selectedSchedule) return [];
    if (
      isLoadingList ||
      isLoadingUsers ||
      isLoadingGroups ||
      isLoadingDataDashboard
    ) {
      return [
        {
          label: "Cargando detalles...",
          content: (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                Obteniendo información del programa del reporte
              </Typography>
            </Box>
          ),
        },
      ];
    }
    return [
      {
        label: "Tablero origen",
        content: (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <DashboardRounded sx={{ fontSize: 18, color: "info.main" }} />
            <Typography
              variant="body2"
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 500,
                color: "primary.main",
                cursor: "pointer",
                textDecoration: "underline",
                "&:hover": { opacity: 0.8 },
              }}
              onClick={() =>
                router.push(`/dashboard/${dataDashboard?.data?.id}`)
              }
            >
              {dataDashboard?.data?.name || "N/A"}
              <Launch sx={{ fontSize: "small" }}></Launch>
            </Typography>
          </Box>
        ),
      },
      {
        label: "Usuario Propietario",
        content: (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Person sx={{ fontSize: 18, color: "primary.main" }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {metadataUsers.find(
                (u) => u.id === selectedSchedule.creator_user_id,
              )?.username || "N/A"}
            </Typography>
          </Box>
        ),
      },
      {
        label: "Usuario Editor",
        content: (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Person sx={{ fontSize: 18, color: "accent.main" }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {metadataUsers.find(
                (u) => u.id === selectedSchedule.last_editor_user_id,
              )?.username || "N/A"}
            </Typography>
          </Box>
        ),
      },
      {
        label: "Grupo",
        content: (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Group sx={{ fontSize: 18, color: "info.main" }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {selectedSchedule?.group_name ||
                metadataGroups.find((g) => g.id === selectedSchedule.group_id)
                  ?.name ||
                "N/A"}
            </Typography>
          </Box>
        ),
      },
    ];
  }, [
    selectedSchedule,
    isLoadingList,
    isLoadingUsers,
    isLoadingGroups,
    isLoadingDataDashboard,
    metadataUsers,
    metadataGroups,
    dataDashboard,
  ]);

  const sidebarContent = (
    <DetailsSidebar
      item={selectedSchedule}
      chipConfig={
        selectedSchedule
          ? {
              label: "Reporte Programado",
              color: selectedSchedule.color || "#1976d2",
              icon: <CalendarMonth sx={{ fontSize: 14, color: "white" }} />,
            }
          : undefined
      }
      onClose={handleCloseSidebar}
      itemCount={schedules.length}
      entityName="Reporte programado"
      customFields={scheduleCustomFields}
      showVisibility={false}
      actions={
        selectedSchedule
          ? [
              {
                label: "Abrir Programa",
                icon: <Visibility sx={{ fontSize: 18 }} />,
                onClick: () => handleOpenDetails(),
                style: "primary",
              },
              { type: "divider" },
              {
                label: "Eliminar",
                icon: <DeleteOutline sx={{ fontSize: 18 }} />,
                onClick: () => handleDelete(selectedSchedule),
                style: "danger",
              },
            ]
          : []
      }
    />
  );
  if (props.actions !== undefined && "__general__reports" in props.actions) {
    return (
      <>
        <ExplorerView
          config={explorerConfig}
          items={schedulesWithColors}
          isLoading={isLoadingList}
          columns={columns}
          getRows={getTableRows}
          onItemClick={handleItemClick}
          onItemDoubleClick={handleItemDoubleClick}
          onRowClick={handleRowClick}
          onRowDoubleClick={handleRowDoubleClick}
          onCreateClick={() => {}}
          onFavoriteClick={() => {}}
          contextMenuActions={contextMenuActions}
          showDeleteAction={true}
          showEditAction={false}
          sidebarContent={sidebarContent}
          isSidebarOpen={isSidebarOpen}
          onCloseSidebar={handleCloseSidebar}
          onSearch={handleSearch}
          onSortChange={handleSortChange}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          totalCount={totalSchedules}
          headerSlots={{
            breadcrumb: <SchedulingBreadcrumb activeItem="scheduling" />,
            sidebarToggle: (
              <Tooltip
                title={
                  isSidebarOpen
                    ? "Ocultar panel de información"
                    : "Mostrar panel de información"
                }
              >
                <IconButton
                  onClick={handleToggleSidebar}
                  size="small"
                  sx={{
                    color: isSidebarOpen ? "primary.main" : "text.secondary",
                    backgroundColor: isSidebarOpen
                      ? "rgb(236, 236, 236)"
                      : "transparent",
                    borderRadius: 1.5,
                    border: "1px solid rgb(207, 205, 205)",
                    "&:hover": { backgroundColor: "action.hover" },
                    height: "38px",
                  }}
                >
                  {isSidebarOpen ? (
                    <ChevronRight fontSize="small" />
                  ) : (
                    <ChevronLeft fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            ),
          }}
          badgeConfig={{
            field: "can_edit",
            value: false,
            icon: <LockRounded sx={{ fontSize: 18, color: "#a3a3a3" }} />,
            position: "top-right",
            backgroundColor: "#FFFFFF",
            showShadow: true,
          }}
          showMenu={false}
        />

        <RestoreModal
          open={isDeleteModal}
          onClose={() => setIsDeleteModal(false)}
          selectedProduct={selectedSchedule}
          onRestore={handleDeleteSchedule}
          isLoadingRestore={isLoadingDelete}
          context="Programa de reporte"
          isDelete={true}
        />
      </>
    );
  } else {
    return (
      <Box className="pad_40" style={{ minHeight: "50vh" }}>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ textAlign: "center", fontWeight: "500", marginBottom: "10px" }}
        >
          <ErrorComponent message="Credenciales no válidas para acceder a la página de reportes." />
        </Typography>
      </Box>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.user,
  organization: state.organization,
  actions: state.actions,
});

export default connect(mapStateToProps)(Reports);
