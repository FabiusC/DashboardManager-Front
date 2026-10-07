import { dashboardGeneralRequest as generalRequest } from "@services/dashboardAPI";
import { pushNotification } from "@redux/actions";
import { handleGetPanels, normalizeLayout } from "../../shared/utils/dashboardActions";
import { toApiPositions } from "../../shared/components/grid/gridLayoutMapper";
import { handleUpdateDashboardCategories } from "../../shared/utils/dashboardActions";

const DEFAULT_W = 3;
const DEFAULT_H = 2;

// Assign the categories of the target dashboard to the dragged dashboard on drop
export const assignDashboardCategoriesOnDrop = async ({
    draggedDashboardId,
    targetDashboard,
    userToken,
    dispatch,
    setDashboard,
}) => {
    const categories = Array.isArray(targetDashboard?.categories) ? targetDashboard.categories : [];
    if (categories.length === 0) {
        dispatch(pushNotification({ msg: "No se pueden asignar categorías: el tablero destino no tiene categorías.", status: "err" }));
        return false;
    }
    if (!draggedDashboardId || String(draggedDashboardId) === String(targetDashboard?.id)) return false;

    try {
        const category_ids = categories.map((category) => category.id).filter(Boolean);
        const category_names = categories.map((category) => category.name).filter(Boolean);
        await handleUpdateDashboardCategories(draggedDashboardId, { category_ids, category_names }, userToken);
        dispatch(pushNotification({ msg: "Categorías asignadas correctamente.", status: "ok" }));
        setDashboard?.((previous) => previous);
        return true;
    } catch (error) {
        dispatch(pushNotification({ msg: error?.message || "No se pudieron asignar las categorías.", status: "err" }));
        return false;
    }
};

const toLayoutItem = (panelId, position = {}) => ({
    id: String(panelId),
    x: position.x || 0,
    y: position.y || 0,
    w: position.w > 0 ? position.w : DEFAULT_W,
    h: position.h > 0 ? position.h : DEFAULT_H,
    page: position.page || 0,
});

/**
 * Add a panel to the board LOCALLY (no persistence). The panel definition is
 * fetched so it can render, but nothing is written to the server until the
 * user hits "Guardar" — same contract as moving/resizing panels.
 */
export const handleAddPanelLocal = async (
    panelId,
    position,
    { setPanels, setLayout, setDashboard, registerPendingAdd, setIsAddingPanel, dispatch }
) => {
    if (!panelId) return;

    setIsAddingPanel(true);
    try {
        const extendPanel = await handleGetPanels({ id: panelId });
        const layoutItem = toLayoutItem(panelId, position);

        setPanels((prev) =>
            prev.some((p) => String(p.id) === String(panelId)) ? prev : [...prev, extendPanel]
        );
        setLayout((prev) => [
            ...(Array.isArray(prev) ? prev.filter((item) => String(item.id) !== String(panelId)) : []),
            layoutItem,
        ]);
        // Keep dashboard.panels in sync so the library marks the panel as in-use.
        setDashboard((prev) => ({
            ...prev,
            panels: [
                ...(prev.panels || []).filter((p) => String(p.id) !== String(panelId)),
                { id: extendPanel.id ?? panelId, name: extendPanel.name, title: extendPanel.title },
            ],
            functions: prev.functions,
        }));
        registerPendingAdd(panelId, layoutItem);
    } catch (error) {
        console.error("Error adding panel:", error);
        dispatch(pushNotification({ msg: "No se pudo cargar el panel", status: "err" }));
    } finally {
        setIsAddingPanel(false);
    }
};

/**
 * Remove a panel from the board LOCALLY (no persistence until "Guardar").
 */
export const handleRemovePanelLocal = (
    panelId,
    { setPanels, setLayout, setDashboard, registerPendingRemove }
) => {
    if (!panelId) return;
    const id = String(panelId);

    setPanels((prev) => prev.filter((p) => String(p.id) !== id));
    setLayout((prev) => (Array.isArray(prev) ? prev.filter((item) => String(item.id) !== id) : prev));
    setDashboard((prev) => ({
        ...prev,
        panels: (prev.panels || []).filter((p) => String(p.id) !== id),
        functions: prev.functions,
    }));
    registerPendingRemove(panelId);
};

