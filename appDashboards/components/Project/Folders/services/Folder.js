import { 
  getACLList, 
  getFolders, 
  getUserInfo, 
  createFolder as createFolderAPI, 
  getFolder, 
  editFolder as editFolderAPI,
  trashFolder as trashFolderAPI,
  restoreFolder as restoreFolderAPI,
  deleteFolder as deleteFolderAPI,
  getAclById,
  updateACLPermissions
} from '@services/creangelAuthAPI';
import { getModifiedFields } from '@components/Utils/compareFormChanges';
import { validatorAPIBasicParameters } from '@source/validators';
import { validateExpirationTime } from '@source/recursiveSecurity';
import { ErrorMessage } from 'formik';

// Función para obtener lista de carpetas
export const getFolderList = async (params, stateSetters) => {
  try {
    const {
      foldersPerPage,
      offset,
      searchValue,
      sortField,
      sortDirection,
      userToken,
      projectId,
      showLoading = false
    } = params;

    const {
      setIsLoadingList,
      setFolders
    } = stateSetters;

    // Mostrar loading si es necesario
    if (showLoading && setIsLoadingList) {
      setIsLoadingList(true);
    }

    const data = {
      limit: foldersPerPage,
      offset: offset,
      q: searchValue,
      order_field: sortField,
      order_by: sortDirection,
      project_id: projectId,
      filter: [
        { field: 'in_trash', value: false }
      ]
    };

    const response = await getFolders(data, {
      'Authorization': `Bearer ${userToken}`
    });

    // Si no hay datos, resetear states y ocultar loading
    if (!response?.data) {
      if (setFolders) setFolders([]);
      if (setIsLoadingList) setIsLoadingList(false);

      return {
        results: [],
        count: 0,
        error: 'No se pudieron obtener las carpetas'
      };
    }

    const { results } = response.data;

    // Actualizar states
    if (setFolders) setFolders(results || []);
    if (setIsLoadingList) setIsLoadingList(false);

    return {
      results: results || [],
      count: results?.length || 0,
      error: null
    };

  } catch (error) {
    console.error('Error en getFolderList:', error);

    // En caso de error, resetear states
    const { setIsLoadingList, setFolders } = stateSetters;
    if (setFolders) setFolders([]);
    if (setIsLoadingList) setIsLoadingList(false);

    return {
      results: [],
      count: 0,
      error: error.message || 'Error desconocido'
    };
  }
};

// Función para actualizar permisos ACL en carpetas
export const updatePermissionsACL = async (params, callbacks) => {
  try {
    const { 
      viewPermissionChanged, 
      editPermissionChanged, 
      newViewPermissionId, 
      newEditPermissionId,
      folderId,
      userToken,
    } = params;
    const { dispatch, pushNotification } = callbacks;

    const permissionUpdates = [];

    // Si cambió el permiso de visualización
    if (viewPermissionChanged && newViewPermissionId) {
      permissionUpdates.push({
        type: 'view',
        aclId: folderId, // Usar el ID de la carpeta como ACL ID
        data: {
          new_role_id: newViewPermissionId, // Usar new_role_id según EditPermissions schema
          view_or_edit: 'view',
        }
      });
    }

    // Si cambió el permiso de edición
    if (editPermissionChanged && newEditPermissionId) {
      permissionUpdates.push({
        type: 'edit',
        aclId: folderId, // Usar el ID de la carpeta como ACL ID
        data: {
          new_role_id: newEditPermissionId, // Usar new_role_id según EditPermissions schema
          view_or_edit: 'edit',
        }
      });
    }

    // Ejecutar las actualizaciones de permisos
    const results = [];
    for (const update of permissionUpdates) {
      try {
        const response = await updateACLPermissions(
          update.data,
          { 'Authorization': `Bearer ${userToken}` },
          update.aclId
        );

        
        if (response && (response.status === 'success' || response.status === 'ok')) {
          results.push({
            type: update.type,
            success: true,
            data: response
          });
        } else {
          results.push({
            type: update.type,
            success: false,
            error: response?.msg || response?.message || 'Error al actualizar permiso'
          });
          
          if (dispatch && pushNotification) {
            dispatch(pushNotification({
              msg: `Error al actualizar permiso de ${update.type === 'view' ? 'visualización' : 'edición'} de la carpeta`,
              status: 'err'
            }));
          }
        }
      } catch (error) {
        console.error(`Error al actualizar permiso de ${update.type}:`, error);
        results.push({
          type: update.type,
          success: false,
          error: error.message || 'Error desconocido'
        });
        
        if (dispatch && pushNotification) {
          dispatch(pushNotification({
            msg: `Error al actualizar permiso de ${update.type === 'view' ? 'visualización' : 'edición'} de la carpeta`,
            status: 'err'
          }));
        }
      }
    }

    const allSuccessful = results.every(r => r.success);
    
    return {
      success: allSuccessful,
      results,
      permissionsUpdated: results.length > 0
    };

  } catch (error) {
    console.error('Error en updatePermissionsACL:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al actualizar permisos',
      permissionsUpdated: false
    };
  }
};

