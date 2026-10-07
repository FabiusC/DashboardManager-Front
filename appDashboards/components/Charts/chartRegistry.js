
import dynamic from "next/dynamic";
// import { BarTransformer } from "./transformers/BarTransformer";
import SimpleIndicator from './custom/customCharts/IndicatorCard/SimpleIndicator'
import MinMaxIndicator from './custom/customCharts/IndicatorCard/MinMaxIndicator'
import ComposedIndicator from './custom/customCharts/IndicatorCard/ComposedIndicator'
import filterSelect from './custom/customFilters/filterSelect'
import PopulationPyramidChart from './custom/customCharts/PopulationPyramid/PopulationPyramidChart'
// import heatMap from './custom/customCharts/MapChart/heatMap'


// import DepartamentColombiaMap from './customCharts/MapChart/index'

const ResponsivePie = dynamic(() => import("@nivo/pie").then(m => m.ResponsivePie), { ssr: false });
const ResponsiveBar = dynamic(() => import("@nivo/bar").then(m => m.ResponsiveBar), { ssr: false });
const ResponsiveTreeMap = dynamic(() => import("@nivo/treemap").then(m => m.ResponsiveTreeMap), { ssr: false });
const DepartamentColombiaMap = dynamic(
  () => import("./custom/customCharts/MapChart"),
  { ssr: false }
);
const MunicipalityColombiaMap = dynamic(
  () => import("./custom/customCharts/MapChart/municipalities_colombia"),
  { ssr: false }
);
const ResponsiveLine  = dynamic(() => import("@nivo/line").then(m => m.ResponsiveLine), { ssr: false });
const heatMap = dynamic(
  () => import('@components/Charts/custom/customCharts/MapChart/heatMap'),
  { ssr: false }
);
const clusterMap = dynamic(
  () => import('@components/Charts/custom/customCharts/MapChart/clusterMap'),
  { ssr: false }
);
const BogotaMapChart  = dynamic(() => import("@components/Charts/custom/customCharts/MapChart/BogotaMapChart/BogotaMapChart"), { ssr: false });
const ResponsiveFunnel = dynamic(() => import("@nivo/funnel").then((m) => m.ResponsiveFunnel), {
  ssr: false,
});
const ResponsiveSwarm = dynamic(() => import("@nivo/swarmplot").then(m => m.ResponsiveSwarmPlot), {ssr: false})
const ResponsivesanKey = dynamic(() => import("@nivo/sankey").then(m => m.ResponsiveSankey), { ssr: false });
const ResponsiveScatterPlot  = dynamic(() => import("@nivo/scatterplot").then(m => m.ResponsiveScatterPlotCanvas), {ssr: false})
const ResponsiveCirclePacking = dynamic(() => import("@nivo/circle-packing").then(m => m.ResponsiveCirclePacking), { ssr: false });
const ResponsiveCalendar = dynamic(() => import("@nivo/calendar").then(m => m.ResponsiveCalendar), { ssr: false });
const ResponsiveRadar = dynamic(() => import("@nivo/radar").then(m => m.ResponsiveRadar), { ssr: false });
const ResponsiveStream = dynamic(() => import("@nivo/stream").then(m => m.ResponsiveStream), { ssr: false });
const ResponsiveBoxPlot = dynamic(() => import("@nivo/boxplot").then(m => m.ResponsiveBoxPlot), { ssr: false });
const ResponsiveAreaBump = dynamic(() => import("@nivo/bump").then(m => m.ResponsiveAreaBump), { ssr: false });
const ResponsiveBump = dynamic(() => import("@nivo/bump").then(m => m.ResponsiveBump), { ssr: false });
const ResponsiveMarimekko = dynamic(() => import("@nivo/marimekko").then(m => m.ResponsiveMarimekko), { ssr: false });
const ResponsiveChord = dynamic(() => import("@nivo/chord").then(m => m.ResponsiveChordCanvas), { ssr: false });
const ResponsiveSunburst = dynamic(()=> import("@nivo/sunburst").then(m=> m.ResponsiveSunburst), {ssr: false});
const ResponsiveGridHeatMap = dynamic(() => import("@nivo/heatmap").then(m => m.ResponsiveHeatMap), {ssr: false});
const ResponsiveWaffle = dynamic(()=> import("@nivo/waffle").then(m=> m.ResponsiveWaffle), {ssr: false});
const ResponsiveTree = dynamic(()=> import("@nivo/tree").then(m=> m.ResponsiveTree), {ssr: false});
const ResponsiveNetwork = dynamic(()=> import("@nivo/network").then(m=> m.ResponsiveNetworkCanvas), {ssr: false});

