/**
 * Render genérico de leyendas basado en el componente `BoxLegendSvg` de nivo.
 *
 * `buildLegendProps` es el único punto de integración que usan los transformers.
 * Config de leyenda → backend. Items de leyenda → contexto de layer de Nivo (`extractLegendItems`).
 */

import dynamic from "next/dynamic";
import { extractLegendItems, resolveLegendConfig, truncateLegendItems } from "./legendUtils";
const ChartLegendSvg = dynamic(() => import("./ChartLegendSvg"), { ssr: false });

/** Stacks por defecto de @nivo sin el layer nativo `legends` (requerido para inyectar el custom layer). */
const NIVO_LAYER_STACK = {
  pie: ["arcs", "arcLinkLabels", "arcLabels"],
  bar: ["grid", "axes", "bars", "totals", "markers", "annotations"],
  line: ["grid", "markers", "axes", "areas", "crosshair", "lines", "points", "slices", "mesh"],
  sankey: ["links", "nodes", "labels"],
  scatterplot: ["grid", "axes", "nodes", "markers", "mesh"],
  circlepacking: ["circles", "labels"],
  radar: ["grid", "layers", "slices", "dots"],
  stream: ["grid", "axes", "layers", "dots", "slices"],
  boxplot: ["grid", "axes", "boxPlots", "markers", "annotations"],
  areabump: ["grid", "axes", "labels", "areas"],
  bump: ["grid", "axes", "labels", "lines", "points", "mesh"],
  marimekko: ["grid", "axes", "bars"],
  waffle: ['cells', 'areas'],
};

function sizeFromScale(scale) {
  if (typeof scale?.range !== "function") return 0;
  const range = scale.range();
  if (!Array.isArray(range) || range.length < 2) return 0;
  return Math.abs(Number(range[1]) - Number(range[0])) || 0;
}

function sizeFromBars(bars) {
  if (!Array.isArray(bars) || bars.length === 0) return null;
  let width = 0;
  let height = 0;
  for (const bar of bars) {
    width = Math.max(width, (bar.x ?? 0) + (bar.width ?? 0));
    height = Math.max(height, (bar.y ?? 0) + (bar.height ?? 0));
  }
  return width > 0 && height > 0 ? { width, height } : null;
}

function sizeFromCells(cells) {
  if (!cells || cells.length === 0) return null;
  let width = 0;
  let height = 0;
  for (const cell of cells) {
    width = Math.max(width, (cell.x ?? 0) + (cell.width ?? 0));
    height = Math.max(height, (cell.y ?? 0) + (cell.height ?? 0));
  }

 return width > 0 && height > 0 ? { width, height } : null;
}

function resolveContainerSize(layer) {
  if (typeof layer?.innerWidth === "number" && typeof layer?.innerHeight === "number") {
    return { width: layer.innerWidth, height: layer.innerHeight };
  }
  if (typeof layer?.centerX === "number" && typeof layer?.centerY === "number") {
    return { width: layer.centerX * 2, height: layer.centerY * 2 };
  }
  const root = Array.isArray(layer?.nodes)
    ? layer.nodes.find((node) => node?.depth === 0) ?? layer.nodes[0]
    : null;
  if (root && typeof root.x === "number" && typeof root.y === "number") {
    return { width: root.x * 2, height: root.y * 2 };
  }

  // Marimekko (y charts similares): el custom layer no expone innerWidth/height.
  const fromBars = sizeFromBars(layer?.bars);
  if (fromBars) return fromBars;

   // Waffle 
  const fromCells = sizeFromCells(layer?.cells);
  if (fromCells) return fromCells;

  const thickness = sizeFromScale(layer?.thicknessScale);
  const dimensions = sizeFromScale(layer?.dimensionsScale);
  if (thickness > 0 && dimensions > 0) {
    const bar = layer?.bars?.[0];
    const isHorizontal = bar != null && (bar.height ?? 0) > (bar.width ?? 0);
    return isHorizontal
      ? { width: dimensions, height: thickness }
      : { width: thickness, height: dimensions };
  }

  return { width: layer?.width ?? 0, height: layer?.height ?? 0 };
}

function prepareLegendRenderProps(config) {
  const { limitChartLegend, symbolType, ...rest } = config;
  const legendProps = { ...rest };

  if (symbolType != null && symbolType !== "") {
    legendProps.symbolShape = symbolType;
  }

  return { limitChartLegend, legendProps };
}

function appendLegendLayer(layers, legendLayer) {
  const base = (Array.isArray(layers) ? layers : NIVO_LAYER_STACK[layers] ?? []).filter(
    (layer) => layer !== "legends"
  );
  return [...base, legendLayer];
}

export function ChartLegend({ items, config, containerWidth, containerHeight }) {
  if (!config || !Array.isArray(items) || items.length === 0) return null;
  if (!containerWidth || !containerHeight) return null;

  const { limitChartLegend, legendProps } = prepareLegendRenderProps(config);
  const data = truncateLegendItems(items, limitChartLegend);

  return (
    <ChartLegendSvg
      {...legendProps}
      containerWidth={containerWidth}
      containerHeight={containerHeight}
      data={data}
    />
  );
}
export function buildLegendProps({ source, dimension, styles, liveChartProps, layers }) {
  const config = resolveLegendConfig({ styles, liveChartProps });
  if (!config) return { legends: [] };
  
  const legendLayer = (layer) => {
    const { width, height } = resolveContainerSize(layer);
    return (
      <ChartLegend
      items={extractLegendItems(layer, source, dimension)}
      config={config}
      containerWidth={width}
      containerHeight={height}
      />
    );
  };

  const stack = layers ?? liveChartProps?.layers ?? styles?.layers ?? source;

  return { legends: [], layers: appendLegendLayer(stack, legendLayer) };
}
