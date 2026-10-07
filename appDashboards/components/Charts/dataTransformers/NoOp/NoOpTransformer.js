import Transformer from "../Transformer";
import merge from "lodash/merge";
/**
 * NoOpTransformer - Transformador vacío para componentes que no necesitan transformar datos
 * 
 * Se utiliza para componentes como "Text" que no procesan datos de consultas,
 * pero necesitan un transformador para mantener la consistencia de la arquitectura.
 */
export class NoOpTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: 'AND',
      acceptsSubgroups: false,
      allowMultipleRules: true,
      isCoupled: false
    });
  }

  /**
   * No transforma datos, simplemente retorna una estructura vacía válida
   */
  transformData(panel) {
    return { data: []  };
  }

  /**
   * No procesa clicks, retorna null
   */
  transformDataClick(datum, fieldFilter) {
    return null;
  }


  
  
transformChartProps(params) {
  const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
  
  return merge(
    {},
    { ...params.chart.defaultProps},
    {styles: params.chart_setup_styles ?? {} },
    {styles: params.liveChartProps},
    onClick ? { onClick } : {},
    {updateLiveChartProps: params.updateLiveChartPropsMethods },
    {panel: params.data }
  );
}
}

