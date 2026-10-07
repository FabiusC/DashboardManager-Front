import { useState, useCallback, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePanelContext } from "../hooks/usePanelContext";
import { useChartContext } from "../hooks/useChartContext";
import useTabs from "../hooks/useTabsContext";
import { convertStateToApiPayload } from "@helpers/filtersConverter";

/* Servicios */
import {
  associateChartType,
  fetchFieldsDistribution,
  fetchQueryFieldsDistribution,
  fetchPanel,
  fetchPanelQueryParameters,
  fetchChartComponent,
  savePanelQueryParameters,
  updatePanelSize,
  updateSelectedFieldMetric,
  isSupportedFieldMetric,
} from "../services/panelsWorkspaceApi";
import { isSameSelectedField } from "@utils/fieldIdUtils";
import { pushNotification } from "../../../redux/actions";

const getSelectedFieldsFromResponse = (data) => {
  const fields = data?.selected_fields ?? data?.query_parameters?.selected_fields;
  return Array.isArray(fields) ? fields : [];
};

const getPersistedSelectedFieldId = (field) => {
  const explicitId = field?.selected_field_id ?? field?.selectedFieldId;
  if (explicitId != null) return explicitId;

  const catalogFieldId = field?.field_id;
  const selectedFieldId = field?.id;
  if (
    catalogFieldId == null ||
    selectedFieldId == null ||
    String(catalogFieldId) === String(selectedFieldId)
  ) {
    return null;
  }

  return selectedFieldId;
};

/**
 * Hook centralizado de acciones para PanelsWorkspace.
 * @param {string} userID – ID del usuario autenticado.
 * @param {Object} options – { editionMode } para no enviar filtros en la petición cuando es true.
 */
