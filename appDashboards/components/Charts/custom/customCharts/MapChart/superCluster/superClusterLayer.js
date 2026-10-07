import L from 'leaflet';
import Supercluster from 'supercluster';
import {
  buildClusterContextPayload,
  CLUSTER_CONTEXT_MENU_THRESHOLD,
  clusterBBoxFromProperties,
  convexHullLatLngs,
  coordinatesFromLeaves,
  polygonCoordinatesFromBBox,
} from './clusterGeometry';

const CHUNK_SIZE = 200;
const RENDER_DEBOUNCE_MS = 80;

function clusterIconSize(count) {
  if (count < 10) return 29;
  if (count < 100) return 36;
  return 43;
}

function clusterSizeClass(count, clusterStyles) {
  if (count < 10) return '';
  if (count < 100) return clusterStyles.medium;
  return clusterStyles.large;
}

function createClusterDivIcon(count, clusterStyles) {
  const size = clusterIconSize(count);
  const sizeClass = clusterSizeClass(count, clusterStyles);
  const rootClass = [clusterStyles.markerCluster, sizeClass].filter(Boolean).join(' ');
  return L.divIcon({
    html: `<div class="${clusterStyles.bubble}"><span>${count}</span></div>`,
    className: rootClass,
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
  });
}

function pointsToFeatures(points) {
  return points.map((point) => ({
    type: 'Feature',
    properties: {
      label: point.label,
      raw: point.raw,
      lat: point.lat,
      lon: point.lon,
    },
    geometry: {
      type: 'Point',
      coordinates: [point.lon, point.lat],
    },
  }));
}

export function attachSuperClusterLayer(map, options) {
  const {
    radius,
    showCoverageOnHover,
    chunkedLoading,
    markerIcon,
    clusterStyles,
    onClusterContextMenu,
    onPointClick,
    buildTooltipHtml,
  } = options;

  const index = new Supercluster({
    radius,
    maxZoom: 20,
    minPoints: 2,
    nodeSize: 128,
    map: (props) => ({
      min_lat: props.lat,
      max_lat: props.lat,
      min_lon: props.lon,
      max_lon: props.lon,
    }),
    reduce: (acc, props) => {
      if (props.min_lat < acc.min_lat) acc.min_lat = props.min_lat;
      if (props.max_lat > acc.max_lat) acc.max_lat = props.max_lat;
      if (props.min_lon < acc.min_lon) acc.min_lon = props.min_lon;
      if (props.max_lon > acc.max_lon) acc.max_lon = props.max_lon;
    },
  });

  const markersLayer = L.layerGroup().addTo(map);
  let coverageLayer = null;
  let renderGeneration = 0;
  let renderDebounceTimer = null;

  const clearCoverage = () => {
    if (coverageLayer) {
      map.removeLayer(coverageLayer);
      coverageLayer = null;
    }
  };

  const showCoverage = (clusterFeature) => {
    if (!showCoverageOnHover) return;
    clearCoverage();
    const props = clusterFeature.properties;
    const pointCount = props.point_count;
    const bbox = clusterBBoxFromProperties(props);

    if (bbox && pointCount > CLUSTER_CONTEXT_MENU_THRESHOLD) {
      const ring = polygonCoordinatesFromBBox(bbox).map(({ lat, lon }) => [lat, lon]);
      coverageLayer = L.polygon(ring, {
        weight: 2,
        fillOpacity: 0.15,
        color: '#3388ff',
        fillColor: '#3388ff',
      }).addTo(map);
      return;
    }

    const clusterId = props.cluster_id;
    const leafLimit = Math.min(pointCount, CLUSTER_CONTEXT_MENU_THRESHOLD);
    const leaves = index.getLeaves(clusterId, leafLimit);
    const coords = coordinatesFromLeaves(leaves).map(({ lat, lon }) => ({ lat, lon }));
    const hull = convexHullLatLngs(coords);
    if (hull.length < 3) return;
    coverageLayer = L.polygon(
      hull.map(({ lat, lon }) => [lat, lon]),
      { weight: 2, fillOpacity: 0.15, color: '#3388ff', fillColor: '#3388ff' },
    ).addTo(map);
  };

  const addClusterMarker = (feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    const count = feature.properties.point_count;
    const marker = L.marker([lat, lon], { icon: createClusterDivIcon(count, clusterStyles) });

    marker.on('contextmenu', (event) => {
      L.DomEvent.preventDefault(event);
      const payload = buildClusterContextPayload(index, feature);
      onClusterContextMenu?.(payload, event.originalEvent);
    });

    if (showCoverageOnHover) {
      marker.on('mouseover', () => showCoverage(feature));
      marker.on('mouseout', clearCoverage);
    }

    markersLayer.addLayer(marker);
    return marker;
  };

  const addPointMarker = (feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    const { label, raw } = feature.properties;
    const marker = L.marker([lat, lon], { icon: markerIcon });

    if (label && buildTooltipHtml) {
      marker.bindTooltip(buildTooltipHtml(label), {
        sticky: true,
        direction: 'top',
        opacity: 0.95,
      });
    }

    marker.on('click', (event) => {
      onPointClick?.(
        { lat: feature.properties.lat, lon: feature.properties.lon, raw, label },
        event,
      );
    });

    markersLayer.addLayer(marker);
    return marker;
  };

  const renderClusterBatch = (clusters, start, generation, onDone) => {
    if (generation !== renderGeneration) return;
    const end = Math.min(start + CHUNK_SIZE, clusters.length);
    for (let i = start; i < end; i += 1) {
      const feature = clusters[i];
      if (feature.properties.cluster) {
        addClusterMarker(feature);
      } else {
        addPointMarker(feature);
      }
    }
    if (end < clusters.length) {
      requestAnimationFrame(() => renderClusterBatch(clusters, end, generation, onDone));
    } else {
      onDone?.();
    }
  };

  const render = () => {
    renderGeneration += 1;
    const generation = renderGeneration;
    clearCoverage();
    markersLayer.clearLayers();

    const bounds = map.getBounds();
    const bbox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];
    const zoom = Math.floor(map.getZoom());
    const clusters = index.getClusters(bbox, zoom);

    if (chunkedLoading && clusters.length > CHUNK_SIZE) {
      renderClusterBatch(clusters, 0, generation);
    } else {
      clusters.forEach((feature) => {
        if (feature.properties.cluster) {
          addClusterMarker(feature);
        } else {
          addPointMarker(feature);
        }
      });
    }
  };

  const setData = (points) => {
    index.load(pointsToFeatures(points));
    render();
  };

  const onMapChange = () => {
    if (renderDebounceTimer) clearTimeout(renderDebounceTimer);
    renderDebounceTimer = setTimeout(() => {
      renderDebounceTimer = null;
      render();
    }, RENDER_DEBOUNCE_MS);
  };

  map.on('moveend', onMapChange);
  map.on('zoomend', onMapChange);

  return {
    setData,
    render,
    clear() {
      index.load([]);
      markersLayer.clearLayers();
      clearCoverage();
    },
    destroy() {
      renderGeneration += 1;
      if (renderDebounceTimer) {
        clearTimeout(renderDebounceTimer);
        renderDebounceTimer = null;
      }
      map.off('moveend', onMapChange);
      map.off('zoomend', onMapChange);
      clearCoverage();
      map.removeLayer(markersLayer);
    },
  };
}
