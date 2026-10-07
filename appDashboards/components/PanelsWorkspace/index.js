import { useState, useEffect, useMemo, useRef } from "react";
import {
    Box,
    Paper
} from "@mui/material";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
    Settings,
    TableViewRounded,
    BarChart,
    SchemaRounded,
    QueryStats,
    ColorLens,
} from "@mui/icons-material";
import { SizeMe } from "react-sizeme";
import { connect, useDispatch } from "react-redux";
import { useRouter } from "next/router";

/* CONTEXT & HOOKS */
import useModals from "./hooks/useModalsContext";
import useTabs from "./hooks/useTabsContext";
import useTabsLayout from "./hooks/useTabsLayout";
import { usePanelContext } from "./hooks/usePanelContext";
import { useChartContext } from "./hooks/useChartContext";

/* SECCIONES Y COMPONENTES */
import SetupMenu from "./menus/SetupMenu";
import CreatePanel from "./components/CreatePanel";
import FieldSelector from "./menus/SideMenuComponents/FieldSelector";
import VisualizationSetup from "./menus/SideMenuComponents/VisualizationSetup";
import PanelSetup from "./menus/SetupMenuComponents/PanelSetup";
import QuerySetup from "./menus/SetupMenuComponents/QuerySetup";
import ChartSetup from "./menus/SetupMenuComponents/ChartSetup";
import ColorsSetup from "./menus/SetupMenuComponents/ColorsSetup";
import PublicationConfig from "./menus/SetupMenuComponents/contentPanels/PublicationConfig";
import BaseDialog from "@components/Recursive/Modals/BaseDialog";
import ConfirmationModal from "./components/ConfirmationModal";
import HeaderWorkspace from "./sections/HeaderWorkSpace";
import LeftSectionMenu from "./sections/LeftSectionMenu";
import PanelCanva from "./sections/PanelCanva";
import PanelItem from "./components/PanelItem";
import { deleteRequest } from "../../helpers/dashboardAPI/genericRequest";


import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import usePanelsWorkspaceActions from "./hooks/usePanelsWorkspaceActions";
import { usePanelPreview } from "./hooks/usePanelPreview";
import { PANEL_PREVIEW_SIZE } from "@services/previewService";

let renderCounter = 0;
const MAP_CHART_TYPES = new Set([
    "colombian_map",
    "colombian_municipality_map",
    "heatmap",
    "clustermap",
]);

const getSelectedFieldsStructureSignature = (fields = []) =>
    JSON.stringify(
        fields.map((field) => ({
            field_id: field?.field_id ?? field?.id ?? null,
            name: field?.name ?? "",
            alias: field?.alias ?? "",
            type: field?.type ?? "",
        }))
    );

