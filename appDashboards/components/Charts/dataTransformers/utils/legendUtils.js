export function getPaletteFromColorStrategy(colorStrategy) {
  return colorStrategy?.[`${colorStrategy?.strategy_type}_palette`]?.colors ?? [];
}

export function extractUniqueLabels(values) {
  if (!Array.isArray(values) || values.length === 0) return [];

  const seen = new Set();
  const labels = [];

  for (const value of values) {
    if (value == null || value === '') continue;
    const key = String(value);
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(value);
  }

  return labels;
}

export function extractUniqueIndexLabels(data, indexBy) {
  if (!indexBy || !Array.isArray(data) || data.length === 0) return [];
  return extractUniqueLabels(data.map((row) => row[indexBy]));
}

/**
 * Sincroniza el color de las barras con la leyenda por índice (solo 1 serie / simple bar).
 */
export function buildSingleSeriesBarColorProps(chartData, colorStrategy) {
  const keys = chartData?.keys ?? [];
  if (keys.length !== 1) return {};

  const palette = getPaletteFromColorStrategy(colorStrategy);
  const labels = extractUniqueIndexLabels(chartData?.data, chartData?.indexBy);
  if (!labels.length || !palette.length) return { colorBy: 'indexValue' };

  const colorByIndex = new Map(
    labels.map((label, i) => [String(label), palette[i % palette.length] || '#ccc'])
  );

  return {
    colorBy: 'indexValue',
    colors: (bar) => colorByIndex.get(String(bar.data.indexValue)) ?? palette[0],
  };
}

/**
 * Combina la configuración de leyenda del backend con ediciones en vivo.
 */
export function resolveLegendConfig({ styles, liveChartProps }) {
  const liveLegends = liveChartProps?.legends;
  const stylesLegends = styles?.legends;

  if (liveLegends === false) return null;
  if (liveLegends === undefined && stylesLegends == null) return null;

  const styleConfig = stylesLegends && typeof stylesLegends === 'object' ? stylesLegends : {};
  const liveConfig = liveLegends && typeof liveLegends === 'object' ? liveLegends : {};

  if (!Object.keys(styleConfig).length && !Object.keys(liveConfig).length) {
    return null;
  }

  return { ...styleConfig, ...liveConfig };
}

/**
 * Trunca la etiqueta de cada item cuando supera `limitChartLegend`, añadiendo una elipsis.
 */
export function truncateLegendItems(items, limitChartLegend) {
  const limit = limitChartLegend;
  if (!Array.isArray(items) || limit <= 0) return items;

  return items.map((item) => {
    const label = item.label ?? '';
    if (label.length <= limit) return item;
    return { ...item, label: `${label.slice(0, limit)}…` };
  });
}

const toLegendItem = (id, label, color) => ({
  id: String(id),
  label: String(label ?? id),
  color,
});

/**
 * Extrae items de leyenda desde el contexto de layer de Nivo.
 * @param {object} layer - Contexto que Nivo pasa al custom layer.
 * @param {'pie'|'line'|'bar'|'sankey'|'scatterplot'|'circlepacking'|'radar'|'stream'|'boxplot'|'areabump'|'bump'|'marimekko|'waffle'} source - Familia de gráfica.
 */
export function extractLegendItems(layer, source, dimension = 'id') {
  switch (source) {
    case 'pie':
      return (layer?.dataWithArc ?? []).map((arc) =>
        toLegendItem(arc.id, arc.label ?? arc.data?.id ?? arc.id, arc.color)
      );
    case 'line':
    case 'scatterplot':
    case 'areabump':
    case 'bump':
      return (layer?.series ?? []).map((serie) =>
        toLegendItem(serie.id, serie.label ?? serie.id, serie.color)
    );
    case 'radar':
      return (layer?.keys ?? []).map((key) =>
        toLegendItem(key, key, layer?.colorByKey?.[key])
      );
    case 'stream':
      return (layer?.layers ?? []).map((streamLayer) =>
        toLegendItem(streamLayer.id, streamLayer.label ?? streamLayer.id, streamLayer.color)
      );
    case 'sankey':
      return (layer?.nodes ?? []).map((node) =>
        toLegendItem(node.id, node.label ?? node.id, node.color)
      );
    case 'circlepacking':
      return (layer?.nodes ?? [])
        .filter((node) => node?.depth === 1)
        .map((node) => toLegendItem(node.id, node.id, node.color));
    case 'bar': {
      const seen = new Map();
      for (const bar of layer?.bars ?? []) {
        const value = dimension === 'indexValue' ? bar?.data?.indexValue : bar?.data?.id;
        if (value == null) continue;
        const key = String(value);
        if (!seen.has(key)) seen.set(key, toLegendItem(key, key, bar?.color));
      }
      return [...seen.values()];
    }
    case 'boxplot': {
      const seen = new Map();
      for (const box of layer?.boxPlots ?? []) {
        const value = dimension === 'subGroup' ? box?.subGroup : box?.group;
        if (value == null || value === '') continue;
        const key = String(value);
        if (!seen.has(key)) seen.set(key, toLegendItem(key, key, box?.color));
      }
      return [...seen.values()];
    }
    case 'marimekko': {
      const seen = new Map();
      for (const bar of layer?.bars ?? []) {
        if (bar?.id == null) continue;
        const key = String(bar.id);
        if (!seen.has(key)) seen.set(key, toLegendItem(key, key, bar?.color));
      }
      return [...seen.values()];
    }
    case 'waffle':
      return (layer?.computedData ?? []).map((data) =>
        toLegendItem(data.id, data.label ?? data.id, data.color)
      );
        
    default:
      return [];
  }
}
