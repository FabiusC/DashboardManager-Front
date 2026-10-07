import Transformer from "../Transformer";
import merge from "lodash/merge";
import bogotaGeoJson from "../../../../public/js/maps/Boglocal.json";

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------
const calculateRange = (data, fieldName) => {
  const values = data
    .map((item) => parseFloat(item[fieldName]))
    .filter((v) => !isNaN(v));
  return {
    min: values.length ? Math.min(...values) : 0,
    max: values.length ? Math.max(...values) : 0,
  };
};

// -----------------------------------------------------------------------------
// Transformer
// -----------------------------------------------------------------------------

export class BogotaMapTransformer extends Transformer {
  mapData = bogotaGeoJson;
  fieldFilter = "";

  constructor(panel_id) {
    super(panel_id);
    this.initialize({
      operator_filter: "AND",
      acceptsSubgroups: false,
      allowMultipleRules: false,
      isCoupled: false,
    });
  }

  // ---------------------------------------------------------------------------
  // Main transformation
  // ---------------------------------------------------------------------------
  
  transformData(panel, isEditionMode) {
    if (!this.validatePanel(panel))
      return this.emptyResult(panel, isEditionMode);
    if (!this.validateRawData(panel))
      return this.emptyResult(panel, isEditionMode);

    // Without filters(like one specific code) raw data contains all data
    const query = panel?.queryParameters?.query_fields_distribution;
    const rawData = panel?.queryParameters?.rawData ?? [];

    const aggregationFields = query?.aggregation_fields ?? [];
    const groupByField = query?.group_by_fields?.[0]?.name;

    this.fieldFilter = groupByField;

    // Create an object with groupByField as key
    const dataByLocality = this.createDataLookup(rawData, groupByField);

    // Verify multiple or single localities
    const { singleLocality, hasMultipleLocalities } = this.getLocalitySelection(
      rawData,
      groupByField,
    );

    // Get features from JSON. It depends its single or multipleLocalities
    const features = this.getSelectedFeatures(singleLocality);

    // Get metrics data from the first aggregationFields
    const firstMetric = aggregationFields[0];
    const metricKey = firstMetric
      ? `${firstMetric.name}__${firstMetric.metric}`
      : null;

    // Calculate range of the legendsF
    const calculatedRange = metricKey
      ? calculateRange(rawData, metricKey)
      : { min: 0, max: 0 };

    const enrichedFeatures = this.enrichFeatures(
      features,
      dataByLocality,
      aggregationFields,
      groupByField,
    );

    return {
      data: enrichedFeatures,
      calculatedRange,
      panel,
      isEditionMode,
      singleLocality, // Info to zoom
      hasMultipleLocalities,
    };
  }

  // ---------------------------------------------------------------------------
  // Query data helpers
  // ---------------------------------------------------------------------------

  createDataLookup(rawData, fieldName) {
    // Create a new element with reduce from rawData
    const lookup = {};

    for (const record of rawData) {
      const code = String(record[fieldName] ?? "");

      if (code) {
        lookup[code] = record;
      }
    }

    return lookup;
  }

  // Get possible selections (Multiple or unique)
  getLocalitySelection(rawData, fieldName) {
    let firstCode = null;

    for (const record of rawData) {
      const code = String(record[fieldName] ?? "");

      // IF it is the first code of data, save and continue
      if (!code) {
        continue;
      }

      if (firstCode === null) {
        firstCode = code;
        continue;
      }

      // IF there is another code besides the first one, simply return the confirmation, not the data
      if (code !== firstCode) {
        return {
          singleLocality: null,
          hasMultipleLocalities: true,
        };
      }
    }

    return {
      singleLocality: firstCode,
      hasMultipleLocalities: false,
    };
  }

  // ---------------------------------------------------------------------------
  // GeoJSON helpers
  // ---------------------------------------------------------------------------

  // Get the features ( a map geometry ) in json
  getSelectedFeatures(singleLocality) {
    // If its multiple, just return the rest of the json
    if (!singleLocality) {
      return this.mapData.features;
    }

    // IF its multiple. Find ONLY the features which code is equal as the json code
    return this.mapData.features.filter(
      (feature) =>
        String(feature.properties.CODIGO_LOC) === String(singleLocality),
    );
  }
  // Transform and unify json data with the query Data
  enrichFeatures(features, dataByLocality, aggregationFields, fieldFilter) {
    // For every feature
    return features.map((feature) => {
      const code = String(feature.properties.CODIGO_LOC); // Extract the code
      const match = dataByLocality[code]; // Find the query data using the code from the json

      // IF the data it is not in the query data return the geometry without data
      // Undefined allows to the color method to paint it
      if (!match) {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            data: undefined,
            stats: undefined,
          },
        };
      }

      // IF exist the data add the properties in a const
      const stats = {
        name: feature.properties.NOMBRE,
        // For every aggregationField
        aggregationData: aggregationFields.map((field) => {
          const key = `${field.name}__${field.metric}`;
          const value = match[key];
          // Add the data for display legend/tooltip
          return {
            alias: field.alias ?? field.name,
            value: value !== undefined ? value.toLocaleString() : "N/A",
            rawValue: value,
          };
        }),
      };

      // For every feature, return a complete object for the map
      return {
        ...feature,
        properties: {
          ...feature.properties,
          data: {
            ...match,
            fieldByFilter: fieldFilter,
          },
          stats,
        },
      };
    });
  }

  transformDataClick(datum) {
    const nodeField = datum?.data?.fieldByFilter ?? this.fieldFilter;
    const value = datum?.value;
    if (!nodeField || value === undefined || value === null) {
      return null;
    }
    const transformed = {
      field: nodeField,
      value,
    };

    this.filterManager.createRule(nodeField, datum.value, "EQUALS");
    return transformed;
  }

  emptyResult(panel, isEditionMode) {
    return {
      data: [],
      calculatedRange: { min: 0, max: 0 },
      panel,
      isEditionMode,
    };
  }

  transformChartProps(params) {
    const onClick = !params.isEditionMode
      ? this.getOnClick(null, params.data)
      : undefined;
    const chartData = params.chartData ?? {};

    return merge(
      { styles: params.chart_setup_styles ?? {} },
      { styles: params.liveChartProps },
      onClick ? { onClick } : {},
      { updateLiveChartProps: params.updateLiveChartPropsMethods },
      {
        panel: params.data,
        calculatedRange: chartData.calculatedRange ?? { min: 0, max: 0 },
        singleDepartment: chartData.singleDepartment ?? null,
        hasMultipleDepartments: chartData.hasMultipleDepartments ?? false,
      },
    );
  }
}
