import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { setAppId, clearAppId } from '../redux/actions';

/**
 * Hook para acceder y manipular el app_id desde cualquier componente
 * 
 * @returns {Object} - Objeto con appId y funciones para manipularlo
 * @returns {string|null} appId - El app_id actual guardado en Redux
 * @returns {Function} updateAppId - Función para actualizar el app_id
 * @returns {Function} removeAppId - Función para limpiar el app_id
 * 
 * @example
 * const { appId, updateAppId, removeAppId } = useAppId();
 * 
 * // Usar el app_id
 * console.log('Current app_id:', appId);
 * 
 * // Actualizar el app_id
 * updateAppId('new-app-123');
 * 
 * // Limpiar el app_id
 * removeAppId();
 */
export const useAppId = () => {
    const dispatch = useDispatch();
    const appId = useSelector((state) => state.app?.id || null);

    /**
     * Actualiza el app_id en Redux
     * @param {string} newAppId - Nuevo app_id a guardar
     */
    const updateAppId = useCallback((newAppId) => {
        if (newAppId) {
            dispatch(setAppId(newAppId));
        }
    }, [dispatch]);

    /**
     * Limpia el app_id de Redux
     */
    const removeAppId = useCallback(() => {
        dispatch(clearAppId());
    }, [dispatch]);

    return {
        appId,
        updateAppId,
        removeAppId,
    };
};

export default useAppId;

