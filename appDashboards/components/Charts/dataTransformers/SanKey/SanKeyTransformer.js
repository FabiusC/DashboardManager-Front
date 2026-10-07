import Transformer from "../Transformer";
import merge from "lodash/merge";
import { buildLegendProps } from "../utils/ChartLegend";

export class SanKeyTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: 'AND',
      acceptsSubgroups: false,
      allowMultipleRules: true,
      isCoupled: false
    });
  }

  transformData(panel) {
    const empty = { data: [] };

    if (!panel || typeof panel !== 'object') return empty;
    if (!this.validatePanel(panel)) return empty;
    if (!this.validateRawData(panel)) return empty;

    const selection_fields = panel?.queryParameters?.selected_fields;
    if (!Array.isArray(selection_fields) || selection_fields.length < 3) return empty;

    const valueField = selection_fields[selection_fields.length - 1];
    const valueFieldName = valueField.name;
    const valueFieldMetric = valueField.metric;
    const valueKey = valueFieldMetric ? `${valueFieldName}__${valueFieldMetric}` : valueFieldName;

    const nodeFields = selection_fields.slice(0, selection_fields.length - 1);
    if (nodeFields.length < 2) return empty;

    const rawData = panel?.queryParameters?.rawData || [];
    if (!Array.isArray(rawData) || rawData.length === 0) return empty;

    this.nodeFields = nodeFields;

    const nodeMap = new Map();
    const linkMap = new Map();

    rawData.forEach((row) => {
      for (let i = 0; i < nodeFields.length - 1; i++) {
        const sourceValue = row[nodeFields[i].name];
        const targetValue = row[nodeFields[i + 1].name];
        const sourceId = `${i}-${sourceValue}`;
        const targetId = `${i + 1}-${targetValue}`;

        if (!nodeMap.has(sourceId)) {
          nodeMap.set(sourceId, { id: sourceId, label: sourceValue });
        }
        if (!nodeMap.has(targetId)) {
          nodeMap.set(targetId, { id: targetId, label: targetValue });
        }

        const linkKey = `${sourceId}==>${targetId}`;
        const value = parseFloat(row[valueKey] ?? row[valueFieldName] ?? 0);
        if (!isFinite(value) || value <= 0) continue;

        if (linkMap.has(linkKey)) {
          linkMap.get(linkKey).value += value;
        } else {
          linkMap.set(linkKey, { source: sourceId, target: targetId, value });
        }
      }
    });

    const nodeIds = new Set(nodeMap.keys());
    const nodes = Array.from(nodeMap.values());
    const links = Array.from(linkMap.values()).filter(
      (l) => nodeIds.has(l.source) && nodeIds.has(l.target)
    );

    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const safeLinks = Array.isArray(links) ? links : [];

    if (safeNodes.length === 0 || safeLinks.length === 0) {
      return { data: [] };
    }

    return {
      data: {
        nodes: safeNodes,
        links: safeLinks,
      },
    };
  }

  transformDataClick(datum, fieldFilter) {

  const isLink = datum?.source !== undefined && datum?.target !== undefined;

  if (isLink) {
    const sourceId = datum.source?.id ?? datum.source;
    const targetId = datum.target?.id ?? datum.target;

    if (!sourceId || !targetId) return null;

    const [sourceLevelStr, ...sourceValueParts] = sourceId.split("-");
    const [targetLevelStr, ...targetValueParts] = targetId.split("-");
    const sourceLevel = parseInt(sourceLevelStr, 10);
    const targetLevel = parseInt(targetLevelStr, 10);
    const sourceValue = sourceValueParts.join("-");
    const targetValue = targetValueParts.join("-");
    const sourceField = this.nodeFields?.[sourceLevel]?.name;
    const targetField = this.nodeFields?.[targetLevel]?.name;

    if (!sourceField || !targetField || !sourceValue || !targetValue) return null;

    this.filterManager.clearPanelFilters();
    this.filterManager.createRule(sourceField, sourceValue, "EQUALS");
    this.filterManager.createRule(targetField, targetValue, "EQUALS");

    return [
      { field: sourceField, value: sourceValue },
      { field: targetField, value: targetValue },
    ];

  } else {
    const nodeId = datum?.id ?? datum?.data?.id;
    if (!nodeId) return null;

    const [levelStr, ...valueParts] = String(nodeId).split("-");
    const level = parseInt(levelStr, 10);
    const nodeValue = valueParts.join("-");

    const field = this.nodeFields?.[level]?.name;
    if (!field || !nodeValue) return null;

    this.filterManager.clearPanelFilters();
    this.filterManager.createRule(field, nodeValue, "EQUALS");

    return { field, value: nodeValue };
  }
 }

  transformChartProps(params) {
  const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;

  const styles = params.chart_setup_styles ?? {};
  const legendProps = buildLegendProps({
    source: 'sankey',
    styles,
    liveChartProps: params.liveChartProps,
  });

  const merged = merge(
    {},
    styles,
    { ...params.chart.defaultProps },
    params.liveChartProps,
    onClick ? { onClick } : {},
    { updateLiveChartProps: params.updateLiveChartPropsMethods },
    { panel: params.data }
  );

  return { ...merged, ...legendProps };
}
}