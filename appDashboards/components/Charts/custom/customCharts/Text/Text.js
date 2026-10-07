import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import * as MuiIcons from "@mui/icons-material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

/**
 * Text Component - Componente elegante para mostrar texto con título y separador
 * Soporta:
 * - Título opcional con separador lateral
 * - Icono configurable de MUI (va con el título)
 * - Contenido de texto opcional con estilos personalizados
 * - Alineación horizontal y vertical
 * - Componente completamente flexible (puede tener solo título, solo contenido, ambos, o ninguno)
 */
function Text({ styles, colors }) {
  console.log(styles,"estilos")
  // Propiedades configurables desde el backend
  const titleValue = styles?.titleValue || "";
  const text = styles?.text || "";
  const margin = styles.marginChart ?? {}


  // Alineaciones del TÍTULO
  const textAlign_title = styles?.textAlign_title || "center";
  const verticalAlign_title = styles?.verticalAlign_title || "top";

  // Alineaciones del CONTENIDO
  const textAlign_content = styles?.textAlign_content || "left";
  const verticalAlign_content = styles?.verticalAlign_content || "top";

  // Alineación vertical general del contenedor (usa la del título o la del contenido)
  const hasTitle = titleValue && typeof titleValue === 'string' && titleValue.trim() !== "";
  const verticalAlign = hasTitle ? verticalAlign_title : verticalAlign_content;

  const iconPosition = styles?.iconPosition || "start";
  const showIcon = styles?.icon && styles?.icon !== "";

  // Validar qué elementos se deben mostrar (manejar null, undefined, y tipos no string)
  const hasText = text && typeof text === 'string' && text.trim() !== "";
  const hasContent = hasTitle || hasText;

  // Separador - Viene en un objeto separator
  const showSeparator = styles?.separator !== undefined && styles?.separator !== null;
  const separatorThickness = styles?.separator?.separatorThickness || 3;
  const separatorColor = colors?.[0] || "#e0e0e0"; // Color del primer elemento del array colors

  // Propiedades quemadas en el front para mejorar la apariencia
  const contentPadding = styles?.contentPadding || 2;
  const contentGap = hasTitle && hasText ? 1.5 : 0; // Gap solo si hay ambos

  // Convertir textAlign a valores de flexbox (horizontal)
  const getAlignmentValue = (align) => {
    switch (align) {
      case "left": return "flex-start";
      case "right": return "flex-end";
      case "center": return "center";
      default: return "flex-start";
    }
  };

  // Convertir verticalAlign a valores de flexbox (vertical)
  const getVerticalAlignmentValue = (align) => {
    switch (align) {
      case "top": return "flex-start";
      case "bottom": return "flex-end";
      case "center": return "center";
      default: return "flex-start";
    }
  };

  // Obtener el icono de MUI
  const getMuiIcon = useMemo(() => {
    if (!showIcon) return null;

    const iconName = styles.icon;
    console.log("Buscando icono:", iconName);

    if (typeof iconName === 'string') {
      // Intentar primero con el nombre exacto
      if (MuiIcons[iconName]) {
        const IconComponent = MuiIcons[iconName];
        console.log("Icono encontrado (exacto):", iconName);
        return IconComponent;
      }

      // Intentar con variantes comunes
      const variants = ['', 'Outlined', 'Rounded', 'Sharp', 'TwoTone'];
      for (const variant of variants) {
        const testName = `${iconName}${variant}`;
        if (MuiIcons[testName]) {
          const IconComponent = MuiIcons[testName];
          console.log("Icono encontrado (variante):", testName);
          return IconComponent;
        }
      }

      // Búsqueda case-insensitive
      const iconNames = Object.keys(MuiIcons);
      const foundIcon = iconNames.find(
        name => name.toLowerCase() === iconName.toLowerCase()
      );

      if (foundIcon) {
        const IconComponent = MuiIcons[foundIcon];
        console.log("Icono encontrado (case-insensitive):", foundIcon);
        return IconComponent;
      }
    }

    // Icono por defecto si no se encuentra
    console.log("Icono no encontrado, usando InfoOutlined");
    return InfoOutlinedIcon;
  }, [showIcon, styles?.icon]);

  // Tamaño y color del icono basado en titleStylesText (el icono va con el título)
  const iconSize = styles?.titleStylesText?.fontSize
    ? `${parseInt(styles.titleStylesText.fontSize) * 1.2}px`
    : "28px";
  const iconColor = styles?.titleStylesText?.color || "#363636";

  // Si no hay contenido, mostrar placeholder
  if (!hasContent) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: contentPadding,
        }}
      >
        <Typography
          sx={{
            color: "#bdbdbd",
            fontSize: "14px",
            fontStyle: "italic",
          }}
        >
          Sin contenido configurado
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: getVerticalAlignmentValue(verticalAlign), // Alineación vertical
        padding: contentPadding,
        gap: contentGap,
        marginTop: `${margin.marginTop ?? 0}px`,
        marginRight: `${margin.marginRight ?? 0}px`,
        marginBottom: `${margin.marginBottom ?? 0}px`,
        marginLeft: `${margin.marginLeft ?? 0}px`,
      }}
    >
      {/* Título con separador lateral e icono - Solo si hay título */}
      {hasTitle && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: showSeparator ? getAlignmentValue(textAlign_title) : getAlignmentValue(textAlign_title),
            gap: showSeparator ? 1.5 : 0,
            width: "100%",
            marginBottom: 0.5,
          }}
        >
          {/* Línea izquierda - Solo si showSeparator está activo */}
          {showSeparator && (
            <Box
              sx={{
                flex: textAlign_title === "center" ? 1 : textAlign_title === "right" ? 1 : 0,
                height: `${separatorThickness}px`,
                backgroundColor: separatorColor,
                borderRadius: "2px",
                minWidth: textAlign_title === "left" ? 0 : "40px",
              }}
            />
          )}

          {/* Contenedor del título con icono */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexShrink: 1,
              minWidth: 0,
              maxWidth: "100%",
            }}
          >
            {/* Icono al inicio del título */}
            {iconPosition === "start" && getMuiIcon && (
              <Box
                component={getMuiIcon}
                sx={{
                  fontSize: iconSize,
                  color: iconColor,
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              />
            )}

            {/* Título */}
            <Typography
              component="div"
              sx={{
                textAlign: textAlign_title,
                fontFamily: "Arial",
                fontWeight: "bold",
                fontSize: "24px",
                color: "#363636",
                lineHeight: 1.2,
                ...styles?.titleStylesText,
                whiteSpace: "normal",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              {typeof titleValue === 'string' ? titleValue : String(titleValue || '')}
            </Typography>

            {/* Icono al final del título */}
            {iconPosition === "end" && getMuiIcon && (
              <Box
                component={getMuiIcon}
                sx={{
                  fontSize: iconSize,
                  color: iconColor,
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              />
            )}
          </Box>

          {/* Línea derecha - Solo si showSeparator está activo */}
          {showSeparator && (
            <Box
              sx={{
                flex: textAlign_title === "center" ? 1 : textAlign_title === "left" ? 1 : 0,
                height: `${separatorThickness}px`,
                backgroundColor: separatorColor,
                borderRadius: "2px",
                minWidth: textAlign_title === "right" ? 0 : "40px",
              }}
            />
          )}
        </Box>
      )}

      {/* Contenido de texto - Solo si hay texto */}
      {hasText && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: getAlignmentValue(textAlign_content),
            gap: 1,
            width: "100%",
            flexWrap: "wrap",
            padding: hasTitle ? 1 : 0, // Padding extra si hay título
          }}
        >
          <Typography
            component="div"
            sx={{
              textAlign: textAlign_content,
              fontFamily: "Arial",
              fontWeight: "normal",
              fontSize: "16px",
              color: "#666666",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              lineHeight: 1.5,
              flex: 1,
              ...styles?.contentStylesText,
            }}
          >
            {typeof text === 'string' ? text : String(text || '')}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default Text;

