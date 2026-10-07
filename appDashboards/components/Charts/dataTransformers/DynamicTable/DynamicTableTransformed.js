import Transformer from '../Transformer';
import merge from 'lodash/merge';

export class DynamicTableTransformer extends Transformer {
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
      return { data: [], dataSourceId: null };
    }

    // Validación de datos raw
    if (!this.validateRawData(panel)) {
      return { data: [], dataSourceId: null };
    }

    // Por ahora devolvemos datos dummy
    // En el futuro aquí procesaremos los datos reales del panel
    const dataSourceId = panel?.queryParameters?.datasource_id
    const dummyData = [
      { region: 'Norte', producto: 'Laptop', ventas: 150, cantidad: 25, mes: 'Enero' },
    ];

    return { data: dummyData, dataSourceId };
  }

  transformDataClick(datum, fieldFilter) {
    const nodeField = datum?.data?.fieldByFilter ?? fieldFilter ?? this.fieldFilter;
    const transformed = { field: nodeField, value: datum.id };

    this.filterManager.createRule(nodeField, datum.id, "EQUALS");
    return transformed;
  }

  transformChartProps(params) {
    const styles = params.chart_setup_styles ?? {};
    const dataSourceId = params.chartData?.dataSourceId ?? params.data?.queryParameters?.datasource_id ?? null;
    return merge(
      {},
      { ...params.chart.defaultProps },
      { styles },
      { styles: params.liveChartProps },
      { updateLiveChartProps: params.updateLiveChartPropsMethods },
      { panel: params.data },
      { dataSourceId }
    );
  }
}
