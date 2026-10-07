import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import useOrganizationTheme from '../../hooks/useOrganizationTheme';

/**
 * ThemeProvider - Componente que aplica el tema de la organización
 * 
 * Este componente debe estar cerca del root de la aplicación para que
 * aplique los colores de la organización en toda la interfaz.
 * 
 * @example
 * // En tu Main.js o layout principal
 * function Main({ children }) {
 *   return (
 *     <>
 *       <ThemeProvider />
 *       {children}
 *     </>
 *   );
 * }
 */
const ThemeProvider = () => {
    const organization = useSelector(state => state.organization?.[0]);
    
    // Usar el hook para aplicar el tema
    useOrganizationTheme(organization);
    
    // Este componente no renderiza nada visible
    return null;
};

export default ThemeProvider;

/**
 * Hook alternativo si prefieres usarlo directamente en tu componente
 * 
 * @example
 * function MyComponent() {
 *   const organization = useSelector(state => state.organization[0]);
 *   const { applyTheme, resetTheme } = useOrganizationTheme(organization);
 *   
 *   // Aplicar tema personalizado
 *   const handleCustomTheme = () => {
 *     applyTheme({
 *       primaryColor: '#1976d2',
 *       secondaryColor: '#424242'
 *     });
 *   };
 *   
 *   return <div>...</div>;
 * }
 */

