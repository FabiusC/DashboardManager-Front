// hooks/useChartContext.js
import { useCallback, useMemo } from "react";
import { useContextSelector } from "use-context-selector";
import { ChartContext } from "../context/ChartContext";
import merge from 'lodash/merge';
import { resolveFieldType } from "@components/DashboardsWorkspace/hooks/useFields";
import { isSameSelectedField } from "@utils/fieldIdUtils";

export const useChartContext = () => {
  const state = {
    queryParameters: useContextSelector(ChartContext, (v) => v?.state?.queryParameters),
    chartType: useContextSelector(ChartContext, (v) => v?.state?.chartType),
    chartTypeId: useContextSelector(ChartContext, (v) => v?.state?.chartTypeId),
    colorStrategy: useContextSelector(ChartContext, (v) => v?.state?.colorStrategy),
    liveChartProps: useContextSelector(ChartContext, (v) => v?.state?.liveChartProps),
    // Por si algún componente lo necesita:
    chartComponents: useContextSelector(ChartContext, (v) => v?.state?.chartComponents),
    reloadChartConfig: useContextSelector(ChartContext, (v) => v?.state?.reloadChartConfig),
  };

  const _initChart = useContextSelector(ChartContext, (v) => v?.initChart);
  const _setQueryParams = useContextSelector(ChartContext, (v) => v?.setQueryParams);
  const _setChartType = useContextSelector(ChartContext, (v) => v?.setChartType);
  const _setColorStrategy = useContextSelector(ChartContext, (v) => v?.setColorStrategy);
  const _updateLiveChartProps = useContextSelector(ChartContext, (v) => v?.updateLiveChartProps);
  const _clearLiveChartProps = useContextSelector(ChartContext, (v) => v?.clearLiveChartProps);
  const _reloadChartConfig = useContextSelector(ChartContext, (v) => v?.reloadChartConfig);
  const _setChartComponents = useContextSelector(ChartContext, (v) => v?.setChartComponents);
  const _resetChartData = useContextSelector(ChartContext, (v) => v?.resetChartData);

  const initializeChart = useCallback((raw) => _initChart?.(raw), [_initChart]);

  const updateQueryParams = useCallback((params) => _setQueryParams?.(params), [_setQueryParams]);

  const changeChartType = useCallback((type) => _setChartType?.(type), [_setChartType]);

  const changeColorStrategy = useCallback(
    (strategy) => _setColorStrategy?.(strategy),
    [_setColorStrategy]
  );

  const updateLiveProps = useCallback(
    (props) => _updateLiveChartProps?.(props),
    [_updateLiveChartProps]
  );

  const handleUpdateLiveChartProps = useCallback(
    (fieldKey, value, parentData = [], value_type = null) => {
      // Obtener el estado actual de liveChartProps
      const currentLiveChartProps = state.liveChartProps || {};

      // Convertir el valor según el tipo
      let convertedValue = value;
      if (value_type === 'boolean') {
        convertedValue = value === 'true' || value === true;
      } else if (value_type === 'integer' || value_type === 'number') {
        convertedValue = Number(value);
      } else if (value_type === 'float') {
        convertedValue = parseFloat(value);
      }

      const updateObj = {};
      let current = updateObj;
      
      for (let i = 0; i < parentData.length; i++) {
        current[parentData[i]] = {};
        current = current[parentData[i]];
      }
      
      current[fieldKey] = convertedValue;

      const updatedLiveChartProps = merge({}, currentLiveChartProps, updateObj);

      _updateLiveChartProps?.(updatedLiveChartProps);
    },
    [state.liveChartProps, _updateLiveChartProps]
  );

  const handleAddField = useCallback(
    (newField) => {
      if (!newField?.id || !_setQueryParams) return null;
      const current = state.queryParameters?.selected_fields || [];
      if (current.find((f) => (f.field_id ?? f.id) === newField.id)) {
        return null;
      }
      const normalizedField = {
        field_id: newField.id,
        metric: newField.metric || "count",
        name: newField.name,
        alias: newField.alias || newField.name,
        type: resolveFieldType(newField),
      }
      const updated = [...current, normalizedField];
      _setQueryParams({
        ...state.queryParameters,
        selected_fields: updated,
      });
      return normalizedField;
    },
    [state.queryParameters, _setQueryParams]
  );
  const handleRemoveField = useCallback(
    (field) => {
      if (!_setQueryParams) return;
      const current = state.queryParameters?.selected_fields || [];
      const updated = current.filter((currentField) => !isSameSelectedField(currentField, field));
      _setQueryParams({
        ...state.queryParameters,
        selected_fields: updated,
        fields_distribution: undefined
      });
    },
    [state.queryParameters, _setQueryParams]
  );

  const clearLiveProps = useCallback(() => _clearLiveChartProps?.(), [_clearLiveChartProps]);

  const forceReloadConfig = useCallback(() => _reloadChartConfig?.(), [_reloadChartConfig]);

  const updateChartComponents = useCallback(
    (components) => _setChartComponents?.(components),
    [_setChartComponents]
  );

  const updateChartComponent = updateChartComponents;

  const resetChartData = useCallback(() => _resetChartData?.(), [_resetChartData]);

  const hasChartType = useMemo(() => !!state.chartType, [state.chartType]);

  /* -------------------- API PÚBLICA -------------------- */
  return {
    state: { ...state, hasChartType },
    actions: {
      initializeChart,
      updateQueryParams,
      handleAddField,
      handleRemoveField,
      changeChartType,
      changeColorStrategy,
      updateLiveProps,
      handleUpdateLiveChartProps,
      clearLiveProps,
      forceReloadConfig,
      updateChartComponents,
      updateChartComponent, // alias
      resetChartData,
    },
  };
};
