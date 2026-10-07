import Transformer from "../Transformer";
import merge from "lodash/merge";
import { buildLegendProps } from "../utils/ChartLegend";

const numberFormatter = new Intl.NumberFormat("es-ES", { useGrouping: true });


const BOX_PLOT_TRANSLATION = {
  n: "Cantidad",
  Summary: "Resumen",
  mean: "Promedio",
  min: "Mínimo",
  max: "Máximo",
  Quantiles: "Cuantiles",
};

function formatBoxPlotValue(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return numberFormatter.format(n);
}

export class BoxPlotTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: "AND",
      acceptsSubgroups: false,
      allowMultipleRules: true,
      isCoupled: false,
    });
    this.groupField = null;
    this.subGroupField = null;
  }

  emptyData() {
    return { data: [], hasSubGroups: false };
  }

  transformData(panel) {
    if (!this.validatePanel(panel)) return this.emptyData();
    if (!this.validateRawData(panel)) return this.emptyData();

    const selectedFields = panel?.queryParameters?.selected_fields;
    if (!Array.isArray(selectedFields) || selectedFields.length < 2 || selectedFields.length > 3) {
      return this.emptyData();
    }

    const groupField = selectedFields[0];
    const valueField = selectedFields[selectedFields.length - 1];
    const subGroupField = selectedFields.length === 3 ? selectedFields[1] : null;

    if (!groupField?.name || !valueField?.name) return this.emptyData();

    this.groupField = groupField.name;
    this.subGroupField = subGroupField?.name ?? null;
    this.fieldFilter = groupField.name;

    const valueKey = valueField.name;
    const hasSubGroups = Boolean(this.subGroupField);
    const data = [];

    for (const row of panel.queryParameters.rawData) {
      const group = row?.[this.groupField];
      const value = Number(row?.[valueKey]);
      if (group == null || group === "" || !Number.isFinite(value)) continue;

      if (hasSubGroups) {
        const subGroup = row?.[this.subGroupField];
        if (subGroup == null || subGroup === "") continue;
        data.push({ group: String(group), subGroup: String(subGroup), value });
      } else {
        data.push({ group: String(group), value });
      }
    }

    if (!data.length) return this.emptyData();
    return { data, hasSubGroups };
  }

  transformDataClick(datum) {
    if (!this.filterManager) return null;

    const group = datum?.group ?? datum?.data?.group;
    const subGroup = datum?.subGroup ?? datum?.data?.subGroup;

    if (!this.groupField || group == null || group === "") return null;

    this.filterManager.createRule(this.groupField, group, "EQUALS");

    if (this.subGroupField && subGroup != null && subGroup !== "") {
      this.filterManager.createRule(this.subGroupField, subGroup, "EQUALS");
      return [
        { field: this.groupField, value: group },
        { field: this.subGroupField, value: subGroup },
      ];
    }

    return { field: this.groupField, value: group };
  }

  transformChartProps(params) {
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
    const styles = params.chart_setup_styles ?? {};
    const hasSubGroups = Boolean(params.chartData?.hasSubGroups);
    const legendProps = buildLegendProps({
      source: "boxplot",
      dimension: hasSubGroups ? "subGroup" : "group",
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

    return {
      ...merged,
      ...legendProps,
      groupBy: "group",
      value: "value",
      subGroupBy: hasSubGroups ? "subGroup" : null,
      colorBy: hasSubGroups ? "subGroup" : "group",
      valueFormat: formatBoxPlotValue,
      theme: {
        ...merged.theme,
        translation: {
          ...BOX_PLOT_TRANSLATION,
          ...merged.theme?.translation,
        },
      },
    };
  }
}
