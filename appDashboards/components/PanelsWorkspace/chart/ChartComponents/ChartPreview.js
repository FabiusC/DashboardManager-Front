import { useMemo, Suspense, useEffect, useState, useCallback, useRef } from "react";
import { Box, Typography, useMediaQuery } from "@mui/material";
import NoDataView from "./NoDataView";
import ErrorFieldConfiguration from "./ErrorFieldConfiguration";
import ErrorData from "./ErrorData";
import ChartLoader from "../loaders/ChartLoader";
import useChart from "@components/Charts/useChar";
import { usePanelData } from "../../hooks/usePanelData";

// 1. OPTIMIZACIÓN: Sacar estilos estáticos fuera del render.
// Evita que el Garbage Collector trabaje extra y permite que Box use igualdad superficial.
const CONTAINER_STYLE = {
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  cursor: "pointer",
  userSelect: 'none',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
  WebkitTouchCallout: 'none',
  WebkitTapHighlightColor: 'transparent',
  backgroundColor: "transparent",
  boxShadow: "none",
  border: "none",
};

// Objeto vacío constante para mantener referencia estable
const EMPTY_OBJ = {};

const isTruthyFlag = (value) => value === true || value === 'true';

export default function ChartPreview({
  height,
  editionMode,
  dashboard = false,
  captureMode = false,
  chartState,
  idPanel,
  reloadTrigger,
  onChartStateUpdate,
  reportPreFilterConfig,
  dashboardPreFilterBlocked = false,
  onPreFilterApplied,
  onPreFilterCleared,
}) {
  const liveProps = chartState?.liveChartProps || EMPTY_OBJ;
  const isSearchTableChart = chartState?.chartType?.name === "search_table";
  const isMobileOrTablet = useMediaQuery("(hover: none) and (pointer: coarse)", { noSsr: true });
  const firstClickRef = useRef(null);
  const [manualSearchValue, setManualSearchValue] = useState(() => {
    const value = chartState?.liveChartProps?.searchValue ?? chartState?.queryParameters?.searchValue;
    return typeof value === "string" ? value.trim() : "";
  });
  const handleSearchCommit = useCallback((value) => {
    setManualSearchValue(String(value ?? "").trim());
  }, []);

  const chartInfoInitial = useChart(
    chartState?.chartType?.name,
    chartState,
    editionMode,
    liveProps,
    idPanel,
    reloadTrigger
  );

  const { chartProps: initialChartProps, isLoading: isSetupLoading, error: setupError } = chartInfoInitial;
  const isFacetTable = chartState?.chartType?.name === 'facet_table';
  const chartTypeName = chartState?.chartType?.name;
  const isFilterSelect = chartTypeName === 'filter_select' || chartTypeName === 'filter_select_affected';
  const isUnaffectedFilterSelect = chartTypeName === 'filter_select';
  const isPreFilterPanel = isFilterSelect && isTruthyFlag(initialChartProps?.styles?.isPreFilter);

  const enableMultipleFilters = isFacetTable && initialChartProps?.styles?.multiple_filters === true;
  const shouldApplyFilters = !enableMultipleFilters && !isUnaffectedFilterSelect;
  const enablePercentageOverride = isFacetTable ? initialChartProps?.styles?.enablePercentage : null;
  const useGlobalFilter = !editionMode && isTruthyFlag(initialChartProps?.styles?.useGlobalFilter);
  const useSearchFilterBar = !editionMode && (initialChartProps?.styles?.useSearchFilterBar === undefined ? true : isTruthyFlag(initialChartProps?.styles?.useSearchFilterBar)
  );

  useEffect(() => {
    if (editionMode || !isFilterSelect || isSetupLoading || !reportPreFilterConfig || !idPanel) {
      return;
    }
    if (!setupError && initialChartProps?.styles == null) {
      return;
    }
    reportPreFilterConfig(idPanel, {
      isActive: setupError ? false : isTruthyFlag(initialChartProps?.styles?.isPreFilter),
      ready: true,
    });
  }, [
    editionMode,
    isFilterSelect,
    isSetupLoading,
    idPanel,
    initialChartProps?.styles?.isPreFilter,
    initialChartProps?.styles,
    setupError,
    reportPreFilterConfig,
  ]);

  const blockUntilPreFilter = !editionMode && !isPreFilterPanel && dashboardPreFilterBlocked;

  const { updatedChartState, isLoadingData, dataError, elementRef } = usePanelData(
    chartState, 
    idPanel, 
    null, 
    shouldApplyFilters,
    editionMode,
    enablePercentageOverride,
    blockUntilPreFilter,
    useGlobalFilter,
    isSearchTableChart ? manualSearchValue : undefined,
    useSearchFilterBar,
    captureMode
  );

  const finalChartState = updatedChartState || chartState;
  const isGridHeatMap = finalChartState?.chartType?.name === 'grid_heatmap';
  useEffect(() => {
  if (finalChartState && typeof onChartStateUpdate === "function") {
    onChartStateUpdate(finalChartState);
  }
}, [finalChartState]);

  const chartInfo = useChart(
    finalChartState?.chartType?.name,
    finalChartState,
    editionMode,
    liveProps,
    idPanel,
    reloadTrigger
  );

  const { ChartComponent, chartData, chartProps, colors, isLoading, isCustom } = chartInfo;

  const isTextChart = finalChartState?.chartType?.name === 'text';
  const delayFilter = dashboard && !editionMode && isMobileOrTablet && !isCustom;
  const handleChartClick = useCallback(
    (datum, event) => {
      const onClick = chartProps?.onClick;
      if (typeof onClick !== "function") return;
      if (!delayFilter) return onClick(datum, event);
      event?.stopPropagation?.();
      const key = [
        datum?.id ?? datum?.data?.id,
        datum?.indexValue ?? datum?.data?.indexValue,
        datum?.key ?? datum?.data?.key,
        datum?.serieId ?? datum?.data?.serieId,
        datum?.x ?? datum?.data?.x,
        datum?.y ?? datum?.data?.y,
      ].join("|");
      const target = event?.currentTarget;
      if (!firstClickRef.current) {
        firstClickRef.current = { key, target };
        return;
      }
      const sameDatum =
        firstClickRef.current.key === key &&
        (!firstClickRef.current.target || !target || firstClickRef.current.target === target);
      if (!sameDatum) {
        firstClickRef.current = { key, target };
        return;
      }
      firstClickRef.current = null;
      onClick(datum, event);
    },
    [chartProps?.onClick, delayFilter],
  );

  const isNoneQueryChart = finalChartState?.chartType?.query_type === 'none_query';
  const isSearchTable = finalChartState?.chartType?.name === 'search_table';
  const hasMeasuredHeight =
    (typeof height === "number" && height > 0) ||
    (typeof height === "string" && height.trim() !== "");
  const resolvedHeight = hasMeasuredHeight ? height : (captureMode ? "100%" : height);

  // 3. OPTIMIZACIÓN: Cálculo de datos con useMemo.
  // Evita ejecutar lógica de validación (Object.keys, Array.isArray) en cada frame de render.
  const viewState = useMemo(() => {
    // Las gráficas sin consulta se renderizan después de cargar su configuración.
    if (isNoneQueryChart) {
      if (isLoading) return 'LOADING';
      if (finalChartState?.fieldConfigurationError) return 'ERROR_CONFIG';
      return 'RENDER_CHART';
    }

    if (blockUntilPreFilter) return 'WAITING_PRE_FILTER';
    if (finalChartState?.state?.dataError || dataError) return 'ERROR_DATA';
    if (finalChartState?.fieldConfigurationError) return 'ERROR_CONFIG';
    
    // Para Search Table, renderizar después de cargar la configuración los datos se cargan una ves es ingresado el valor en el input
    if (isSearchTable) {
      if (isLoading || isLoadingData) return 'LOADING';
      return 'RENDER_CHART';
    }

    if (
      finalChartState?.queryParameters?.rawData !== undefined &&
      Array.isArray(finalChartState.queryParameters.rawData) &&
      finalChartState.queryParameters.rawData.length === 0 &&
      !isLoadingData
    ) {
      return 'NO_DATA_VIEW';
    }

    const data = chartData?.data;
    const isArray = Array.isArray(data);
    const isObject = typeof data === "object" && !isArray && data !== null;
    const hasValidData =
      (isArray && data.length > 0) ||
      (isObject && Object.keys(data).length > 0);
    const hasEmptyData =
      (isArray && data.length === 0) ||
      (isObject && Object.keys(data).length === 0);

    if (isLoading || isLoadingData) return 'LOADING';
    if (hasValidData || finalChartState?.chartType?.query_type === "none_query") return 'RENDER_CHART';
    if (hasEmptyData && !isLoading && !isLoadingData) return 'EMPTY_MSG';

    return 'LOADING';
  }, [
    isNoneQueryChart,
    isSearchTable,
    finalChartState?.queryParameters?.rawData,
    finalChartState?.state?.isLoading,
    finalChartState?.state?.dataError,
    finalChartState?.fieldConfigurationError,
    finalChartState?.chartType?.query_type,
    finalChartState?.chartType?.name,
    chartData,
    isLoading,
    isLoadingData,
    dataError,
    blockUntilPreFilter,
  ]);

  // Renderizado optimizado: Solo elige qué pintar, sin lógica pesada aquí.
  const renderContent = () => {
    switch (viewState) {
      case 'NO_DATA_VIEW':
        return <NoDataView size={50} />;
      case 'ERROR_DATA':
        return <ErrorData size={50} msg={"Error al cargar los datos"} />;
      case 'ERROR_CONFIG':
        return <ErrorFieldConfiguration size={50} />;
      case 'WAITING_PRE_FILTER':
        return (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              backgroundColor: "background.paper",
            }}
          />
        );
      case 'LOADING':
        return <ChartLoader height={resolvedHeight} message="Cargando datos..." size={60} speed={1.5} />;
      case 'EMPTY_MSG':
        return (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 400 }}>Sin datos</Typography>
            <Typography variant="caption" color="text.secondary">No hay datos disponibles</Typography>
          </Box>
        );
      case 'RENDER_CHART':
        return (
          <Suspense
            fallback={(
              <Box data-preview-state="LOADING">
                <ChartLoader height={resolvedHeight} message="Cargando..." size={100} speed={1.5} />
              </Box>
            )}
          >
            {ChartComponent ? (
              // Para Text charts, pasar styles y colors directamente desde chartProps
              // Para otros charts, pasar chartData y chartProps normalmente
              isTextChart ? (
                <ChartComponent
                  styles={chartProps?.styles || {}}
                  colors={chartProps?.colors || colors || []}
                  editionMode={editionMode}
                />
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    minWidth: 0,
                    minHeight: 0,
                    boxSizing: "border-box",
                    "& *": {
                      boxSizing: "border-box",
                    },
                  }}
                >
                  <ChartComponent
                    {...chartProps}
                    onClick={typeof chartProps?.onClick === "function" ? handleChartClick : undefined}
                    data={chartData?.data }
                    {...(!isGridHeatMap && colors != null ? { colors } : {})}
                    editionMode={editionMode}
                    onPreFilterApplied={onPreFilterApplied}
                    onPreFilterCleared={onPreFilterCleared}
                    {...(isSearchTable ? { onSearchCommit: handleSearchCommit } : {})}
                    // Dashboards render many charts that resize with the grid; nivo's
                    // spring animations flood rAF with work and hit a known react-spring
                    // bug (scientific-notation values -> invalid SVG transform errors).
                    // Immediate mode keeps the board fluid; the panel editor keeps its
                    // animations since `animate` only gets forced inside dashboards.
                    {...(dashboard ? { animate: false } : {})}
                  />
                </Box>
              )
            ) : null}
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <Box
      ref={elementRef}
      data-preview-state={viewState}
      sx={{
        ...CONTAINER_STYLE,
        height: resolvedHeight,
        minHeight: resolvedHeight,
        overflow: "hidden",
        boxSizing: "border-box",
        "& *": { boxSizing: "border-box" },
      }}
    >
      {renderContent()}
    </Box>
  );
}