import merge from "lodash/merge";
import Transformer from "../Transformer";
export class ChordTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: "AND",
      acceptsSubgroups: false,
      allowMultipleRules: true,
      isCoupled: false,
    });
    this.sourceField = null;
    this.targetField = null;
    this.nodeMetaByKey = {};
  }

  emptyData() {
    return { data: [], keys: [] };
  }

  transformData(panel) {
    if (!this.validateRawData(panel)) return this.emptyData();

    const distribution = panel.queryParameters.query_fields_distribution;
    const groupFields = distribution?.group_by_fields ?? [];
    const aggregationFields = distribution?.aggregation_fields ?? [];
    if (groupFields.length !== 2 || aggregationFields.length !== 1) return this.emptyData();

    const sourceField = groupFields[0]?.name;
    const targetField = groupFields[1]?.name;
    const metricField = aggregationFields[0];
    if (!sourceField || !targetField || !metricField?.name) return this.emptyData();

    this.sourceField = sourceField;
    this.targetField = targetField;
    this.fieldFilter = sourceField;

    const metricKey = `${metricField.name}__${metricField.metric}`;
    const keyOrder = [];
    const nodeMetaByKey = {};
    const flows = new Map();

    const ensureKey = (raw, field) => {
      const key = String(raw);
      if (!Object.prototype.hasOwnProperty.call(nodeMetaByKey, key)) {
        nodeMetaByKey[key] = { value: raw, field };
        keyOrder.push(key);
      }
      return key;
    };

    for (const row of panel.queryParameters.rawData) {
      const rawSource = row?.[sourceField];
      const rawTarget = row?.[targetField];
      if (rawSource == null || rawSource === "" || rawTarget == null || rawTarget === "") {
        continue;
      }

      const sourceKey = ensureKey(rawSource, sourceField);
      const targetKey = ensureKey(rawTarget, targetField);

      const value = Number(row?.[metricKey]);
      const numericValue = Number.isFinite(value) && value > 0 ? value : 0;
      if (numericValue <= 0) continue;

      if (!flows.has(sourceKey)) flows.set(sourceKey, new Map());
      const targets = flows.get(sourceKey);
      targets.set(targetKey, (targets.get(targetKey) ?? 0) + numericValue);
    }

    if (!keyOrder.length || !flows.size) return this.emptyData();

    this.nodeMetaByKey = nodeMetaByKey;

    const indexByKey = new Map(keyOrder.map((key, index) => [key, index]));
    const n = keyOrder.length;
    const matrix = Array.from({ length: n }, () => Array(n).fill(0));

    for (const [sourceKey, targets] of flows) {
      const i = indexByKey.get(sourceKey);
      for (const [targetKey, value] of targets) {
        matrix[i][indexByKey.get(targetKey)] = value;
      }
    }

    return { data: matrix, keys: keyOrder };
  }

  transformDataClick(datum) {
    if (!this.filterManager) return null;

    const isRibbon = datum?.source != null && datum?.target != null;
    if (isRibbon) {
      const sourceKey = datum.source?.id ?? datum.source;
      const targetKey = datum.target?.id ?? datum.target;
      const sourceMeta = this.nodeMetaByKey[sourceKey];
      const targetMeta = this.nodeMetaByKey[targetKey];

      if (!sourceMeta || !targetMeta || !this.sourceField || !this.targetField) return null;

      this.filterManager.clearPanelFilters();
      this.filterManager.createRule(this.sourceField, sourceMeta.value, "EQUALS");
      this.filterManager.createRule(this.targetField, targetMeta.value, "EQUALS");

      return [
        { field: this.sourceField, value: sourceMeta.value },
        { field: this.targetField, value: targetMeta.value },
      ];
    }

    const key = datum?.id;
    const meta = key != null ? this.nodeMetaByKey[key] : null;
    if (!meta?.field || meta.value == null || meta.value === "") return null;

    this.filterManager.createRule(meta.field, meta.value, "EQUALS");
    return { field: meta.field, value: meta.value };
  }

  transformChartProps(params) {
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
    const styles = params.chart_setup_styles ?? {};
    const chartData = params.chartData ?? this.emptyData();

    const merged = merge(
      {},
      { ...params.chart.defaultProps },
      styles,
      params.liveChartProps,
      { updateLiveChartProps: params.updateLiveChartPropsMethods },
      { panel: params.data },
      { keys: chartData.keys ?? [] }
    );

    const legends = merged.legends
      ? Array.isArray(merged.legends)
        ? merged.legends
        : [merged.legends]
      : [];

    return {
      ...merged,
      legends,
      ...(onClick
        ? {
            onArcClick: onClick,
            onRibbonClick: onClick,
          }
        : {}),
    };
  }
}
