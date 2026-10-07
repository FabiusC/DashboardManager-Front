import {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { useTheme } from '@mui/material';
import { hexToRgb } from '@components/Recursive/mui_styled_components';

const NO_DATA_COLOR    = 'rgba(255, 252, 252, 0.42)';
const COLOMBIA_CENTER  = [4.570868, -74.297333];
const COLOMBIA_ZOOM    = 4.5;
const SAI_CATA_CENTER  = [12.93558238780604, -81.54483429516513];

const HEAT_BASE_RADIUS = 15;

const parseFloatClean = (value) => {
  const cleaned = typeof value === 'string' ? String(value).replace(/,/g, '.') : value;
  return parseFloat(cleaned);
};

const interpolateColor = (c1, c2, f) => {
  const hex = (str) => str.replace('#', '').match(/\w\w/g).map(h => parseInt(h, 16));
  const [r1, g1, b1] = hex(c1);
  const [r2, g2, b2] = hex(c2);
  const round = (a, b) => Math.round(a + (b - a) * f).toString(16).padStart(2, '0');
  return `#${round(r1, r2)}${round(g1, g2)}${round(b1, b2)}`;
};

const formatShort = (v) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000   ? `${(v / 1_000).toFixed(1)}K`
  : String(v);

export default function HeatMap(props) {
  const theme = useTheme();

  const hasError = Boolean(props.error);

  const COLOR_SCALE = useMemo(
    () => ({
      min: props.colors?.[0] ?? '#fffb00',
      max: props.colors?.[props.colors?.length - 1] ?? '#ff000d',
    }),
    [props.colors],
  );

  const scaleType    = props?.styles?.scale       ?? 'linear';
  const densityValue = props.styles?.densityValue
  const showTooltips = props.styles?.showTooltips ?? true;
  const borderWidth  = props.styles?.borderWidth  ?? 1;
  const borderColor  = props.styles?.borderColor  ?? 'black';
  const heatRadius   = props.styles?.radius       ?? HEAT_BASE_RADIUS;
  const heatBlur     = props.styles?.blur;

  const [geoData, setGeoData]                = useState([]);
  const [populationRange, setPopulationRange] = useState({ min: 0, max: 0 });
  const [heatPoints, setHeatPoints]          = useState([]);

  const mapRef           = useRef(null);
  const leafletMap       = useRef(null);
  const geoJsonLayerRef  = useRef(null);
  const heatLayerRef     = useRef(null);
  const legendRef        = useRef(null);
  const gradientRef      = useRef(null);
  const returnButtonRef  = useRef(null);
  const activePolygonRef = useRef(null);
  console.log(props,"PROPIEDADES")
  const margin = props?.styles?.marginChart ?? {}
  const panelRef   = useRef(props.panel);
  const onClickRef = useRef(props.onClick);
  useEffect(() => { panelRef.current = props.panel; }, [props.panel]);
  useEffect(() => { onClickRef.current = props.onClick; }, [props.onClick]);

  const normalizeValue = useCallback(
    (value) => {
      const { min, max } = populationRange;
      if (min === max) return 0;
      if (scaleType === 'symlog') {
        return Math.log(value + 1) / Math.log(max + 1);
      }
      return (value - min) / (max - min);
    },
    [populationRange, scaleType],
  );

  const getColor = useCallback(
    (value) => {
      if (value == null) return NO_DATA_COLOR;
      return interpolateColor(COLOR_SCALE.min, COLOR_SCALE.max, normalizeValue(value));
    },
    [normalizeValue, COLOR_SCALE],
  );

  useEffect(() => {
    setGeoData(props.data || []);
    setPopulationRange(props.calculatedRange || { min: 0, max: 0 });
  }, [props.data, props.calculatedRange]);

  useEffect(() => {
    if (!Array.isArray(props.heatData)) return;

    const points = props.heatData
      .map((p) => {
        const lat = parseFloatClean(p.lat);
        const lon = parseFloatClean(p.lon);
        const intensity = densityValue
        if (isNaN(lat) || isNaN(lon)) return null;
        return [lat, lon, intensity];
      })
      .filter(Boolean);

    setHeatPoints(points);
  }, [props.heatData, densityValue, props.calculatedRange]);

  const refreshScaleLegend = useCallback(
    (range) => {
      if (gradientRef.current) {
        gradientRef.current.style.background =
          `linear-gradient(to right, ${COLOR_SCALE.min}, ${COLOR_SCALE.max})`;
      }
      const el = mapRef.current?.querySelector('#color-scale-labels');
      if (el) {
        el.innerHTML = `<span>${formatShort(range.min)}</span><span>${formatShort(range.max)}</span>`;
      }
    },
    [COLOR_SCALE],
  );

  useEffect(() => {
    refreshScaleLegend(populationRange);
  }, [COLOR_SCALE, populationRange, refreshScaleLegend]);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    leafletMap.current = L.map(mapRef.current, { zoomSnap: 0.1 }).setView(
      COLOMBIA_CENTER,
      COLOMBIA_ZOOM,
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    }).addTo(leafletMap.current);

    const Legend = L.Control.extend({
      options: { position: 'bottomright' },
      onAdd() {
        const c = L.DomUtil.create('div', 'info legend');
        c.style.cssText =
          'background:rgba(255,255,255,.5);padding:6px;border-radius:4px;' +
          'box-shadow:0 1px 5px rgba(0,0,0,.2);min-width:150px;font-size:11px;display:none;pointer-events:none;';
        c.innerHTML = '<div id="legend-content"></div>';
        return c;
      },
    });

    const ColorScaleLegend = L.Control.extend({
      options: { position: 'bottomleft' },
      onAdd() {
        const c = L.DomUtil.create('div', 'color-scale-legend');
        c.style.cssText =
          'background:rgba(255,255,255,.5);padding:4px;border-radius:4px;' +
          'box-shadow:0 1px 5px rgba(0,0,0,.2);font-size:10px;pointer-events:none;width:110px;';
        c.innerHTML = `
          <div style="font-weight:bold;margin-bottom:3px">Escala de color</div>
          <div style="position:relative;height:12px;margin-bottom:2px">
            <div id="gradient-bar" style="width:100%;height:100%;border-radius:2px"></div>
          </div>
          <div id="color-scale-labels" style="display:flex;justify-content:space-between;font-size:9px"></div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
            <div style="width:14px;height:14px;border:1px solid rgba(0,0,0,.3);border-radius:2px;background:${NO_DATA_COLOR}"></div>
            <div style="font-size:9px;line-height:1.1">Sin datos</div>
          </div>`;
        gradientRef.current = c.querySelector('#gradient-bar');
        return c;
      },
    });

    legendRef.current = new Legend().addTo(leafletMap.current).getContainer();
    new ColorScaleLegend().addTo(leafletMap.current);

    const magnifyingCircle = L.circle(SAI_CATA_CENTER, {
      radius: 80000,
      color: hexToRgb(theme.palette.primary.main),
      fillColor: hexToRgb(theme.palette.primary.main),
      fillOpacity: 0.2,
    }).addTo(leafletMap.current);

    const magnifyingLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors' },
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
        const c = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        c.style.cssText =
          "background:white;width:30px;height:30px;" +
          "background-image:url('https://cdn-icons-png.flaticon.com/512/25/25694.png');" +
          'background-size:20px 20px;background-repeat:no-repeat;background-position:center;cursor:pointer;';

        c.onclick = () => {
          leafletMap.current.flyTo(COLOMBIA_CENTER, COLOMBIA_ZOOM, { duration: 0.7 });
          if (!leafletMap.current.hasLayer(magnifyingCircle)) {
            magnifyingCircle.addTo(leafletMap.current);
          }
          activePolygonRef.current = null;
          if (returnButtonRef.current) {
            returnButtonRef.current.style.backgroundImage =
              "url('https://cdn-icons-png.flaticon.com/512/25/25694.png')";
          }
        };

        returnButtonRef.current = c;
        return c;
      },
    });

    if (!props.isEditionMode) {
      leafletMap.current.addControl(new HomeBtn());
    }

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

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

  useEffect(() => {
    if (!leafletMap.current || !geoData?.length) return;

    if (geoJsonLayerRef.current) {
      leafletMap.current.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
      activePolygonRef.current = null;
    }

    const stylePolygon = (feature) => ({
      fillColor: getColor(feature.properties.stats?.population),
      weight:      borderWidth,
      color:       borderColor,
      dashArray:   '1',
      opacity:     1,
      fillOpacity: 0.9,
    });

    const highlightPolygon = (layer) => {
      layer.setStyle({ weight: 1, color: '#666', dashArray: '', fillOpacity: 1 });
      layer.bringToFront();
    };

    geoJsonLayerRef.current = L.geoJSON(geoData, {
      style: stylePolygon,
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover() {
            if (layer !== activePolygonRef.current) highlightPolygon(layer);
            if (showTooltips && feature.properties.stats) {
              const { name, aggregationData } = feature.properties.stats;
              legendRef.current.style.display = 'block';
              legendRef.current.querySelector('#legend-content').innerHTML = `
                <p style="margin:0 0 4px 0;font-weight:bold;">${name}</p>
                ${aggregationData
                  .map(f => `<p style="margin:2px 0">${f.alias}: ${f.value}</p>`)
                  .join('')}
              `;
            }
          },
          mouseout() {
            if (layer !== activePolygonRef.current) {
              layer.setStyle(stylePolygon(feature));
            }
            if (showTooltips && legendRef.current) {
              legendRef.current.style.display = 'none';
            }
          },
          click() {
            leafletMap.current.flyToBounds(layer.getBounds(), {
              duration: 0.7,
              padding: [20, 20],
            });

            if (activePolygonRef.current) {
              activePolygonRef.current.setStyle(
                stylePolygon(activePolygonRef.current.feature),
              );
            }

            layer.setStyle({ ...stylePolygon(feature), weight: 1, dashArray: '' });
            activePolygonRef.current = layer;

            const panel = panelRef.current;
            const groupByField = panel?.queryParameters?.query_fields_distribution?.group_by_fields?.[0]?.name;
            onClickRef.current?.({
              field:    groupByField,
              value:    feature.properties.NOMBRE_DPT,
              rawValue: feature.properties.NOMBRE_DPT,
              code:     feature.properties.DPTO,
            });
          },
        });
      },
    }).addTo(leafletMap.current);

    return () => {
      if (geoJsonLayerRef.current && leafletMap.current) {
        leafletMap.current.removeLayer(geoJsonLayerRef.current);
        geoJsonLayerRef.current = null;
        activePolygonRef.current = null;
      }
    };
  }, [geoData, getColor, borderWidth, borderColor, showTooltips]);

  // Heat layer effect — matches old FocusHeatMap: single layer, fixed radius/blur,
  // no zoom handler. Leaflet.heat handles redraw internally on moveend.
  useEffect(() => {
    const map = leafletMap.current;
    if (!map || heatPoints.length === 0) return;

    // 1) Remove ALL heat layers (by _heat internal) and purge canvases — like old
    //    version which recreates map each time; we ensure a clean slate.
    const removeAllHeatLayers = () => {
      map.eachLayer((layer) => {
        if (layer._heat != null) {
          try {
            map.removeLayer(layer);
          } catch (e) {
            console.warn('Error removing heat layer:', e);
          }
        }
      });
      heatLayerRef.current = null;
      const pane = map.getPane?.('overlayPane');
      if (pane) {
        pane.querySelectorAll?.('canvas.leaflet-heatmap-layer').forEach((c) => c.remove());
      }
    };

    removeAllHeatLayers();

    // 2) Add exactly one heat layer; radius/blur configurable from props.styles.
    const radius = parseFloatClean(heatRadius) || HEAT_BASE_RADIUS;
    const blurNum = parseFloatClean(heatBlur);
    const blur = !isNaN(blurNum) ? blurNum : Math.round(radius * 0.75);

    const layer = L.heatLayer(
      heatPoints.map((p) => [p[0], p[1], p[2]]),
      {
        radius:     radius,
        blur:       blur,
        maxZoom:    map.getMaxZoom?.() ?? 18,
        max:        1.0,
        minOpacity: 0.05,
        gradient: {
          0.0: COLOR_SCALE.min,
          0.5: interpolateColor(COLOR_SCALE.min, COLOR_SCALE.max, 0.5),
          1.0: COLOR_SCALE.max,
        },
      },
    ).addTo(map);

    heatLayerRef.current = layer;

    return () => {
      removeAllHeatLayers();
    };
  }, [heatPoints, heatRadius, heatBlur, COLOR_SCALE]);

return (
    <div 
      style={{ 
        position: 'relative', 
        height: '100%', 
        width: '100%',
        boxSizing: 'border-box',
        paddingTop: margin.marginTop ?? 0,
        paddingBottom: margin.marginBottom ?? 0,
        paddingLeft: margin.marginLeft ?? 0,
        paddingRight: margin.marginRight ?? 0,
      }}
    >
      {hasError && (
        <div
          style={{
            position: 'absolute',
            top: 8 + (margin.marginTop ?? 0),
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#d32f2f',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: 4,
            zIndex: 1000,
            fontSize: 13,
            pointerEvents: 'none',
          }}
        >
          Error: datos inválidos
        </div>
      )}
      <div
        ref={mapRef}
        style={{ height: '100%', width: '100%', borderRadius: '2px' }}
      />
    </div>
  );
}
