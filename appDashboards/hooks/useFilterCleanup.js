import { useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import { resetFilters } from '@redux/actions';

/**
 * Hook personalizado para manejar la limpieza automática de filtros
 * cuando se sale del dashboard o se navega a otra página
 */
export const useFilterCleanup = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const reportIdParam = router.query?.report_id;
  const reportId =
    typeof reportIdParam === "string"
      ? reportIdParam
      : Array.isArray(reportIdParam)
      ? reportIdParam[0]
      : null;
  const isReportMode = !!reportId;

  // Función helper para limpiar filtros de manera segura
  const clearFiltersSafely = useCallback(() => {
    try {
      if (isReportMode) return;
      dispatch(resetFilters());
    } catch (error) {
      console.error('Error al limpiar filtros:', error);
    }
  }, [dispatch, isReportMode]);

  // Efecto para limpiar filtros cuando el componente se desmonte
  useEffect(() => {
    return () => {
      clearFiltersSafely();
    };
  }, [clearFiltersSafely]);

  // Efecto para manejar la navegación y limpiar filtros
  useEffect(() => {
    const handleBeforeUnload = () => {
      clearFiltersSafely();
    };

    const handleRouteChange = () => {
      clearFiltersSafely();
    };

    // Limpiar filtros cuando se cierra la ventana o se navega
    window.addEventListener('beforeunload', handleBeforeUnload);
    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.events.off('routeChangeStart', handleRouteChange);
      clearFiltersSafely();
    };
  }, [clearFiltersSafely, router]);

  // Efecto para manejar el botón de retroceso
  useEffect(() => {
    const handlePopState = () => {
      clearFiltersSafely();
    };

    // Manejar el botón de retroceso del navegador
    window.addEventListener('popstate', handlePopState);


    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [clearFiltersSafely]);

  return {
    clearFiltersSafely
  };
}; 