import GaugeChart from "./custom/customCharts/Gauge/GaugeChart";
import { MunicipalityTransformedData } from './dataTransformers/Map/MapMunicipalitiesTransformedData'
import { PieTransformer } from "./dataTransformers/Pie/PieTransformedData" 
import { AdvancedBarTransformed } from "./dataTransformers/Bar/AdvancedBarTransformed"
import { SimpleBarTransformed } from "./dataTransformers/Bar/SimpleBarTransformed"
import { PopulationPyramidTransformer } from "./dataTransformers/PopulationPyramid/PopulationPyramidTransformer"
import { TreeMapTransformedData } from "./dataTransformers/Treemap/TreeMapTransformedData"
// import { transformMultiValueIndicatorData } from "./dataTransformers/IndicatorCard/ComposedIndicator"
import { SimpleIndicatorTransformed } from "./dataTransformers/Indicator/SimpleIndicatorTransformed"
import { MinMaxIndicatorTransformer } from "./dataTransformers/Indicator/MinMaxIndicatorTransformed"
import { ComposedIndicatorTransformed } from "./dataTransformers/Indicator/ComposeIndicatorTransformed"
import { MapTransformedData } from './dataTransformers/Map/MapTransformedData'
import { MapHeatTransformer } from './dataTransformers/Map/MapHeatTransformer'
import { MapClusterTransformer } from './dataTransformers/Map/MapClusterTransformer'
import { FacetTableTransformer, RecordsTableTransformer, SearchTableTransformer } from './dataTransformers/Table/TablaTansformedData'
import FacetTable from "./custom/customCharts/TableChart/FacetTableChart";
import RecordsTable from "./custom/customCharts/TableChart/RecordsTableChart";
import SearchTable from "./custom/customCharts/TableChart/SearchTable";
import DynamicTable from "./custom/customCharts/DynamicTableChart/DynamicTable";
import { DynamicTableTransformer } from "./dataTransformers/DynamicTable/DynamicTableTransformed";
import Text from "./custom/customCharts/Text/Text";
import ImageChart from "./custom/customCharts/ImageChart/ImageChart";
import TrafficLight from "./custom/customCharts/TrafficLight/TrafficLight";
import { NoOpTransformer } from "./dataTransformers/NoOp/NoOpTransformer";
import { HierarchicalFilterTransformer } from "./dataTransformers/HierarchicalFilter/HierarchicalFilterTransformer";
import HierarchicalFilter from "./custom/customFilters/hierarchicalFilter";
import { LineTransformer } from "./dataTransformers/Line/LineTransformer";
import { SwarmTransformer} from "./dataTransformers/SwarmTransformer/SwarmTransformer"
import { selectFilterTransform} from "./dataTransformers/SelectTable/selectFilterTransform"
import { FunnelTransformer} from "./dataTransformers/Funnel/FunelTransformer"
import { SanKeyTransformer } from "./dataTransformers/SanKey/SanKeyTransformer";
import { ScatterPlotTransformer } from "./dataTransformers/ScatterPlot/ScatterPlotTransformer";
import { CirclePackingTransformer } from "./dataTransformers/CirclePacking/CirclePackingTransformer";
import { CalendarTransformer } from "./dataTransformers/Calendar/CalendarTransformer";
import { RadarTransformer } from "./dataTransformers/Radar/RadarTransformer";
import { StreamTransformer } from "./dataTransformers/Stream/StreamTransformer";
import { StreamCategoryTransformer } from "./dataTransformers/Stream/StreamCategoryTransformer";
import { BoxPlotTransformer } from "./dataTransformers/BoxPlot/BoxPlotTransformer";
import { AreaBumpTransformer } from "./dataTransformers/AreaBump/AreaBumpTransformer";
import { MarimekkoTransformer } from "./dataTransformers/Marimekko/MarimekkoTransformer";
import { ChordTransformer } from "./dataTransformers/Chord/ChordTransformer";
import { SunburstTransformer } from "./dataTransformers/Sunburst/SunburstTransformer";
import { BogotaMapTransformer } from "./dataTransformers/Map/BogotaMapTransformer";
import { GaugeTransformer } from "./dataTransformers/Gauge/GaugeTransformer";
import { GridHeatMapTransformer } from "./dataTransformers/GridHeatMap/GridHeatMapTransformer";
import { WaffleTransformer } from "./dataTransformers/Waffle/WaffleTransformedData";
import { TreeTransformedData } from "./dataTransformers/Tree/TreeTransformedData";
import { TrafficLightTranformer } from "./dataTransformers/TrafficLight/TrafficLightTranformedData";
import { NetworkTransformer } from "./dataTransformers/Network/NetworkTransformer";