// Función de validación específica para edición de carpetas
export const validateEditFolderData = (folderData) => {
  let notif2return = {};

  if (folderData.name && folderData.name.trim() === "") {
    notif2return = {
      message: "El nombre de la carpeta no puede estar vacío.",
      status: false,
      openNotification: true,
    };
  } else if (folderData.name && folderData.name.length < 3) {
    notif2return = {
      message: "El nombre de la carpeta debe contener al menos 3 caracteres.",
      status: false,
      openNotification: true,
    };
  } else if (folderData.name && folderData.name.length > 255) {
    notif2return = {
      message: "El nombre de la carpeta no puede contener más de 255 caracteres.",
      status: false,
      openNotification: true,
    };
  } else if (folderData.description && folderData.description.length > 1000) {
    notif2return = {
      message: "La descripción de la carpeta no puede contener más de 1000 caracteres.",
      status: false,
      openNotification: true,
    };
  } else {
    notif2return = {
      message: "La carpeta ha sido editada exitosamente.",
      status: true,
      openNotification: false,
    };
  }

  return notif2return;
};

// Función para editar carpeta
export const editFolder = async (params, stateSetters, callbacks) => {
  try {
    const { editFolderData, folderForm, userToken } = params;
    const {
      setIsLoadingData,
      dispatch
    } = stateSetters;
    const {
      setEditingId,
      handleFolder,
      pushNotification
    } = callbacks;

    if (setIsLoadingData) setIsLoadingData(true);

    // Preparar datos del formulario
    // Extraer los role IDs de los permisos para comparación (necesitamos rol.id, no permission.id)
    // Intentar obtener view_role_id desde diferentes fuentes
    if (!editFolderData.view_role_id) {
      if (editFolderData.view_permission?.rol?.id) {
        editFolderData.view_role_id = editFolderData.view_permission.rol.id;
      } else if (editFolderData.view_role?.id) {
        editFolderData.view_role_id = editFolderData.view_role.id;
      } else if (editFolderData.view_permission_id) {
        // Si ya tenemos view_permission_id, usarlo como fallback
        editFolderData.view_role_id = editFolderData.view_permission_id;
      }
    }

    // Intentar obtener edit_role_id desde diferentes fuentes
    if (!editFolderData.edit_role_id) {
      if (editFolderData.edit_permission?.rol?.id) {
        editFolderData.edit_role_id = editFolderData.edit_permission.rol.id;
      } else if (editFolderData.edit_role?.id) {
        editFolderData.edit_role_id = editFolderData.edit_role.id;
      } else if (editFolderData.edit_permission_id) {
        // Si ya tenemos edit_permission_id, usarlo como fallback
        editFolderData.edit_role_id = editFolderData.edit_permission_id;
      }
    }

    // Mapear los valores del formulario a view_role_id y edit_role_id para comparación
    // El formulario usa view_permission_id y edit_permission_id, pero contienen role IDs
    const formViewRoleId = folderForm?.view_permission_id || folderForm?.view_role_id;
    const formEditRoleId = folderForm?.edit_permission_id || folderForm?.edit_role_id;

    // Campos a verificar para cambios (excluyendo permisos, los manejamos por separado)
    const FIELDS_TO_CHECK = ['name', 'description', 'color', 'tags'];
    const { hasChanges, changedFields } = getModifiedFields(editFolderData, folderForm, FIELDS_TO_CHECK);
    
    // Verificar si cambiaron los permisos comparando role IDs
    const viewPermissionChanged = formViewRoleId && editFolderData.view_role_id !== formViewRoleId;
    const editPermissionChanged = formEditRoleId && editFolderData.edit_role_id !== formEditRoleId;
    const hasPermissionChanges = viewPermissionChanged || editPermissionChanged;
    
    // Si hay cambios en permisos o en otros campos, proceder
    if (hasChanges || hasPermissionChanges) {


      // Si hay cambios en permisos, actualizar ACL primero
      if (hasPermissionChanges) {
        
        const aclParams = {
          viewPermissionChanged,
          editPermissionChanged,
          newViewPermissionId: formViewRoleId,
          newEditPermissionId: formEditRoleId,
          folderId: editFolderData.id, // Usar el ID de la carpeta como ACL ID
          userToken,
        };

        const aclCallbacks = {
          dispatch,
          pushNotification
        };

        const aclResult = await updatePermissionsACL(aclParams, aclCallbacks);

        if (!aclResult.success) {
          if (setIsLoadingData) setIsLoadingData(false);
          if (dispatch && pushNotification) {
            dispatch(pushNotification({
              msg: "Error al actualizar los permisos de la carpeta",
              status: "err"
            }));
          }
          return {
            success: false,
            error: "Error al actualizar permisos ACL",
            aclResult
          };
        }
      }

      // Preparar campos para actualizar la carpeta (excluyendo permisos si ya se actualizaron vía ACL)
      const requestBody = { ...changedFields };
      
      // Si actualizamos permisos vía ACL, no los incluimos en la actualización de la carpeta
      if (hasPermissionChanges) {
        delete requestBody.view_permission_id;
        delete requestBody.edit_permission_id;
      }

      // Si después de excluir permisos no hay más cambios, solo devolver éxito
      if (Object.keys(requestBody).length === 0) {
        if (setIsLoadingData) setIsLoadingData(false);
        if (setEditingId) setEditingId(null);
        if (handleFolder) handleFolder();
        
        if (dispatch && pushNotification) {
          dispatch(pushNotification({
            msg: "Carpeta actualizada exitosamente",
            status: "ok"
          }));
        }

        return {
          success: true,
          permissionsOnly: true
        };
      }

      // Validar los datos usando la función de validación específica para edición
      const validationResult = validateEditFolderData(requestBody);

      if (validationResult.status) {
        // Llamar al servicio de edición (el ID se pasa en la URL, no en el payload)
        const response = await editFolderAPI(requestBody, {
          'Authorization': `Bearer ${userToken}`
        }, editFolderData.id);

        if (response && response.status === "success") {
          if (setIsLoadingData) setIsLoadingData(false);
          if (setEditingId) setEditingId(null);
          if (handleFolder) handleFolder();

          if (dispatch && pushNotification) {
            dispatch(pushNotification({
              msg: "La carpeta ha sido editada exitosamente.",
              status: "ok"
            }));
          }

          return {
            success: true,
            data: response.data
          };
        } else {
          if (setIsLoadingData) setIsLoadingData(false);

          const errorMsg = response?.msg || "Error al actualizar la carpeta";
          if (dispatch && pushNotification) {
            dispatch(pushNotification({
              msg: errorMsg,
              status: "err"
            }));
          }

          return {
            success: false,
            error: errorMsg
          };
        }
      } else {
        if (setIsLoadingData) setIsLoadingData(false);
        if (dispatch && pushNotification) {
          dispatch(pushNotification({
            msg: validationResult.message,
            status: "err"
          }));
        }

        return {
          success: false,
          validation: validationResult
        };
      }
    } else {
      if (setIsLoadingData) setIsLoadingData(false);
      if (setEditingId) setEditingId(null);
      if (dispatch && pushNotification) {
        dispatch(pushNotification({
          msg: "No hay cambios para guardar",
          status: "warn"
        }));
      }

      return {
        success: true,
        noChanges: true
      };
    }

  } catch (error) {
    console.error('Error en editFolder:', error);

    const { setIsLoadingData, dispatch } = stateSetters;
    const { pushNotification } = callbacks;

    if (setIsLoadingData) setIsLoadingData(false);
    if (dispatch && pushNotification) {
      dispatch(pushNotification({
        msg: "Error inesperado al editar la carpeta. Inténtalo de nuevo.",
        status: "err"
      }));
    }

    return {
      success: false,
      error: error.message || 'Error desconocido'
    };
  }
};

