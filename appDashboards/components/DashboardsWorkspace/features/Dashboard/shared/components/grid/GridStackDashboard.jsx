import { createPortal } from "react-dom";
import { useGridStackDashboard } from "./useGridStackDashboard";
import StaticDashboardGrid from "./StaticDashboardGrid";

function InteractiveGridStackDashboard({
    panels = [],
    layout = [],
    configuration,
    isReadOnly = false,
    cellHeight,
    onLayoutChange,
    onDropPanel,
    renderPanel,
    className = "",
    style,
}) {
    const {containerRef, widgetHosts} = useGridStackDashboard({
        panels,
        layout,
        configuration,
        isReadOnly,
        cellHeight,
        onLayoutChange,
        onDropPanel,
    });

    return (
        <div
            ref={containerRef}
            className={`grid-stack dashboard-grid-root ${className}`.trim()}
            style={style}
        >
            {panels.map((panel) =>{
                const host = widgetHosts[String(panel.id)];
                return host ? createPortal(renderPanel(panel), host, String(panel.id)) : null;
            })}
        </div>
    );
}

export default function GridStackDashboard(props) {
    return props.captureMode
        ? <StaticDashboardGrid {...props} />
        : <InteractiveGridStackDashboard {...props} />;
}
