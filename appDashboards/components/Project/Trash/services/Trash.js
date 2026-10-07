import { 
  getACLList,
  restoreProject,
  deleteProject,
  restoreFolder,
  deleteFolder
} from "@services/creangelAuthAPI";
import { dashboardGeneralRequest } from "@services/dashboardAPI";
import {
  IMAGE_ENTITY_TYPES,
  IMAGE_REFERENCE_PURPOSE,
  deletePreview,
  listPanelContentReferences,
  unlinkImage,
} from "@services/imageServerAPI";

// Función para obtener lista de productos en la papelera
export const getTrashProductsList = async (params, stateSetters) => {
  try {
    const { 
      elementsPerPage = 500, 
      offset = 0, 
      searchTerm = '', 
      sortField = 'created_at', 
      sortDirection = 'desc', 
      userToken, 
      types = ['panel', 'dashboard'],
      filtered_groups = [],
      showLoading = false 
    } = params;
    
    const {
      setIsLoadingList,
      setProductsList,
      setTotalProducts
    } = stateSetters;

    // Mostrar loading si es necesario
    if (showLoading && setIsLoadingList) {
      setIsLoadingList(true);
    }

    const requestData = {
      type: types,
      filtered_groups: filtered_groups,
      limit: elementsPerPage,
      offset: offset,
      q: searchTerm,
      order_by: sortDirection,
      order_field: sortField,
      filter: [
        { field: 'in_trash', value: true }
      ]
    };

    const response = await getACLList(requestData, {
      'Authorization': `Bearer ${userToken}`
    });

    // Si no hay datos, resetear states y ocultar loading
    if (!response?.data) {
      if (setProductsList) setProductsList([]);
      if (setTotalProducts) setTotalProducts(0);
      if (setIsLoadingList) setIsLoadingList(false);

      return {
        results: [],
        count: 0,
        offsetError: false
      };
    }

    const { results, count } = response.data;
    
    // Asegurar que results sea un array
    const safeResults = Array.isArray(results) ? results : [];
    const offsetError = offset > count && count > 0;

    // Si hay error de offset, resetear
    if (offsetError) {
      if (setIsLoadingList) setIsLoadingList(false);

      return {
        results: [],
        count,
        offsetError: true
      };
    }

    // Actualizar todos los states
    if (setProductsList) setProductsList(safeResults);
    if (setTotalProducts) setTotalProducts(count || 0);
    if (setIsLoadingList) setIsLoadingList(false);

    return {
      results: safeResults,
      count: count || 0,
      offsetError: false
    };

  } catch (error) {
    const { setIsLoadingList, setProductsList, setTotalProducts } = stateSetters;
    
    if (setProductsList) setProductsList([]);
    if (setTotalProducts) setTotalProducts(0);
    if (setIsLoadingList) setIsLoadingList(false);

    return {
      results: [],
      count: 0,
      error: error.message || 'Error al obtener productos de la papelera'
    };
  }
};

// Función para mover un proyecto a la papelera
export const moveAclToTrash = async (params, stateSetters, callbacks) => {
  const {
    userID,
    acl,
  } = params;

  const {
    setIsLoadingTrash,
    dispatch
  } = stateSetters;

  const {
    pushNotification,
    getAclList
  } = callbacks;

  const url = acl.type === 'dashboard' ? 'trashDashboard' : 'trashPanel';
  const dynamicParams = acl.type === 'dashboard' ? { dashboard_id: acl.id } : { panel_id: acl.id };

  setIsLoadingTrash(true);
  try {
    const response = await dashboardGeneralRequest({
      version: 'v1',
      typeRequest: 'PUT',
      nameUrl: url,
      headers: {
        'Authorization': `Bearer ${userID}`
      },
      dynamicParams: dynamicParams
    });

    if (response && response.status === "success") {
      if (setIsLoadingTrash) setIsLoadingTrash(false);
      if (pushNotification) pushNotification({ msg: "Proyecto movido a la papelera exitosamente", status: "ok" });
      if (getAclList) await getAclList();

      if (dispatch) dispatch(pushNotification({ msg: "Proyecto movido a la papelera exitosamente", status: "ok" }));
      return true;
    }
  } catch (error) {
    if (setIsLoadingTrash) setIsLoadingTrash(false);
    if (dispatch) dispatch(pushNotification({ msg: "Ocurrió un error al momento de mover el proyecto a la papelera", status: "err" }));
    return false;
  }
};

