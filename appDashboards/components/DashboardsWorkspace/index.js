import { useState, useEffect, useRef } from "react"
import { Box } from "@mui/material"
import { LoadingAssembly } from "@creangel/ifindit-ui"
import { DashboardTabsProvider } from "./context/DashboardTabsContext"
import { connect, useDispatch } from "react-redux"
import { useRouter } from "next/router"
import { pushNotification, resetFilters, setDashboardLoading } from "@redux/actions"
import { useDashboardData } from "./features/Dashboard/shared/hooks/useDashboardData"
import { useQuery } from "@tanstack/react-query"
import { dashboardGeneralRequest } from "@services/dashboardAPI";
import { addGroup, addRule } from "@redux/actions";
import DashboardEditor from "./features/Dashboard/Editor/DashboardEditor"
import DashboardViewer from "./features/Dashboard/Viewer/DashboardViewer"

// TODO: Unify DashboardEditor and DashboardViewer to use the parent container
function DashboardsWorkspaceContent({ id, user }) {
  const [editionDashboard, setEditionDashboard] = useState(undefined)
  const [isReadOnly, setIsReadOnly] = useState(!!id)
  const dispatch = useDispatch()
  const router = useRouter()

  const dashboardIdToFetch = id || editionDashboard
  
  const reportIdParam = router.query?.report_id
  const reportId = typeof reportIdParam === 'string' ? reportIdParam : Array.isArray(reportIdParam) ? reportIdParam[0]: null
  const isReady = router.isReady
  const isReport = !!reportId
  const [reportFiltersReady,setReportFiltersReady] = useState(false)
  const appliedReportFiltersRef = useRef({ reportId: null, applied: false });
  const shouldFetchDashboard = isReady && (!isReport || reportFiltersReady)
  const {
    dashboard,
    setDashboard,
    panels,
    setPanels,
    layout,
    setLayout,
    isLoading: isLoadingDashboard,
    isError: isErrorDashboard
  } = useDashboardData(dashboardIdToFetch, user, isReadOnly,shouldFetchDashboard)

  const previousDashboardId = useRef(null);
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (!isReady) return;
    if (!isReport) setReportFiltersReady(true);
  }, [isReady, isReport]);

  useEffect(() => {
    if (!dashboardIdToFetch || !isReady) return;

    if (isReport) {
      isFirstMount.current = false;
      previousDashboardId.current = dashboardIdToFetch;
      return;
    }
    // Reset filters when dashboard opens for the first time or when dashboard ID changes
    if (
      isFirstMount.current ||
      (previousDashboardId.current !== null &&
        previousDashboardId.current !== dashboardIdToFetch)
    ) {
      dispatch(resetFilters());
      isFirstMount.current = false;
    }

    previousDashboardId.current = dashboardIdToFetch;
  }, [dashboardIdToFetch, dispatch, isReady, isReport]);

  const reportFiltersQuery = useQuery({
    queryKey: ["reportFilters", reportId],
    enabled: isReady && isReport && !!reportId && !reportFiltersReady,
    queryFn: async () => {
      return await dashboardGeneralRequest({
        version: "v1",
        typeRequest: "GET",
        nameUrl: "getFiltersReport",
        dynamicParams: { report_id: reportId },
      });
    },
  });

  useEffect(()=>{
    if(!isReady) return
    if(!reportFiltersQuery.data) return
    if(reportFiltersReady) return
    if (appliedReportFiltersRef.current.reportId === reportId && appliedReportFiltersRef.current.applied) {
      return;
    }
    appliedReportFiltersRef.current = { reportId, applied: true };

    const payload = reportFiltersQuery.data?.data
    dispatch(resetFilters())
    const reportRootGroupId = `report::${reportId}::group`
    dispatch(
      addGroup({
        id: reportRootGroupId,
        parentId: "root",
        uiContext_id: "report",
        operator: payload?.operator || "AND",
        children: [],
        acceptsSubgroups: true,
        allowMultipleRules: true,
        isCoupled: false,
      })
    )
    let groupCounter = 0;
    const addTree = (node, parentGroupId) => {
      if (!node) return;
      const isLeafRule =
        !!node.field &&
        !!node.operator &&
        (!Array.isArray(node.conditions) || node.conditions.length === 0);

      if (isLeafRule) {
        const cleanVal = String(node.value).replace(/\s+/g, "_");
        const ruleId = `${parentGroupId}::rule::${node.field}::${node.operator}::${cleanVal}`;
        dispatch(
          addRule({
            id: ruleId,
            parentId: parentGroupId,
            field: node.field,
            value: node.value,
            operator: node.operator,
          })
        );
        return;
      }

      const childConditions = Array.isArray(node.conditions) ? node.conditions : [];
      if (childConditions.length === 0) return;

      // Crear un subgrupo para este nivel lógico (AND/OR)
      const groupId = `${parentGroupId}::subgroup::${groupCounter++}`;
      dispatch(
        addGroup({
          id: groupId,
          parentId: parentGroupId,
          uiContext_id: "report",
          operator: node.operator || "AND",
          children: [],
          acceptsSubgroups: true,
          allowMultipleRules: true,
          isCoupled: false,
        })
      );

      childConditions.forEach((c) => addTree(c, groupId));
    };
    const topConditions = Array.isArray(payload?.conditions) ? payload.conditions : [];
    topConditions.forEach((c) => addTree(c, reportRootGroupId));

    setReportFiltersReady(true);

    try {
      const nextQuery = { ...(router.query || {}) };
      delete nextQuery.report_id;
      router.replace(
        { pathname: router.pathname, query: nextQuery },
        undefined,
        { shallow: true }
      );
    } catch (_) { }
  },[isReady, isReport, reportFiltersQuery.data, reportFiltersReady, dispatch])

  useEffect(() => {
  if (!reportFiltersQuery.data) return;
  console.log("REPORT FILTERS RAW", reportFiltersQuery.data);
  }, [reportFiltersQuery.data]);

  useEffect(() => {
    if (isErrorDashboard && dashboardIdToFetch) {
      dispatch(pushNotification({ msg: 'Error al cargar el tablero', status: 'err' }));
    }
  }, [isErrorDashboard, dashboardIdToFetch, dispatch]);

  // Configurar isReadOnly cuando hay id en la URL
  useEffect(() => {
    if (id) {
      setIsReadOnly(true);
    } else {
      // Si no hay id, verificar sessionStorage para modo edición
      let sessionProjectId = sessionStorage.getItem('projectId');
      let sessionFolderId = sessionStorage.getItem('folderId');
      let sessionDashboardId = sessionStorage.getItem('resourceId');

      if (sessionProjectId && sessionFolderId) {
        if (sessionDashboardId) {
          setEditionDashboard(sessionDashboardId);
        }
      } else {
        router.push('/projects/folders/resources');
      }
    }
  }, [id, router]);

  const isReportFiltersLoading =
    isReport && !reportFiltersReady && (reportFiltersQuery.isLoading || reportFiltersQuery.isFetching)
  const isViewerLoading =
    isReadOnly &&
    !isErrorDashboard &&
    (!isReady || isReportFiltersLoading || isLoadingDashboard)

  // Report loading state only for visualization mode (viewer)
  useEffect(() => {
    if (!isReadOnly) {
      dispatch(setDashboardLoading(false));
      return;
    }
    dispatch(setDashboardLoading(isViewerLoading));
    return () => dispatch(setDashboardLoading(false));
  }, [isViewerLoading, isReadOnly, dispatch]);

  // Renderizar Editor o Viewer según el modo
  if (isReadOnly) {
    if (isViewerLoading) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            minHeight: id ? "calc(100vh - 66px)" : "100vh",
            bgcolor: "#F5F5F5",
          }}
        >
          <LoadingAssembly
            state={{
              message: "Cargando tablero...",
              borderRadius: false,
              boxShadow: false,
              size: 60,
            }}
          />
        </Box>
      )
    }

    return (
      <DashboardViewer
        dashboard={dashboard}
        panels={panels}
        setPanels={setPanels}
        layout={layout}
        user={user}
        id={id}
      />
    )
  }

  return (
    <DashboardEditor
      dashboard={dashboard}
      setDashboard={setDashboard}
      panels={panels}
      setPanels={setPanels}
      layout={layout}
      setLayout={setLayout}
      user={user}
      id={id}
      dashboardIdToFetch={dashboardIdToFetch}
    />
  )
}

const mapStateToProps = (state) => ({
  user: state.user,
});

// Componente wrapper que proporciona el contexto
function DashboardsWorkspace({ id, user }) {
  return (
    <DashboardTabsProvider>
      <DashboardsWorkspaceContent id={id} user={user} />
    </DashboardTabsProvider>
  );
}

export default connect(mapStateToProps)(DashboardsWorkspace);
