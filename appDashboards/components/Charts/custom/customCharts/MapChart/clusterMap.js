import { useEffect, useRef, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useTheme } from '@mui/material';
import { hexToRgb } from '@components/Recursive/mui_styled_components';
import colombiaGeoJson from '../../../../../public/js/maps/departament_colombia.json';
import { normalizeDepartmentCode } from '../../../dataTransformers/Map/mapDepartmentUtils';
import { attachSuperClusterLayer } from './superCluster/superClusterLayer';
import clusterStyles from './superCluster/superCluster.module.css';

const COLOMBIA_CENTER = [4.570868, -74.297333];
const COLOMBIA_ZOOM = 4.5;
const SAI_CATA_CENTER = [12.93558238780604, -81.54483429516513];
const DEFAULT_FILL_COLOR = '#5564eb';
const DEFAULT_POLYGON_FILL_OPACITY = 0.2;
const DEFAULT_MAX_CLUSTER_RADIUS = 80;
const DEFAULT_POPUP_FONT_SIZE = 12;
const DEFAULT_POPUP_FONT_FAMILY = 'inherit';
const DEFAULT_POPUP_TEXT_COLOR = '#333333';

const defaultMarkerIcon = L.icon({
  iconUrl: markerIcon.src ?? markerIcon,
  iconRetinaUrl: markerIcon2x.src ?? markerIcon2x,
  shadowUrl: markerShadow.src ?? markerShadow,
  iconSize: [18, 30],
  iconAnchor: [9, 30],
  popupAnchor: [1, -25],
  shadowSize: [30, 30],
});

L.Marker.prototype.options.icon = defaultMarkerIcon;

const parseFloatClean = (value) => {
  const cleaned = typeof value === 'string' ? String(value).replace(/,/g, '.') : value;
  return parseFloat(cleaned);
};

const toBool = (value, fallback) => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return fallback;
};

function getPolygonStyle(borderWidth, borderColor, fillOpacity, fillColor) {
  return {
    fillColor,
    weight: borderWidth,
    color: borderColor,
    dashArray: '1',
    opacity: 1,
    fillOpacity,
  };
}

function buildPopupHtml(label, fontSize, fontFamily, textColor) {
  const size = parseFloatClean(fontSize);
  const fs = !Number.isNaN(size) && size > 0 ? size : DEFAULT_POPUP_FONT_SIZE;
  const family = fontFamily || DEFAULT_POPUP_FONT_FAMILY;
  const color = textColor || DEFAULT_POPUP_TEXT_COLOR;
  return `<div style="font-size:${fs}px;font-family:${family};color:${color}">${label}</div>`;
}