// Función para manejar navegación de carpetas
export const handleCardClick = (folderId, folderName, router) => {
  try {
    sessionStorage.setItem('folderId', folderId);
    sessionStorage.setItem('folderName', folderName);
    router.push(`/projects/folders/resources`);

    return {
      success: true
    };
  } catch (error) {
    console.error('Error en handleCardClick:', error);

    return {
      success: false,
      error: error.message || 'Error de navegación'
    };
  }
};

// Validación de datos de carpeta
export const validateFolderData = (folderData) => {
  let errors = {};
  let isValid = true;

  // Validar nombre
  if (!folderData.name || folderData.name.trim() === "") {
    errors.name = "El nombre de la carpeta no puede estar vacío.";
    isValid = false;
  } else if (folderData.name.length < 3) {
    errors.name = "El nombre de la carpeta debe contener al menos 3 caracteres.";
    isValid = false;
  } else if (folderData.name.length > 500) {
    errors.name = "El nombre de la carpeta no puede contener más de 500 caracteres.";
    isValid = false;
  }

  // Validar descripción
  if (!folderData.description || folderData.description.trim() === "") {
    errors.description = "La descripción de la carpeta no puede estar vacía.";
    isValid = false;
  } else {
    const threeWords = folderData.description.trim().split(/\s+/).length >= 3;
    if (!threeWords) {
      errors.description = "La descripción de la carpeta debe contener al menos 3 palabras.";
      isValid = false;
    } else if (folderData.description.length > 10000) {
      errors.description = "La descripción de la carpeta no puede contener más de 10000 caracteres.";
      isValid = false;
    }
  }

  // Validar permisos de visualización (usando view_role_id)
  if (folderData.hasOwnProperty('view_role_id') && (!folderData.view_role_id || folderData.view_role_id.toString().trim() === "")) {
    errors.view_role_id = "Debe seleccionar un nivel de visualización.";
    isValid = false;
  }

  // Validar permisos de edición (usando edit_role_id)
  if (folderData.hasOwnProperty('edit_role_id') && (!folderData.edit_role_id || folderData.edit_role_id.toString().trim() === "")) {
    errors.edit_role_id = "Debe seleccionar un nivel de edición.";
    isValid = false;
  }

  if (!folderData.group_id || folderData.group_id.trim() === "") {
    errors.group_id = "Debe seleccionar un grupo.";
    isValid = false;
  }

  if (!folderData.application_id || folderData.application_id.trim() === "") {
    errors.application_id = "El ID de la aplicación es requerido.";
    isValid = false;
  }

  return { isValid, errors };
};

