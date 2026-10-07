import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "@mui/material";

const DEFAULT_ZOOM = 10.15;
const DEFAULT_CENTER = [4.63683, -74.09815];
const NO_DATA_COLOR = "rgba(133,133,133,0.52)";
const HOME_ICON_URL = "https://cdn-icons-png.flaticon.com/512/25/25694.png";

// -----------------------------------------------------------------------------
// Utility functions
// -----------------------------------------------------------------------------

const normalizeLinear = (value, min, max) => {
  if (max === min) return 0;
  return (value - min) / (max - min);
};

const normalizeLog = (value, max) => {
  if (max <= 0) return 0;
  return Math.log(value + 1) / Math.log(max + 1);
};

const interpolateColor = (startColor, endColor, factor) => {
  const start = startColor.match(/\w\w/g);
  const end = endColor.match(/\w\w/g);

  if (!start || !end) return startColor;

  const result = start.map((color, index) => {
    const startValue = parseInt(color, 16);
    const endValue = parseInt(end[index], 16);
    const value = Math.round(startValue + (endValue - startValue) * factor);

    return value.toString(16).padStart(2, "0");
  });

  return `#${result.join("")}`;
};

const formatShort = (value) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return value.toString();
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function BogotaMapChart({
  data = [],
  calculatedRange = { min: 0, max: 0 },
  colors = [],
  styles = {},
  panel,
  onClick,
  isEditionMode = false,
  error,
}) {
  // ---------------------------------------------------------------------------
  // Theme and layout
  // ---------------------------------------------------------------------------

  useTheme();

  const margin = styles.marginChart ?? {};
  const scaleType = styles.scale ?? "linear";

  // ---------------------------------------------------------------------------
  // State and refs
  // ---------------------------------------------------------------------------

  const [geoData, setGeoData] = useState(data);
  const [populationRange, setPopulationRange] = useState(calculatedRange);

  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const geoJsonLayerRef = useRef(null);

  const legendRef = useRef(null);
  const gradientRef = useRef(null);
  const homeButtonRef = useRef(null);
  const activePolygonRef = useRef(null);

  const stylesRef = useRef(styles);
  const onClickRef = useRef(onClick);

  // ---------------------------------------------------------------------------
  // Color scale
  // ---------------------------------------------------------------------------

  const colorScale = useMemo(
    () => ({
      min: colors[0] ?? "#5564eb",
      max: colors[colors.length - 1] ?? "#ffa420",
    }),
    [colors],
  );

  const getColor = (value) => {
    if (value === undefined || value === null) {
      return NO_DATA_COLOR;
    }

    const { min, max } = populationRange;

    if (min === max) {
      return colorScale.min;
    }

    const normalizedValue =
      scaleType === "symlog"
        ? normalizeLog(value, max)
        : normalizeLinear(value, min, max);

    return interpolateColor(colorScale.min, colorScale.max, normalizedValue);
  };

  // ---------------------------------------------------------------------------
  // Keep refs synchronized with the latest props
  // ---------------------------------------------------------------------------

  useEffect(() => {
    stylesRef.current = styles;
  }, [styles]);

  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    setGeoData(data);
  }, [data]);

  useEffect(() => {
    setPopulationRange(calculatedRange);
  }, [calculatedRange]);

  useEffect(() => {
    if (error) {
      alert("invalido");
    }
  }, [error]);

  // ---------------------------------------------------------------------------
  // Legend
  // ---------------------------------------------------------------------------

  const updateColorScaleLegend = (range) => {
    if (gradientRef.current) {
      gradientRef.current.style.background = `linear-gradient(
        to right,
        ${colorScale.min},
        ${colorScale.max}
      )`;
    }

    const labels = mapRef.current?.querySelector("#color-scale-labels");

    if (labels) {
      labels.innerHTML = `
        <span>${formatShort(range.min)}</span>
        <span>${formatShort(range.max)}</span>
      `;
    }
  };

  const createInfoLegend = () => {
    const Legend = L.Control.extend({
      options: {
        position: "bottomright",
      },

      onAdd() {
        const container = L.DomUtil.create("div", "info legend");

        container.style.cssText = `
          background: rgba(255,255,255,.5);
          padding: 6px;
          border-radius: 4px;
          box-shadow: 0 1px 5px rgba(0,0,0,.2);
          min-width: 150px;
          font-size: 11px;
          display: none;
          pointer-events: none;
        `;

        container.innerHTML = `
          <div id="legend-content"></div>
        `;

        return container;
      },
    });

    return new Legend();
  };

  const createColorScaleLegend = () => {
    const ColorScaleLegend = L.Control.extend({
      options: {
        position: "bottomleft",
      },

      onAdd() {
        const container = L.DomUtil.create("div", "color-scale-legend");

        container.style.cssText = `
          background: rgba(255,255,255,.5);
          padding: 4px;
          border-radius: 4px;
          box-shadow: 0 1px 5px rgba(0,0,0,.2);
          font-size: 10px;
          pointer-events: none;
          width: 110px;
        `;

        container.innerHTML = `
          <div style="font-weight:bold;margin-bottom:3px">
            Color scale
          </div>

          <div style="position:relative;height:12px;margin-bottom:2px">
            <div
              id="gradient-bar"
              style="width:100%;height:100%;border-radius:2px"
            ></div>
          </div>

          <div
            id="color-scale-labels"
            style="
              display:flex;
              justify-content:space-between;
              font-size:9px;
            "
          ></div>

          <div
            style="
              display:flex;
              align-items:center;
              gap:6px;
              margin-top:4px;
            "
          >
            <div
              style="
                width:14px;
                height:14px;
                border:1px solid rgba(0,0,0,.3);
                border-radius:2px;
                background:${NO_DATA_COLOR};
              "
            ></div>

            <div style="font-size:9px;line-height:1.1">
              No data
            </div>
          </div>
        `;

        gradientRef.current = container.querySelector("#gradient-bar");

        return container;
      },
    });

    return new ColorScaleLegend();
  };

  useEffect(() => {
    updateColorScaleLegend(populationRange);
  }, [populationRange, colorScale]);

  // ---------------------------------------------------------------------------
  // Polygon styles
  // ---------------------------------------------------------------------------

  const getPolygonStyle = (feature) => {
    const value = feature.properties?.stats?.aggregationData?.[0]?.rawValue;

    return {
      fillColor: getColor(value),
      weight: styles.borderWidth ?? 1,
      color: styles.borderColor ?? "black",
      dashArray: "1",
      opacity: 1,
      fillOpacity: 0.9,
    };
  };

  const highlightPolygon = (layer) => {
    layer.setStyle({
      weight: 1,
      color: "#666",
      dashArray: "",
      fillOpacity: 1,
    });

    layer.bringToFront();
  };

  // ---------------------------------------------------------------------------
  // Map initialization
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) {
      return;
    }

    const map = L.map(mapRef.current, {
      zoomSnap: 0.1,
    }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

    leafletMapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    }).addTo(map);

    legendRef.current = createInfoLegend().addTo(map).getContainer();

    createColorScaleLegend().addTo(map);

    // Home button
    if (!isEditionMode) {
      const HomeButton = L.Control.extend({
        options: {
          position: "topright",
        },

        onAdd() {
          const container = L.DomUtil.create(
            "div",
            "leaflet-bar leaflet-control leaflet-control-custom",
          );

          container.style.cssText = `
            background: white;
            width: 30px;
            height: 30px;
            background-image: url('${HOME_ICON_URL}');
            background-size: 20px 20px;
            background-repeat: no-repeat;
            background-position: center;
            cursor: pointer;
          `;

          container.onclick = () => {
            map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, {
              duration: 0.7,
            });

            if (activePolygonRef.current) {
              const feature = activePolygonRef.current.feature;

              activePolygonRef.current.setStyle(getPolygonStyle(feature));

              activePolygonRef.current = null;
            }

            if (homeButtonRef.current) {
              homeButtonRef.current.style.backgroundImage = `url('${HOME_ICON_URL}')`;
            }
          };

          homeButtonRef.current = container;

          return container;
        },
      });

      map.addControl(new HomeButton());
    }

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, [isEditionMode]);

  // ---------------------------------------------------------------------------
  // Map resize handling
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!mapRef.current || !leafletMapRef.current) {
      return;
    }

    let frameId = null;

    const scheduleInvalidate = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(() => {
        leafletMapRef.current?.invalidateSize();
      });
    };

    const resizeObserver = new ResizeObserver(scheduleInvalidate);

    resizeObserver.observe(mapRef.current);

    if (mapRef.current.parentElement) {
      resizeObserver.observe(mapRef.current.parentElement);
    }

    window.addEventListener("resize", scheduleInvalidate);

    scheduleInvalidate();

    return () => {
      window.removeEventListener("resize", scheduleInvalidate);

      resizeObserver.disconnect();

      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // GeoJSON layer
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const map = leafletMapRef.current;

    if (!map) {
      return;
    }

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    const geoJsonLayer = L.geoJSON(geoData, {
      style: getPolygonStyle,

      onEachFeature: (feature, layer) => {
        layer.on({
            mouseover() {
                if (layer !== activePolygonRef.current) {
                  highlightPolygon(layer);
                }
              
                if (!legendRef.current) {
                  return;
                }
              
                const name = feature.properties?.NOMBRE;
                const aggregationData =
                  feature.properties?.stats?.aggregationData ?? [];
              
                const content = legendRef.current.querySelector(
                  "#legend-content",
                );
              
                if (!content) {
                  return;
                }
              
                const values = aggregationData.length
                  ? aggregationData
                      .map(
                        ({ alias, value }) => `
                          <p style="margin:2px 0">
                            ${alias}: ${value}
                          </p>
                        `,
                      )
                      .join("")
                  : `<p style="margin:2px 0">Sin datos</p>`;
              
                content.innerHTML = `
                  <p style="margin:0 0 4px 0;font-weight:bold;">
                    ${name}
                  </p>
                  ${values}
                `;
              
                legendRef.current.style.display = "block";
              },
          mouseout() {
            if (layer !== activePolygonRef.current) {
              layer.setStyle(getPolygonStyle(feature));
            }

            if (legendRef.current) {
              legendRef.current.style.display = "none";
            }
          },

          click() {
            const filterData = feature.properties?.data;

            const field = filterData?.fieldByFilter;
            const value = field ? filterData?.[field] : undefined;

            // Zoom to the selected polygon
            map.flyToBounds(layer.getBounds(), {
              duration: 0.7,
              padding: [20, 20],
            });

            // Restore the previously selected polygon
            if (activePolygonRef.current) {
              activePolygonRef.current.setStyle(
                getPolygonStyle(activePolygonRef.current.feature),
              );
            }

            // Highlight the selected polygon
            layer.setStyle({
              ...getPolygonStyle(feature),
              weight: 1,
              dashArray: "",
            });

            activePolygonRef.current = layer;

            // Apply the external filter
            onClickRef.current?.({
              field,
              value,
              rawValue: value,
            });
          },
        });
      },
    }).addTo(map);

    geoJsonLayerRef.current = geoJsonLayer;
  }, [geoData, styles, populationRange, colorScale, scaleType]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        paddingTop: margin.marginTop ?? 0,
        paddingBottom: margin.marginBottom ?? 0,
        paddingLeft: margin.marginLeft ?? 0,
        paddingRight: margin.marginRight ?? 0,
      }}
    >
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "2px",
        }}
      />
    </div>
  );
}
