"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getRequest } from "@helpers/dashboardAPI/genericRequest";
import { pushNotification } from "@redux/actions";
import { dashboardGeneralRequest } from "@services/dashboardAPI";

const DELAY_MS = 200;
const setupRequestCache = new Map();

/**
 * Hook que obtiene la configuración del panel (getChartSetUp).
 * Gestiona loading, error y datos de configuración con cancelación al desmontar.
 */
const useChartSetup = (idPanel, chartType, chart, reloadChartConfig) => {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.user?.[0]?.userID);

  const [state, setState] = useState({
    configData: null,
    isLoading: !!idPanel,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    const requestKey = `${userId ?? "anonymous"}:${idPanel ?? "no-panel"}:${reloadChartConfig ?? 0}`;

    const fetchSetup = async () => {
      if (!idPanel || !chart) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: !chart ? `Tipo de gráfica inválido: ${chartType}` : null,
        }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      if (!isMounted) return;

      try {
        let cachedEntry = setupRequestCache.get(requestKey);

        if (!cachedEntry) {
          const requestPromise = userId? getRequest(
                dispatch,
                userId,
                "",
                "",
                "getChartSetUp",
                "configuración del panel",
                { panel_id: idPanel }
              )
            : dashboardGeneralRequest({
                version: "v1",
                typeRequest: "GET",
                nameUrl: "getChartSetUpPublic",
                dynamicParams: { panel_id: idPanel },
                useJWT: false,
              })
                .then((r) => {
                  if (!r || typeof r !== "object") return null;
                  if (r?.status !== "success") return null;
                  const d = r?.data;
                  if (d && (d.status === "success")) {
                    return d?.data ?? null;
                  }
                  return d ?? null;
                })
                .catch(() => null);
          cachedEntry = { status: "pending", promise: requestPromise };
          setupRequestCache.set(requestKey, cachedEntry);
        }

        const response = cachedEntry.promise
          ? await cachedEntry.promise
          : cachedEntry.response;

        if (!isMounted) return;

        if (userId) {
          if (response && response.status !== "error") {
            setupRequestCache.set(requestKey, { status: "resolved", response });
            setState({ isLoading: false, error: null, configData: response.data });
          } else {
            setupRequestCache.delete(requestKey);
            const errorMsg =
              response?.status || "No se pudo obtener la información del panel";
            setState({ isLoading: false, error: errorMsg, configData: null });
            dispatch(pushNotification({ msg: errorMsg, status: "err" }));
          }
        } else {
          const styles =
            response?.data?.data ??
            response?.data ??
            response;
          setState({ isLoading: false, error: null, configData: styles });
        }
      } catch (error) {
        setupRequestCache.delete(requestKey);
        if (!isMounted) return;
        const errorMsg =
          error.message || "Error al cargar la información del panel";
        setState({ isLoading: false, error: errorMsg, configData: null });
        dispatch(pushNotification({ msg: errorMsg, status: "err" }));
      }
    };

    fetchSetup();

    return () => {
      setupRequestCache.delete(requestKey);
      isMounted = false;
    };
  }, [idPanel, reloadChartConfig, chart, chartType, userId, dispatch]);

  return {
    chart_setup_styles: state.configData,
    configData: state.configData,
    isLoading: state.isLoading,
    error: state.error,
  };
};

export default useChartSetup;