export const createFolder = async (params, stateSetters, callbacks) => {
  try {
    const { formData, userToken } = params;
    const {
      setIsLoadingData,
      setFormError,
      setValidationErrors
    } = stateSetters;
    const { handleFolder, setIsCreateModal, handleCleanForm, dispatch, pushNotification } = callbacks;

    if (setIsLoadingData) setIsLoadingData(true);
    if (setFormError) setFormError("");

    const requestBody = formData;
    if (requestBody.tags == "" || requestBody.tags == null || requestBody.tags == undefined) {
      requestBody.tags = [];
    }
    const validation = validateFolderData(requestBody);

    if (validation.isValid) {
      const response = await createFolderAPI(requestBody, {
        'Authorization': `Bearer ${userToken}`
      });
      if (response && response.status != "error" && response.status != "err") {
        if (setIsLoadingData) setIsLoadingData(false);
        if (handleFolder) handleFolder();
        if (setIsCreateModal) setIsCreateModal(false);
        if (handleCleanForm) handleCleanForm();

        return {
          success: true,
          data: response
        };
      } else {
        if (setIsLoadingData) setIsLoadingData(false);
        

        if (response.msg.includes("with this name already exists in your organization")) {
          setFormError("El nombre de la carpeta ya existe en la organización. La carpeta con el nombre ingresado puede estar activa o en la papelera.");
        } else {
          if (setFormError) setFormError("Error al crear la carpeta. Inténtalo de nuevo.");
        }

        return {
          success: false,
          error: "Error al crear la carpeta"
        };
      }
    } else {
      if (setValidationErrors) setValidationErrors(validation.errors);
      if (setIsLoadingData) setIsLoadingData(false);

      if (dispatch && pushNotification) {
        dispatch(pushNotification({
          msg: validation.errors,
          status: "err"
        }));
      }

      return {
        success: false,
        errors: validation.errors,
        type: 'validation'
      };
    }
  } catch (error) {
    console.error('Error en createFolder:', error);
    const { setIsLoadingData, setFormError } = stateSetters;

    if (setIsLoadingData) setIsLoadingData(false);
    if (setFormError) setFormError("Error inesperado al crear la carpeta.");

    if (dispatch && pushNotification) {
      dispatch(pushNotification({
        msg: error.message || "Error inesperado al crear la carpeta.",
        status: "err"
      }));
    }

    return {
      success: false,
      error: error.message || "Error inesperado"
    };
  }
};

