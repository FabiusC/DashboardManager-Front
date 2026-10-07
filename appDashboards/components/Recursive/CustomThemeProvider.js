import React, { useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme, alpha, lighten } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { amber } from '@mui/material/colors';
import { getContrastColor } from './mui_styled_components';

/** Body bg: MUI lighten + alpha for a nice light gray tinted with primary */
const BODY_BG_LIGHTEN = 0.95;
const BODY_BG_ALPHA = 0.90;

export default function CustomThemeProvider({ children }) {
  const organization = useSelector((state) => state.organization[0]);

  const [primaryColor, secondaryColor, accentColor] = organization?.palette && organization.palette.length >= 1
    ? organization.palette
    : ['#464866', '#F8F9FA', '#660F2F'];  // Colores por defecto

  // Actualizar las variables CSS de IFindit UI según la paleta de la organización
  useEffect(() => {
    const root = document.documentElement;

    // Aplicar colores de la paleta de la organización a las variables CSS
    if (primaryColor) {
      root.style.setProperty('--ifinditUi-primaryColor', primaryColor);
    }

    if (secondaryColor) {
      root.style.setProperty('--ifinditUi-secondaryColor', secondaryColor);
    }

    // Body background: MUI lighten + alpha for a nice light gray with primary tint
    if (primaryColor) {
      const lightened = lighten(primaryColor, BODY_BG_LIGHTEN);
      const bgColor = alpha(lightened, BODY_BG_ALPHA);
      root.style.setProperty('--ifinditUi-backgroundColor', bgColor);
    }

    // Opcional: También podemos actualizar el color de hover basado en el color primario
    if (primaryColor) {
      // Crear un color de hover con opacidad basado en el color primario
      const hoverColor = `${primaryColor}0a`; // Añadir alpha 0a (opacidad ~4%)
      root.style.setProperty('--ifinditUi-hoverSurfaceColor', hoverColor);
    }

  }, [primaryColor, secondaryColor, accentColor]);

  const theme = useMemo(() => createTheme({
    palette: {
      primary: {
        main: primaryColor, // Color principal de la paleta
        contrastText: getContrastColor(primaryColor),
      },
      secondary: {
        main: secondaryColor ? secondaryColor : "#F8F9FA", // Segundo color
        contrastText: getContrastColor(secondaryColor ? secondaryColor : "#F8F9FA"),
      },
      error: {
        main: "#C62828", // Color para errores o alertas
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '6px',
            textTransform: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      }
    },
  }), [primaryColor, secondaryColor, accentColor]);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}