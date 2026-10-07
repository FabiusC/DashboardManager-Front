import Transformer from "../Transformer";
import merge from "lodash/merge";
import { resolveDictionaryLabel } from "@components/PanelsWorkspace/utils/dictionaryUtils";
import { buildLegendProps } from "../utils/ChartLegend";

export class RadarTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: "AND",
      acceptsSubgroups: false,
      allowMultipleRules: false,
      isCoupled: false,
    });
  }

  emptyData() {
    return { data: [], keys: [], indexBy: null };
  }

  transformData(panel) {
    if (!this.validatePanel(panel)) return this.emptyData();
    if (!this.validateRawData(panel)) return this.emptyData();
    if (!this.validateQueryFieldsDistribution(panel)) return this.emptyData();
    if (!this.validateGroupByFields(panel)) return this.emptyData();
    if (!this.validateAggregationFields(panel)) return this.emptyData();

    const { group_by_fields, aggregation_fields } = panel.queryParameters.query_fields_distribution;
    const rawData = panel.queryParameters.rawData;
    const indexBy = group_by_fields[0]?.name;

    if (!indexBy || !aggregation_fields.length) return this.emptyData();

    this.fieldFilter = indexBy;
    const dictionaryMap = panel.queryParameters.dictionaryMap ?? {};
    const keys = aggregation_fields
      .map((field) => `${field.name}__${field.metric}`)
      .filter((key) =>
        rawData.some((row) => Object.prototype.hasOwnProperty.call(row, key))
      );

    if (!keys.length) return this.emptyData();

    const data = rawData
      .filter((row) => row?.[indexBy] != null)
      .map((row) => {
        const filterValue = row[indexBy];
        const entry = {
          [indexBy]: resolveDictionaryLabel(filterValue, dictionaryMap),
          filterValue,
          fieldByFilter: indexBy,
        };

        keys.forEach((key) => {
          const value = Number(row[key]);
          entry[key] = Number.isFinite(value) ? value : 0;
        });

        return entry;
      });
    return { data, keys, indexBy };
  }

  transformDataClick(datum, fieldFilter) {
    if (!this.filterManager) return null;

    const nodeField = datum?.fieldByFilter ?? fieldFilter ?? this.fieldFilter;
    const filterValue = datum?.filterValue ?? datum?.[nodeField];

    if (!nodeField || filterValue == null || filterValue === "") return null;

    this.filterManager.createRule(nodeField, filterValue, "EQUALS");
    return { field: nodeField, value: filterValue };
  }

  transformChartProps(params) {
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
    const styles = params.chart_setup_styles ?? {};
    const legendProps = buildLegendProps({
      source: "radar",
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
      {
        data: params.chartData?.data ?? [],
        keys: params.chartData?.keys ?? [],
        indexBy: params.chartData?.indexBy ?? null,
      }
    );

    return { ...merged, ...legendProps };
  }
}