/**
 * Persist EVERY pending change in one pass: panels added (with their final
 * position), panels removed, and moves/resizes of pre-existing panels.
 * Successfully persisted items are cleared from their pending list even if a
 * later request fails, so retrying "Guardar" only re-sends what is missing.
 */
export const handleSaveDashboardChanges = async ({
    dashboard,
    layout,
    changedItems,
    pendingAdds,
    pendingRemoves,
    setDashboard,
    setLayout,
    setChangedItems,
    setPendingAdds,
    setPendingRemoves,
    dispatch,
    userToken,
    updateActionState,
}) => {
    if (!dashboard?.id || !userToken) {
        console.error("Missing required parameters for handleSaveDashboardChanges");
        dispatch(pushNotification({ msg: "Error: parámetros requeridos faltantes", status: "err" }));
        return false;
    }

    // Final position of a panel: the live layout wins (it reflects unsaved moves).
    const positionOf = (panelId) => {
        const fromLayout = (Array.isArray(layout) ? layout : []).find(
            (item) => String(item.id) === String(panelId)
        );
        return fromLayout || changedItems.find((item) => String(item.id) === String(panelId)) || {};
    };

    updateActionState("save", { isLoading: true });
    let lastData = null;

    try {
        for (const panelId of pendingAdds) {
            const pos = positionOf(panelId);
            const response = await generalRequest({
                version: "v1",
                typeRequest: "POST",
                nameUrl: "dashboardAddPanel",
                body: {
                    x: pos.x || 0,
                    y: pos.y || 0,
                    w: pos.w > 0 ? pos.w : DEFAULT_W,
                    h: pos.h > 0 ? pos.h : DEFAULT_H,
                    page: pos.page || 0,
                },
                dynamicParams: { id: dashboard.id, panel_id: panelId },
            });
            if (response?.status !== "success") throw new Error(`No se pudo agregar el panel ${panelId}`);
            lastData = response.data;
            setPendingAdds((prev) => prev.filter((id) => String(id) !== String(panelId)));
        }

        for (const panelId of pendingRemoves) {
            const response = await generalRequest({
                version: "v1",
                typeRequest: "DELETE",
                nameUrl: "dashboardAddPanel",
                dynamicParams: { id: dashboard.id, panel_id: panelId },
            });
            if (response?.status !== "success") throw new Error(`No se pudo eliminar el panel ${panelId}`);
            lastData = response.data;
            setPendingRemoves((prev) => prev.filter((id) => String(id) !== String(panelId)));
        }

        // Adds already carried their final position in the POST body, and removed
        // panels no longer exist, so only pre-existing panels need a position PUT.
        const addedIds = new Set(pendingAdds.map(String));
        const removedIds = new Set(pendingRemoves.map(String));
        const moves = changedItems.filter(
            (item) => !addedIds.has(String(item.id)) && !removedIds.has(String(item.id))
        );
        if (moves.length > 0) {
            const response = await generalRequest({
                version: "v1",
                typeRequest: "PUT",
                nameUrl: "dashboardUpdatePanels",
                body: { panels: toApiPositions(moves) },
                dynamicParams: { id: dashboard.id },
            });
            if (response?.status !== "success") throw new Error("No se pudieron guardar las posiciones");
            if (Array.isArray(response.data?.layout) && response.data.layout.length > 0) {
                lastData = response.data;
            }
        }
        setChangedItems([]);

        // Refresh the saved baseline from the last server response available.
        if (lastData) {
            const hasLayout = Array.isArray(lastData.layout);
            const serverLayout = hasLayout ? normalizeLayout(lastData.layout) : null;
            if (serverLayout) setLayout(serverLayout);
            setDashboard((prev) => ({
                ...prev,
                ...(serverLayout ? { initialLayout: serverLayout } : {}),
                ...(Array.isArray(lastData.panels) ? { panels: [...lastData.panels] } : {}),
                functions: prev.functions,
            }));
        }

        dispatch(pushNotification({ msg: "Tablero guardado correctamente.", status: "ok" }));
        return true;
    } catch (error) {
        console.error("Error saving dashboard changes:", error);
        dispatch(
            pushNotification({
                msg: "No se pudieron guardar todos los cambios del tablero. Intenta guardar de nuevo.",
                status: "err",
            })
        );
        return false;
    } finally {
        updateActionState("save", { isLoading: false });
    }
};

