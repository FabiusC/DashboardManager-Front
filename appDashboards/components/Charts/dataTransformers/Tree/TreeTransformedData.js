import Transformer from "../Transformer";
import merge from "lodash/merge";

export class TreeTransformedData extends Transformer {
  constructor(panel_id) {
    super(panel_id);
  }

  transformData(panel) {
    const defaultData = {
      data: {
        name: "data",
        children: [],
      },
    };
    if (!this.validatePanel(panel)) return defaultData;
    if (!this.validateRawData(panel)) return defaultData;
    if (!this.validateQueryFieldsDistribution(panel)) return defaultData;
    if (!this.validateGroupByFields(panel)) return defaultData;

    const dataResult = this.tranformFromTree(panel);
    return { data: dataResult };
  }

  tranformFromTree(panel) {
    const rawData = panel?.queryParameters?.rawData || [];

    let selectedFiles = panel?.queryParameters?.selected_fields || [];

    this.fieldFilter = selectedFiles[0].name;

    if (!Array.isArray(rawData) || rawData.length === 0) return defaultData;

    function buildTree(data, groupFields) {
      const [currentField, ...restFields] = groupFields;
      const fieldName =
        typeof currentField === "string" ? currentField : currentField?.name;
      const fieldNameCount = `${currentField.name}__${currentField.metric}`;

      const groups = {};
      data.forEach((item) => {
        let key = item?.[fieldName] ?? item?.[fieldNameCount] ?? "(Sin valor)";
        (groups[key] ||= []).push(item);
      });

      return Object.entries(groups).map(([key, items]) => {
        if (restFields.length === 0) {
          return {
            name: key,
            fieldByFilter: fieldName,
            filterValue: key,
          };
        }

        return {
          name: key,
          fieldByFilter: fieldName,
          filterValue: key,
          children: buildTree(items, restFields),
        };
      });
    }

    return {
      name: "Data",
      fieldByFilter: this.fieldFilter,
      children: buildTree(rawData, selectedFiles),
    };
  }

  transformDataClick(datum, fieldFilter) {
    const fieldName = datum?.data?.fieldByFilter ?? fieldFilter ?? this.fieldFilter;

    const filterValue = datum?.data?.filterValue ?? datum?.id;
    const transformed = { field: fieldName, value: filterValue };

    this.filterManager.createRule(fieldName, filterValue, "EQUALS");
    return transformed;
  }

  transformChartProps(params) {
    const onClick = !params.isEditionMode
      ? this.getOnClick(null, params.data)
      : undefined;
    const styles = params.chart_setup_styles ?? {};
    
    const nodeTooltip = ({ node }) => {
      if (!node) return null;

      const label = node.data?.fieldByFilter ?? "";
      const rawValue = node.data?.filterValue ?? 0;

      return (
        <div
          style={{
            background: "white",
            padding: "9px 12px",
            borderRadius: "4px",
            fontSize: "11px",
            fontFamily:  "sans-serif",
            textAlign:"center"
          }}
        >
          <div>
            <p><strong>{label}</strong></p>
            <p>{rawValue}</p>
          </div>
        </div>
      );
    };

    const merged = merge(
      { ...params.chart.defaultProps },
      styles,
      params.liveChartProps,
      {
        ...(onClick
          ? {
              onNodeClick: onClick,
            }
          : {}),
      },
      { updateLiveChartProps: params.updateLiveChartPropsMethods },
      { panel: params.data },
      { identity: "name" },
      { nodeTooltip },
    );
    return { ...merged };
  }
}
