import { useEffect, useCallback } from 'react';

/**
 * Hook para aplicar el tema de la organización usando CSS Variables
 * 
 * @param {Object} organization - Objeto de organización con colores
 * @param {Object} organization.colors - Colores del tema
 * @param {string} organization.colors.primaryColor - Color principal
 * @param {string} organization.colors.secondaryColor - Color secundario
 * @param {string} organization.colors.textColorDark - Color de texto oscuro
 * @param {string} organization.colors.textColorLight - Color de texto claro
 * @param {string} organization.colors.hoverSurfaceColor - Color de hover
 * @param {string} organization.colors.mutedTextColor - Color de texto muted
 * 
 * @example
 * const organization = useSelector(state => state.organization[0]);
 * useOrganizationTheme(organization);
 */
export const useOrganizationTheme = (organization) => {
    
    /**
     * Aplica los colores de la organización a las variables CSS
     */
    const applyTheme = useCallback((colors) => {
        if (!colors) return;

        const root = document.documentElement;
        
        // Mapeo de propiedades de colors a variables CSS
        const cssVarMapping = {
            primaryColor: '--ifinditUi-primaryColor',
            secondaryColor: '--ifinditUi-secondaryColor',
            textColorDark: '--ifinditUi-textColorDark',
            textColorLight: '--ifinditUi-textColorLight',
            hoverSurfaceColor: '--ifinditUi-hoverSurfaceColor',
            mutedTextColor: '--ifinditUi-mutedTextColor',
            backgroundColor: '--ifinditUi-backgroundColor',
            surfaceColor: '--ifinditUi-surfaceColor',
            borderColor: '--ifinditUi-borderColor',
            dividerColor: '--ifinditUi-dividerColor',
            activeSurfaceColor: '--ifinditUi-activeSurfaceColor',
            selectedSurfaceColor: '--ifinditUi-selectedSurfaceColor',
            disabledTextColor: '--ifinditUi-disabledTextColor',
        };

        // Aplicar cada color que esté definido
        Object.entries(colors).forEach(([key, value]) => {
            const cssVar = cssVarMapping[key];
            if (cssVar && value) {
                root.style.setProperty(cssVar, value);
            }
        });

        // Log para debugging (solo en desarrollo)
        if (process.env.NODE_ENV === 'development') {
            console.log('🎨 Tema de organización aplicado:', colors);
        }
    }, []);

    /**
     * Resetea al tema por defecto
     */
    const resetTheme = useCallback(() => {
        const root = document.documentElement;
        
        const defaultTheme = {
            primaryColor: '#9f2323',
            secondaryColor: '#6c757d',
            textColorDark: '#292929',
            textColorLight: '#686363',
            hoverSurfaceColor: 'rgba(0, 0, 0, 0.02)',
            mutedTextColor: 'rgba(0, 0, 0, 0.54)',
        };

        Object.entries(defaultTheme).forEach(([key, value]) => {
            const cssVar = `--ifinditUi-${key}`;
            root.style.setProperty(cssVar, value);
        });
    }, []);

    /**
     * Guarda el tema en localStorage para persistencia
     */
    const saveThemeToStorage = useCallback((colors) => {
        try {
            localStorage.setItem('ifinditUi-orgTheme', JSON.stringify(colors));
        } catch (error) {
            console.error('Error guardando tema:', error);
        }
    }, []);

    /**
     * Carga el tema desde localStorage
     */
    const loadThemeFromStorage = useCallback(() => {
        try {
            const savedTheme = localStorage.getItem('ifinditUi-orgTheme');
            if (savedTheme) {
                const colors = JSON.parse(savedTheme);
                applyTheme(colors);
                return colors;
            }
        } catch (error) {
            console.error('Error cargando tema:', error);
        }
        return null;
    }, [applyTheme]);

    // Aplicar tema cuando cambie la organización
    useEffect(() => {
        if (organization?.colors) {
            applyTheme(organization.colors);
            saveThemeToStorage(organization.colors);
        } else {
            // Intentar cargar desde localStorage
            const savedTheme = loadThemeFromStorage();
            if (!savedTheme) {
                resetTheme();
            }
        }
    }, [organization, applyTheme, saveThemeToStorage, loadThemeFromStorage, resetTheme]);

    return {
        applyTheme,
        resetTheme,
        saveThemeToStorage,
        loadThemeFromStorage,
    };
};

export default useOrganizationTheme;

