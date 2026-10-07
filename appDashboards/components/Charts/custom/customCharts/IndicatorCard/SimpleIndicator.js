import { useState, useEffect, useRef, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import * as MuiIcons from "@mui/icons-material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { formatNumber } from "@components/Charts/dataTransformers/utils/numberFormatter";
import { getAlignmentValue, getTextAlignValue } from "./utils/alignTextFormatter";
function SimpleIndicator({ data, styles, colors, updateLiveChartProps}) {
  const margin = styles?.marginChart ?? updateLiveChartProps?.marginChart ?? 0
  const [value, setValue] = useState(50);
  const [valueSecond, setValueSecond] = useState(50)
  const [title, setTitle] = useState("this is a simple indicator");
  const lastUpdatedTitleRef = useRef(null);

  useEffect(() => {
    if (data && data.length > 0) {
      const firstItem = data[0];
      let rawValue1 = firstItem.value;
      if (typeof rawValue1 === 'string') {
        rawValue1 = rawValue1.replace(/\./g, '').replace(',', '.');
      }
      const parsedValue1 = parseFloat(rawValue1);
      setValue(isNaN(parsedValue1) ? 0 : parsedValue1);

    let rawValue2 = firstItem.secondValue;
      if (rawValue2 !== undefined) {
        if (typeof rawValue2 === 'string') {
          rawValue2 = rawValue2.replace(/\./g, '').replace(',', '.');
        }
        const parsedValue2 = parseFloat(rawValue2);
        setValueSecond(isNaN(parsedValue2) ? 0 : parsedValue2);
      } else {
        setValueSecond(isNaN(parsedValue1) ? 0 : parsedValue1);
      }
    }
    }, [data]);


  useEffect(() => {
    if (!data || data.length === 0) return;
    
    const firstItem = data[0];
    const dataTitle = firstItem?.title || "this is a simple indicator";
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
  }, [data, styles?.titleValue, updateLiveChartProps]);
  const borderActive = styles?.borderActive 
  const borderColor = styles?.borderColor || colors?.[0] || "#e5e7eb";
  const borderWidth = styles?.borderActive?.borderWidth ?? styles?.borderWidth ?? 2;
  const alignment = styles?.alignment ?? "center";
  const titleAlignment = styles?.titleAlignment ?? "center";
  const valueAlignment = styles?.textAlign ?? "center";
  const valueAlignmentSecond = styles?.textAlignSecond ?? "center";
  const iconPosition = styles?.iconPosition || "end";
  const decimalPlaces = styles?.decimalPlaces !== undefined ? styles.decimalPlaces : 0;
  const escalaCorta = styles?.escalaCorta === true;
  const decimalPlacesSecond = styles?.decimalPlacesSecond !== undefined ? styles.decimalPlacesSecond : 0;
  const escalaCortaSecond = styles?.escalaCortaSecond === true;

  const formattedValue = useMemo(() => {
    return formatNumber(value, {
      decimalPlaces,
      shortScale: escalaCorta,
    });
  }, [value, decimalPlaces, escalaCorta]);

  const formattedValueSecond = useMemo(() => {
    return formatNumber(valueSecond, {
      decimalPlaces: decimalPlacesSecond,
      shortScale: escalaCortaSecond,
    });
  }, [valueSecond, decimalPlacesSecond, escalaCortaSecond]);
  const getMuiIcon = useMemo(() => {
    if (!styles?.icon) return null;
    
    const iconName = styles.icon;
    
  
    // Si es un nombre de icono de MUI, intentar obtenerlo del módulo
    if (typeof iconName === 'string') {
      // Normalizar el nombre: capitalizar primera letra y convertir a formato de componente
      const normalizedName = iconName
        .split(/[-_\s]/) // Separar por guiones, guiones bajos o espacios
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
      
      const variants = ['', 'Outlined', 'Rounded', 'Sharp', 'TwoTone'];
      
      // Generar posibles nombres del icono
      const possibleNames = [
        iconName, // nombre original
        normalizedName, // nombre normalizado
        `${normalizedName}Icon`, // con sufijo Icon
      ];
      
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
  }, [styles?.icon, styles?.titleStylesText, colors]);

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
        padding: 2,
        backgroundColor: "transparent",
        gap: 1.5,
        borderTop: borderActive ? `${borderWidth}px solid ${borderColor}` : "none",
        borderRadius: "3px",
        marginTop: `${margin.marginTop ?? 0}px`,
        marginRight: `${margin.marginRight ?? 0}px`,
        marginBottom: `${margin.marginBottom ?? 0}px`,
        marginLeft: `${margin.marginLeft ?? 0}px`,
      }}
    >
      { (styles?.enableTitle !== false) && title && (
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

      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 0 }}>
        
        <Box
          sx={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: getAlignmentValue(valueAlignment),
            gap: 0,
            width: "100%",
          // Aplicar márgenes al contenedor del valor
         
          }}
        >
       <Typography 
          variant="h2"  
          component="div"
          sx={{
            fontWeight: 600,
            lineHeight: 1.2,
            fontSize: "2rem",
            textAlign: getTextAlignValue(valueAlignment),
            ...styles?.valueStylesText,
            ...(styles?.margin && {
              marginTop: `${styles.margin.marginTop || 0}px`,
              marginRight: `${styles.margin.marginRight || 0}px`,
              marginBottom: `${styles.margin.marginBottom || 0}px`,
              marginLeft: `${styles.margin.marginLeft || 0}px`,
            }),
          }}
        >
          {styles?.beforeText && (
            <span style={{ fontSize: "0.5em", fontWeight: 200, ...styles.beforeTextStyles }}>
              {styles.beforeText}
            </span>
          )}

          {formattedValue}

          {styles?.afterText && (
            <span style={{ fontSize: "0.3em", fontWeight: 200, ...styles.afterTextStyles }}>
              {styles.afterText}
            </span>
          )}
        </Typography>
        </Box>

        {styles?.EnableSecondvalue && (
          <Box
            sx={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: getAlignmentValue(valueAlignmentSecond),
              gap: 0,
              width: "100%",
            }}
          >
            <Typography 
              variant="h2"
              component="div"
              sx={{
                fontWeight: 600,
                lineHeight: 1.2,
                fontSize: "2rem",
                textAlign: getTextAlignValue(valueAlignmentSecond),
                ...styles?.valueStylesTextSecond,
                ...(styles?.marginSecond && {
                  marginTop: `${styles.marginSecond.marginTop || 0}px`,
                  marginRight: `${styles.marginSecond.marginRight || 0}px`,
                  marginBottom: `${styles.marginSecond.marginBottom || 0}px`,
                  marginLeft: `${styles.marginSecond.marginLeft || 0}px`,
                }),
              }}
            >
              {styles?.beforeTextSecond && (
                <span style={{ fontSize: "0.5em", fontWeight: 400, ...styles.beforeTextStylesSecond }}>
                  {styles.beforeTextSecond}
                </span>
              )}
              {formattedValueSecond}
              {styles?.afterTextSecond && (
                <span style={{ fontSize: "0.3em", fontWeight: 200, ...styles.afterTextStylesSecond }}>
                {styles.afterTextSecond}
                </span>
              )}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default SimpleIndicator;