import { useLayoutEffect, useRef, useState } from "react";
import { GridStack, DDManager } from "gridstack";
import {
    buildGridOptions,
    applyGridMargin,
    applyGridColumns,
    applyReadOnly,
    resolveColumns,
} from "./gridConfig";
import { toGridWidgets, fromGridNode } from "./gridLayoutMapper";
import { attachDragGhostEffect } from "./dragGhostEffect";

/**
 * Keeps a GridStack instance in sync with React state.
 *
 * Architecture: in edit mode GridStack OWNS the widget positions. React only
 * owns which panels exist (add/remove) and the panel content (rendered through
 * portals). The `layout` prop is a write-only mirror: it is read once to *seed*
 * a widget's initial position, and updated only from GridStack's "change" event.
 * We never push `layout` back into the grid, which is what used to create the
 * drag → change → setLayout → re-apply feedback loop (stuck / jumpy panels).
 */

export function useGridStackDashboard({
    panels = [],
    layout = [],
    configuration,
    isReadOnly,
    cellHeight,
    onLayoutChange,
    onDropPanel,
}) {
    const containerRef = useRef(null); // DOM node where GridStack mounts.
    const gridRef = useRef(null); // Live GridStack instance.
    const nodesRef = useRef(new Map()); // panel id -> { el, host } for widgets on the grid.
    // True while we mutate the grid ourselves, so "change" events are ignored.
    const isApplyingRef = useRef(false);
    const hostsKeyRef = useRef(""); // Tracks the current set of widget ids.

    // Always-fresh mirrors so GridStack listeners never read stale closures.
    const layoutRef = useRef(layout);
    const configurationRef = useRef(configuration);
    layoutRef.current = layout;
    configurationRef.current = configuration;
    const liveRef = useRef();
    liveRef.current = {
        onLayoutChange,
        onDropPanel,
        isReadOnly,
        desktopColumns: resolveColumns(configuration),
    };

    const [widgetHosts, setWidgetHosts] = useState({});

    // Publish the id -> host map, but only when the SET of ids actually changes,
    // so unrelated grid mutations don't re-render every portal.
    const publishHosts = () => {
        const nodes = nodesRef.current;
        const key = [...nodes.keys()].map(String).sort().join("|");
        if (key === hostsKeyRef.current) return;
        hostsKeyRef.current = key;
        const hosts = {};
        for (const [id, entry] of nodes) hosts[id] = entry.host;
        setWidgetHosts(hosts);
    };

    // Create GridStack Instance to user interaction events.
    useLayoutEffect(() => {
        if (!containerRef.current || gridRef.current) return undefined;

        const grid = GridStack.init(
            buildGridOptions({ configuration, isReadOnly, cellHeight }),
            containerRef.current
        );
        gridRef.current = grid;
        DDManager.pauseDrag = false;
        const detachDragGhost = isReadOnly ? () => {} : attachDragGhostEffect(grid);

        // User moved or resized a widget → report the new layout upstream.
        grid.on("change", (_event, nodes) => {
            if (isApplyingRef.current || liveRef.current.isReadOnly) return;
            if (grid.getColumn() !== liveRef.current.desktopColumns) return;
            if (!nodes || nodes.length === 0) return;
            liveRef.current.onLayoutChange?.(nodes.map(fromGridNode));
        });

        // External panel dropped onto the grid → hand it to React, then remove the ghost.
        grid.on("dropped", (_event, _previousNode, newNode) => {
            if (liveRef.current.isReadOnly || !newNode) return;
            const dropped = fromGridNode(newNode);
            const ghostEl = newNode.el;
            requestAnimationFrame(() => {
                if (!gridRef.current || !ghostEl) return;
                isApplyingRef.current = true;
                gridRef.current.removeWidget(ghostEl, true, false);
                isApplyingRef.current = false;
            });
            liveRef.current.onDropPanel?.(dropped.id, dropped);
        });

        return () => {
            detachDragGhost();
            grid.offAll();
            grid.destroy(false);
            gridRef.current = null;
            nodesRef.current.clear();
            hostsKeyRef.current = "";
        };
    }, []);

    // Keep grid spacing in sync when dashboard configuration changes.
    useLayoutEffect(() => {
        const grid = gridRef.current;
        if (!grid) return;
        isApplyingRef.current = true;
        try {
            applyGridMargin(grid, configuration);
            if (nodesRef.current.size > 0) {
                applyGridColumns(grid, configuration);
            }
        } finally {
            isApplyingRef.current = false;
        }
    }, [configuration]);

    // --- Read-only toggle ----------------------------------------------------
    useLayoutEffect(() => {
        applyReadOnly(gridRef.current, isReadOnly);
    }, [isReadOnly]);

    // --- Reconcile which widgets exist (add / remove only) -------------------
    // Depends on `panels` (the set), NOT on `layout`. Positions are seeded from
    // `layoutRef` at add-time and afterwards owned by GridStack.
    useLayoutEffect(() => {
        const grid = gridRef.current;
        if (!grid) return;

        const desired = toGridWidgets(layoutRef.current, panels, isReadOnly).sort((a, b) => a.y - b.y || a.x - b.x);
        const desiredById = new Map(desired.map((w) => [String(w.id), w]));
        const nodes = nodesRef.current;
        isApplyingRef.current = true;
        try {
            if (desired.length > 0 && nodes.size === 0) {
                const desktopColumns = resolveColumns(configurationRef.current);
                if (grid.getColumn() !== desktopColumns) {
                    grid.column(desktopColumns, "moveScale");
                }
            }

            grid.batchUpdate();

            // Remove widgets
            for (const [id, entry] of nodes) {
                if (!desiredById.has(String(id))) {
                    grid.removeWidget(entry.el, true, false);
                    nodes.delete(id);
                }
            }

            // Add brand-new widgets, seeding their saved/dropped position.
            for (const w of desired) {
                if (nodes.has(w.id)) continue;
                const el = grid.addWidget({
                    id: w.id,
                    x: w.x,
                    y: w.y,
                    w: w.w,
                    h: w.h,
                    minW: w.minW,
                    minH: w.minH,
                    noMove: w.noMove,
                    noResize: w.noResize,
                });
                const host = el.querySelector(".grid-stack-item-content");
                nodes.set(w.id, { el, host });
            }

            grid.batchUpdate(false);

            // Reflow only after all saved widgets have been seeded at desktop
            // columns; this gives GridStack a stable order to compact on mobile.
            if (nodes.size > 0) {
                applyGridColumns(grid, configurationRef.current);
            }
        } finally {
            isApplyingRef.current = false;
        }

        publishHosts();
    }, [panels, isReadOnly]);
    
    useLayoutEffect(() => {
        const grid = gridRef.current;
        if (!grid || typeof window === "undefined") return undefined;

        let frameId = null;
        const applyResponsiveColumns = () => {
            frameId = null;
            if (nodesRef.current.size === 0) return;

            isApplyingRef.current = true;
            try {
                applyGridColumns(grid, configurationRef.current);
            } finally {
                isApplyingRef.current = false;
            }
        };
        const scheduleResponsiveColumns = () => {
            if (frameId !== null) return;
            frameId = requestAnimationFrame(applyResponsiveColumns);
        };

        applyResponsiveColumns();
        window.addEventListener("resize", scheduleResponsiveColumns);
        window.addEventListener("pageshow", scheduleResponsiveColumns);
        window.visualViewport?.addEventListener("resize", scheduleResponsiveColumns);

        return () => {
            window.removeEventListener("resize", scheduleResponsiveColumns);
            window.removeEventListener("pageshow", scheduleResponsiveColumns);
            window.visualViewport?.removeEventListener("resize", scheduleResponsiveColumns);
            if (frameId !== null) cancelAnimationFrame(frameId);
        };
    }, []);

    return { containerRef, widgetHosts };
}
