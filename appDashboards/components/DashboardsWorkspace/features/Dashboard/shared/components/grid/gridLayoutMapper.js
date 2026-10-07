import { DEFAULT_MIN_W, DEFAULT_MIN_H } from "./gridConfig";

const DEFAULT_W = 3;
const DEFAULT_H = 12;

// Turn API layout data and panels into GridStack widgets to render on the grid.
export function toGridWidgets(layout = [], panels = [], isReadOnly = false) {
    const byId = (Array.isArray(layout) ? layout : []).reduce((map, item) => {
        const id = item.panel_id ?? item.id;
        if (id != null && String(id) !== "undefined") {
            map.set(String(id), item);
        }
        return map;
    }, new Map());

    // Build one grid widget per panel and attach its saved position when available.
    return (Array.isArray(panels) ? panels : []).map((panel) => {
        // Saved layout for this panel, or an empty object if it has no position yet.
        const position = byId.get(String(panel.id)) || {};
        return {
            id: panel.id,
            x: position.x ?? 0,
            y: position.y ?? 0,
            w: position.w ?? panel.width ?? DEFAULT_W,
            h: position.h ?? panel.height ?? DEFAULT_H,
            minW: DEFAULT_MIN_W,
            minH: DEFAULT_MIN_H,
            noMove: isReadOnly,
            noResize: isReadOnly,
        };
    });
}

// Read a panel's current position from a GridStack node (after drag or resize).
export function fromGridNode(node) {
    return {
        id: node?.id ?? node?.el?.getAttribute?.("gs-id") ?? "",
        x: node?.x ?? 0,
        y: node?.y ?? 0,
        w: node?.w ?? 1,
        h: node?.h ?? 1,
    };
}

// Convert grid items into the shape the API expects when saving panel positions.
export function toApiPositions(items = [], page = 0) {
    return items.map((item) => ({
        panel_id: item.id,
        x: item.x ?? 0,
        y: item.y ?? 0,
        w: item.w ?? 2,
        h: item.h ?? 1,
        page,
    }));
}
