import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '@mui/material';

const NO_DATA_COLOR = 'rgba(133,133,133,0.52)';

export default function DynamicBoundaryMap(props) {
  if (props.error) alert('invalido');

  // --- ESCALA DE COLORES ---
  const COLOR_SCALE = useMemo(() => ({
      min: props.colors?.[0] ?? '#5564eb',
      max: props.colors?.[props.colors.length - 1] ?? '#ffa420',
    }), [props.colors]);

  // --- ESTADOS Y REFS ---
  const [geoData, setGeoData] = useState([]);
  const [departmentName, setDepartmentName] = useState(''); // Estado para el nombre
  const [populationRange, setPopulationRange] = useState({ min: 0, max: 0 });
  const [isSingleDepartment, setIsSingleDepartment] = useState(false);

  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const legendRef = useRef(null);
  const titleRef = useRef(null); // Ref para el control del título
  const gradientRef = useRef(null);
  const activePolygonRef = useRef(null);
  const initialBoundsRef = useRef(null);
  const margin = props?.styles?.marginChart ?? {}

  // --- ACTUALIZACIÓN DE DATOS ---
  useEffect(() => {
    const data = props.data || [];
    setGeoData(data);
    setPopulationRange(props.calculatedRange || { min: 0, max: 0 });
    
    // Detectar si es un solo departamento (viene del transformer)
    const isSingle = props.singleDepartment !== null && props.singleDepartment !== undefined;
    setIsSingleDepartment(isSingle);

    // Extraer el nombre del departamento
    if (isSingle && data.length > 0 && data[0].properties) {
        // Si es un solo departamento, mostrar su nombre
        setDepartmentName(data[0].properties.NOMBRE_DPT || '');
    } else {
        setDepartmentName('');
    }
  }, [props.data, props.calculatedRange, props.singleDepartment]);

  // --- ACTUALIZAR VISIBILIDAD/TEXTO DEL TÍTULO ---
  useEffect(() => {
    if (!titleRef.current) return;
    
    // Por defecto es TRUE. Solo se oculta si explícitamente es false.
    const showTitle = props.styles?.showTitle !== false;

    if (showTitle && departmentName) {
        titleRef.current.style.display = 'block';
        titleRef.current.innerHTML = `<span style="font-weight:700; font-size:14px; text-transform:uppercase;">${departmentName}</span>`;
    } else {
        titleRef.current.style.display = 'none';
    }
  }, [departmentName, props.styles]);


  // --- HELPERS (Estilos y Color) ---
  const scaleType = props?.styles?.scale ?? 'linear';
  const linearNorm = (v, min, max) => (max === min ? 0 : (v - min) / (max - min));
  const logNorm = (v, _, max) => Math.log(v + 1) / Math.log(max + 1);

  const interpolateColor = (c1, c2, f) => {
    try {
        const res = c1.match(/\w\w/g).map((c, i) => {
          const h1 = parseInt(c, 16);
          const h2 = parseInt(c2.match(/\w\w/g)[i], 16);
          const val = Math.round(h1 + (h2 - h1) * f);
          return val.toString(16).padStart(2, '0');
        });
        return `#${res.join('')}`;
    } catch { return NO_DATA_COLOR; }
  };

  const getColor = value => {
    if (value === undefined || value === null) return NO_DATA_COLOR;
    const { min, max } = populationRange;
    if (min === max) return COLOR_SCALE.min;
    const norm = scaleType === 'symlog' ? logNorm(value, min, max) : linearNorm(value, min, max);
    return interpolateColor(COLOR_SCALE.min, COLOR_SCALE.max, norm);
  };

  const formatShort = v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(1)}K` : v?.toString();

  const refreshScaleLegend = range => {
    if (gradientRef.current) gradientRef.current.style.background = `linear-gradient(to right, ${COLOR_SCALE.min}, ${COLOR_SCALE.max})`;
    const el = mapRef.current?.querySelector('#color-scale-labels');
    if (el) el.innerHTML = `<span>${formatShort(range.min)}</span><span>${formatShort(range.max)}</span>`;
  };

  // --- CONTROLES LEAFLET ---
  
  // 1. NUEVO CONTROL DE TÍTULO
  const TitleControl = L.Control.extend({
    options: { position: 'topright' }, // Lo ponemos arriba a la derecha
    onAdd() {
      const c = L.DomUtil.create('div', 'info title-control');
      c.style.cssText = `
        background: rgba(255, 255, 255, 0.9);
        padding: 6px 10px;
        border-radius: 4px;
        box-shadow: 0 1px 5px rgba(0,0,0,0.2);
        color: #333;
        font-family: Roboto, sans-serif;
        margin-right: 10px; 
        pointer-events: none;
        display: none;
      `;
      return c;
    },
  });

  const Legend = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd() {
      const c = L.DomUtil.create('div', 'info legend');
      c.style.cssText = 'background:rgba(255,255,255,.9);padding:6px;border-radius:4px;box-shadow:0 1px 5px rgba(0,0,0,.2);min-width:150px;font-size:11px;display:none;pointer-events:none;z-index:999;';
      c.innerHTML = '<div id="legend-content"></div>';
      return c;
    },
  });

  const ColorScaleLegend = L.Control.extend({
    options: { position: 'bottomleft' },
    onAdd() {
      const c = L.DomUtil.create('div', 'color-scale-legend');
      c.style.cssText = 'background:rgba(255,255,255,.9);padding:4px;border-radius:4px;box-shadow:0 1px 5px rgba(0,0,0,.2);font-size:10px;pointer-events:none;width:110px;';
      c.innerHTML = `
        <div style="font-weight:bold;margin-bottom:3px">Escala</div>
        <div style="position:relative;height:12px;margin-bottom:2px"><div id="gradient-bar" style="width:100%;height:100%;border-radius:2px"></div></div>
        <div id="color-scale-labels" style="display:flex;justify-content:space-between;font-size:9px"></div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:4px"><div style="width:14px;height:14px;border:1px solid rgba(0,0,0,.3);border-radius:2px;background:${NO_DATA_COLOR}"></div><div style="font-size:9px;line-height:1.1">Sin datos</div></div>`;
      gradientRef.current = c.querySelector('#gradient-bar');
      return c;
    },
  });

  const HomeBtn = L.Control.extend({
    options: { position: 'topright' },
    onAdd() {
      const c = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
      c.style.cssText = "background:white;width:30px;height:30px;background-image:url('https://cdn-icons-png.flaticon.com/512/25/25694.png');background-size:20px 20px;background-repeat:no-repeat;background-position:center;cursor:pointer;";
      c.onclick = () => {
        if (initialBoundsRef.current && leafletMap.current) {
             leafletMap.current.flyToBounds(initialBoundsRef.current, { duration: 0.7 });
        }
        if (activePolygonRef.current) {
          const f = activePolygonRef.current.feature;
          activePolygonRef.current.setStyle({
             fillColor: getColor(f.properties.stats?.population),
             // Reset al estilo por defecto (grueso)
             weight: props.styles?.borderWidth ?? 1,
             color: props.styles?.borderColor ?? '#333',
             dashArray: '1', opacity: 1, fillOpacity: 0.9,
          });
          activePolygonRef.current = null;
        }
      };
      return c;
    },
  });

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    leafletMap.current = L.map(mapRef.current, { zoomSnap: 0.1, preferCanvas: true });
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM contributors' }).addTo(leafletMap.current);
    
    legendRef.current = new Legend().addTo(leafletMap.current).getContainer();
    new ColorScaleLegend().addTo(leafletMap.current);

    const titleCtrl = new TitleControl();
    titleRef.current = titleCtrl.addTo(leafletMap.current).getContainer();

    if (!props.isEditionMode) new HomeBtn().addTo(leafletMap.current);
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

  useEffect(() => { refreshScaleLegend(populationRange); }, [COLOR_SCALE, populationRange]);

  useEffect(() => {
    if (!leafletMap.current) return;
    if (geoJsonLayerRef.current) leafletMap.current.removeLayer(geoJsonLayerRef.current);
    if (geoData.length === 0) return;

    const stylePolygon = feature => ({
        fillColor: getColor(feature.properties.stats?.population),
        // 3. ESTILOS POR DEFECTO MÁS GRUESOS
        weight: props.styles?.borderWidth ?? 1,     // Antes 0.5, ahora 1
        color: props.styles?.borderColor ?? '#333', // Antes #555, ahora #333 (más oscuro)
        dashArray: '1', opacity: 1, fillOpacity: 0.9,
    });

    geoJsonLayerRef.current = L.geoJSON(geoData, {
      style: stylePolygon,
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover() {
            if (layer !== activePolygonRef.current) {
                layer.setStyle({ weight: 2.5, color: '#000', dashArray: '', fillOpacity: 1 });
                layer.bringToFront();
            }
            if (feature.properties.stats) {
              const { name, aggregationData } = feature.properties.stats;
              legendRef.current.style.display = 'block';
              legendRef.current.querySelector('#legend-content').innerHTML = `
                <p style="margin:0 0 4px 0;font-weight:bold;">${name}</p>
                ${aggregationData.map(f => `<p style="margin:2px 0">${f.alias}: ${f.value}</p>`).join('')}
              `;
            }
          },
          mouseout() {
            if (layer !== activePolygonRef.current) layer.setStyle(stylePolygon(feature));
            legendRef.current.style.display = 'none';
          },
          click() {
            leafletMap.current.flyToBounds(layer.getBounds(), { duration: 0.7, padding: [20, 20] });
            if (activePolygonRef.current) activePolygonRef.current.setStyle(stylePolygon(activePolygonRef.current.feature));
            // Estilo de selección (muy grueso)
            layer.setStyle({ ...stylePolygon(feature), weight: 3, color: '#000', dashArray: '' });
            activePolygonRef.current = layer;

            props.onClick?.({
              field: props.panel.queryParameters.query_fields_distribution.group_by_fields[0].name,
              value: feature.properties.NOMBRE_MPI,
              rawValue: feature.properties.NOMBRE_MPI,
              code: feature.properties.MPIOS,
            });
          },
        });
      },
    }).addTo(leafletMap.current);

    const bounds = geoJsonLayerRef.current.getBounds();
    if (bounds.isValid()) {
        leafletMap.current.fitBounds(bounds, { padding: [20, 20] });
        initialBoundsRef.current = bounds; 
    }

  }, [geoData, props.styles, props.panel, populationRange, COLOR_SCALE]);

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