const chartRegistry = {
  pie: {
    component: ResponsivePie,
    transformerClass: PieTransformer,
    isCustom: false,
    defaultProps: {
      animate: true,
      motionConfig: "noWobble",
      sortByValue: false, 
    }
  },
  bar: {
    component: ResponsiveBar,
    transformerClass: SimpleBarTransformed,
    isCustom: false,
    defaultProps: {
      animate: true,
      motionConfig: "noWobble",
    }
  },
  population_pyramid: {
    component: PopulationPyramidChart,
    transformerClass: PopulationPyramidTransformer,
    isCustom: true,
    defaultProps: {},
  },
  grouped_bar: {
    component: ResponsiveBar,
    transformerClass: AdvancedBarTransformed,
    isCustom: false,
    defaultProps: {
      groupMode: 'grouped',
      animate: true,
      motionConfig: "noWobble",
    }
  },
  stacked_bar: {
    component: ResponsiveBar,
    transformerClass: AdvancedBarTransformed,
    isCustom: false,
    defaultProps: {
      groupMode: 'stacked',
      animate: true,
      motionConfig: "noWobble",
    }
  },
  tree_map: {
    component: ResponsiveTreeMap,
    transformerClass: TreeMapTransformedData,
    isCustom: false,
    defaultProps: {}
  },
  composed_indicator: {
    component: ComposedIndicator,
    transformerClass: ComposedIndicatorTransformed,
    isCustom: true,
    defaultProps: {

    }

  },
  simple_indicator: {
    component: SimpleIndicator,
    transformerClass: SimpleIndicatorTransformed,
    isCustom: true,
    defaultProps: {}

  },
  facet_table: {
    component: FacetTable,
    transformerClass: FacetTableTransformer,
    isCustom: true,
    defaultProps: {}
  },
  colombian_map: {
    component: DepartamentColombiaMap,
    transformerClass: MapTransformedData,
    isCustom: true,
    defaultProps: {}
  },
  colombian_municipality_map: {
    component: MunicipalityColombiaMap,
    transformerClass: MunicipalityTransformedData,
    isCustom: true,
    defaultProps: {}
  },
  records_table: {
    component: RecordsTable,
    transformerClass: RecordsTableTransformer,
    isCustom: true,
    defaultProps: {}
  },
  dynamic_table: {
    component: DynamicTable,
    transformerClass: DynamicTableTransformer,
    isCustom: true,
    defaultProps: {}
  },
  min_max_indicator: {
    component: MinMaxIndicator,
    transformerClass: MinMaxIndicatorTransformer,
    isCustom: true,
    defaultProps: {}
  },
  text: { 
    component: Text,
    transformerClass: NoOpTransformer,
    isCustom: true,
    defaultProps: {}
  },
  image: {
    component: ImageChart,
    transformerClass: NoOpTransformer,
    isCustom: true,
    defaultProps: {}
  },
  hierarchical_filter: {
    component: HierarchicalFilter,
    transformerClass: HierarchicalFilterTransformer,
    isCustom: true,
    defaultProps: {

    }


  },
 line: {
  component: ResponsiveLine,
  transformerClass: LineTransformer,
  isCustom: false,
  defaultProps: {
    yScale: {type: 'linear'},
  }
},
  
  swarm: {
    component: ResponsiveSwarm,
    transformerClass: SwarmTransformer,
    isCustom: false,
    defaultProps: {
      axisTop: null,
      axisRight: null
    }
  },

  filter_select: {
    component: filterSelect, 
    transformerClass: selectFilterTransform,
    isCustom: true,
    defaultProps:{
    }
  },
  filter_select_affected: {
    component: filterSelect,
    transformerClass: selectFilterTransform,
    isCustom: true,
    defaultProps: {}
  },
  funnel: {
    component: ResponsiveFunnel,
    transformerClass: FunnelTransformer,
    isCustom: false,
    defaultProps:{}
  },

  sankey: {
    component: ResponsivesanKey,
    transformerClass: SanKeyTransformer,
    isCustom: false,
    defaultProps: {},
  },

  heatmap: {
    component: heatMap,
    transformerClass:MapHeatTransformer,
    isCustom:true,
    defaultProps: {}
  },

  clustermap: {
    component: clusterMap,
    transformerClass: MapClusterTransformer,
    isCustom: true,
    defaultProps: {}
  },
  search_table: {
    component: SearchTable,
    transformerClass: SearchTableTransformer,
    isCustom: true,
    defaultProps: {}
  },
  scatterplot: {
    component: ResponsiveScatterPlot,
    transformerClass: ScatterPlotTransformer,
    isCustom: false,
    defaultProps: {},
  },
  circlepacking: {
    component: ResponsiveCirclePacking,
    transformerClass: CirclePackingTransformer,
    isCustom: false,
    defaultProps: {
      labelsFilter: (node) => node.id !== "root",
    },
  },
  calendar: {
    component: ResponsiveCalendar,
    transformerClass: CalendarTransformer,
    isCustom: false,
    defaultProps: {},
  },
  radar: {
    component: ResponsiveRadar,
    transformerClass: RadarTransformer,
    isCustom: false,
    defaultProps: {},
  },
  stream: {
    component: ResponsiveStream,
    transformerClass: StreamTransformer,
    isCustom: false,
    defaultProps: {},
  },
  stream_category: {
    component: ResponsiveStream,
    transformerClass: StreamCategoryTransformer,
    isCustom: false,
    defaultProps: {},
  },
  boxplot: {
    component: ResponsiveBoxPlot,
    transformerClass: BoxPlotTransformer,
    isCustom: false,
    defaultProps: {},
  },
  areabump: {
    component: ResponsiveAreaBump,
    transformerClass: AreaBumpTransformer,
    isCustom: false,
    defaultProps: {},
  },
  bump: {
    component: ResponsiveBump,
    transformerClass: AreaBumpTransformer,
    isCustom: false,
    defaultProps: {},
  },
  marimekko: {
    component: ResponsiveMarimekko,
    transformerClass: MarimekkoTransformer,
    isCustom: false,
  },
  chord: {
    component: ResponsiveChord,
    transformerClass: ChordTransformer,
    isCustom: false,
    defaultProps: {},
  },
  sunburst: {
    component: ResponsiveSunburst,
    transformerClass: SunburstTransformer,
    isCustom: false,
    defaultProps: {}
  },
  bogota_map:{
    component: BogotaMapChart,
    transformerClass: BogotaMapTransformer,
    isCustom: true,
    defaultProps: {}
  },
  gauge:{
    component: GaugeChart,
    transformerClass: GaugeTransformer,
    isCustom: true,
    defaultProps: {}
  },
  grid_heatmap:{
    component: ResponsiveGridHeatMap,
    transformerClass: GridHeatMapTransformer,
    isCustom: false,
    defaultProps: {
    },
  },
  waffle:{
    component: ResponsiveWaffle,
    transformerClass: WaffleTransformer,
    isCustom: false,
    defaultProps: {}
  },
  network:{
    component: ResponsiveNetwork,
    transformerClass: NetworkTransformer,
    isCustom: false,
    defaultProps: {}
  },
  tree:{
    component: ResponsiveTree,
    transformerClass: TreeTransformedData,
    isCustom: false,
    defaultProps: {}
  },
  traffic_light:{
    component: TrafficLight,
    transformerClass: TrafficLightTranformer,
    isCustom: true,
    defaultProps: {}
  }
}

export default chartRegistry
