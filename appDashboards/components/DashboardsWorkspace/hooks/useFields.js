import { useQuery } from '@tanstack/react-query';
import { dataSourceManagerGeneralRequest } from '@services/dataSourceManagerAPI';
export function resolveFieldType(field) {
  if (field?.type === 'dimension' || field?.type === 'measure') {
    return field.type;
  }
  return field?.is_dimension === true ? 'dimension' : 'measure';
}

/**
 * Hook para obtener los campos de una fuente de datos por ID
 * @param {string} dataSourceId - ID de la fuente de datos
 * @returns {Object} Objeto con data, isLoading, isError, error
 */
export const useFieldsByDataSourceId = (dataSourceId) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['fields', 'byDataSource', dataSourceId],
    queryFn: async () => {
      if (!dataSourceId) return [];
      
      try {
        const response = await dataSourceManagerGeneralRequest({
          version: 'v1',
          typeRequest: 'POST',
          nameUrl: 'fieldListByDataSource',
          dynamicParams: { data_source_id: dataSourceId },
        });
        
        // Manejar la estructura de respuesta: { msg, status, data: { results: [...] } }
        if (response?.status === 'success' || response?.status === 'ok') {
          // La respuesta puede venir en data.results o directo en data
          const results = response?.data?.results  || [];
          
          // Mapear los campos para agregar la propiedad 'type' basado en is_dimension e is_numeric
          const fields = results.map((field) => {
            if (field?.type === 'dimension' || field?.type === 'measure') {
              return field;
            }
            return {
              ...field,
              type: resolveFieldType(field),
            };
          });
          
          return fields;
        }
        
        // Si la respuesta indica error
        if (response?.status === 'error' || response?.status === 'err') {
          throw new Error(response?.msg || 'Error al obtener los campos');
        }
        
        return Array.isArray(response?.data) ? response.data : [];
      } catch (err) {
        console.error('Error en useFieldsByDataSourceId:', err);
        throw err;
      }
    },
    enabled: !!dataSourceId, // Solo ejecutar si hay un dataSourceId
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    retry: 1, // Reintentar 1 vez en caso de error
  });

  return {
    data: data || [],
    isLoading,
    isError,
    error: error?.message || error
  };
};

/**
 * Hook para obtener un campo por ID
 * @param {string} fieldId - ID del campo
 * @returns {Object} Objeto con data, isLoading, isError, error, notFound
 */
export const useFieldById = (fieldId) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['field', fieldId],
    queryFn: async () => {
      if (!fieldId) return null;
      
      try {
        const response = await dataSourceManagerGeneralRequest({
          version: 'v1',
          typeRequest: 'GET',
          nameUrl: 'fieldById',
          dynamicParams: { id: fieldId },
        });
        
        // Manejar la estructura de respuesta
        if (response?.status === 'success' || response?.status === 'ok') {
          return response?.data || null;
        }
        
        // Si la respuesta indica que no se encontró
        if (response?.status === 'error' || response?.status === 'err') {
          throw new Error(response?.msg || 'Campo no encontrado');
        }
        
        return response?.data || null;
      } catch (err) {
        console.error('Error en useFieldById:', err);
        throw err;
      }
    },
    enabled: !!fieldId, // Solo ejecutar si hay un ID
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    retry: 1, // Reintentar 1 vez en caso de error
  });

  const notFound = !isLoading && !isError && !data;

  return {
    data: data || null,
    isLoading,
    isError,
    error: error?.message || error,
    notFound
  };
};

export default useFieldsByDataSourceId;
