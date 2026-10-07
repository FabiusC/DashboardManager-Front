export const DEFAULT_GRID_COLUMNS = 12;
export const DEFAULT_CELL_HEIGHT = 25;
export const DEFAULT_MARGIN = 12;
export const DEFAULT_MIN_W = 1;
export const DEFAULT_MIN_H = 1;
export const DRAG_IN_SELECTOR = ".dashboard-panel-drag";


export const resolveColumns = (configuration) => {
    const cols = Number(configuration?.grid_columns)
    return cols > 0 ? cols : DEFAULT_GRID_COLUMNS
}
// ColumnOptions: "list" packs by (y,x) reading order — correct for 1-column mobile.
const buildColumnOpts = (columns) => ({
    layout: "list",
    columnMax: columns,
    breakpointForWindow: false,
    breakpoints: [{ w: 700, c: 1 }],
});
const resolveMargin = (configuration) => {
    const mx = configuration?.grid_gap_x ?? DEFAULT_MARGIN;
    const my = configuration?.grid_gap_y ?? DEFAULT_MARGIN;
    return `${my}px ${mx}px`;
};

//GridStackOptions -> Global configuration object that defines the layout, appearance, and behavior of the grid.
export function buildGridOptions({configuration, isReadOnly = false, cellHeight} ={}){
    const columns = resolveColumns(configuration);
    return {
        column: columns, // Set de number of columns in the grid
        columnOpts: buildColumnOpts(columns), // Control how widgets are repositioned when the grid column count changes
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
    const columns = resolveColumns(configuration);
    const responsive = grid.opts?.columnOpts;

    if (responsive?.breakpoints?.length) {
        responsive.columnMax = columns;
        const width = grid.el?.clientWidth;
        if (!width) return;

        let targetColumns = columns;
        for (const breakpoint of responsive.breakpoints) {
            if (width <= breakpoint.w) {
                targetColumns = breakpoint.c || targetColumns;
            }
        }

        if (grid.getColumn() !== targetColumns) {
            const breakpoint = responsive.breakpoints.find((item) => item.c === targetColumns);
            grid.column(targetColumns, breakpoint?.layout || responsive.layout || "moveScale");
        }
        return;
    }

    if (grid.getColumn() !== columns) grid.column(columns, "moveScale");
}

export function applyReadOnly(grid, isReadOnly) {
    if (!grid) return;
    grid.setStatic(Boolean(isReadOnly));
}