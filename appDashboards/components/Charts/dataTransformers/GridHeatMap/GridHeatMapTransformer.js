import { getResolvedColors } from "../utils/PaletteColors"
import Transformer from "../Transformer";
import merge from "lodash/merge";

export class GridHeatMapTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: 'AND',
      acceptsSubgroups: false,
      allowMultipleRules: true,
      isCoupled: false,
    });
    this.rowValuesById = {};
    this.columnValuesById = {};
  }

  emptyData() {
    return { data: [] };
  }

  transformData(panel) {
    if (!this.validatePanel(panel) || !this.validateRawData(panel)) { return this.emptyData(); }
    const distribution = panel?.queryParameters?.query_fields_distribution ?? panel?.queryParameters?.fields_distribution;
    const groupFields = distribution?.group_by_fields ?? [];
    const aggregationFields = distribution?.aggregation_fields ?? [];
    
    const columnField = groupFields[0]?.name;
    const rowField = groupFields[1]?.name;
    const metricField = aggregationFields[0];
    if (!columnField || !rowField || !metricField) return this.emptyData();
    
    this.fieldFilter = rowField;
    this.columnFieldFilter = columnField;
    
    const metricKey = metricField.metric ? `${metricField.name}__${metricField.metric}` : metricField.name;

    const columns = {};
    const rows = {};

    for (const record of panel.queryParameters.rawData) {
      if (!record) continue;
      const isArr = Array.isArray(record);
      const rawColumn = isArr ? record[0] : record[columnField];
      const rawRow = isArr ? record[1] : record[rowField];
      const rawMetric = isArr ? record[2] : (record[metricKey] ?? record[metricField.alias]);
      if (rawColumn == null || rawColumn === "" || rawRow == null || rawRow === "") {
        continue;
      }
      const columnId = String(rawColumn);
      const rowId = String(rawRow);
      columns[columnId] = rawColumn;
      if (!rows[rowId]) {
        rows[rowId] = {
          id: rowId,
          rawValue: rawRow,
          values: {},
        };
      }
      const numericValue = Number(rawMetric) || 0;
      rows[rowId].values[columnId] = (rows[rowId].values[columnId] ?? 0) + numericValue;
    }

    const columnIds = Object.keys(columns);
    const rowIds = Object.keys(rows);

    if (!columnIds.length || !rowIds.length) return this.emptyData();

    this.rowValuesById = Object.fromEntries(
      rowIds.map((id) => [id, rows[id].rawValue])
    );
    this.columnValuesById = columns;

    const data = rowIds.map((rowId) => {
      const rowObj = rows[rowId];
      return {
        id: rowObj.id,
        data: columnIds.map((columnId) => ({
          x: columns[columnId],
          y: rowObj.values[columnId] ?? 0,
        })),
      };
    });

    return { data };
  }
  
  transformDataClick(datum) {
    if (!this.filterManager) return null;

    const columnId = datum?.data?.x ?? datum?.x;
    const columnValue = this.columnValuesById[columnId] ?? columnId;
    const columnField = this.columnFieldFilter;
    const filters = [];

    if (columnField && columnValue != null && columnValue !== "" && typeof columnValue !== "number") {
      this.filterManager.createRule(columnField, columnValue, "EQUALS");
      filters.push({field: columnField, value: columnValue, operator: "EQUALS"});
    }
  
    return filters.length > 0 ? filters : null;
  }


  transformChartProps(params) {
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
    const chartData = params.data?.data ?? (Array.isArray(params.data) ? params.data : []);
    const styles = params.chart_setup_styles ?? {};
    const liveChartProps = params.liveChartProps ?? {};
    const merged = merge(
      {},
      params.chart?.defaultProps,
      styles,
      liveChartProps,
      onClick ? { onClick } : {},
      { updateLiveChartProps: params.updateLiveChartPropsMethods },
      { panel: params.data },
      { 
        id: "id",
        value: "value"
      }
    );

    const resolvedColors = getResolvedColors(params.data, params.data?.queryParameters);

    const legends = merged.legends ? [merged.legends] : [];

    return {
      ...merged,
      legends,
      data: chartData,
      colors: { type: 'sequential', colors: resolvedColors },
      ...(onClick ? { onClick } : {}),
      ...(params.updateLiveChartPropsMethods ? { updateLiveChartProps: params.updateLiveChartPropsMethods } : {})
    };
  }
}