// Función para restaurar un producto desde la papelera
export const restoreProductFromTrash = async (params, stateSetters, callbacks) => {
  const {
    userID,
    product,
  } = params;

  const {
    setIsLoadingRestore,
    dispatch,
  } = stateSetters;

  const {
    pushNotification,
  } = callbacks;

  if (setIsLoadingRestore) setIsLoadingRestore(true);

  try {
    let response;
    const productType = product.acl_object_type || product.type;

    // Determinar qué función usar según el tipo de producto
    if (productType === 'project') {
      response = await restoreProject({}, {
        'Authorization': `Bearer ${userID}`
      }, product.id);
    } else if (productType === 'folder') {
      response = await restoreFolder(product.id, {
        'Authorization': `Bearer ${userID}`
      });
    } else {
      // Para dashboards y panels, usar dashboardGeneralRequest
      const url = productType === 'dashboard' ? 'restoreDashboard' : 'restorePanel';
      const dynamicParams = productType === 'dashboard' ? { dashboard_id: product.id } : { panel_id: product.id };
            
      response = await dashboardGeneralRequest({
        version: 'v1',
        typeRequest: 'POST',  // POST para restaurar
        nameUrl: url,
        headers: {
          'Authorization': `Bearer ${userID}`
        },
        dynamicParams: dynamicParams
      });
    }

    if (response && response.status === "success") {
      if (setIsLoadingRestore) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsLoadingRestore(false);
      }
      if (pushNotification) pushNotification({ msg: "Producto restaurado exitosamente", status: "ok" });

      if (dispatch) dispatch(pushNotification({ msg: "Producto restaurado exitosamente", status: "ok" }));
      return true;
    } else {
      if (setIsLoadingRestore) setIsLoadingRestore(false);
      if (dispatch) dispatch(pushNotification({ msg: "No se pudo restaurar el producto", status: "err" }));
      return false;
    }
  } catch (error) {
    if (setIsLoadingRestore) setIsLoadingRestore(false);
    if (dispatch) dispatch(pushNotification({ msg: "Ocurrió un error al momento de restaurar el producto", status: "err" }));
    return false;
  }
};

// Función para eliminar permanentemente un producto de la papelera
export const deleteProductPermanently = async (params, stateSetters, callbacks) => {
  const {
    userID,
    product,
  } = params;

  const {
    setIsLoadingDelete,
    dispatch,
  } = stateSetters;

  const {
    pushNotification,
  } = callbacks;

  if (setIsLoadingDelete) setIsLoadingDelete(true);

  try {
    let response;
    const productType = product.acl_object_type || product.type;

    // Determinar qué función usar según el tipo de producto
    if (productType === 'project') {
      response = await deleteProject(product.id, {
        'Authorization': `Bearer ${userID}`
      });
    } else if (productType === 'folder') {
      response = await deleteFolder(product.id, {
        'Authorization': `Bearer ${userID}`
      });
    } else {
      // Para dashboards y panels, usar dashboardGeneralRequest
      const url = productType === 'dashboard' ? 'deleteDashboard' : 'deletePanel';
      const dynamicParams = productType === 'dashboard' ? { dashboard_id: product.id } : { panel_id: product.id };
      
      
      response = await dashboardGeneralRequest({
        version: 'v1',
        typeRequest: 'DELETE',  // DELETE en endpoint base para eliminar permanentemente (hard delete)
        nameUrl: url,
        headers: {
          'Authorization': `Bearer ${userID}`
        },
        dynamicParams: dynamicParams
      });
    }

    if (response && response.status === "success") {
      if (productType === "panel" || productType === "dashboard") {
        try {
          await deletePreview({
            entityType: productType,
            entityId: product.id,
            token: userID,
          });
        } catch (previewError) {
          console.error(
            `No se pudo eliminar la preview del ${productType} ${product.id}:`,
            previewError
          );
        }
      }
      if (productType === "panel") {
        try {
          const references = await listPanelContentReferences({
            entityId: product.id,
            token: userID,
          });
          const contentReference = references?.find(
            (reference) =>
              reference.purpose === IMAGE_REFERENCE_PURPOSE.CONTENT,
          );
          if (contentReference?.image_id) {
            await unlinkImage({
              imageId: contentReference.image_id,
              entityType: IMAGE_ENTITY_TYPES.PANEL,
              entityId: product.id,
              purpose: IMAGE_REFERENCE_PURPOSE.CONTENT,
              token: userID,
            });
          }
        } catch (contentError) {
          console.error(
            `No se pudo desvincular la imagen de contenido del panel ${product.id}:`,
            contentError,
          );
        }
      }

      if (setIsLoadingDelete) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsLoadingDelete(false);
      }
      if (pushNotification) pushNotification({ msg: "Producto eliminado permanentemente", status: "ok" });

      if (dispatch) dispatch(pushNotification({ msg: "Producto eliminado permanentemente", status: "ok" }));
      return true;
    } else {
      if (setIsLoadingDelete) setIsLoadingDelete(false);
      if (dispatch) dispatch(pushNotification({ msg: "No se pudo eliminar el producto permanentemente", status: "err" }));
      return false;
    }
  } catch (error) {
    if (setIsLoadingDelete) setIsLoadingDelete(false);
    if (dispatch) dispatch(pushNotification({ msg: "Ocurrió un error al momento de eliminar el producto", status: "err" }));
    return false;
  }
};
