import Transformer from "../Transformer";
import merge from "lodash/merge";

export class selectFilterTransform extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter:    'OR',
      acceptsSubgroups:   false,
      allowMultipleRules: false,
      isCoupled:          false,
    });
    this._fieldKey = null;
    this._candidateKey = null;
    this._isDictionary = false;
  }
  getSelectedValuesFromStore(filterField) {
    if (!filterField || !this.filterManager) return [];
    const store = this.filterManager._getStore();
    if (!store?.groups || !store?.rules) return [];

    const mainGroup = store.groups[this.filterManager.mainGroupId];
    if (!mainGroup?.children?.length) return [];

    const selectedValues = [];
    const extractRules = (groupId) => {
      const group = store.groups[groupId];
      if (!group?.children?.length) return;

      group.children.forEach((childRef) => {
        if (childRef.type === 'rule') {
          const rule = store.rules[childRef.id];
          if (rule?.field === filterField && rule.operator === 'EQUALS') {
            selectedValues.push(String(rule.value));
          }
        } else if (childRef.type === 'group') {
          extractRules(childRef.id);
        }
      });
    };

    extractRules(mainGroup.id);
    return selectedValues;
  }

  transformData(panel) {
    const selected_fields = panel?.queryParameters?.selected_fields;
    if (!Array.isArray(selected_fields) || selected_fields.length === 0) {
      return { data: [], selectedValues: [], selectedValuesToFilters: [] };
    }

    this._fieldKey = selected_fields[0]?.name ?? null;
    this._candidateKey = selected_fields[1]?.name ?? null;

    const rawData = panel?.queryParameters?.rawData || [];
    const selectedValuesToFilters = this._candidateKey
      ? this.getSelectedValuesFromStore(this._candidateKey)
      : [];

    let selectedValues = this._fieldKey
      ? this.getSelectedValuesFromStore(this._fieldKey)
      : [];

    if (this._candidateKey && selectedValuesToFilters.length > 0 && rawData.length > 0) {
      const labelsFromCodes = selectedValuesToFilters
        .map((code) => {
          const row = rawData.find(
            (item) => String(item[this._candidateKey]) === String(code),
          );
          return row?.[this._fieldKey] != null ? String(row[this._fieldKey]) : null;
        })
        .filter(Boolean);

      if (labelsFromCodes.length > 0) {
        selectedValues = labelsFromCodes;
      }
    }

    if (!rawData.length) {
      return { data: [], selectedValues, selectedValuesToFilters };
    }

    return {
      data: rawData.map((item) => ({
        [this._fieldKey]: item[this._fieldKey],
        ...(this._candidateKey ? { [this._candidateKey]: item[this._candidateKey] } : {}),
      })),
      selectedValues,
      selectedValuesToFilters,
    };
  }

  transformDataClick(datum) {
    if (!this.filterManager || !this._fieldKey) return [];

    this.filterManager.clearPanelFilters();
    if (datum == null) return [];

    const values = (Array.isArray(datum) ? datum : [datum])
      .filter((v) => v != null && v !== '');

    if (!values.length) return [];

    const filterField = this._isDictionary && this._candidateKey ? this._candidateKey : this._fieldKey;

    return values.map((val) => {
      const filterValue = String(val);
      this.filterManager.createRule(filterField, filterValue, 'EQUALS');
      return { field: filterField, value: filterValue };
    });
  }

  transformChartProps(params) {
    const styles = { ...params.chart_setup_styles, ...params.liveChartProps };
    this._isDictionary = styles?.isAdiccionary === true || styles?.isAdiccionary === 'true';
    const chartData = params.chartData || {};
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;

    return merge(
      {},
      { ...params.chart.defaultProps },
      { styles: params.chart_setup_styles },
      { styles: params.liveChartProps },
      onClick ? { onClick } : {},
      { updateLiveChartProps: params.updateLiveChartPropsMethods },
      { panel: params.data },
      {
        selectedValues: chartData.selectedValues ?? [],
        selectedValuesToFilters: chartData.selectedValuesToFilters ?? [],
      },
    );
  }
}