function PanelsWorkspace(props) {


    /* ----------------- estado local ----------------- */
    const [editionMode, setEditionMode] = useState(false);
    const [editionPanels, setEditionPanels] = useState([]);
    const [fieldToDelete, setFieldToDelete] = useState(null);
    const [fieldToCreate, setFieldToCreate] = useState(null);
    const [panelId, setPanelId] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const previousPanelIdRef = useRef(null);
    const previousSelectedFieldsStructureRef = useRef(null);
    const previousSortRuleRef = useRef(null);

    /* -------------- hooks de contexto / redux -------------- */
    const dispatch = useDispatch();
    const router = useRouter();
    const panel = usePanelContext();
    const chart = useChartContext();
    const { sideWidth, setupWidth } = useTabsLayout();
    const modals = useModals();
    const { initTabs, changeSideTabState } = useTabs();
    const panelPreviewRef = useRef(null);
    const mapPreviewRef = useRef(null);
    const previewPanelId = panel.state.panel?.id;
    const isMapPreview = MAP_CHART_TYPES.has(chart.state.chartType?.name);
    const previewElementRef = isMapPreview ? mapPreviewRef : panelPreviewRef;
    const previewElementId = isMapPreview
        ? `panel-${previewPanelId}`
        : `panel-capture-${previewPanelId}`;

    const {
        isCapturing: isPanelPreviewCapturing,
        requestPreview,
    } = usePanelPreview({
        panelId: previewPanelId,
        elementRef: previewElementRef,
        elementId: previewElementId,
        token: props.user[0].userID,
        fixedSize: !isMapPreview,
        dispatch,
    });

    /* -------- Hook de acciones -------- */
    const {
        /* acciones */
        handleSelectedChartType,
        handleGetPanels,
        handleLayoutChange,
        savePanelQueryParameters,
        handleUpdateFieldMetric,
        /* estados */
        isLoadingPanels,
        layouts,
    } = usePanelsWorkspaceActions(props.user[0].userID)

    /* -- side & setup tabs base (idénticos a antes) -- */
    const sideTabsDefault = [
        {
            name: "setup",
            label: "Visualización",
            description: "Visualización de los datos",
            icon: <SchemaRounded sx={{ fontSize: 21 }} />,
            state: { isLoading: false, isDisabled: true, isActive: false },
            component: () => (
                <VisualizationSetup
                    onSelectedChartType={handleSelectedChartType}
                    sx={{ fontSize: 21 }}
                />
            ),
        },
        {
            name: "data",
            label: "Campos",
            description: "Sección de campos que se usarán en la gráfica",
            icon: <TableViewRounded sx={{ fontSize: 21 }} />,
            state: { isLoading: false, isDisabled: true, isActive: false },
            component: () => (
                <FieldSelector
                    panel={panel.state}
                    setFieldToCreate={setFieldToCreate}
                    sx={{ fontSize: 21 }}
                />
            ),
        },
        {
            name: "publication",
            label: "Configuración",
            description: "Configuración de publicación y permisos",
            icon: <Settings sx={{ fontSize: 21 }} />,
            state: { isLoading: false, isDisabled: false, isActive: false },
            component: () => (
                <PublicationConfig
                    userToken={props.user[0].userID}
                    onPanelSaved={requestPreview}
                />
            ),
        },
    ];

    const setupTabsDefault = [
        {
            name: "setupColors",
            label: "Colores",
            description: "Sección de colores de la gráfica",
            icon: <ColorLens sx={{ fontSize: 17 }} />,
            state: { isLoading: false, isDisabled: true, isActive: false },
            component: (p) => <ColorsSetup {...p} sx={{ fontSize: 21 }} />,
        },
        {
            name: "setupQuery",
            label: "Consulta",
            description: "Sección de configuración de la consulta",
            icon: <QueryStats sx={{ fontSize: 17 }} />,
            state: { isLoading: false, isDisabled: true, isActive: false },
            component: (p) => <QuerySetup {...p} sx={{ fontSize: 21 }} />,
        },
        {
            name: "setupChart",
            label: "Gráfica",
            description: "Sección de configuración de la gráfica",
            icon: <BarChart sx={{ fontSize: 17 }} />,
            state: { isLoading: false, isDisabled: true, isActive: false },
            component: (p) => <ChartSetup {...p} sx={{ fontSize: 21 }} />,
        },
        {
            name: "setupPanel",
            label: "Panel",
            description: "Sección de configuración del panel",
            icon: <Settings sx={{ fontSize: 17 }} />,
            state: { isLoading: false, isDisabled: true, isActive: false },
            component: (p) => <PanelSetup {...p} sx={{ fontSize: 21 }} />,
        },
    ];

    /* ---------------- EFFECTS ---------------- */
    /* Guarda selected_fields cuando cambien */
    useEffect(() => {
        const currentPanelId = panel.state.panel?.id;
        if (!currentPanelId) {
            return;
        }

        if (isLoadingPanels) {
            return;
        }

        const selectedFields = chart.state.queryParameters?.selected_fields;
        if (selectedFields === undefined) {
            return;
        }

        const selectedFieldsStructure = getSelectedFieldsStructureSignature(selectedFields);
        const sortRuleSignature = JSON.stringify(
            chart.state.queryParameters?.sort_rule ?? null
        );

        if (previousPanelIdRef.current !== currentPanelId) {
            previousPanelIdRef.current = currentPanelId;
            previousSelectedFieldsStructureRef.current = selectedFieldsStructure;
            previousSortRuleRef.current = sortRuleSignature;
            return;
        }

        const shouldSave =
            previousSelectedFieldsStructureRef.current === null ||
            previousSelectedFieldsStructureRef.current !== selectedFieldsStructure ||
            previousSortRuleRef.current !== sortRuleSignature;

        previousSelectedFieldsStructureRef.current = selectedFieldsStructure;
        previousSortRuleRef.current = sortRuleSignature;

        if (!shouldSave) {
            return;
        }

        savePanelQueryParameters({
            dispatch,
            userID: props.user[0].userID,
            panelId: currentPanelId,
            selectedFields,
            sortRule: chart.state.queryParameters?.sort_rule,
        });
    }, [
        chart.state.queryParameters?.selected_fields,
        chart.state.queryParameters?.sort_rule,
        panel.state.panel?.id,
        isLoadingPanels,
    ]);

    /* Guarda solo filters cuando cambien */
    useEffect(() => {
        if (!panel.state.panel?.id) {
            return;
        }

        if (chart.state.queryParameters?.filters === undefined) {
            return;
        }

        savePanelQueryParameters({
            dispatch,
            userID: props.user[0].userID,
            panelId: panel.state.panel.id,
            filters: chart.state.queryParameters?.filters,
        });
    }, [chart.state.queryParameters?.filters]);

    /* Inicializa tabs */
    useEffect(() => {
        initTabs(sideTabsDefault, setupTabsDefault);
    }, []);

    /* Obtiene resourceId y configura edición */
    useEffect(() => {
        const sessionPanelId = sessionStorage.getItem("resourceId");
        if (sessionPanelId) {
            setEditionMode(true);
            setEditionPanels([sessionPanelId]);
            setPanelId(sessionPanelId);
        }
        // Marcar como inicializado después de verificar sessionStorage
        setIsInitialized(true);
    }, []);

    const selectedFieldsLength = useMemo(() => {
        const length = chart.state.queryParameters?.selected_fields?.length || 0;
        return length;
    }, [chart.state.queryParameters?.selected_fields]);

    useEffect(() => {

        if (selectedFieldsLength > 0) {
            changeSideTabState("setup", "isDisabled", false);

            if (!chart.state.hasChartType) {
                changeSideTabState('setup', 'isActive', true);
            }
        } else {
            changeSideTabState("setup", "isDisabled", true);
            changeSideTabState("setup", "isActive", false);
        }
    }, [selectedFieldsLength]);

    /* Abrir modal creación si es nuevo */
    useEffect(() => {
        // Solo abrir modal después de inicializar y si no estamos en modo edición Y no hay panelId
        if (isInitialized && !editionMode && panelId == null && !panel.state.panel?.id) {
            modals.openCreateModal();
        }
    }, [isInitialized, editionMode, panel.state.panel?.id, panelId]);

    /* Cargar panel en modo edición */
    useEffect(() => {
        if (editionMode && editionPanels.length) {
            handleGetPanels(editionPanels[0]);
            changeSideTabState("data", "isDisabled", false);
            changeSideTabState("data", "isActive", true);
        }
    }, [editionPanels.length]);




    //console.log("Render #", renderCounter++);
    //console.log("state panel ", panel);
    // console.log("state chart", chart);
    //console.log("layputs" , layouts)

    /* ---------------- RENDER ---------------- */
    return (
        <>
            {/* ----- LAYOUT PRINCIPAL ----- */}
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <DndProvider backend={HTML5Backend}>
                    <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, overflow: "hidden", minHeight: 0 }}>
                        <Paper variant="outlined" sx={{ display: "flex", flexDirection: "row", height: "100%", overflow: "hidden" }}>
                            <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden", height: "100%", width: "100%", minWidth: 0 }}>
                                <LeftSectionMenu />
                                <Box sx={{ flex: 1, minWidth: 0, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
                                    <HeaderWorkspace
                                        panelTitle={panel.state.panel.title}
                                        setFieldToDelete={setFieldToDelete}
                                        onOperationChange={handleUpdateFieldMetric}
                                    />
                                    <Box sx={{ display: "flex", flexDirection: "row", flex: 1, minWidth: 0, width: "100%", overflow: "hidden", minHeight: 0 }}>
                                        <SizeMe monitorWidth monitorHeight>
                                            {({ size: canvasSize }) => (
                                                <Box sx={{ flex: 1, minWidth: 0, overflow: "hidden", display: "flex" }}>
                                                    <PanelCanva
                                                        size={canvasSize && typeof canvasSize.width === 'number' ? { width: canvasSize.width, height: canvasSize.height } : props.dimensions}
                                                        isLoadingPanels={isLoadingPanels}
                                                        panel={panel}
                                                        layouts={layouts}
                                                        handleLayoutChange={handleLayoutChange}
                                                        editionMode={editionMode}
                                                        panelPreviewRef={isMapPreview ? mapPreviewRef : undefined}
                                                        user={props.user}
                                                        handleSelectedChartType={handleSelectedChartType}
                                                        setFieldToCreate={setFieldToCreate}
                                                    />
                                                </Box>
                                            )}
                                        </SizeMe>
                                        {setupWidth > 0 && (
                                            <SetupMenu
                                                user={props.user[0]}
                                                onPanelSaved={requestPreview}
                                            />
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                </DndProvider>
            </Box>

            {isPanelPreviewCapturing && !isMapPreview && previewPanelId && (
                <Box
                    aria-hidden="true"
                    sx={{
                        position: "fixed",
                        top: 0,
                        left: "-100000px",
                        width: `${PANEL_PREVIEW_SIZE.width}px`,
                        height: `${PANEL_PREVIEW_SIZE.height}px`,
                        overflow: "hidden",
                        pointerEvents: "none",
                        zIndex: -1,
                    }}
                >
                    <PanelItem
                        panel={panel.state}
                        chartState={chart.state}
                        user={props.user[0]}
                        editionMode
                        dashboard
                        captureMode
                        domIdPrefix="capture-"
                        panelPreviewRef={panelPreviewRef}
                        reloadTrigger={chart.state.reloadChartConfig}
                    />
                </Box>
            )}

            {/* --------------- MODALES --------------- */}
            <BaseDialog
                open={modals.isCreateModalOpen}
                onClose={() => router.push("/projects/folders/products")}
                maxWidth="lg"
                sx={{ maxWidth: 900 }}
            >
                <CreatePanel
                    setIsCreateModal={modals.closeCreateModal}
                    user={props.user[0]}
                    handleReturnIndex={() => router.push("/projects/folders/products")}
                />
            </BaseDialog>

            {/* Confirmación de DELETE field */}
            <ConfirmationModal
                open={modals.isDeleteFieldModalOpen}
                onClose={modals.closeDeleteFieldModal}
                title="Advertencia"
                description="¿Estás seguro de que deseas realizar esta acción? Esta acción eliminará la gráfica completa y no se puede deshacer."
                onConfirm={async () => {
                    if (fieldToDelete) {
                        if (chart.state.chartTypeId) chart.actions.changeChartType(null);

                        // Reset chart data keeping only the updated selected_fields (without the deleted field)
                        chart.actions.resetChartData();

                        await deleteRequest(dispatch, props.user[0].userID, 'delatePanelUnassign_chart_type', 'configuración del panel', '', { id: panel.state.panel.id });
                        chart.actions.handleRemoveField(fieldToDelete);

                        modals.closeDeleteFieldModal();

                    }
                }}
            />

            {/* Confirmación de CREATE field */}
            <ConfirmationModal
                open={modals.isCreateFieldModalOpen}
                onClose={modals.closeCreateFieldModal}
                title="Advertencia de crear"
                description="¿Estás seguro de que deseas realizar esta acción? Esta acción eliminará la gráfica completa y no se puede deshacer."
                onConfirm={async () => {
                    if (!fieldToCreate || !panel.state.panel?.id) return;
                    const current =
                        chart.state.queryParameters?.selected_fields || [];
                    const normalizedField =
                        chart.actions.handleAddField(fieldToCreate);
                    if (!normalizedField) return;
                    const newSelectedFields = [...current, normalizedField];
                    if (chart.state.chartTypeId) chart.actions.changeChartType(null);
                    chart.actions.resetChartData();

                    await deleteRequest(dispatch, props.user[0].userID, 'delatePanelUnassign_chart_type', 'configuración del panel', '', { id: panel.state.panel.id });

                    await savePanelQueryParameters({
                        dispatch,
                        userID: props.user[0].userID,
                        panelId: panel.state.panel.id,
                        selectedFields: newSelectedFields,
                        sortRule: chart.state.queryParameters?.sort_rule,
                    });

                    modals.closeCreateFieldModal();
                }}
            />
        </>
    );
}

const mapStateToProps = (state) => ({ user: state.user, dimensions: state.dimensions });
export default connect(mapStateToProps)(PanelsWorkspace);
