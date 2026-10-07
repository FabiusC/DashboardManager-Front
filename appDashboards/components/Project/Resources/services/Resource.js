import { handleList } from "@helpers/dashboardAPI/genericRequest";
import { dashboardGeneralRequest } from "@services/dashboardAPI";
import { getAclById } from '@services/creangelAuthAPI';

export const handleResourceTrash = async (params, stateSetters, callbacks) => {

    const {
        userID,
        resource,
    } = params;

    const {
        setIsLoadingTrash,
        dispatch
    } = stateSetters;

    const {
        pushNotification,
        getResourceList
    } = callbacks;

    // Determinar si es panel o dashboard
    const isPanel = resource.acl_object_type === 'panel' || resource.type === 'panel';
    const url = isPanel ? 'trashPanel' : 'trashDashboard';
    const dynamicParams = isPanel ? { panel_id: resource.id } : { dashboard_id: resource.id };
    
    
    if (setIsLoadingTrash) setIsLoadingTrash(true);
    
    try {
        const response = await dashboardGeneralRequest({
            version: 'v1',
            typeRequest: 'DELETE',  // DELETE en /trash para mover a papelera (soft delete)
            nameUrl: url,
            headers: {
                'Authorization': `Bearer ${userID}`
            },
            dynamicParams: dynamicParams
        });

        if (response && response.status === "success") {
            if (setIsLoadingTrash) setIsLoadingTrash(false);
            if (pushNotification) pushNotification({ msg: "Recurso movido a la papelera exitosamente", status: "ok" });
            if (getResourceList) await getResourceList();

            if (dispatch) dispatch(pushNotification({ msg: "Recurso movido a la papelera exitosamente", status: "ok" }));
            return { success: true };
        } else {
            // Verificar si es un error de asociación
            const errorMsg = response?.msg || response?.message || '';
            
            // Verificar si hay dashboards asociados en la respuesta (puede estar en response.data o directamente en response)
            const associatedDashboards = response?.data?.associated_dashboards || response?.associated_dashboards;
            
            if (associatedDashboards && Array.isArray(associatedDashboards) && associatedDashboards.length > 0) {
                // Error de asociación con dashboards
                if (setIsLoadingTrash) setIsLoadingTrash(false);
                return { 
                    success: false, 
                    isAssociated: true,
                    associatedDashboards: associatedDashboards,
                    message: errorMsg
                };
            }
            
            if (setIsLoadingTrash) setIsLoadingTrash(false);
            if (dispatch) dispatch(pushNotification({ msg: errorMsg || "No se pudo mover el recurso a la papelera", status: "err" }));
            return { success: false };
        }
    } catch (error) {
        
        // Verificar si el error contiene información de asociación
        const errorData = error?.response?.data;
        const errorMsg = errorData?.msg || errorData?.message || error?.message || '';
        if (setIsLoadingTrash) setIsLoadingTrash(false);
        
        // Verificar si hay dashboards asociados en la respuesta de error (error 400)
        const associatedDashboards = errorData?.associated_dashboards;
        
        if (associatedDashboards && Array.isArray(associatedDashboards) && associatedDashboards.length > 0) {
            // Error de asociación con dashboards
            return { 
                success: false, 
                isAssociated: true,
                associatedDashboards: associatedDashboards,
                message: errorMsg
            };
        }
        
        if (dispatch) dispatch(pushNotification({ msg: errorMsg || "Ocurrió un error al momento de mover el recurso a la papelera", status: "err" }));
        return { success: false };
    }
}

// Función para obtener detalles completos de un recurso usando ACL (incluye permisos completos)
export const getResourceDetailedData = async (params, stateSetters) => {
  try {
    const { resourceId, userToken } = params;
    const {
      setIsLoadingResourceDetails,
      setResourceDetailedData
    } = stateSetters;

    if (!resourceId) {
      return {
        success: false,
        error: "resourceId es requerido"
      };
    }

    if (setIsLoadingResourceDetails) {
      setIsLoadingResourceDetails(true);
    }

    const response = await getAclById(resourceId, {
      'Authorization': `Bearer ${userToken}`
    });

    if (response && response.status === "success" && response.data) {
      if (setResourceDetailedData) {
        setResourceDetailedData(response.data);
      }
      
      if (setIsLoadingResourceDetails) {
        setIsLoadingResourceDetails(false);
      }

      return {
        success: true,
        data: response.data
      };
    } else {
      console.error('Error al obtener detalles del recurso:', response);
      
      if (setResourceDetailedData) {
        setResourceDetailedData(null);
      }
      
      if (setIsLoadingResourceDetails) {
        setIsLoadingResourceDetails(false);
      }

      return {
        success: false,
        error: response?.msg || "No se pudieron obtener los detalles del recurso"
      };
    }

  } catch (error) {
    console.error('Error en getResourceDetailedData:', error);

    const { setIsLoadingResourceDetails, setResourceDetailedData } = stateSetters;
    
    if (setResourceDetailedData) {
      setResourceDetailedData(null);
    }
    
    if (setIsLoadingResourceDetails) {
      setIsLoadingResourceDetails(false);
    }

    return {
      success: false,
      error: error.message || 'Error desconocido al obtener detalles del recurso'
    };
  }
};