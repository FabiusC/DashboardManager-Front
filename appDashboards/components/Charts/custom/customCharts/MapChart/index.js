import {
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '@mui/material';
import { hexToRgb } from '@components/Recursive/mui_styled_components';

const NO_DATA_COLOR = 'rgba(133,133,133,0.52)';
const COLOMBIA_CENTER = [4.570868, -74.297333];
const COLOMBIA_ZOOM = 5.39;
const SAI_CATA_CENTER = [12.93558238780604, -81.54483429516513];

export default function DepartamentColombiaMap(props) {
  if (props.error) alert('invalido');

  // -------- Escala de colores --------
  const COLOR_SCALE = useMemo(
    () => ({
      min: props.colors?.[0] ?? '#5564eb',
      max: props.colors?.[props.colors.length - 1] ?? '#ffa420',
    }),
    [props.colors],
  );

  // ---------- datos y refs ---------------
  const [geoData, setGeoData] = useState([]);
  const [populationRange, setPopulationRange] = useState({ min: 0, max: 0 });

  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const legendRef = useRef(null);
  const gradientRef = useRef(null);
  const returnButtonRef = useRef(null);
  const activePolygonRef = useRef(null);
  const stylesRef = useRef(props.styles);
  const getColorRef = useRef(() => NO_DATA_COLOR);

  const theme = useTheme();
  const margin = props?.styles?.marginChart ?? {}
  // ------------ normalización y colores ----------
  const scaleType = props?.styles?.scale ?? 'linear';

  const linearNorm = (v, min, max) => (max === min ? 0 : (v - min) / (max - min));
  const logNorm = (v, _, max) => Math.log(v + 1) / Math.log(max + 1);

  const interpolateColor = (c1, c2, f) => {
    const res = c1.match(/\w\w/g).map((c, i) => {
      const h1 = parseInt(c, 16);
      const h2 = parseInt(c2.match(/\w\w/g)[i], 16);
      const val = Math.round(h1 + (h2 - h1) * f);
      return val.toString(16).padStart(2, '0');
    });
    return `#${res.join('')}`;
  };

  const getColor = value => {
    if (value === undefined || value === null) return NO_DATA_COLOR;
    const { min, max } = populationRange;
    if (min === max) return COLOR_SCALE.min;

    const norm =
      scaleType === 'symlog'
        ? logNorm(value, min, max)
        : linearNorm(value, min, max);

    return interpolateColor(COLOR_SCALE.min, COLOR_SCALE.max, norm);
  };

  useEffect(() => {
    stylesRef.current = props.styles;
  }, [props.styles]);

  useEffect(() => {
    getColorRef.current = getColor;
  }, [getColor]);

  // ------------ leyenda ---------
  const formatShort = v =>
    v >= 1_000_000
      ? `${(v / 1_000_000).toFixed(1)}M`
      : v >= 1_000
        ? `${(v / 1_000).toFixed(1)}K`
        : v.toString();

  const refreshScaleLegend = range => {
    if (gradientRef.current)
      gradientRef.current.style.background = `linear-gradient(to right, ${COLOR_SCALE.min}, ${COLOR_SCALE.max})`;

    const el = mapRef.current?.querySelector('#color-scale-labels');
    if (el)
      el.innerHTML = `<span>${formatShort(range.min)}</span><span>${formatShort(
        range.max,
      )}</span>`;
  };

  // ------------ controles personalizados ----------
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

  const highlightPolygon = layer => {
    layer.setStyle({
      weight: 1,
      color: '#666',
      dashArray: '',
      fillOpacity: 1,
    });
    layer.bringToFront();
  };

  // ------- datos que llegan del transformador ------
  useEffect(() => {
    setGeoData(props.data || []);
    setPopulationRange(props.calculatedRange || { min: 0, max: 0 });
  }, [props.data, props.calculatedRange]);

  // ------------- inicializar mapa --------------
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

    legendRef.current = new Legend().addTo(leafletMap.current).getContainer();
    new ColorScaleLegend().addTo(leafletMap.current);

    // --- círculo / lupa sobre San Andrés ---
    const magnifyingCircle = L.circle(SAI_CATA_CENTER, {
      radius: 80000,
      color: hexToRgb(theme.palette.primary.main),
      fillColor: hexToRgb(theme.palette.primary.main),
      fillOpacity: 0.2,
    }).addTo(leafletMap.current);

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

    // --- botón “home” ---
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
          leafletMap.current.flyTo(COLOMBIA_CENTER, COLOMBIA_ZOOM, { duration: 0.7 });

          if (!leafletMap.current.hasLayer(magnifyingCircle))
            magnifyingCircle.addTo(leafletMap.current);

          if (activePolygonRef.current) {
            // restaurar estilo sin depender de stylePolygon (evita ReferenceError)
            const f = activePolygonRef.current.feature;
            const pop = f.properties.stats?.population;
            activePolygonRef.current.setStyle({
              fillColor: getColorRef.current(pop),
              weight: stylesRef.current?.borderWidth ?? 1,
              color: stylesRef.current?.borderColor ?? 'black',
              dashArray: '1',
              opacity: 1,
              fillOpacity: 0.9,
            });
            activePolygonRef.current = null;
          }

          if (returnButtonRef.current)
            returnButtonRef.current.style.backgroundImage =
              "url('https://cdn-icons-png.flaticon.com/512/25/25694.png')";
        };
        returnButtonRef.current = c;
        return c;
      },
    });
    if (!props.isEditionMode) {
      leafletMap.current.addControl(new HomeBtn());
    }
  }, [theme, props.isEditionMode]);

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

  // -------- actualizar leyenda --------
  useEffect(() => {
    refreshScaleLegend(populationRange);
  }, [COLOR_SCALE, populationRange]);

  // -------- dibujar capa GeoJSON ----------------
  useEffect(() => {
    if (!leafletMap.current) return;

    if (geoJsonLayerRef.current)
      leafletMap.current.removeLayer(geoJsonLayerRef.current);

    const stylePolygon = feature => {
      const pop = feature.properties.stats?.population;
      return {
        fillColor: getColor(pop),
        weight: props.styles?.borderWidth ?? 1,
        color: props.styles?.borderColor ?? 'black',
        dashArray: '1',
        opacity: 1,
        fillOpacity: 0.9,
      };
    };

    geoJsonLayerRef.current = L.geoJSON(geoData, {
      style: stylePolygon,
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover() {
            if (layer !== activePolygonRef.current) highlightPolygon(layer);
            if (feature.properties.stats) {
              const { name, aggregationData } = feature.properties.stats;
              legendRef.current.style.display = 'block';
              legendRef.current.querySelector('#legend-content').innerHTML = `
                <p style="margin:0 0 4px 0;font-weight:bold;">${name}</p>
                ${aggregationData
                  .map(
                    f => `<p style="margin:2px 0">${f.alias}: ${f.value}</p>`,
                  )
                  .join('')}
              `;
            }
          },
          mouseout() {
            if (layer !== activePolygonRef.current)
              layer.setStyle(stylePolygon(feature));
            legendRef.current.style.display = 'none';
          },
          click() {
            // zoom suave al polígono
            leafletMap.current.flyToBounds(layer.getBounds(), {
              duration: 0.7,
              padding: [20, 20],
            });

            if (activePolygonRef.current)
              activePolygonRef.current.setStyle(
                stylePolygon(activePolygonRef.current.feature),
              );

            layer.setStyle({ ...stylePolygon(feature), weight: 1, dashArray: '' });
            activePolygonRef.current = layer;

            props.onClick?.({
              field:
                props.panel?.queryParameters.query_fields_distribution
                  .group_by_fields[0].name,
              value: feature.properties.NOMBRE_DPT,
              rawValue: feature.properties.NOMBRE_DPT,
              code: feature.properties.DPTO,
            });
          },
        });
      },
    }).addTo(leafletMap.current);
  }, [
    geoData,
    props.styles,
    props.panel,
    populationRange,
    COLOR_SCALE,
    scaleType,
  ]);

  // --------------- render -----------------
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