// Función para obtener carpeta por ID
export const getFolderById = async (params, stateSetters) => {
  try {
    const { folderId, userToken } = params;
    const {
      setIsLoadingData,
      setFolderData,
      setFormError
    } = stateSetters;

    if (setIsLoadingData) setIsLoadingData(true);
    if (setFormError) setFormError("");

    const response = await getFolder(folderId, {
      'Authorization': `Bearer ${userToken}`
    });

    if (response && response.status === "success" && response.data) {
      if (setFolderData) setFolderData(response.data);
      if (setIsLoadingData) setIsLoadingData(false);

      return {
        success: true,
        data: response.data
      };
    } else {
      if (setIsLoadingData) setIsLoadingData(false);
      if (setFormError) setFormError("Error al cargar los datos de la carpeta.");

      return {
        success: false,
        error: response?.msg || "Error al obtener la carpeta"
      };
    }

  } catch (error) {
    console.error('Error en getFolderById:', error);

    const { setIsLoadingData, setFormError } = stateSetters;
    if (setIsLoadingData) setIsLoadingData(false);
    if (setFormError) setFormError("Error inesperado al cargar la carpeta.");

    return {
      success: false,
      error: error.message || 'Error desconocido'
    };
  }
};

// Función para obtener detalles completos de una carpeta usando ACL (incluye permisos completos)
export const getFolderDetailedData = async (params, stateSetters) => {
  try {
    const { folderId, userToken } = params;
    const {
      setIsLoadingFolderDetails,
      setFolderDetailedData
    } = stateSetters;

    if (!folderId) {
      return {
        success: false,
        error: "folderId es requerido"
      };
    }

    if (setIsLoadingFolderDetails) {
      setIsLoadingFolderDetails(true);
    }

    const response = await getAclById(folderId, {
      'Authorization': `Bearer ${userToken}`
    });

    if (response && response.status === "success" && response.data) {
      if (setFolderDetailedData) {
        setFolderDetailedData(response.data);
      }
      
      if (setIsLoadingFolderDetails) {
        setIsLoadingFolderDetails(false);
      }

      return {
        success: true,
        data: response.data
      };
    } else {
      console.error('Error al obtener detalles de la carpeta:', response);
      
      if (setFolderDetailedData) {
        setFolderDetailedData(null);
      }
      
      if (setIsLoadingFolderDetails) {
        setIsLoadingFolderDetails(false);
      }

      return {
        success: false,
        error: response?.msg || "No se pudieron obtener los detalles de la carpeta"
      };
    }

  } catch (error) {
    console.error('Error en getFolderDetailedData:', error);

    const { setIsLoadingFolderDetails, setFolderDetailedData } = stateSetters;
    
    if (setFolderDetailedData) {
      setFolderDetailedData(null);
    }
    
    if (setIsLoadingFolderDetails) {
      setIsLoadingFolderDetails(false);
    }

    return {
      success: false,
      error: error.message || 'Error desconocido al obtener detalles de la carpeta'
    };
  }
};

