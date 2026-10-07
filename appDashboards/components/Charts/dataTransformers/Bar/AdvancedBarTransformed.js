import Transformer from '../Transformer'
import merge from "lodash/merge";
import { resolveDictionaryLabel } from "@components/PanelsWorkspace/utils/dictionaryUtils";
import { buildLegendProps } from "../utils/ChartLegend";
import { buildAxisValueFormatProps } from "../utils/axisValueFormat";

export class AdvancedBarTransformed extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    // Inicialización manual de is_multiple_filters y operator_filter
    this.initialize({
      operator_filter: 'AND',
      acceptsSubgroups: false,
      allowMultipleRules: true,
      isCoupled: false
    });
  }

  transformData(panel) {
    // Validaciones básicas del panel
    if (!this.validatePanel(panel)) {
      return { data: [], keys: [], indexBy: null };
    }

    // Validación de datos raw
    if (!this.validateRawData(panel)) {
      return { data: [], keys: [], indexBy: null };
    }

    // Validación de campos seleccionados
    if (!this.validateSelectedFields(panel)) {
      return { data: [], keys: [], indexBy: null };
    }

    // Validación de distribución de campos
    if (!this.validateQueryFieldsDistribution(panel)) {
      return { data: [], keys: [], indexBy: null };
    }

    // Validación de campos de agrupación
    if (!this.validateGroupByFields(panel)) {
      return { data: [], keys: [], indexBy: null };
    }

    this.fieldFilter = panel.queryParameters.query_fields_distribution?.group_by_fields[0].name;

    const data = panel?.queryParameters?.rawData || [];
    const selectedFields = panel?.queryParameters?.selected_fields || [];
    if (!Array.isArray(data) || data.length === 0) return { data: [], keys: [], indexBy: null };
    if (!Array.isArray(selectedFields) || selectedFields.length < 3) return { data: [], keys: [], indexBy: null };
    const groupField1 = selectedFields[0].name;
    const groupField2 = selectedFields[1].name;
    this.primaryGroupFieldName = groupField1;
    this.secondaryGroupFieldName = groupField2;
    const metricBaseField = selectedFields[2].name;
    const metricField = Object.keys(data[0] || {}).find(key => key.startsWith(`${metricBaseField}__`));
    if (!metricField) return { data: [], keys: [], indexBy: null };
    const dictionaryMap = panel?.queryParameters?.dictionaryMap ?? {};
    const resolveLabel = (value) => resolveDictionaryLabel(value ?? "null", dictionaryMap);

    const grouped = {};
    data.forEach(d => {
      const rawKey1 = d[groupField1] ?? "null";
      const rawKey2 = d[groupField2] ?? "null";
      const key1 = resolveLabel(rawKey1);
      const key2 = resolveLabel(rawKey2);
      const value = parseFloat(d[metricField]) || 0;
      if (!grouped[key1]) {
        grouped[key1] = {};
      }
      if (!grouped[key1][key2]) {
        grouped[key1][key2] = 0;
      }
      grouped[key1][key2] += value;
    });
    const keys = [...new Set(data.map(d => resolveLabel(d[groupField2] ?? "null")))];
    const transformedData = Object.entries(grouped).map(([key1, obj]) => {
      return {
        [groupField1]: key1,
        ...obj
      };
    });
    return {
      data: transformedData,
      keys,
      indexBy: groupField1
    };
  }

  transformDataClick(datum, fieldFilter) {
    const nodeField = this?.secondaryGroupFieldName ?? fieldFilter ?? this.fieldFilter;
    const transformed = { field: nodeField, value: datum.id };

    this.filterManager.createRule(nodeField, datum.id, "EQUALS");
    return transformed;
  }

  transformChartProps(params) {
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
    const styles = params.chart_setup_styles ?? {};
    const axisFormatProps = buildAxisValueFormatProps({
      styles,
      liveChartProps: params.liveChartProps,
    });
    const legendProps = buildLegendProps({
      source: 'bar',
      dimension: 'id',
      styles,
      liveChartProps: params.liveChartProps,
    });

  const merged = merge(
    {},
    params.chart_setup_styles ?? {},
    { ...params.chart.defaultProps },
    params.liveChartProps,
    axisFormatProps,
    onClick ? { onClick } : {},
    { updateLiveChartProps: params.updateLiveChartPropsMethods },
    { panel: params.data },
    {
      data: params.chartData?.data ?? [],
      keys: params.chartData?.keys ?? [],
      indexBy: params.chartData?.indexBy ?? null,
    }
  );

  return { ...merged, ...legendProps };
}
}

