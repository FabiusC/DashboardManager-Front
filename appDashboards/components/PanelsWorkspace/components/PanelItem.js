import { Box, Typography, IconButton, Paper, Tooltip } from "@mui/material";
import { InfoOutlined, Close, TableView, GridOn, DataObject, Edit, Image as ImageIcon, ConstructionOutlined } from "@mui/icons-material";
import { useEffect, useRef, useState, useMemo, useCallback, memo } from "react";
import { useRouter } from "next/router";
import ChartPreview from "../chart/ChartComponents/ChartPreview";
import MenuActions from "./MenuActions";
import ChartLoader from "../chart/loaders/ChartLoader";
import { buildFileName } from "../../../source/downloads";
import NoDataView from "../chart/ChartComponents/NoDataView";
import SelectFieldsGuidance from "./SelectFieldsGuidance";
import SelectChartTypeGuidance from "./SelectChartTypeGuidance";

const getPriorityValue = (setUp, setUpChanged, path) => {
    let changed = setUpChanged;
    let base = setUp;
    for (const key of path) {
        changed = changed?.[key];
        base = base?.[key];
    }
    return changed !== undefined && changed !== null ? changed : base;
};

function PanelItem({
    panel,
    chartState,
    onDeletePanel,
    onRequestDownload,

    dashboard = false,
    editionMode = false,
    domIdPrefix = "",
    captureMode = false,
    panelPreviewRef = null,

    user,
    setLayouts,
    changeSideTabState,
    setFieldConfigurationError,
    setError,
    editionPanels,
    reloadTrigger,
    reportPreFilterConfig,
    dashboardPreFilterBlocked,
    onPreFilterApplied,
    onPreFilterCleared,
    ...props
}) {
    const router = useRouter();
    const panelSetUp = panel?.setUp?.current || {};
    const panelSetUpChanged = panel?.setUp?.changed || {};
    const panelId = panel?.panel?.id;
    const domPanelId = `${domIdPrefix}${panelId}`;
    const isPanelLoading =
        panel?.state?.isLoading === true || panel?.panel?.state?.isLoading === true;

    // Detectar si estamos en dashboard (no en panel editor)
    // El panel editor está en /panelsWorkspace, los dashboards están en /dashboardsWorkspace o /dashboard/[id]
    const isInDashboard = dashboard && router.pathname && !router.pathname.includes('/panelsWorkspace');

    const pv = useCallback(
        (path) => getPriorityValue(panelSetUp, panelSetUpChanged, path),
        [panelSetUp, panelSetUpChanged]
    );
    const [panelHeight, setPanelHeight] = useState(undefined);
    const [downloadChartState, setDownloadChartState] = useState(null);
    const panelRef = useRef(null);

    const getDownloadExt = (type) => ({ csv: "csv", excel: "xlsx", json: "json", png: "png" }[type] || "csv");
    const rafId = useRef(null);

    useEffect(() => {
        if (!panelRef.current) return;
        const el = panelRef.current;
        const initialHeight = el.getBoundingClientRect().height;
        if (initialHeight > 0) {
            setPanelHeight(initialHeight);
        }

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target !== el) continue;
                if (el.closest(".dashboard-grid-root--dragging")) return;
                if (rafId.current) cancelAnimationFrame(rafId.current);
                rafId.current = requestAnimationFrame(() => {
                    setPanelHeight(entry.contentRect.height);
                });
            }
        });

        observer.observe(el);
        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current);
            observer.disconnect();
        };
    }, []);

    const paperStyles = useMemo(() => {
        const showBorder = pv(["external_border", "is_active"]) === true || pv(["external_border", "is_active"]) === "true";
        const isBackgroundActive = pv(["background", "is_active"]) === true || pv(["background", "is_active"]) === "true";
        const dimensionsActiveValue = pv(["dimensions", "is_active"]);
        const isDimensionsActive = dimensionsActiveValue === undefined ||
            dimensionsActiveValue === true ||
            dimensionsActiveValue === "true";
        const border = showBorder
            ? `${pv(["external_border", "size", "value"])}px ${pv(["external_border", "style", "value"])} ${pv(["external_border", "color", "value"])}`
            : "inherit";
        const borderRadius = showBorder ? `${pv(["external_border", "radius", "value"])}px` : 0;
        const isActiveBorderDivider = showBorder &&
            (pv(["external_border", "active_border", "value"]) === true ||
                pv(["external_border", "active_border", "value"]) === "true");
        const background_color = isBackgroundActive
            ? pv(["background", "background_color", "value"]) || "inherit"
            : "inherit";
        const padding = isDimensionsActive
            ? `${pv(["dimensions", "paddingDimensions", "paddingTop", "value"]) ?? 10}px ${pv(["dimensions", "paddingDimensions", "paddingRight", "value"]) ?? 10}px ${pv(["dimensions", "paddingDimensions", "paddingBottom", "value"]) ?? 10}px ${pv(["dimensions", "paddingDimensions", "paddingLeft", "value"]) ?? 10}px`
            : "0px";
        const externalShadowActive = pv(["external_shadow", "is_active"]) === true || pv(["external_shadow", "is_active"]) === "true";
        let boxShadow = "none";
        if (externalShadowActive) {
            const useDefault = pv(["external_shadow", "default", "value"]) === "true";
            if (useDefault) {
                boxShadow = pv(["external_shadow", "default", "type", "value"]);
            } else if (pv(["external_shadow", "personalized", "value"]) === "true") {
                const l1 = pv(["external_shadow", "personalized", "layer_1", "value"]) === "true"
                    ? `${pv(["external_shadow", "personalized", "layer_1", "offset_x", "value"])}px ${pv(["external_shadow", "personalized", "layer_1", "offset_y", "value"])}px ${pv(["external_shadow", "personalized", "layer_1", "blur", "value"])}px ${pv(["external_shadow", "personalized", "layer_1", "spread_radius", "value"])}px ${pv(["external_shadow", "personalized", "layer_1", "color", "value"])}`
                    : null;
                const l2 = pv(["external_shadow", "personalized", "layer_2", "value"]) === "true"
                    ? `${pv(["external_shadow", "personalized", "layer_2", "offset_x", "value"])}px ${pv(["external_shadow", "personalized", "layer_2", "offset_y", "value"])}px ${pv(["external_shadow", "personalized", "layer_2", "blur", "value"])}px ${pv(["external_shadow", "personalized", "layer_2", "spread_radius", "value"])}px ${pv(["external_shadow", "personalized", "layer_2", "color", "value"])}`
                    : null;
                const l3 = pv(["external_shadow", "personalized", "layer_3", "value"]) === "true"
                    ? `${pv(["external_shadow", "personalized", "layer_3", "offset_x", "value"])}px ${pv(["external_shadow", "personalized", "layer_3", "offset_y", "value"])}px ${pv(["external_shadow", "personalized", "layer_3", "blur", "value"])}px ${pv(["external_shadow", "personalized", "layer_3", "spread_radius", "value"])}px ${pv(["external_shadow", "personalized", "layer_3", "color", "value"])}`
                    : null;
                boxShadow = [l1, l2, l3].filter(Boolean).join(", ") || "none";
            }
        }

        return {
            cursor: editionMode && dashboard ? "grab" : "inherit",
            height: "100%",
            width: "100%",
            minHeight: dashboard ? 0 : "100px",
            minWidth: dashboard ? 0 : "200px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border,
            borderRadius,
            fontFamily: panelSetUp.typography || "inherit",
            transition: dashboard ? "none" : "all 0.2s ease",
            position: "relative",
            boxSizing: "border-box",
            boxShadow,
            borderBottomDivider: isActiveBorderDivider ? "1px solid #e0e0e0" : "none",
            background_color: background_color,
            padding
            
        };
    }, [editionMode, panelSetUp, panelSetUpChanged, pv]);
    const handleDelete = useCallback(() => {
        if (!onDeletePanel || !panelId) return;
        onDeletePanel(panelId);
    }, [onDeletePanel, panelId]);

    const handleEditPanel = useCallback(() => {
        if (!panelId) return;

        // Preservar valores existentes de sessionStorage (projectId, folderId, etc.)
        // Estos valores son necesarios para el contexto del panel editor
        const existingProjectId = sessionStorage.getItem('projectId');
        const existingFolderId = sessionStorage.getItem('folderId');
        const existingProjectName = sessionStorage.getItem('projectName');
        const existingFolderName = sessionStorage.getItem('folderName');
        const existingGroupId = sessionStorage.getItem('groupId');

        // Guardar información del panel para cargar en el editor
        sessionStorage.setItem('resourceId', panelId.toString());
        sessionStorage.setItem('resourceName', panel?.panel?.name || panel?.panel?.title || '');
        sessionStorage.setItem('resourceType', 'panel');

        // Preservar valores existentes (establecer solo si existen, para mantener el contexto)
        // Estos valores son necesarios para operaciones como crear paneles, permisos, etc.
        if (existingProjectId) {
            sessionStorage.setItem('projectId', existingProjectId);
        }
        if (existingFolderId) {
            sessionStorage.setItem('folderId', existingFolderId);
        }
        if (existingProjectName) {
            sessionStorage.setItem('projectName', existingProjectName);
        }
        if (existingFolderName) {
            sessionStorage.setItem('folderName', existingFolderName);
        }
        if (existingGroupId) {
            sessionStorage.setItem('groupId', existingGroupId);
        }

        // Navegar al panel editor
        router.push('/panelsWorkspace');
    }, [panelId, panel?.panel?.name, panel?.panel?.title, router]);

    const hasChartType = !!chartState?.hasChartType;

    // Configuración de descargas provista por el backend
    const downloadConfig = panel?.setUp?.current?.download;
    const iconColor = downloadConfig?.icon_color?.value || "#1976d2";

    const downloadActionsDefs = useMemo(() => {
        if (!downloadConfig) return [];
        return [
            { key: "csv", label: "CSV", description: "Archivo de valores separados por coma", icon: <TableView sx={{ fontSize: 18, color: iconColor }} /> },
            { key: "excel", label: "Excel", description: "Libro de Excel (.xlsx)", icon: <GridOn sx={{ fontSize: 18, color: iconColor }} /> },
            { key: "json", label: "JSON", description: "Datos estructurados en formato JSON", icon: <DataObject sx={{ fontSize: 18, color: iconColor }} /> },
            { key: "png", label: "Imagen", description: "Captura del panel en formato PNG", icon: <ImageIcon sx={{ fontSize: 18, color: iconColor }} /> }
        ];
    }, [downloadConfig, iconColor]);

    const availableActions = useMemo(() => {
        return downloadActionsDefs.filter(({ key }) => {
            const cfg = downloadConfig?.[`${key}_format`];
            const val = cfg?.value;
            return val === true || val === "true";
        });
    }, [downloadConfig, downloadActionsDefs]);


    const handleOpenDownloadModal = useCallback((actionKey) => {
        const ext = getDownloadExt(actionKey);
        const baseTitle = panel?.panel?.title || "data";
        const titleForName = actionKey === "json" ? (baseTitle ? baseTitle.toUpperCase() : "data") : baseTitle;
        const defaultFileName = buildFileName(titleForName, ext);
        onRequestDownload?.({ type: actionKey, defaultFileName, panel, downloadChartState: downloadChartState || chartState });
    }, [panel, downloadChartState, chartState, onRequestDownload]);


    return (
        <Paper elevation={1} sx={{
            ...paperStyles,
            userSelect: 'none',
            backgroundColor: paperStyles.background_color,
            // boxShadow: "none",
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            WebkitTouchCallout: 'none',
            WebkitTapHighlightColor: 'transparent',
            position: "relative",
                                                        
        }}
            id={`panel-${domPanelId}`}
            ref={panelPreviewRef}
            data-preview-loading={isPanelLoading ? "true" : "false"}
        >
            {panel?.state?.isLoading && (
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        bgcolor: "rgba(255, 255, 255, 0.7)",
                        zIndex: 10,
                    }}
                >
                    <ChartLoader size={100} speed={1.5} message={"Cargando distribución..."} />
                </Box>
            )}

            <Box sx={{ borderBottom: paperStyles.borderBottomDivider }}>
                <Box
                    sx={{position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center",
                        bgcolor: pv(["title", "is_active"]) ? pv(["title", "background_color", "value"]) : undefined,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5, order: 1, flex: 1 }} id={`actionsPanel-${domPanelId}`}>
                        <Box sx={{ ml: 1, flexShrink: 0 }}>
                            {pv(["description", "is_active"]) &&
                                pv(["description", "visibility_mode_icon", "value"]) == "true" && (
                                    <Tooltip title={panel?.panel?.description} arrow placement="top">
                                        <span>
                                            <IconButton size="small">
                                                <InfoOutlined
                                                    sx={{
                                                        fontSize: "14px",
                                                        color: pv([
                                                            "description",
                                                            "visibility_mode_icon",
                                                            "visibility_mode_icon_color",
                                                            "value",
                                                        ]),
                                                    }}
                                                />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                )}
                            {pv(["menu_actions", "is_active"]) && (
                                <MenuActions
                                    getPriorityValue={getPriorityValue}
                                    panel={panel}
                                    displayActions={downloadActionsDefs}
                                    availableActions={availableActions}
                                    downloadEnabled={dashboard && availableActions.length > 0 && !editionMode && downloadConfig?.is_enabled === true}
                                    onOpenDownloadModal={handleOpenDownloadModal}
                                />
                            )}
                        </Box>


                        {isInDashboard && editionMode && (
                            <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 0.5 }}>
                                {/* Botón de editar panel - visible solo en modo edición */}
                                <Tooltip title={"Editar panel"} arrow placement="top">
                                    <span>
                                        <IconButton size="small" className="no-drag" onClick={handleEditPanel}>
                                            <Edit sx={{ fontSize: "14px" }} />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                                {/* Botón de eliminar - solo visible en modo edición */}
                                <Tooltip title={"Eliminar panel"} arrow placement="top">
                                    <span>
                                        <IconButton size="small" className="no-drag" onClick={handleDelete}>
                                            <Close sx={{ fontSize: "14px" }} />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Box>
                        )}

                    </Box>


                    {pv(["title", "is_active"]) ? (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent:
                                    pv(["title", "text_align", "value"]) === "center"
                                        ? "center"
                                        : pv(["title", "text_align", "value"]) === "right"
                                            ? "flex-end"
                                            : "flex-start",
                                alignItems: "center",
                                color: pv(["title", "font_color", "value"]),
                                overflow: "hidden",
                                minHeight: "40px",
                                width: "100%", // Ensure it fills space
                            }}
                        >
                            <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", alignItems: 'center' }}>
                                <Tooltip
                                    title={panel?.panel?.title?.toUpperCase()}
                                    arrow
                                    placement="top"
                                    enterDelay={500}
                                >
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            paddingTop: `${pv(["title","padding","paddingTop", "value"]) ?? 4}px`,
                                            paddingBottom: `${pv(["title", "padding", "paddingBottom", "value"]) ?? 4}px`,
                                            paddingLeft: `${pv(["title", "padding", "paddingLeft", "value"]) ?? 4}px`,
                                            paddingRight: `${pv(["title", "padding",  "paddingRight", "value"]) ?? 4}px`,
                                            
                                            fontSize: `${pv(["title", "font_size", "value"])}px`,
                                            fontWeight: pv(["title", "font_weight", "value"]),
                                            fontFamily: pv(["title", "font_family", "value"]),
                                            color: pv(["title", "font_color", "value"]),
                                            // --- Truncation Logic ---
                                            display: 'block',
                                            width: '100%',
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            cursor: 'default'
                                        }}
                                    >
                                        {panel?.panel?.title?.toUpperCase()}
                                    </Typography>
                                </Tooltip>
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                            {pv(["description", "is_active"]) &&
                                pv(["description", "visibility_mode_icon", "value"]) == "true" && (
                                    <Tooltip title={panel?.panel?.description} arrow placement="top">
                                        <span>
                                            <IconButton size="small">
                                                <InfoOutlined
                                                    sx={{
                                                        fontSize: "14px",
                                                        color: pv([
                                                            "description",
                                                            "visibility_mode_icon",
                                                            "visibility_mode_icon_color",
                                                            "value",
                                                        ]),
                                                    }}
                                                />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                )}
                        </Box>
                    )}
                </Box>
                {pv(["description", "is_active"]) &&
                    pv(["description", "visibility_mode_text", "value"]) == "true" && (
                        <Typography
                            variant="body2"
                            sx={{
                                paddingTop: `${pv(["description", "paddingDescription", "paddingTop","value"]) ?? 4}px`,
                                paddingBottom: `${pv(["description","paddingDescription", "paddingBottom","value"]) ?? 4}px`,
                                paddingLeft: `${pv(["description","paddingDescription", "paddingLeft","value"]) ?? 4}px`,
                                paddingRight: `${pv(["description","paddingDescription", "paddingRight","value"]) ?? 4}px`,
                                textAlign: pv(["description", "visibility_mode_text", "text_align", "value"]),
                                color: pv(["description", "visibility_mode_text", "font_color", "value"]),
                                fontWeight: pv(["description", "visibility_mode_text", "font_weight", "value"]),
                                fontSize: `${pv(["description", "visibility_mode_text", "font_size", "value"])}px`,
                                bgcolor: pv(["description", "visibility_mode_text", "background_color", "value"]),
                                fontFamily: pv(["description", "visibility_mode_text", "font_family", "value"]),
                            }}
                        >
                            {panel?.panel?.description}
                        </Typography>
                    )}
            </Box>

            <Box
                ref={panelRef}
                className={`panel-content-${panelId}`}
                id={`contentPanel_${domPanelId}`}
                sx={{
                    height: "100%",

                    // bgcolor: pv(["background", "background_color", "value"]) || "inherit",
                }}
            >
                {hasChartType ? (
                    <ChartPreview
                        height={captureMode ? "100%" : panelHeight}
                        editionMode={editionMode}
                        dashboard={dashboard}
                        captureMode={captureMode}
                        chartState={chartState}
                        idPanel={panelId}
                        reloadTrigger={reloadTrigger}
                        onChartStateUpdate={setDownloadChartState}
                        reportPreFilterConfig={dashboard ? reportPreFilterConfig : undefined}
                        dashboardPreFilterBlocked={dashboard ? dashboardPreFilterBlocked : false}
                        onPreFilterApplied={dashboard ? onPreFilterApplied : undefined}
                        onPreFilterCleared={dashboard ? onPreFilterCleared : undefined}
                    />
                ) : (
                    <Box
                        sx={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            borderRadius: 1,
                        }}
                    >
                        {!editionMode ? (
                            <NoDataView message="Configuración del panel incompleta" size={60} />
                        ) : !chartState?.queryParameters?.selected_fields?.length ? (
                            <SelectFieldsGuidance showGuidance />
                        ) : (
                            <SelectChartTypeGuidance selectedFieldsCount={chartState?.queryParameters?.selected_fields?.length ?? 0}/>
                        )}
                    </Box>
                )}
            </Box>
        </Paper>
    );
}


function queryParamsForRequestEqual(a, b) {
    if (a === b) return true;
    if (!a || !b) return !a && !b;
    return (
        a.limit === b.limit &&
        a.sort_field === b.sort_field &&
        a.sort_direction === b.sort_direction &&
        a.sort_criterion === b.sort_criterion &&
        a.enablePercentage === b.enablePercentage &&
        JSON.stringify(a.sort_rule) === JSON.stringify(b.sort_rule)
    );
}

export default memo(PanelItem, (prev, next) => {
    if (prev.editionMode !== next.editionMode || prev.dashboard !== next.dashboard ||
        prev.domIdPrefix !== next.domIdPrefix || prev.captureMode !== next.captureMode ||
        prev.panelPreviewRef !== next.panelPreviewRef ||
        prev.onDeletePanel !== next.onDeletePanel || prev.panel !== next.panel ||
        prev.reloadTrigger !== next.reloadTrigger) return false;
    if (prev.dashboardPreFilterBlocked !== next.dashboardPreFilterBlocked) return false;
    if (prev.chartState === next.chartState) return true;
    if (!prev.chartState || !next.chartState) return false;
    return queryParamsForRequestEqual(prev.chartState.queryParameters, next.chartState.queryParameters);
});
