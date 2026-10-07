import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { handleAddDashboard } from '../utils/dashboardActions';
import { dashboardGeneralRequest } from '@services/dashboardAPI';
import { getBasePathByType, SERVICE_TYPE_DASHBOARD_MANAGER } from 'constants/microserviceTypes';

const asPanelList = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

export const useDashboardData = (id, user, isReadOnly, shouldFetchDashboard = true) => {
  const dispatch = useDispatch();
  const microservices = useSelector(state => state.microservice || []);
  const hasUserToken = Array.isArray(user) && user.length > 0 && !!user?.[0]?.userID;
  const hasDashboardApiEnvFallback =
    typeof process !== "undefined" &&
    typeof process.env.NEXT_PUBLIC_DASHBOARD_MANAGER_BASE_URL === "string" &&
    process.env.NEXT_PUBLIC_DASHBOARD_MANAGER_BASE_URL.trim() !== "";

  const [layout, setLayout] = useState([]);
  const [panels, setPanels] = useState([]);
  const [dashboard, setDashboard] = useState({});

  // Check if microservices are available and contain the required service type
  const microservicesReady = Array.isArray(microservices) &&
    microservices.length > 0 &&
    getBasePathByType(microservices, SERVICE_TYPE_DASHBOARD_MANAGER) !== null;

  const apiReadyForThisView =
    microservicesReady ||
    (isReadOnly && !hasUserToken && hasDashboardApiEnvFallback);

  const { data: apiResponse, isLoading, isFetching, isPending, isError } = useQuery({
    queryKey: ['dashboard', id, isReadOnly ? 'viewer' : 'editor', hasUserToken ? 'private' : 'public'],
    queryFn: async () => {
      if (!id && isReadOnly) return null;
      const isPublicViewer = isReadOnly && !hasUserToken;
      if (isPublicViewer) {
        const [dashboardResp, panelsResp] = await Promise.all([
          dashboardGeneralRequest({
            version: 'v1',
            typeRequest: 'GET',
            nameUrl: 'dashboardPublic',
            dynamicParams: { id: id },
            useJWT: false,
          }),
          dashboardGeneralRequest({
            version: 'v1',
            typeRequest: 'GET',
            nameUrl: 'dashboardPanelsPublic',
            dynamicParams: { id: id },
            useJWT: false,
          }),
        ]);
        if (dashboardResp?.status && dashboardResp.status !== 'success' && dashboardResp.status !== 'ok') {
          throw new Error(dashboardResp?.msg || 'Error al cargar el tablero público');
        }

        const dashboardData = dashboardResp?.data || {};
        const panels = asPanelList(panelsResp?.data);

        return {
          status: dashboardResp?.status,
          msg: dashboardResp?.msg,
          data: {
            ...dashboardData,
            panels: panels.length > 0 ? panels : asPanelList(dashboardData.panels),
          },
        };
      }

      return await dashboardGeneralRequest({
        version: 'v1',
        typeRequest: 'GET',
        nameUrl: 'dashboardEditionGet',
        dynamicParams: { id: id },
      });
    },
    enabled: !!id && apiReadyForThisView && shouldFetchDashboard,
    staleTime: 0,
    gcTime: 0,
    //enabled: !!id && microservicesReady,
    // staleTime: 1000 * 60 * 10,
    // gcTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    if (apiResponse?.data) {
      handleAddDashboard(
        apiResponse.data,
        setDashboard,
        setLayout,
        setPanels,
        user?.[0]?.userID || user?.userID,
        isReadOnly
      );
    }
  }, [apiResponse, dispatch, isReadOnly, user]);

  return {
    dashboard,
    setDashboard,
    panels,
    setPanels,
    layout,
    setLayout,
    isLoading:
      !!id &&
      shouldFetchDashboard &&
      (!apiReadyForThisView ||
        isPending ||
        isFetching ||
        isLoading ||
        (!isError && !apiResponse?.data)),
    isError,
  };
};
