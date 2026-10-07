import {
    DEFAULT_CELL_HEIGHT,
    DEFAULT_MARGIN,
    resolveColumns,
} from "./gridConfig";
import { toGridWidgets } from "./gridLayoutMapper";

const itemStyle = ({ x = 0, y = 0, w = 1, h = 1 }) => ({
    top: y > 0 ? `calc(${y} * var(--gs-cell-height))` : undefined,
    left: x > 0 ? `calc(${x} * var(--gs-column-width))` : undefined,
    width: w > 1 ? `calc(${w} * var(--gs-column-width))` : undefined,
    height: h > 1 ? `calc(${h} * var(--gs-cell-height))` : undefined,
});

export default function StaticDashboardGrid({
    panels = [],
    layout = [],
    configuration,
    cellHeight,
    renderPanel,
    className = "",
    style,
}) {
    const widgets = toGridWidgets(layout, panels, true);
    const columns = resolveColumns(configuration);
    const height = Number(cellHeight) > 0 ? Number(cellHeight) : DEFAULT_CELL_HEIGHT;
    const marginX = configuration?.grid_gap_x ?? DEFAULT_MARGIN;
    const marginY = configuration?.grid_gap_y ?? DEFAULT_MARGIN;
    const rows = widgets.reduce(
        (max, widget) => Math.max(
            max,
            Math.max(0, Number(widget.y) || 0) + Math.max(1, Number(widget.h) || 1)
        ),
        0
    );

    return (
        <div
            className={`grid-stack dashboard-grid-root dashboard-grid-root--capture ${className}`.trim()}
            style={{
                ...style,
                width: "100%",
                height: `${Math.max(1, rows) * height}px`,
                minHeight: 0,
                "--gs-column-width": `${100 / columns}%`,
                "--gs-cell-height": `${height}px`,
                "--gs-item-margin-top": `${marginY}px`,
                "--gs-item-margin-right": `${marginX}px`,
                "--gs-item-margin-bottom": `${marginY}px`,
                "--gs-item-margin-left": `${marginX}px`,
            }}
        >
            {widgets.map((widget, index) => (
                <div key={String(widget.id)} className="grid-stack-item" style={itemStyle(widget)}>
                    <div className="grid-stack-item-content">
                        {renderPanel(panels[index])}
                    </div>
                </div>
            ))}
        </div>
    );
}
