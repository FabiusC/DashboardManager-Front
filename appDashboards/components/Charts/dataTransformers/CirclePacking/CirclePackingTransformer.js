import Transformer from '../Transformer'
import merge from "lodash/merge";
import { buildLegendProps } from "../utils/ChartLegend";

export class CirclePackingTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: 'AND',
      acceptsSubgroups: false,
      allowMultipleRules: true,
      isCoupled: false
    });
  }

  emptyData() {
    return {
      data: {
        id: "root",
        children: []
      }
    };
  }

  buildTree(rows, groupFields, aggKey) {
    if (!Array.isArray(groupFields) || groupFields.length === 0) return [];

    const [currentField, ...restFields] = groupFields;
    const fieldName = currentField?.name;
    if (!fieldName) return [];

    const groups = new Map();
    for (const row of rows) {
      const key = row?.[fieldName] ?? '(Sin valor)';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    }

    return Array.from(groups.entries()).map(([key, items]) => {
      if (restFields.length === 0) {
        const value = items.reduce((sum, row) => {
          const n = Number(row?.[aggKey]);
          return sum + (Number.isFinite(n) ? n : 0);
        }, 0);

        return { id: key, value, fieldByFilter: fieldName };
      }

      return {
        id: key,
        fieldByFilter: fieldName,
        children: this.buildTree(items, restFields, aggKey),
      };
    });
  }

  transformData(panel) {
    if (!this.validatePanel(panel)) return this.emptyData();
    if (!this.validateRawData(panel)) return this.emptyData();
    if (!this.validateQueryFieldsDistribution(panel)) return this.emptyData();
    if (!this.validateGroupByFields(panel)) return this.emptyData();
    if (!this.validateAggregationFields(panel)) return this.emptyData();

    const { group_by_fields, aggregation_fields } =
      panel.queryParameters.query_fields_distribution;
    const rawData = panel.queryParameters.rawData;
    const aggField = aggregation_fields[0];
    const aggKey = `${aggField.name}__${aggField.metric}`;

    this.fieldFilter = group_by_fields[group_by_fields.length - 1]?.name ?? '';

    return {
      data: {
        id: "root",
        children: this.buildTree(rawData, group_by_fields, aggKey),
      },
    };
  }

  transformDataClick(datum, fieldFilter) {
    if (!this.filterManager) return null;

    const chain = [];
    let node = datum;

    while (node && node.id !== 'root') {
      const field = node?.data?.fieldByFilter ?? fieldFilter ?? this.fieldFilter;
      const value = node?.data?.id ?? node?.id;
      const normalized = value != null ? String(value) : undefined;
      const isMissing = !normalized || normalized === '(Sin valor)';

      if (field && !isMissing) {
        chain.push({ field, value: normalized });
      }
      node = node?.parent;
    }

    if (chain.length === 0) return null;

    const path = chain.reverse();
    const leaf = path[path.length - 1];
    this.filterManager.createRule(leaf.field, leaf.value, "EQUALS");
    return path;
  }

  transformChartProps(params) {
    const onClick = !params.isEditionMode
      ? this.getOnClick(null, params.data)
      : undefined;
    const styles = params.chart_setup_styles ?? {};
    const legendProps = buildLegendProps({
      source: 'circlepacking',
      styles,
      liveChartProps: params.liveChartProps,
    });

    const merged = merge(
      {},
      { ...params.chart.defaultProps },
      styles,
      params.liveChartProps,
      onClick ? { onClick } : {},
      { updateLiveChartProps: params.updateLiveChartPropsMethods },
      { panel: params.data }
    );

    return { ...merged, ...legendProps };
  }
}
