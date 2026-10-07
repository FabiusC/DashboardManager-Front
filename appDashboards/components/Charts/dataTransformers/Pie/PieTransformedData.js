import Transformer from '../Transformer'
import merge from "lodash/merge";
import { resolveDictionaryLabel } from "@components/PanelsWorkspace/utils/dictionaryUtils";
import { buildLegendProps } from "../utils/ChartLegend";
function getRandomColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 50%)`;
}


export class PieTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: 'AND',
      acceptsSubgroups: false,
      allowMultipleRules: false, // Solo permite una regla
      isCoupled: false
    });
  }

  transformData(panel) {
    // Validaciones básicas del panel
    if (!this.validatePanel(panel)) {
      return { data: [] };
    }

    // Validación de datos raw
    if (!this.validateRawData(panel)) {
      return { data: [] };
    }

    // Validación de distribución de campos
    if (!this.validateQueryFieldsDistribution(panel)) {
      return { data: [] };
    }

    // Validación de campos de agrupación
    if (!this.validateGroupByFields(panel)) {
      return { data: [] };
    }

    this.fieldFilter = panel?.queryParameters?.query_fields_distribution?.group_by_fields[0].name;

    const data = panel?.queryParameters?.rawData || [];
    if (!Array.isArray(data) || data.length === 0) return [];
    const groupField = panel?.queryParameters?.query_fields_distribution?.group_by_fields[0].name;
    const sampleEntry = data.find(d => d[groupField] !== null);
    if (!sampleEntry) return [];
    const aggregationField = Object.keys(sampleEntry).find(
      key => key !== groupField
    );
    if (!aggregationField) return [];
    const dictionaryMap = panel?.queryParameters?.dictionaryMap ?? {};
    const data2 = data
      .filter(d => d[groupField] !== null && d[aggregationField] !== null)
      .map(d => {
        const rawId = d[groupField];
        const label = resolveDictionaryLabel(rawId, dictionaryMap);
        return {
          id: label,
          filterValue: rawId,
          value: d[aggregationField],
          color: getRandomColor(),
          fieldByFilter: groupField,
        };
      });
    return { data: data2 };
  }

  transformDataClick(datum , fieldFilter) {
    const nodeField = datum?.data?.fieldByFilter ?? fieldFilter ?? this.fieldFilter;
    const filterValue = datum?.data?.filterValue ?? datum?.id;
    const transformed = { field: nodeField, value: filterValue };

    this.filterManager.createRule(nodeField, filterValue, "EQUALS" );
    return transformed
  }

  transformChartProps(params) {
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
    const styles = params.chart_setup_styles ?? {};
    const legendProps = buildLegendProps({
      source: 'pie',
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
      { panel: params.data },
    );

    return { ...merged, ...legendProps };
  }
}