// Función para mover carpeta a papelera (soft delete)
export const handleTrashFolder = async (params, stateSetters, callbacks) => {
  try {
    const { folderId, userToken } = params;
    const { setIsLoadingTrash, dispatch } = stateSetters;
    const { pushNotification, getFolderList } = callbacks;

    if (setIsLoadingTrash) setIsLoadingTrash(true);

    const response = await trashFolderAPI(folderId, {
      'Authorization': `Bearer ${userToken}`
    });

    if (response && response.status === "success") {
      if (setIsLoadingTrash) setIsLoadingTrash(false);
      
      // Construir mensaje más descriptivo
      let successMsg = "Carpeta movida a la papelera exitosamente";
      
      // Verificar si hay información adicional en la respuesta
      const responseData = response.data || {};
      const resourceCount = responseData.resources_count || responseData.associated_resources || 0;
      
      if (resourceCount > 0) {
        successMsg = `Carpeta y ${resourceCount} recurso${resourceCount > 1 ? 's' : ''} movido${resourceCount > 1 ? 's' : ''} a la papelera exitosamente`;
      }
      
      if (dispatch && pushNotification) {
        dispatch(pushNotification({ 
          msg: successMsg, 
          status: "ok" 
        }));
      }
      
      if (getFolderList) await getFolderList();

      return { success: true };
    } else {
      if (setIsLoadingTrash) setIsLoadingTrash(false);
      
      // Mensajes de error más descriptivos
      let errorMsg = response?.msg || response?.message || "No se pudo mover la carpeta a la papelera";
      
      // Verificar si ya está en papelera
      if (errorMsg.toLowerCase().includes('already in trash') || 
          errorMsg.toLowerCase().includes('ya está en la papelera') ||
          errorMsg.toLowerCase().includes('ya existe en la papelera')) {
        errorMsg = "Esta carpeta ya se encuentra en la papelera";
      }
      // Verificar si hay errores de permisos
      else if (errorMsg.toLowerCase().includes('permission') || 
               errorMsg.toLowerCase().includes('permiso')) {
        errorMsg = "No tienes permisos para mover esta carpeta a la papelera";
      }
      // Verificar si la carpeta no existe
      else if (errorMsg.toLowerCase().includes('not found') || 
               errorMsg.toLowerCase().includes('no encontrado')) {
        errorMsg = "La carpeta no existe o ya fue eliminada";
      }
      
      if (dispatch && pushNotification) {
        dispatch(pushNotification({ 
          msg: errorMsg, 
          status: "err" 
        }));
      }
      
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    console.error("Error al mover a papelera la carpeta:", error);
    
    const { setIsLoadingTrash, dispatch } = stateSetters;
    const { pushNotification } = callbacks;
    
    if (setIsLoadingTrash) setIsLoadingTrash(false);
    
    // Mensajes de error más descriptivos según el tipo de error
    let errorMsg = error?.response?.data?.msg || error?.message || "Ocurrió un error al momento de mover la carpeta a la papelera";
    
    // Verificar si ya está en papelera
    if (errorMsg.toLowerCase().includes('already in trash') || 
        errorMsg.toLowerCase().includes('ya está en la papelera') ||
        errorMsg.toLowerCase().includes('ya existe en la papelera')) {
      errorMsg = "Esta carpeta ya se encuentra en la papelera";
    }
    // Verificar si hay errores de permisos
    else if (errorMsg.toLowerCase().includes('permission') || 
             errorMsg.toLowerCase().includes('permiso') ||
             error?.response?.status === 403) {
      errorMsg = "No tienes permisos para mover esta carpeta a la papelera";
    }
    // Verificar si la carpeta no existe
    else if (errorMsg.toLowerCase().includes('not found') || 
             errorMsg.toLowerCase().includes('no encontrado') ||
             error?.response?.status === 404) {
      errorMsg = "La carpeta no existe o ya fue eliminada";
    }
    // Error de red
    else if (error?.message?.includes('Network') || error?.message?.includes('network')) {
      errorMsg = "Error de conexión. Verifica tu conexión a internet e intenta nuevamente";
    }
    
    if (dispatch && pushNotification) {
      dispatch(pushNotification({ 
        msg: errorMsg, 
        status: "err" 
      }));
    }
    
    return { success: false, error: errorMsg };
  }
};

// Función para restaurar carpeta desde papelera
export const handleRestoreFolder = async (params, stateSetters, callbacks) => {
  try {
    const { folderId, userToken } = params;
    const { setIsLoadingRestore, dispatch } = stateSetters;
    const { pushNotification, getFolderList } = callbacks;

    if (setIsLoadingRestore) setIsLoadingRestore(true);

    const response = await restoreFolderAPI(folderId, {
      'Authorization': `Bearer ${userToken}`
    });

    if (response && response.status === "success") {
      if (setIsLoadingRestore) setIsLoadingRestore(false);
      
      if (dispatch && pushNotification) {
        dispatch(pushNotification({ 
          msg: "Carpeta restaurada exitosamente", 
          status: "ok" 
        }));
      }
      
      if (getFolderList) await getFolderList();

      return { success: true };
    } else {
      if (setIsLoadingRestore) setIsLoadingRestore(false);
      
      const errorMsg = response?.msg || response?.message || "No se pudo restaurar la carpeta";
      if (dispatch && pushNotification) {
        dispatch(pushNotification({ 
          msg: errorMsg, 
          status: "err" 
        }));
      }
      
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    console.error("Error al restaurar la carpeta:", error);
    
    const { setIsLoadingRestore, dispatch } = stateSetters;
    const { pushNotification } = callbacks;
    
    if (setIsLoadingRestore) setIsLoadingRestore(false);
    
    const errorMsg = error?.response?.data?.msg || error?.message || "Ocurrió un error al momento de restaurar la carpeta";
    if (dispatch && pushNotification) {
      dispatch(pushNotification({ 
        msg: errorMsg, 
        status: "err" 
      }));
    }
    
    return { success: false, error: errorMsg };
  }
};

// Función para eliminar permanentemente carpeta (hard delete)
export const handleDeleteFolder = async (params, stateSetters, callbacks) => {
  try {
    const { folderId, userToken } = params;
    const { setIsLoadingDelete, dispatch } = stateSetters;
    const { pushNotification, getFolderList } = callbacks;

    if (setIsLoadingDelete) setIsLoadingDelete(true);

    const response = await deleteFolderAPI(folderId, {
      'Authorization': `Bearer ${userToken}`
    });

    console.log("Response_DeleteFolder:", response);

    if (response && response.status === "success") {
      if (setIsLoadingDelete) setIsLoadingDelete(false);
      
      if (dispatch && pushNotification) {
        dispatch(pushNotification({ 
          msg: "Carpeta eliminada permanentemente", 
          status: "ok" 
        }));
      }
      
      if (getFolderList) await getFolderList();

      return { success: true };
    } else {
      if (setIsLoadingDelete) setIsLoadingDelete(false);
      
      const errorMsg = response?.msg || response?.message || "No se pudo eliminar la carpeta permanentemente";
      if (dispatch && pushNotification) {
        dispatch(pushNotification({ 
          msg: errorMsg, 
          status: "err" 
        }));
      }
      
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    console.error("Error al eliminar permanentemente la carpeta:", error);
    
    const { setIsLoadingDelete, dispatch } = stateSetters;
    const { pushNotification } = callbacks;
    
    if (setIsLoadingDelete) setIsLoadingDelete(false);
    
    const errorMsg = error?.response?.data?.msg || error?.message || "Ocurrió un error al momento de eliminar la carpeta";
    if (dispatch && pushNotification) {
      dispatch(pushNotification({ 
        msg: errorMsg, 
        status: "err" 
      }));
    }
    
    return { success: false, error: errorMsg };
  }
};
