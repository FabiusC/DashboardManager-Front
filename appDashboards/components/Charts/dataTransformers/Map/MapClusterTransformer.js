import Transformer from '../Transformer';
import merge from 'lodash/merge';
import colombiaGeoJson from '../../../../public/js/maps/departament_colombia.json';
import { getDepartmentCodesFromFilters } from './mapDepartmentUtils';
const parseFloatClean = (value) => {
  const cleaned = typeof value === 'string' ? String(value).replace(/,/g, '.') : value;
  return parseFloat(cleaned);
};

const buildPointLabel = (row, showedFields, latField, lonField) => {
  if (!Array.isArray(showedFields) || showedFields.length === 0) return '';
  return showedFields
    .map((f) => {
      const key = f?.name;
      if (!key) return null;
      const val = row?.[key];
      if (val == null || val === '') return null;

      let alias = f?.alias ?? key;
      if (key === latField) alias = 'Latitud';
      else if (key === lonField) alias = 'Longitud';

      return `${alias}: ${val}`;
    })
    .filter(Boolean)
    .join(' | ');
};

export class MapClusterTransformer extends Transformer {
  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: 'AND',
      acceptsSubgroups: true,
      allowMultipleRules: true,
      isCoupled: false,
    });
  }
  mapData = colombiaGeoJson;
  latField = '';
  lonField = '';

  getActiveDepartmentCodes(panel, isEditionMode) {
    if (isEditionMode || !this.filterManager) return [];

    const latField = panel?.queryParameters?.selected_fields?.[0]?.name ?? '';
    const lonField = panel?.queryParameters?.selected_fields?.[1]?.name ?? '';
    const rules = this.filterManager._getStore()?.rules ?? {};

    return getDepartmentCodesFromFilters(
      rules,
      this.mapData?.features ?? [],
      [latField, lonField],
    );
  }

  transformData(panel, isEditionMode) {
    const empty = {
      data: [],
      clusterData: [],
      activeDepartmentCodes: [],
      panel,
      isEditionMode,
    };
    if (!this.validatePanel(panel))                   return empty;
    if (!this.validateRawData(panel))                 return empty;
    if (!this.validateQueryFieldsDistribution(panel)) return empty;
    if (!this.mapData?.features?.length)              return empty;
    
    const selectedFields = panel?.queryParameters?.selected_fields ?? [];
    const rawData = panel?.queryParameters?.rawData ?? [];
    const showed_fields = panel.queryParameters?.query_fields_distribution?.showed_fields || [];
    const latField = selectedFields?.[0]?.name;
    const lonField = selectedFields?.[1]?.name;

    if (!latField || !lonField) return empty;
    this.latField = latField;
    this.lonField = lonField;
    const activeDepartmentCodes = this.getActiveDepartmentCodes(panel, isEditionMode);

    const clusterData = rawData
      .map((row) => {
        const lat = parseFloatClean(row?.[latField]);
        const lon = parseFloatClean(row?.[lonField]);
        if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

        return {
          lat,
          lon,
          label: buildPointLabel(row, showed_fields, latField, lonField),
          raw: row,
        };
      })
      .filter(Boolean);

    return {
      data: this.mapData.features.map((poly) => ({
        ...poly,
        properties: { ...poly.properties, data: undefined, stats: undefined },
      })),
      clusterData,
      activeDepartmentCodes,
      panel,
      isEditionMode,
    };
  }

  transformDataClick(datum) {
    const latField = this.latField || this.panel?.queryParameters?.selected_fields?.[0]?.name;
    const lonField = this.lonField || this.panel?.queryParameters?.selected_fields?.[1]?.name;
    if (!latField || !lonField) return null;
    if (datum?.type === 'cluster_points') {
      const coordinates = Array.isArray(datum?.coordinates) ? datum.coordinates : [];
      if (coordinates.length === 0) return null;
      this.filterManager.clearPanelFilters();

      // When user select a cluster
      const mainGroupId = this.filterManager.mainGroupId;
      const orGroupId = this.filterManager.createSubGroup(
        mainGroupId,
        'OR',
        true,
        true,
        false,
      );

        coordinates.forEach(({ lat, lon }) => {
        const pairGroupId = this.filterManager.createSubGroup(
          orGroupId,
          'AND',
          false,
          true,
          false,
        );
        this.filterManager.createSubRule(pairGroupId, latField, lat, 'EQUALS');
        this.filterManager.createSubRule(pairGroupId, lonField, lon, 'EQUALS');
      });

      return coordinates.flatMap(({ lat, lon }) => ([
        { field: String(latField), value: String(lat) },
        { field: String(lonField), value: String(lon) },
      ]));
    }
    if (datum?.type === 'cluster_polygon') {
      const bbox = datum?.bbox;
      const polygonCoordinates = Array.isArray(datum?.coordinates) ? datum.coordinates : [];
      if (
        !bbox ||
        bbox.min_lat == null ||
        bbox.max_lat == null ||
        bbox.min_lon == null ||
        bbox.max_lon == null ||
        polygonCoordinates.length < 3
      ) {
        return null;
      }

      const latRange = [String(bbox.min_lat), String(bbox.max_lat)];
      const lonRange = [String(bbox.min_lon), String(bbox.max_lon)];

      this.filterManager.clearPanelFilters();
      this.filterManager.createRule(latField, latRange, 'BETWEEN');
      this.filterManager.createRule(lonField, lonRange, 'BETWEEN');

      return [
        { field: String(latField), value: latRange, operator: 'BETWEEN' },
        { field: String(lonField), value: lonRange, operator: 'BETWEEN' },
        {
          type: 'cluster_polygon',
          coordinates: polygonCoordinates,
          bbox,
          wkt: datum?.wkt,
        },
      ];
    }
    //When user select a point
    const lat = datum?.lat ?? datum?.raw?.[latField];
    const lon = datum?.lon ?? datum?.raw?.[lonField];
    if (lat == null || lon == null || lat === '' || lon === '') return null;

    this.filterManager.clearPanelFilters();
    this.filterManager.createRule(latField, lat, 'EQUALS');
    this.filterManager.createRule(lonField, lon, 'EQUALS');

    return [
      { field: String(latField), value: String(lat) },
      { field: String(lonField), value: String(lon) },
    ];
  }

  transformChartProps(params) {
    const onClick = !params.isEditionMode ? this.getOnClick(null, params.data) : undefined;
    return merge(
      { styles: params.chart_setup_styles ?? {} },
      { styles: params.liveChartProps },
      { updateLiveChartProps: params.updateLiveChartPropsMethods },
      onClick ? { onClick } : {},
      { panel: params.panel },
      {
        data: params.chartData?.data ?? [],
        clusterData: params.chartData?.clusterData ?? [],
        activeDepartmentCodes: params.chartData?.activeDepartmentCodes ?? [],
        isEditionMode: params.isEditionMode,
      }
    );
  }
}
