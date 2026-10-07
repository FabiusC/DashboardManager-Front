import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataSourceManagerGeneralRequest } from '@services/dataSourceManagerAPI';

const EMPTY_ARRAY = [];

/**
 * Hook para listar todas las fuentes de datos desde la API
 * @returns {Object} Objeto con data, results, count, isLoading, isError, error, isEmpty
 */
export const useDataSourcesList = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dataSources', 'list'],
    queryFn: async () => {
      try {
        const response = await dataSourceManagerGeneralRequest({
          version: 'v1',
          typeRequest: 'POST',
          nameUrl: 'dataSourceList',
          body: { limit: 100,
                 order: 'desc',
                 order_by:'alias'
          },
        });
        
        // Manejar la estructura de respuesta: { msg, status, data: { results: [], count: 0 } }
        if (response?.status === 'success' || response?.status === 'ok') {
          const results = response?.data?.results || [];
          const count = response?.data?.count || 0;
          return {
            results,
            count,
            hasData: count > 0 && results.length > 0
          };
        }
        
        // Si la respuesta no es exitosa
        throw new Error(response?.msg || 'Error al obtener las fuentes de datos');
      } catch (err) {
        console.error('Error en useDataSourcesList:', err);
        throw err;
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    retry: 2, // Reintentar 2 veces en caso de error
  });

  const results = useMemo(() => data?.results || EMPTY_ARRAY, [data?.results]);
  const count = data?.count || 0;
  const isEmpty = !isLoading && !isError && (count === 0 || results.length === 0);

  return {
    data: results,
    results,
    count,
    isEmpty,
    isLoading,
    isError,
    error: error?.message || error,
    hasData: data?.hasData || false
  };
};

/**
 * Hook para obtener una fuente de datos por ID desde la API
 * @param {string} id - ID de la fuente de datos
 * @returns {Object} Objeto con data, isLoading, isError, error, notFound
 */
export const useDataSourceById = (id) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dataSource', id],
    queryFn: async () => {
      if (!id) return null;
      
      try {
        const response = await dataSourceManagerGeneralRequest({
          version: 'v1',
          typeRequest: 'GET',
          nameUrl: 'dataSourceById',
          dynamicParams: { id },
        });
        
        // Manejar la estructura de respuesta
        if (response?.status === 'success' || response?.status === 'ok') {
          if (!response?.data) {
            throw new Error('La fuente de datos aún no está lista'); 
          }
          return response?.data;
        }
        
        if (response?.status === 'error' || response?.status === 'err') {
          throw new Error(response?.msg || 'Fuente de datos no encontrada');
        }
        
        return response?.data || null;
      } catch (err) {
        console.error('Error en useDataSourceById:', err);
        throw err;
      }
    },
    enabled: !!id, 
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 3,
    retryDelay: 1000, 
  });

  const notFound = !!id && !isLoading && !isError && !data;

  return {
    data: data || null,
    isLoading,
    isError,
    error: error?.message || error,
    notFound
  };
};

export default useDataSourcesList;