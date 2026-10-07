import { convex, featureCollection, point } from '@turf/turf';

export const CLUSTER_CONTEXT_MENU_THRESHOLD = 200;

export function clusterBBoxFromProperties(properties) {
  const { min_lat, max_lat, min_lon, max_lon } = properties;
  if (
    min_lat == null ||
    max_lat == null ||
    min_lon == null ||
    max_lon == null
  ) {
    return null;
  }
  return { min_lat, max_lat, min_lon, max_lon };
}

export function polygonCoordinatesFromBBox(bbox) {
  const { min_lat, max_lat, min_lon, max_lon } = bbox;
  return [
    { lat: min_lat, lon: min_lon },
    { lat: min_lat, lon: max_lon },
    { lat: max_lat, lon: max_lon },
    { lat: max_lat, lon: min_lon },
  ];
}

export function coordinatesFromLeaves(leaves) {
  return leaves.map(({ geometry, properties }) => ({
    lat: geometry.coordinates[1],
    lon: geometry.coordinates[0],
    label: properties.label,
    raw: properties.raw,
  }));
}

export function boundingBoxFromCoordinates(coordinates) {
  let min_lat = Infinity;
  let max_lat = -Infinity;
  let min_lon = Infinity;
  let max_lon = -Infinity;

  for (const { lat, lon } of coordinates) {
    if (lat < min_lat) min_lat = lat;
    if (lat > max_lat) max_lat = lat;
    if (lon < min_lon) min_lon = lon;
    if (lon > max_lon) max_lon = lon;
  }

  return { min_lat, max_lat, min_lon, max_lon };
}

export function convexHullLatLngs(coordinates) {
  if (coordinates.length < 3) return coordinates;

  const fc = featureCollection(coordinates.map((c) => point([c.lon, c.lat])));
  const hull = convex(fc);
  if (!hull?.geometry?.coordinates?.[0]) return coordinates;

  return hull.geometry.coordinates[0]
    .slice(0, -1)
    .map(([lon, lat]) => ({ lat, lon }));
}

export function toWktPolygon(hullCoords) {
  const ring = hullCoords.map(({ lon, lat }) => [lon, lat]);
  if (ring.length >= 3) {
    const [firstLng, firstLat] = ring[0];
    const [lastLng, lastLat] = ring[ring.length - 1];
    if (firstLng !== lastLng || firstLat !== lastLat) {
      ring.push(ring[0]);
    }
  }
  const wktPoints = ring.map(([lon, lat]) => `${lon} ${lat}`);
  return `POLYGON ((${wktPoints.join(', ')}))`;
}

export function buildClusterContextPayload(
  index,
  clusterFeature,
  threshold = CLUSTER_CONTEXT_MENU_THRESHOLD,
) {
  const clusterId = clusterFeature.properties.cluster_id;
  const pointCount = clusterFeature.properties.point_count;
  const props = clusterFeature.properties;

  if (pointCount <= threshold) {
    const leaves = index.getLeaves(clusterId, pointCount);
    const coordinates = coordinatesFromLeaves(leaves).map(({ lat, lon }) => ({ lat, lon }));
    return { type: 'cluster_points', coordinates };
  }

  const bbox = clusterBBoxFromProperties(props);
  if (!bbox) {
    const leaves = index.getLeaves(clusterId, threshold);
    const sampled = coordinatesFromLeaves(leaves).map(({ lat, lon }) => ({ lat, lon }));
    const hullLatLngs = convexHullLatLngs(sampled);
    const polygonCoordinates = hullLatLngs.map(({ lat, lon }) => ({ lat, lon }));
    return {
      type: 'cluster_polygon',
      coordinates: polygonCoordinates,
      bbox: boundingBoxFromCoordinates(sampled),
      wkt: toWktPolygon(hullLatLngs),
    };
  }

  const polygonCoordinates = polygonCoordinatesFromBBox(bbox);
  return {
    type: 'cluster_polygon',
    coordinates: polygonCoordinates,
    bbox,
    wkt: toWktPolygon(polygonCoordinates),
  };
}