export default function usePanelsWorkspaceActions(userID, options = {}) {
  const { editionMode = true } = options;
  const dispatch = useDispatch();
  const panel = usePanelContext();
  const chart = useChartContext();
  const { changeSideTabState } = useTabs();
  const filtersState = useSelector((state) => state.filters || {});
  const filters = useMemo(() => convertStateToApiPayload(filtersState), [filtersState]);

  /* States UI */
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [isLoadingPanels, setIsLoadingPanels] = useState(false);
  const [layouts, setLayouts] = useState({
    lg: [], md: [], sm: [], xs: [], xxs: [],
  });
  const [fieldConfigurationError, setFieldConfigurationError] = useState(null);
  const [error, setError] = useState(null);

  /* -------- SELECT CHART TYPE -------- */
  const handleSelectedChartType = useCallback(
    async (chartTypeInfo) => {
      if (!panel.state?.panel?.id) return;
      setIsLoadingChart(true);
      await associateChartType({
        dispatch,
        userID,
        panelId: panel.state.panel.id,
        chartTypeInformation: chartTypeInfo,
        chartActions: chart.actions,
        setHasChartTypeState: () => { },
        setError,
        panel,
        changeSideTabState,
      });
      setIsLoadingChart(false);
    },
    [dispatch, userID, panel.state?.panel?.id, chart.actions]
  );

  /* -------- FIELDS DISTRIBUTION -------- */
  const verifySelectedFieldsSetup = (fields) => {
    if (!Array.isArray(fields) || fields.length === 0) return false;
    for (const f of fields) {
      if (!f?.id && !f?.field_id) return false;
    }
    return true;
  }

  const getFieldsDistribution = useCallback(async () => {
    const ctId = chart.state.chartType?.id;
    const sel = chart.state.queryParameters?.selected_fields?.length;
    if (!ctId || !sel || !verifySelectedFieldsSetup(chart.state.queryParameters.selected_fields)) return;
    await fetchFieldsDistribution({
      dispatch,
      userID,
      chartTypeId: ctId,
      selectedFields: chart.state.queryParameters.selected_fields,
      chartActions: chart.actions,
      setFieldConfigurationError,
    });
  }, [
    dispatch,
    userID,
    chart.actions,
    chart.state.chartType?.id,
    chart.state.queryParameters?.selected_fields,
  ]);

  const getQueryFieldsDistribution = useCallback(async () => {
    const ctId = chart.state.chartType?.id;
    const fd = chart.state.queryParameters?.fields_distribution;
    if (!ctId || !fd) return;
    await fetchQueryFieldsDistribution({
      dispatch,
      userID,
      chartTypeId: ctId,
      selectedFields: chart.state.queryParameters.selected_fields,
      chartActions: chart.actions,
      setFieldConfigurationError,
    });
  }, [
    dispatch,
    userID,
    chart.actions,
    chart.state.chartType?.id,
    chart.state.queryParameters?.selected_fields,
    chart.state.queryParameters?.fields_distribution,
  ]);

  const handleUpdateFieldMetric = useCallback(
    async (field, metric) => {
      const panelId = panel.state?.panel?.id;
      const selectedFields = chart.state.queryParameters?.selected_fields || [];
      const selectedField = selectedFields.find((currentField) =>
        isSameSelectedField(currentField, field)
      );

      if ( !panelId || !selectedField || !isSupportedFieldMetric(metric, selectedField)
      ) {
        dispatch(
          pushNotification({
            msg: "No se pudo actualizar la métrica del campo seleccionado.",
            status: "err",
          })
        );
        return false;
      }

      const persistedQueryParameters = await fetchPanelQueryParameters({
        dispatch,
        userID,
        panelId,
      });
      const persistedFields = persistedQueryParameters?.selected_fields;
      if (!Array.isArray(persistedFields)) {
        dispatch(
          pushNotification({
            msg: "No se pudo consultar el campo seleccionado en el panel.",
            status: "err",
          })
        );
        return false;
      }

      const persistedField = persistedFields.find((currentField) =>
        isSameSelectedField(currentField, selectedField)
      );
      const sourceField = persistedField || selectedField;
      const previousMetric = sourceField.metric || "count";
      if (previousMetric === metric) return true;

      let selectedFieldId = getPersistedSelectedFieldId(persistedField);
      if (selectedFieldId == null) {
        const saveResult = await savePanelQueryParameters({
          dispatch,
          userID,
          panelId,
          selectedFields,
          sortRule: chart.state.queryParameters?.sort_rule,
        });
        const [saved, savedData] = Array.isArray(saveResult)
          ? saveResult
          : [false, null];
        const savedField = getSelectedFieldsFromResponse(savedData).find(
          (candidate) => isSameSelectedField(candidate, selectedField)
        );

        const persistedSelectedFieldId =
          getPersistedSelectedFieldId(savedField);

        if (!saved || persistedSelectedFieldId == null) {
          dispatch(
            pushNotification({
              msg: "No se pudo obtener el identificador local del campo seleccionado.",
              status: "err",
            })
          );
          return false;
        }

        selectedFieldId = persistedSelectedFieldId;
      }

      const [ok] = await updateSelectedFieldMetric({
        dispatch,
        userID,
        panelId,
        selectedFieldId,
        metric,
      });

      if (!ok) {
        return false;
      }

      await fetchPanel({
        dispatch,
        userID,
        panelId,
        panelActions: panel.actions,
        chartActions: chart.actions,
        changeSideTabState,
        setError,
      });
      chart.actions.forceReloadConfig?.();

      return true;
    },
    [
      chart.actions,
      chart.state.queryParameters?.selected_fields,
      changeSideTabState,
      dispatch,
      fetchPanelQueryParameters,
      panel.actions,
      panel.state?.panel?.id,
      userID,
    ]
  );

  /* -------- PANEL -------- */
  const handleGetPanels = useCallback(
    async (id) => {
      setIsLoadingPanels(true);

      await new Promise(resolve => setTimeout(resolve, 800));

      const layout = await fetchPanel({
        dispatch,
        userID,
        panelId: id,
        editionMode,
        panelActions: panel.actions,
        chartActions: chart.actions,
        changeSideTabState,
        setError,
      });
      if (layout) {
        setLayouts({
          lg: [layout],
          md: [layout],
          sm: [layout],
          xs: [layout],
          xxs: [layout],
        });
      }
      setIsLoadingPanels(false);
    },
    [dispatch, userID, panel.actions, chart.actions, changeSideTabState]
  );

  /* -------- CHART COMPONENT -------- */
  const getChartComponent = useCallback(async () => {
    const ctid = chart.state.chartTypeId;
    const pid = panel.state.panel?.id;
    if (!ctid || !pid) return;
    setIsLoadingChart(true);
    const updatedChartInfo = await fetchChartComponent({
      dispatch,
      userID,
      panelId: pid,
      chartActions: chart.actions,
      setError,
    });
    setIsLoadingChart(false);
  }, [
    dispatch,
    userID,
    panel.state?.panel?.id,
    chart.state.chartTypeId,
    chart.actions,
  ]);

  /* -------- RESIZE & LAYOUT -------- */
  const handlePanelSizeChange = useCallback(
    async (prevItem, currentItem) => {
      const changes = {};
      changes.width = currentItem.w;
      changes.height = currentItem.h;
      if (!Object.keys(changes).length) return;
      await updatePanelSize({
        dispatch,
        userID,
        panelId: panel.state.panel.id,
        changedFields: changes,
        panelActions: panel.actions,
      });
    },
    [dispatch, userID, panel.state?.panel?.id, panel.actions]
  );

  const handleLayoutChange = useCallback(
    (current, all) => {
      setLayouts((prev) => {
        try {
          const prevMap = new Map((prev?.lg || []).map((it) => [String(it.i), it]));
          (current || []).forEach((item) => {
            const prevItem = prevMap.get(String(item.i));
            if (prevItem && (prevItem.w !== item.w || prevItem.h !== item.h)) {
              handlePanelSizeChange(prevItem, item);
            }
          });
        } catch (error) {
          console.error("Error en handleLayoutChange:", error);
          return prev;
        }
        return JSON.stringify(prev) !== JSON.stringify(all) ? all : prev;
      });
    },
    [handlePanelSizeChange]
  );

  useEffect(() => {
    const pid = panel.state?.panel?.id;
    const nextW = panel.state?.panel?.width;
    const nextH = panel.state?.panel?.height;
    if (!pid || (nextW == null && nextH == null)) return;

    setLayouts((prev) => {
      const updateItems = (items = []) =>
        items.map((l) =>
          String(l.i) === String(pid)
            ? {
                ...l,
                w: nextW != null ? nextW : l.w,
                h: nextH != null ? nextH : l.h,
              }
            : l
        );

      return {
        lg: updateItems(prev?.lg),
        md: updateItems(prev?.md),
        sm: updateItems(prev?.sm),
        xs: updateItems(prev?.xs),
        xxs: updateItems(prev?.xxs),
      };
    });
  }, [panel.state?.panel?.id, panel.state?.panel?.width, panel.state?.panel?.height]);

  /* -------- API EXPUESTA -------- */
  return useMemo(() => ({
    handleSelectedChartType,
    getFieldsDistribution,
    getQueryFieldsDistribution,
    handleUpdateFieldMetric,
    handleGetPanels,
    getChartComponent,
    handlePanelSizeChange,
    handleLayoutChange,
    savePanelQueryParameters,
    // estados
    isLoadingChart,
    isLoadingPanels,
    layouts,
    fieldConfigurationError,
    error,
  }), [
    handleSelectedChartType,
    getFieldsDistribution,
    getQueryFieldsDistribution,
    handleUpdateFieldMetric,
    handleGetPanels,
    getChartComponent,
    handlePanelSizeChange,
    handleLayoutChange,
    savePanelQueryParameters,
    isLoadingChart,
    isLoadingPanels,
    layouts,
    fieldConfigurationError,
    error,
  ]);
}
