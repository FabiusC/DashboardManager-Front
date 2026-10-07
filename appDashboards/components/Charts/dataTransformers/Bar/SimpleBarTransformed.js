import Transformer from '../Transformer'
import merge from "lodash/merge";
import { resolveDictionaryLabel } from "@components/PanelsWorkspace/utils/dictionaryUtils";
import { buildSingleSeriesBarColorProps } from "../utils/legendUtils";
import { buildLegendProps } from "../utils/ChartLegend";
import { sortByCalendarOrder } from "../utils/categoryOrderUtils";
import { buildAxisValueFormatProps } from "../utils/axisValueFormat";

export class SimpleBarTransformed extends Transformer {
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
    // Validaciones básicas del panel
    if (!this.validatePanel(panel)) {
      return { data: [], keys: [], indexBy: null };
    }

    // Validación de datos raw
    if (!this.validateRawData(panel)) {
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

    this.fieldFilter = panel.queryParameters.query_fields_distribution.group_by_fields[0].name;

    const data = panel?.queryParameters?.rawData || [];
    if (!Array.isArray(data) || data.length === 0) return { data: [], keys: [], indexBy: null };
    const groupField = panel?.queryParameters?.query_fields_distribution?.group_by_fields?.[0]?.name;
    if (!groupField) return { data: [], keys: [], indexBy: null };
    const sampleEntry = data.find(d => d[groupField] !== null);
    if (!sampleEntry) return { data: [], keys: [], indexBy: null };
    const aggregationKeys = Object.keys(sampleEntry).filter(k => k !== groupField);
    if (aggregationKeys.length === 0) return { data: [], keys: [], indexBy: groupField };
    const dictionaryMap = panel?.queryParameters?.dictionaryMap ?? {};
    const transformedData = data
      .filter(d => d[groupField] !== null)
      .map(d => {
        const rawId = d[groupField];
        const label = resolveDictionaryLabel(rawId, dictionaryMap);
        const entry = { [groupField]: label, filterValue: rawId };
        aggregationKeys.forEach(key => {
          if (d[key] !== null && !isNaN(d[key])) {
            entry[key] = parseFloat(d[key]);
          }
        });
        // incluir el campo para uso en onClick
        entry.fieldByFilter = groupField;
        return entry;
      });
    const orderedData = sortByCalendarOrder(transformedData, item => item[groupField]);

    return {
      data: orderedData,
      keys: aggregationKeys,
      indexBy: groupField
    };
  }

  transformDataClick(datum, fieldFilter) {
    const nodeField = datum?.data?.fieldByFilter ?? fieldFilter ?? this.fieldFilter;
    const filterValue = datum?.data?.filterValue ?? datum?.data?.[nodeField];
    const transformed = { field: nodeField, value: filterValue };

    this.filterManager.createRule(nodeField, filterValue, "EQUALS");
    return transformed;
  }

transformChartProps(params) {
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;     
    const tooltip = (props) => {
        const formattedValue = new Intl.NumberFormat('es-ES',{useGrouping: true}).format(props.value);
        const node = props;
        if (!node) return null;
        
        return (
          <div style={{
            background: 'white',
            padding: '9px 12px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'sans-serif'
          }}>
           <strong>{props.indexValue}</strong>: {formattedValue}
          </div>
        );
      }
      const styles = params.chart_setup_styles ?? {};
      const liveChartProps = params.liveChartProps ?? {};
      const keys = params.chartData?.keys ?? [];
      const legendProps = buildLegendProps({
        source: 'bar',
        dimension: keys.length === 1 ? 'indexValue' : 'id',
        styles,
        liveChartProps: params.liveChartProps,
      });
      const colorProps = buildSingleSeriesBarColorProps(params.chartData, params.data?.colorStrategy);
      const axisFormatProps = buildAxisValueFormatProps({
        styles,
        liveChartProps,
      });

  const merged = merge(
    {},
    params.chart_setup_styles ?? {},
    { ...params.chart.defaultProps },
    params.liveChartProps,
    colorProps,
    { updateLiveChartProps: params.updateLiveChartPropsMethods },
    onClick ? { onClick } : {},
    { panel: params.data },
    {
      data: params.chartData?.data ?? [],
      keys: params.chartData?.keys ?? [],
      indexBy: params.chartData?.indexBy ?? null,
      ...axisFormatProps,
      tooltip: tooltip
    }
  );

  return { ...merged, ...legendProps };
}
}

