import { useState, useEffect, useRef, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import * as MuiIcons from "@mui/icons-material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { formatNumber } from "@components/Charts/dataTransformers/utils/numberFormatter";

const applyCasing = (text, type) => {
  if (!text || typeof text !== "string") return text;
  const lowerText = text.toLowerCase().trim();
  const safeType = typeof type === "string" ? type : "toLowerCase";

  switch (safeType) {
    case "toUpperCase":
      return text.toUpperCase();
    case "toLowerCase":
      return text.toLowerCase();
    case "toUpperCamelCase":
      return lowerText.replace(
        /(^|[\s\.\-,/])([a-z])/g,
        (match) => match.toUpperCase()
      );
    default:
      return text;
  }
};

function MinMaxIndicator({ data, styles, colors, updateLiveChartProps }) {
  const [metric, setMetric] = useState(""); // Metric es texto
  const [value, setValue] = useState(0); // Value es numérico
  const [title, setTitle] = useState("");
  const lastUpdatedTitleRef = useRef(null);
  const margin = styles?.marginChart ?? updateLiveChartProps.marginChart ?? {}

  useEffect(() => {
    if (data && data.length > 0) {
      const firstItem = data[0];
      
      // Metric es texto (se muestra grande)
      setMetric(firstItem.metric || "");

      // Value es numérico (se muestra pequeño debajo con formato)
      let rawValue = firstItem.value;
      if (typeof rawValue === 'string') {
        rawValue = rawValue.replace(/\./g, '').replace(',', '.');
      }
      const parsedValue = parseFloat(rawValue);
      setValue(isNaN(parsedValue) ? 0 : parsedValue);
    }
  }, [data]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const firstItem = data[0]; // Corregido: debe ser data[0], no data
    const dataTitle = firstItem?.title || "";
    const backendTitle = styles?.titleValue?.trim() || "";

    if (backendTitle !== "") {
      setTitle(styles.titleValue);
      if (backendTitle === dataTitle && firstItem?.title) {
        lastUpdatedTitleRef.current = `data:${firstItem.title}`;
      } else {
        lastUpdatedTitleRef.current = `backend:${styles.titleValue}`;
      }
      return;
    }

    setTitle(dataTitle);
    const lastUpdated = lastUpdatedTitleRef.current;
    const isAlreadySet = backendTitle === dataTitle;
    const shouldUpdate =
      updateLiveChartProps?.updateLiveProps &&
      firstItem?.title &&
      firstItem.title.trim() !== "" &&
      lastUpdated !== `data:${firstItem.title}` &&
      !isAlreadySet;

    if (shouldUpdate) {
      updateLiveChartProps.updateLiveProps({
        styles: {
          titleValue: dataTitle
        }
      });
      lastUpdatedTitleRef.current = `data:${firstItem.title}`;
    }
  }, [data, styles?.titleValue]);

  const borderColor = styles?.borderColor || colors?.[0] || "#e5e7eb";
  const borderWidth = styles?.borderWidth || 5;
  
  const alignment = styles?.alignment || "center";
  const titleAlignment = styles?.titleAlignment || "center";
  const iconPosition = styles?.iconPosition || "end"; // "start" o "end", por defecto "end"
  const decimalPlaces = styles?.decimalPlaces !== undefined ? styles.decimalPlaces : 0;
  const escalaCorta = styles?.escalaCorta === true; // Escala corta para números grandes
  const caseType = styles?.caseType;
  // Formatear el value (numérico) según las propiedades
  const formattedValue = useMemo(() => {
    return formatNumber(value, {
      decimalPlaces,
      shortScale: escalaCorta,
    });
  }, [value, decimalPlaces, escalaCorta]);

  const getAlignmentValue = (align) => {
    switch (align) {
      case "left": return "flex-start";
      case "right": return "flex-end";
      case "center": return "center";
      case "space-between": return "space-between";
      default:
        return "center";
    }
  };

  const getTextAlignValue = (align) => {
    switch (align) {
      case "left": return "left";
      case "right": return "right";
      case "center": 
        return "center";
      case "space-between":
        return "space-between";
      default:
        return "center";
    }
  };

  const getMuiIcon = useMemo(() => {
    if (!styles?.icon) return null;

    const iconName = styles.icon;

  
    // Si es un nombre de icono de MUI, intentar obtenerlo del módulo
    if (typeof iconName === 'string') {
      // Normalizar el nombre: capitalizar primera letra y convertir a formato de componente
      const normalizedName = iconName
        .split(/[-_\s]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join("");

      const variants = ["", "Outlined", "Rounded", "Sharp", "TwoTone"];
      const possibleNames = [iconName, normalizedName, `${normalizedName}Icon`];

      variants.forEach(variant => {
        possibleNames.push(
          variant ? `${normalizedName}${variant}` : normalizedName,
          variant ? `${normalizedName}${variant}Icon` : `${normalizedName}Icon`
        );
      });

      for (const name of possibleNames) {
        if (MuiIcons[name]) {
          const IconComponent = MuiIcons[name];
          return (
            <IconComponent
              sx={{
                fontSize: styles?.titleStylesText?.fontSize
                  ? `${parseInt(styles.titleStylesText.fontSize) * 1.3}px`
                  : "16px",
                color: colors?.[0] || "inherit",
              }}
            />
          );
        }
      }

      // Si no se encuentra, intentar búsqueda case-insensitive
      const iconNames = Object.keys(MuiIcons);
      const foundIcon = iconNames.find(
        name => name.toLowerCase() === iconName.toLowerCase() || 
          name.toLowerCase() === `${iconName}Icon`.toLowerCase()
      );

      if (foundIcon) {
        const IconComponent = MuiIcons[foundIcon];
        return (
          <IconComponent
            sx={{
              fontSize: styles?.titleStylesText?.fontSize
                ? `${parseInt(styles.titleStylesText.fontSize) * 1.3}px`
                : "16px",
              color: colors?.[0] || "inherit",
            }}
          />
        );
      }
    }

    // Si no se encuentra y hay un icono definido, usar icono por defecto
    if (styles?.icon) {
    return (
      <InfoOutlinedIcon
        sx={{
          fontSize: styles?.titleStylesText?.fontSize
            ? `${parseInt(styles.titleStylesText.fontSize) * 1.3}px`
            : "16px",
          color: colors?.[0] || "inherit",
          opacity: 0.8,
        }}
      />
    );
    }
    
    // Si no hay icono definido, retornar null
    return null;
  }, [styles?.icon, styles?.titleStylesText]);

  return (
    <Box
      sx={{
        boxSizing: "border-box",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: getAlignmentValue(alignment),
        justifyContent: "center",
        textAlign: getTextAlignValue(alignment),
        padding: 2,
        backgroundColor: "transparent",
        gap: 1.5,
        borderTop: `${borderWidth}px solid ${borderColor}`,
        borderRadius: "3px",
        marginTop: `${margin.marginTop ?? 0}px`,
        marginRight: `${margin.marginRight ?? 0}px`,
        marginBottom: `${margin.marginBottom ?? 0}px`,
        marginLeft: `${margin.marginLeft ?? 0}px`,
      }}
    >
      {title && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: getAlignmentValue(titleAlignment),
            gap: 1,
            width: "100%",
          }}
        >
          {iconPosition === "start" && getMuiIcon}
          <Typography
            variant="body2"
            component="div"
            sx={{
              color: "text.secondary",
              fontWeight: 400,
              lineHeight: 1.4,
              textAlign: getTextAlignValue(titleAlignment),
              ...styles?.titleStylesText,
            }}
          >
            {title}
          </Typography>
          {iconPosition === "end" && getMuiIcon}
        </Box>
      )}
      {/* Metric - Texto grande (sin formato numérico) */}
      {metric && (
        <Box
          sx={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: getAlignmentValue(alignment),
            gap: 0.5,
            width: "100%",
          }}
        >
          {styles?.beforeText && (
            <Typography
              component="span"
              sx={{
                fontSize: "0.5em",
                fontWeight: 400,
                ...styles.beforeTextStyles,
              }}
            >
              {styles.beforeText}
            </Typography>
          )}
          <Typography
            variant="h2"
            sx={{
              fontWeight: 600,
              lineHeight: 1.2,
              fontSize: "2rem",
              ...styles?.valueStylesText,
              ...(styles?.margin && {
                marginTop: `${styles.margin.marginTop || 0}px`,
                marginRight: `${styles.margin.marginRight || 0}px`,
                marginBottom: `${styles.margin.marginBottom || 0}px`,
                marginLeft: `${styles.margin.marginLeft || 0}px`,
              }),
            }}
          >
            {applyCasing(metric, caseType)}  {/* ← casing aplicado aquí */}
          </Typography>
          {styles?.afterText && (
            <Typography
              component="span"
              sx={{
                fontSize: "0.3em",
                fontWeight: 200,
                ...styles.afterTextStyles,
              }}
            >
              {styles.afterText}
            </Typography>
          )}
        </Box>
      )}

      {/* Value - Valor numérico pequeño debajo (con formato de escala) */}
      {( styles?.enableValueMetric && (value !== 0 || value !== "")) && (
        <Box
          sx={{
            display: "flex",
            justifyContent: getAlignmentValue(alignment),
            width: "100%",
          }}
        >
          <Typography
            variant="body2"
            component="div"
            sx={{
              ...styles?.enableValueMetric,
              fontWeight: styles?.enableValueMetric?.fontWeight,
              fontSize: styles?.enableValueMetric?.fontSize,
              lineHeight: 1.4,
              textAlign: getTextAlignValue(alignment),
              
            }}
          >
            {formattedValue}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default MinMaxIndicator;