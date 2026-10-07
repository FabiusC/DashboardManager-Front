export const DEFAULT_GRID_COLUMNS = 12;
export const DEFAULT_CELL_HEIGHT = 25;
export const DEFAULT_MARGIN = 12;
export const DEFAULT_MIN_W = 1;
export const DEFAULT_MIN_H = 1;
export const DRAG_IN_SELECTOR = ".dashboard-panel-drag";
export const MOBILE_GRID_BREAKPOINT = 700;


export const resolveColumns = (configuration) => {
    const cols = Number(configuration?.grid_columns)
    return cols > 0 ? cols : DEFAULT_GRID_COLUMNS
}
const resolveMargin = (configuration) => {
    const mx = configuration?.grid_gap_x ?? DEFAULT_MARGIN;
    const my = configuration?.grid_gap_y ?? DEFAULT_MARGIN;
    return `${my}px ${mx}px`;
};

const isMobileViewport = () =>
    typeof window !== "undefined" && window.innerWidth <= MOBILE_GRID_BREAKPOINT;

//GridStackOptions -> Global configuration object that defines the layout, appearance, and behavior of the grid.
export function buildGridOptions({configuration, isReadOnly = false, cellHeight} ={}){
    const columns = resolveColumns(configuration);
    return {
        column: columns, // Set de number of columns in the grid
        cellHeight: cellHeight ?? DEFAULT_CELL_HEIGHT, // Update current cell height
        margin: resolveMargin(configuration), // Updates the margins which will set all 4 sides at once
        float: false, // Enable/disable floating widgets (default: false). When enabled, widgets can float up to fill empty spaces.
        animate: true, // Enable/disable animate when use drag and drop or resizable widget
        staticGrid: isReadOnly, // Toggles between view mode (panels are locked) and edit mode (panels can be moved and dragged)
        acceptWidgets: isReadOnly ? false : DRAG_IN_SELECTOR,
        // Keep handles in the DOM (no ui-resizable-autohide / display:none on desktop).
        alwaysShowResizeHandle: true,
        draggable: { cancel: ".no-drag", scroll: false, pause: false },
        resizable: { handles: "n, e, s, w, ne, se, sw, nw" },
    }
}

export function applyGridMargin(grid, configuration) {
    if (!grid) return;
    grid.margin(resolveMargin(configuration));
}

export function applyGridColumns(grid, configuration) {
    if (!grid) return;
    const desktopColumns = resolveColumns(configuration);
    const targetColumns = isMobileViewport() ? 1 : desktopColumns;
    if (grid.getColumn() === targetColumns) return;
    grid.column(targetColumns, targetColumns === 1 ? "list" : "moveScale");
}

export function applyReadOnly(grid, isReadOnly) {
    if (!grid) return;
    grid.setStatic(Boolean(isReadOnly));
}
