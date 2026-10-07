import Transformer from "../Transformer";
import merge from "lodash/merge";
import { getResolvedColors } from "../utils/PaletteColors"

export class NetworkTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: 'AND',
      acceptsSubgroups: false,
      allowMultipleRules: true,
      isCoupled: false,
    });
  }

  emptyData() {
    return { data: { nodes: [], links: [] } };
  }

  transformData(panel) {
    if (!this.validateRawData(panel)) { return this.emptyData(); }
    console.log("panel: ", panel)
    const qParams = panel?.queryParameters || {};
    const distribution = qParams?.query_fields_distribution ?? qParams?.fields_distribution ?? {};
    const rawDimensions = [
      ...(distribution?.group_by_fields || []),
      ...(distribution?.attribute_fields || []),
      ...(qParams?.selected_fields?.filter(f => f.type === 'dimension') || [])
    ];

    const uniqueDimensions = Array.from(
      new Map(rawDimensions.map(f => [f.name || f.field_id, f])).values()
    );
    const dimFields = uniqueDimensions.map(d => d.name).filter(Boolean);
    if (dimFields.length < 2) {
      return this.emptyData();
    }
    
    this.sourceFieldFilter = dimFields[0];
    this.targetFieldFilter = dimFields[1];
    
    const rawData = qParams.rawData || [];
    const nodesMap = new Map();
    const linksMap = new Map();

    const sortField = qParams.sort_field || dimFields[0];
    const rootNodeId = `root-${sortField}`;

    // Init root node
    nodesMap.set(rootNodeId, {
      rawId: rootNodeId,
      path: sortField,
      name: sortField,
      value: 0,
      group: "root",
      children: new Set()
    });

    // Register nodes and links
    for (const record of rawData) {
      if (!record) continue;
      const isArr = Array.isArray(record);

      const dimValues = dimFields.map((field, idx) => {
        return isArr ? record[idx] : record[field];
      });

      let parentRawId = rootNodeId;
      let currentPath = sortField;

      for (let i = 0; i < dimValues.length; i++) {
        const val = dimValues[i];
        if (val == null || val === "") break;

        const valStr = String(val);
        const groupName = dimFields[i];
        
        currentPath = `${currentPath} > ${valStr}`;
        const currentRawId = `${parentRawId}>${groupName}:${valStr}`;

        // Register unique nodes
        if (!nodesMap.has(currentRawId)) {
          nodesMap.set(currentRawId, {
            rawId: currentRawId,
            path: currentPath,
            name: valStr,
            value: 0,
            group: groupName,
            isLeaf: i === dimValues.length - 1 || dimValues[i + 1] == null || dimValues[i + 1] === ""
          });
        }

        // Register unidirectional link
        const linkKey = `${parentRawId}->${currentRawId}`;
        if (!linksMap.has(linkKey)) {
          linksMap.set(linkKey, {
            source: parentRawId,
            target: currentRawId,
            value: 0
          });
        }
        
        parentRawId = currentRawId;
      }
    }

    // Count node and links frequency
    for (const record of rawData) {
      if (!record) continue;
      const isArr = Array.isArray(record);

      const dimValues = dimFields.map((field, idx) => {
        return isArr ? record[idx] : record[field];
      });

      let parentRawId = rootNodeId;

      for (let i = 0; i < dimValues.length; i++) {
        const val = dimValues[i];
        if (val == null || val === "") break;

        const groupName = dimFields[i];
        const currentRawId = `${parentRawId}>${groupName}:${String(val)}`;
        
        const isLast = i === dimValues.length - 1 || dimValues[i + 1] == null || dimValues[i + 1] === "";
        
        if (isLast) {
          nodesMap.get(currentRawId).value += 1;
        }

        const linkKey = `${parentRawId}->${currentRawId}`;
        if (linksMap.has(linkKey)) {
          linksMap.get(linkKey).value += 1;
        }

        parentRawId = currentRawId;
      }
    }

    const sortedNodes = Array.from(nodesMap.entries()).sort((a, b) => b[0].length - a[0].length);

    for (const [id, node] of sortedNodes) {
      if (id === rootNodeId) continue;
      
      const parentLinks = Array.from(linksMap.values()).filter(l => l.target === id);
      if (parentLinks.length > 0 && node.value === 0) {
        const childLinks = Array.from(linksMap.values()).filter(l => l.source === id);
        if (childLinks.length > 0) {
          node.value = childLinks.reduce((sum, link) => {
            return sum + (nodesMap.get(link.target)?.value || 0);
          }, 0);
        }
      }
    }

    const rootChildrenLinks = Array.from(linksMap.values()).filter(l => l.source === rootNodeId);
    nodesMap.get(rootNodeId).value = rootChildrenLinks.reduce((sum, link) => {
      return sum + (nodesMap.get(link.target)?.value || 0);
    }, 0);


    const formattedNodesMap = new Map();
    const formattedLinksMap = new Map();

    nodesMap.forEach((node, rawId) => {
      const formattedId = rawId === rootNodeId ? `${node.path} : ${node.value}` : `${node.path} : ${node.value}`;
      formattedNodesMap.set(rawId, formattedId);
    });

    linksMap.forEach((link) => {
      const sourceFormatted = formattedNodesMap.get(link.source);
      const targetFormatted = formattedNodesMap.get(link.target);

      const linkKey = `${sourceFormatted}->${targetFormatted}`;
      if (!formattedLinksMap.has(linkKey)) {
        formattedLinksMap.set(linkKey, {
          source: sourceFormatted,
          target: targetFormatted,
          value: link.value
        });
      }
    });

    const rawNodesArray = Array.from(nodesMap.values());
    const resolvedColors = getResolvedColors(panel, qParams);
    const uniqueGroups = Array.from(new Set(rawNodesArray.map(n => n.group)));
    const groupColorMap = { root: '#2c3e50' };
    
    let colorIdx = 0;
    uniqueGroups.forEach((groupName) => {
      if (groupName !== 'root') {
        groupColorMap[groupName] = resolvedColors[colorIdx % resolvedColors.length];
        colorIdx++;
      }
    });

    const nodes = rawNodesArray.map(node => {
      const nodeValue = node.value || 1;
      const baseSize = node.rawId === rootNodeId ? 22 : Math.max(5, Math.min(20, nodeValue * 1.1));
      const formattedLabel = `${node.path} : ${nodeValue}`;

      return {
        id: formattedLabel,
        name: formattedLabel,
        value: nodeValue,
        group: node.group,
        baseSize: baseSize,
        nodeSize: baseSize,
        color: groupColorMap[node.group] || resolvedColors[0]
      };
    });

    const links = Array.from(formattedLinksMap.values());
    
    if (!nodes.length || !links.length) {
      return this.emptyData();
    }
    
    return { data: { nodes, links } };
  }
  
  transformDataClick(datum) {
    if (!this.filterManager) return null;
    console.log("datum ", datum);
    
    if (datum && datum.id) {
      const rawId = datum.rawId || datum.id; 
      const cleanId = rawId.split(" : ")[0];
      const segments = cleanId.split(" > ");
      const targetValue = segments[segments.length - 1]; 

      const columnField = datum.data?.group;
      if (columnField == "root") {return null}
      const filters = [];

      if (columnField && targetValue != null && targetValue !== "") {
        this.filterManager.createRule(columnField, targetValue, "EQUALS");
        filters.push({ field: columnField, value: targetValue, operator: "EQUALS" });
      }

      return filters.length > 0 ? filters : null;
    }
    
    return null;
  }

  transformChartProps(params) {
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
    
    const sourceChartData = params.chartData?.data || { nodes: [], links: [] };
    const rawNodes = sourceChartData.nodes || [];
    const rawLinks = sourceChartData.links || [];

    const resolvedColors = getResolvedColors(params.data, params.data?.queryParameters);
    const linkColor = resolvedColors.length <= 4 ? '#777777' : resolvedColors[0];

    const styles = params.chart_setup_styles ?? {};
    const liveChartProps = params.liveChartProps ?? {};

    const frontendNodeSize = Number(liveChartProps.nodeSize ?? styles.nodeSize) || 12;

    const chartData = {
      nodes: rawNodes,
      links: rawLinks
    };

    return merge(
      {},
      params.chart?.defaultProps,
      styles,
      {
        data: chartData,
        nodeColor: node => node.color,
        nodeSize: node => node.nodeSize,
        nodeLabel: "name",
        linkColor: linkColor,
      },
      params.liveChartProps,
      {
        nodeSize: node => node.nodeSize * (frontendNodeSize / 10)
      },
      onClick ? { onClick } : {},
      { updateLiveChartProps: params.updateLiveChartPropsMethods },
      { panel: params.data }
    );
  }
}