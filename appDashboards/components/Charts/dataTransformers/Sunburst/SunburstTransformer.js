import { resolveDictionaryLabel } from "@components/PanelsWorkspace/utils/dictionaryUtils";
import Transformer from "../Transformer";
import merge from "lodash/merge";
import { first, forEach } from "lodash";

/**
 * SunBurstTransformer - Transformer for Sunburst Chart
 *
 */

export class SunburstTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: "AND",
      acceptsSubgroups: false,
      allowMultipleRules: false,
      isCoupled: false,
    });
  }

  /**
   *  Basic empty validations. Returns an empty valid structure
   */

  transformData(panel) {
    // Basic validations
    if (!this.validatePanel(panel)) {
      return { data: [] };
    }

    // Raw data validation
    if (!this.validateRawData(panel)) {
      return { data: [] };
    }

    // Fields distribution validation
    if (!this.validateQueryFieldsDistribution(panel)) {
      return { data: [] };
    }

    // GroupBy fields validation
    if (!this.validateGroupByFields(panel)) {
      return { data: [] };
    }

    // Selection fields validation
    const selection_fields = panel?.queryParameters?.selected_fields;
    if (!Array.isArray(selection_fields)) {
      return { data: [] };
    }
    if (selection_fields.length == 0 || selection_fields == undefined) {
      return { data: [] };
    }

    this.fieldFliter =
      panel?.queryParameters?.query_fields_distribution?.group_by_fields[0].name;

    // Data validation
    const data = panel?.queryParameters?.rawData || [];
    if (!Array.isArray(data) || data.length === 0) return [];

    // Get the field to group the data
    const groupField =
      panel?.queryParameters?.query_fields_distribution?.group_by_fields[0]
        .name;

    // Get a unique sample from the data
    const sampleEntry = data.find((d) => d[groupField] !== null);
    if (!sampleEntry) return [];

    // Get the aggregation fields in the sample
    const aggregationFields = Object.keys(sampleEntry).filter(
      (key) => key !== groupField,
    );
    if (!aggregationFields) return [];

    // Last aggregation field
    const lastKey = aggregationFields.at(-1);

    const finalData = this.organizeRegistry(
      data,
      groupField,
      aggregationFields,
      lastKey,
    );
    return { data: finalData };
  }

  transformDataClick(datum, fieldFilter) {
    const nodeField =
      datum?.data?.fieldByFilter ?? fieldFilter ?? this.fieldFilter;
    const filterValue = datum?.data.filterValue;
    if (!nodeField || !filterValue) return null;
    this.filterManager.createRule(nodeField, filterValue, "EQUALS");

    return { field: nodeField, value: filterValue };
  }

  transformChartProps(params) {
    const onClick = !params.isEditionMode
      ? this.getOnClick(null, params.data)
      : undefined;
    const styles = params.chart_setup_styles ?? {};

    const merged = merge(
      {},
      { ...params.chart.defaultProps },
      styles,
      params.liveChartProps,
      onClick ? { onClick } : {},
      { updateLiveChartProps: params.updateLiveChartPropsMethods },
      { panel: params.data },
    );

    return { ...merged };
  }

  organizeRegistry(data, groupField, aggregationFields, finalField) {
    const dataFinal = { id: "data", children: [] };
    let parent = {};
    for (const row of data) {
      // Validate if parent exists using the groupField
      parent = dataFinal.children.find((p) => p.id === row[groupField]);

      // IF not exists, add to dataFinal and save the object in parent
      if (!parent) {
        const newParent = { id: row[groupField], children: [],  filterValue:row[groupField], fieldByFilter: groupField };
        dataFinal.children.push(newParent);
        parent = newParent;
      }

      // Continue with aggregationFields
      for (const aggregationField of aggregationFields) {
        let child = null;

        // IF it is the final field add with the value property
        if (aggregationField == finalField) {
          child = { id: row[aggregationField], value: row[aggregationField], filterValue: parent.filterValue, fieldByFilter: parent.fieldByFilter  };
          parent.children.push(child);
        } else {
          // IF it is not the final field add the children property
          child = { id: row[aggregationField], children: [],  value: row[aggregationField], filterValue:row[aggregationField], fieldByFilter: aggregationField };
          parent.children.push(child);
        }
        // Change the parent reference for the next aggregationField
        parent = child;
      }
    }

    return dataFinal;
  }
}