export default function ClusterMap(props) {
  const theme = useTheme();
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const superClusterRef = useRef(null);
  const returnButtonRef = useRef(null);
  const magnifyingCircleRef = useRef(null);
  const activePolygonRef = useRef(null);
  const lastZoomedCodesRef = useRef(null);
  const zoomToDepartmentsRef = useRef(() => {});

  const activeDepartmentCodes = useMemo(() => {
    if (!Array.isArray(props.activeDepartmentCodes)) return [];
    return props.activeDepartmentCodes.filter(Boolean);
  }, [props.activeDepartmentCodes]);

  const activeDepartmentCodesRef = useRef(activeDepartmentCodes);
  useEffect(() => {
    activeDepartmentCodesRef.current = activeDepartmentCodes;
  }, [activeDepartmentCodes]);

  const onClickRef = useRef(props.onClick);
  const panelRef = useRef(props.panel);
  useEffect(() => { onClickRef.current = props.onClick; }, [props.onClick]);
  useEffect(() => { panelRef.current = props.panel; }, [props.panel]);

  const margin = props?.styles?.marginChart ?? {};
  const borderWidth = props.styles?.borderWidth ?? 1;
  const borderColor = props.styles?.borderColor ?? 'black';
  const fillOpacity = props.styles?.fillOpacity ?? DEFAULT_POLYGON_FILL_OPACITY;
  const fillColor = props.colors?.[0] ?? DEFAULT_FILL_COLOR;

  const showCoverageOnHover = toBool(props.styles?.showCoverageOnHover, true);
  const chunkedLoading = toBool(props.styles?.chunkedLoading, true);
  const maxClusterRadiusRaw = parseFloatClean(props.styles?.maxClusterRadius);
  const maxClusterRadius =
    !Number.isNaN(maxClusterRadiusRaw) && maxClusterRadiusRaw > 0
      ? maxClusterRadiusRaw
      : DEFAULT_MAX_CLUSTER_RADIUS;
  const popupFontSize = props.styles?.popupFontSize ?? DEFAULT_POPUP_FONT_SIZE;
  const popupFontFamily = props.styles?.popupFontFamily ?? DEFAULT_POPUP_FONT_FAMILY;
  const popupTextColor = props.styles?.popupTextColor ?? DEFAULT_POPUP_TEXT_COLOR;

  const buildTooltip = useCallback(
    (label) => buildPopupHtml(label, popupFontSize, popupFontFamily, popupTextColor),
    [popupFontSize, popupFontFamily, popupTextColor],
  );

  const zoomToDepartments = useCallback(
    (codes) => {
      const map = leafletMap.current;
      const geoLayer = geoJsonLayerRef.current;
      if (!map || !geoLayer) return;

      const normalizedCodes = Array.isArray(codes)
        ? codes.map((code) => normalizeDepartmentCode(code)).filter(Boolean): [];
      const codesKey = normalizedCodes.slice().sort().join('|');

      if (lastZoomedCodesRef.current === codesKey) return;
      lastZoomedCodesRef.current = codesKey;

      const baseStyle = getPolygonStyle(borderWidth, borderColor, fillOpacity, fillColor);

      if (activePolygonRef.current) {
        activePolygonRef.current.setStyle(baseStyle);
        activePolygonRef.current = null;
      }

      if (normalizedCodes.length === 0) {
        map.flyTo(COLOMBIA_CENTER, COLOMBIA_ZOOM, { duration: 0.7 });
        return;
      }

      const matchingLayers = [];
      const codesSet = new Set(normalizedCodes);
      geoLayer.eachLayer((layer) => {
        const dpto = normalizeDepartmentCode(layer.feature?.properties?.DPTO);
        if (dpto && codesSet.has(dpto)) {
          matchingLayers.push(layer);
        }
      });

      if (matchingLayers.length === 0) return;

      const combinedBounds = L.latLngBounds(matchingLayers[0].getBounds());
      matchingLayers.slice(1).forEach((layer) => {
        combinedBounds.extend(layer.getBounds());
      });

      map.flyToBounds(combinedBounds, { duration: 0.7, padding: [20, 20] });

      matchingLayers.forEach((layer, index) => {
        layer.setStyle({ ...baseStyle, weight: 1, dashArray: '' });
        if (index === 0) {
          activePolygonRef.current = layer;
        }
      });
    },
    [borderWidth, borderColor, fillOpacity, fillColor],
  );

  useEffect(() => {
    zoomToDepartmentsRef.current = zoomToDepartments;
  }, [zoomToDepartments]);

  useEffect(() => {
    zoomToDepartments(activeDepartmentCodes);
  }, [activeDepartmentCodes, zoomToDepartments]);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    leafletMap.current = L.map(mapRef.current, { zoomSnap: 0.1 }).setView(
      COLOMBIA_CENTER,
      COLOMBIA_ZOOM,
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    }).addTo(leafletMap.current);

    const stylePolygon = () =>
      getPolygonStyle(borderWidth, borderColor, fillOpacity, fillColor);

    geoJsonLayerRef.current = L.geoJSON(colombiaGeoJson, {
      style: stylePolygon,
      onEachFeature: (feature, layer) => {
        layer.on({
          click() {
            zoomToDepartmentsRef.current?.([feature.properties.DPTO]);

            const panel = panelRef.current;
            const groupByField =
              panel?.queryParameters?.query_fields_distribution?.group_by_fields?.[0]?.name;

            onClickRef.current?.({
              field: groupByField,
              value: feature.properties.NOMBRE_DPT,
              rawValue: feature.properties.NOMBRE_DPT,
              code: feature.properties.DPTO,
            });
          },
        });
      },
    }).addTo(leafletMap.current);

    const magnifyingCircle = L.circle(SAI_CATA_CENTER, {
      radius: 80000,
      color: hexToRgb(theme.palette.primary.main),
      fillColor: hexToRgb(theme.palette.primary.main),
      fillOpacity: 0.2,
    }).addTo(leafletMap.current);
    magnifyingCircleRef.current = magnifyingCircle;

    const magnifyingLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
      },
    );

    magnifyingCircle.on('mouseover', () => {
      leafletMap.current.addLayer(magnifyingLayer);
      leafletMap.current.flyTo(SAI_CATA_CENTER, 8.2, { duration: 0.7 });
      magnifyingCircle.remove();
      if (returnButtonRef.current) {
        returnButtonRef.current.style.backgroundImage =
          "url('https://cdn-icons-png.flaticon.com/512/271/271218.png')";
      }
    });

    const HomeBtn = L.Control.extend({
      options: { position: 'topright' },
      onAdd() {
        const c = L.DomUtil.create(
          'div',
          'leaflet-bar leaflet-control leaflet-control-custom',
        );
        c.style.cssText =
          "background:white;width:30px;height:30px;background-image:url('https://cdn-icons-png.flaticon.com/512/25/25694.png');" +
          'background-size:20px 20px;background-repeat:no-repeat;background-position:center;cursor:pointer;';

        c.onclick = () => {
          lastZoomedCodesRef.current = null;
          leafletMap.current.flyTo(COLOMBIA_CENTER, COLOMBIA_ZOOM, { duration: 0.7 });

          if (
            magnifyingCircleRef.current &&
            !leafletMap.current.hasLayer(magnifyingCircleRef.current)
          ) {
            magnifyingCircleRef.current.addTo(leafletMap.current);
          }

          if (returnButtonRef.current) {
            returnButtonRef.current.style.backgroundImage =
              "url('https://cdn-icons-png.flaticon.com/512/25/25694.png')";
          }

          if (activePolygonRef.current) {
            activePolygonRef.current.setStyle(stylePolygon(activePolygonRef.current.feature));
            activePolygonRef.current = null;
          }
        };
        returnButtonRef.current = c;
        return c;
      },
    });

    if (!props.isEditionMode) {
      leafletMap.current.addControl(new HomeBtn());
    }

    requestAnimationFrame(() => {
      lastZoomedCodesRef.current = null;
      zoomToDepartmentsRef.current?.(activeDepartmentCodesRef.current);
    });

    return () => {
      superClusterRef.current?.destroy();
      superClusterRef.current = null;
      leafletMap.current?.remove();
      leafletMap.current = null;
      geoJsonLayerRef.current = null;
      magnifyingCircleRef.current = null;
      returnButtonRef.current = null;
      activePolygonRef.current = null;
      lastZoomedCodesRef.current = null;
    };
  }, [theme, props.isEditionMode]);

  useEffect(() => {
    if (!leafletMap.current || !geoJsonLayerRef.current) return;

    geoJsonLayerRef.current.setStyle(() =>
      getPolygonStyle(borderWidth, borderColor, fillOpacity, fillColor),
    );
  }, [borderWidth, borderColor, fillOpacity, fillColor]);

  useEffect(() => {
    const map = leafletMap.current;
    if (!map) return;

    superClusterRef.current?.destroy();
    superClusterRef.current = null;

    superClusterRef.current = attachSuperClusterLayer(map, {
      radius: maxClusterRadius,
      showCoverageOnHover,
      chunkedLoading,
      markerIcon: defaultMarkerIcon,
      clusterStyles,
      onClusterContextMenu: (payload, originalEvent) => {
        onClickRef.current?.(payload, originalEvent);
      },
      onPointClick: (datum, event) => {
        onClickRef.current?.(datum, event);
      },
      buildTooltipHtml: buildTooltip,
    });

    return () => {
      superClusterRef.current?.destroy();
      superClusterRef.current = null;
    };
  }, [showCoverageOnHover, maxClusterRadius, chunkedLoading, buildTooltip]);

  useEffect(() => {
    const layer = superClusterRef.current;
    if (!layer) return;

    const points = Array.isArray(props.clusterData) ? props.clusterData : [];
    const normalized = points
      .map((point) => {
        const lat = parseFloatClean(point.lat);
        const lon = parseFloatClean(point.lon);
        if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
        return { ...point, lat, lon };
      })
      .filter(Boolean);

    layer.setData(normalized);
  }, [
    props.clusterData,
    showCoverageOnHover,
    maxClusterRadius,
    chunkedLoading,
  ]);

  useEffect(() => {
    if (!mapRef.current || !leafletMap.current) return;

    let frameId = null;
    const scheduleInvalidate = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        leafletMap.current?.invalidateSize();
      });
    };

    const resize = () => scheduleInvalidate();
    window.addEventListener('resize', resize);

    const resizeObserver = new ResizeObserver(() => scheduleInvalidate());
    resizeObserver.observe(mapRef.current);
    if (mapRef.current.parentElement) {
      resizeObserver.observe(mapRef.current.parentElement);
    }
    scheduleInvalidate();

    return () => {
      window.removeEventListener('resize', resize);
      resizeObserver.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        paddingTop: margin.marginTop ?? 0,
        paddingBottom: margin.marginBottom ?? 0,
        paddingLeft: margin.marginLeft ?? 0,
        paddingRight: margin.marginRight ?? 0,
      }}
    >
      <div
        ref={mapRef}
        style={{ height: '100%', width: '100%', borderRadius: '2px' }}
      />
    </div>
  );
}
