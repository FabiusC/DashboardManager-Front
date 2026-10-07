import { dashboardGeneralRequest } from "@services/dashboardAPI";
import {
  createProject as createProjectService,
  getProjects,
  editProject as editProjectService,
  getProject,
  trashProject as trashProjectAPI,
  restoreProject as restoreProjectAPI,
  deleteProject as deleteProjectAPI,
  getAclById,
  getProject as fetchProjectAPI,
  updateACLPermissions
} from '@services/creangelAuthAPI';
import { getModifiedFields } from '@components/Utils/compareFormChanges';

// Función para actualizar permisos ACL
export const updatePermissionsACL = async (params, callbacks) => {
  try {
    const {
      viewPermissionChanged,
      editPermissionChanged,
      newViewPermissionId,
      newEditPermissionId,
      projectId,
      userToken,
    } = params;
    const { dispatch, pushNotification } = callbacks;

    const permissionUpdates = [];

    // Si cambió el permiso de visualización
    if (viewPermissionChanged && newViewPermissionId) {
      permissionUpdates.push({
        type: 'view',
        aclId: projectId, // Usar el ID del proyecto como ACL ID
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
        aclId: projectId, // Usar el ID del proyecto como ACL ID
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
              msg: `Error al actualizar permiso de ${update.type === 'view' ? 'visualización' : 'edición'}`,
              status: 'err'
            }));
          }
        }
      } catch (error) {
        results.push({
          type: update.type,
          success: false,
          error: error.message || 'Error desconocido'
        });

        if (dispatch && pushNotification) {
          dispatch(pushNotification({
            msg: `Error al actualizar permiso de ${update.type === 'view' ? 'visualización' : 'edición'}`,
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
    return {
      success: false,
      error: error.message || 'Error desconocido al actualizar permisos',
      permissionsUpdated: false
    };
  }
};

// Función para obtener lista de proyectos
export const getProjectList = async (params, stateSetters) => {
  try {
    const { projectsPerPage, offset, searchValue, sortField, sortDirection, userToken, groupId, showLoading = false } = params;
    const {
      setIsLoadingList,
      setProjects,
      setTotalProjects,
      setCurrentPage
    } = stateSetters;

    // Mostrar loading si es necesario
    if (showLoading && setIsLoadingList) {
      setIsLoadingList(true);
    }

    const filters = [{ field: 'in_trash', value: false }];

    // Agregar filtro de grupo si existe
    if (groupId) {
      filters.push({ field: 'group_id', value: groupId });
    }

    const requestData = {
      limit: projectsPerPage,
      offset: offset,
      filter: filters,
      q: searchValue,
      order_field: sortField,
      order_by: sortDirection
    };

    const response = await getProjects(requestData, {
      'Authorization': `Bearer ${userToken}`
    });

    // Si no hay datos, resetear states y ocultar loading
    if (!response?.data) {
      if (setProjects) setProjects([]);
      if (setTotalProjects) setTotalProjects(0);
      if (setIsLoadingList) setIsLoadingList(false);

      return {
        results: [],
        count: 0,
        offsetError: false
      };
    }

    const { results, count } = response.data;
    const offsetError = offset > count && count > 0;

    // Si hay error de offset, resetear página
    if (offsetError) {
      if (setCurrentPage) setCurrentPage(1);
      if (setIsLoadingList) setIsLoadingList(false);

      return {
        results: [],
        count,
        offsetError: true
      };
    }

    // Actualizar todos los states
    if (setProjects) setProjects(results || []);
    if (setTotalProjects) setTotalProjects(count || 0);
    if (setIsLoadingList) setIsLoadingList(false);

    return {
      results: results || [],
      count: count || 0,
      offsetError: false
    };

  } catch (error) {
    // En caso de error, resetear states
    const { setIsLoadingList, setProjects, setTotalProjects } = stateSetters;
    if (setProjects) setProjects([]);
    if (setTotalProjects) setTotalProjects(0);
    if (setIsLoadingList) setIsLoadingList(false);

    return {
      results: [],
      count: 0,
      offsetError: false,
      error: error.message || 'Error desconocido'
    };
  }
};

// Función para obtener un proyecto específico por ID
export const getProjectById = async (params, stateSetters) => {
  try {
    const { projectId, userToken } = params;
    const {
      setIsLoadingData,
      setProjectData,
      setFormError
    } = stateSetters;

    if (setIsLoadingData) {
      setIsLoadingData(true);
    }

    if (setFormError) {
      setFormError("");
    }

    const response = await getProject(projectId, {
      'Authorization': `Bearer ${userToken}`
    });

    if (!response?.data) {
      if (setFormError) {
        setFormError("No se pudo cargar la información del proyecto.");
      }
      if (setIsLoadingData) {
        setIsLoadingData(false);
      }

      return {
        success: false,
        error: "No se encontraron datos del proyecto"
      };
    }

    if (setProjectData) {
      setProjectData(response.data);
    }
    if (setIsLoadingData) {
      setIsLoadingData(false);
    }

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    // En caso de error, resetear states
    const { setIsLoadingData, setFormError } = stateSetters;
    if (setFormError) {
      setFormError("Error al cargar los datos del proyecto. Inténtalo de nuevo.");
    }
    if (setIsLoadingData) {
      setIsLoadingData(false);
    }

    return {
      success: false,
      error: error.message || 'Error desconocido'
    };
  }
};

// Función para obtener detalles completos de un proyecto usando ACL (incluye permisos completos)
export const getProjectDetailedData = async (params, stateSetters) => {
  try {
    const { projectId, userToken } = params;
    const {
      setIsLoadingProjectDetails,
      setProjectDetailedData
    } = stateSetters;

    if (!projectId) {
      return {
        success: false,
        error: "projectId es requerido"
      };
    }

    if (setIsLoadingProjectDetails) {
      setIsLoadingProjectDetails(true);
    }
    // Usar getAclById para obtener detalles completos vía ACL
    const response = await getAclById(projectId, {
      'Authorization': `Bearer ${userToken}`
    });

    if (response && response.status === "success" && response.data) {

      if (setProjectDetailedData) {
        setProjectDetailedData(response.data);
      }

      if (setIsLoadingProjectDetails) {
        setIsLoadingProjectDetails(false);
      }

      return {
        success: true,
        data: response.data
      };
    } else {

      if (setProjectDetailedData) {
        setProjectDetailedData(null);
      }

      if (setIsLoadingProjectDetails) {
        setIsLoadingProjectDetails(false);
      }

      return {
        success: false,
        error: response?.msg || "No se pudieron obtener los detalles del proyecto"
      };
    }

  } catch (error) {

    const { setIsLoadingProjectDetails, setProjectDetailedData } = stateSetters;

    if (setProjectDetailedData) {
      setProjectDetailedData(null);
    }

    if (setIsLoadingProjectDetails) {
      setIsLoadingProjectDetails(false);
    }

    return {
      success: false,
      error: error.message || 'Error desconocido al obtener detalles del proyecto'
    };
  }
};

export const getProjectDetailedDataByAcl = async (params, stateSetters) => {
  try {
    const { projectId, userToken } = params;
    const {
      setIsLoadingProjectDetails,
      setProjectDetailedData
    } = stateSetters;
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Error desconocido al obtener detalles del proyecto'
    };
  }
};

// Función de validación de datos del proyecto
export const validateProjectData = (projectData) => {
  let errors = {};
  let isValid = true;

  if (!projectData.name || projectData.name.trim() === "") {
    errors.name = "El nombre del proyecto no puede estar vacío.";
    isValid = false;
  } else if (projectData.name.length < 3) {
    errors.name = "El nombre del proyecto debe contener al menos 3 caracteres.";
    isValid = false;
  } else if (projectData.name.length > 500) {
    errors.name = "El nombre del proyecto no puede contener más de 500 caracteres.";
    isValid = false;
  }

  const threeWords = projectData.description && projectData.description.trim().split(/\s+/).length >= 3;
  if (!projectData.description || projectData.description.trim() === "") {
    errors.description = "La descripción del proyecto no puede estar vacía.";
    isValid = false;
  } else if (!threeWords) {
    errors.description = "La descripción del proyecto debe contener al menos 3 palabras.";
    isValid = false;
  } else if (projectData.description.length > 10000) {
    errors.description = "La descripción del proyecto no puede contener más de 10000 caracteres.";
    isValid = false;
  }

  if (!projectData.group_id || projectData.group_id.trim() === "") {
    errors.group_id = "Debe seleccionar un grupo.";
    isValid = false;
  }

  if (!projectData.view_role_id || projectData.view_role_id.trim() === "") {
    errors.view_role_id = "Debe seleccionar un nivel de visualización.";
    isValid = false;
  }

  if (!projectData.edit_role_id || projectData.edit_role_id.trim() === "") {
    errors.edit_role_id = "Debe seleccionar un nivel de edición.";
    isValid = false;
  }

  if (!projectData.application_id || projectData.application_id.trim() === "") {
    errors.application_id = "El ID de la aplicación es requerido.";
    isValid = false;
  }

  return { isValid, errors };
};

// Función de validación específica para edición de proyectos
export const validateEditProjectData = (projectData) => {
  let notif2return = {};
  const threeWords = projectData?.description?.trim().split(/\s+/).length >= 3;

  if (projectData.name && projectData.name.trim() === "") {
    notif2return = {
      message: "El nombre del proyecto no puede estar vacío.",
      status: false,
      openNotification: true,
    };
  } else if (projectData.name && projectData.name.length < 3) {
    notif2return = {
      message: "El nombre del proyecto debe contener al menos 3 caracteres.",
      status: false,
      openNotification: true,
    };
  } else if (projectData.name && projectData.name.length > 500) {
    notif2return = {
      message: "El nombre del proyecto no puede contener más de 500 caracteres.",
      status: false,
      openNotification: true,
    };
  } else if (projectData.description && projectData.description.trim() === "") {
    notif2return = {
      message: "La descripción del proyecto no puede estar vacía.",
      status: false,
      openNotification: true,
    };
  } else if (projectData.description && threeWords === false) {
    notif2return = {
      message: "La descripción del proyecto debe contener al menos 3 palabras.",
      status: false,
      openNotification: true,
    };
  } else if (projectData.description && projectData.description.length > 10000) {
    notif2return = {
      message: "La descripción del proyecto no puede contener más de 10000 caracteres.",
      status: false,
      openNotification: true,
    };
  } else {
    notif2return = {
      message: "El proyecto ha sido editado exitosamente.",
      status: true,
      openNotification: false,
    };
  }

  return notif2return;
};

export const createProject = async (params, stateSetters, callbacks) => {
  try {
    const { formData, userToken } = params;
    const {
      setIsLoadingData,
      setFormError,
      setValidationErrors
    } = stateSetters;
    const { handleProject, setIsCreateModal, handleCleanForm, dispatch, pushNotification } = callbacks;

    if (setIsLoadingData) setIsLoadingData(true);
    if (setFormError) setFormError("");



    const requestBody = formData;

    const validation = validateProjectData(requestBody);

    if (validation.isValid) {
      const response = await createProjectService(requestBody, {
        'Authorization': `Bearer ${userToken}`
      });

      if (response) {
        if (setIsLoadingData) setIsLoadingData(false);
        if (handleProject) handleProject();

        if (response.status === "error" || response.status === "err") {

          if (response.msg.includes("with this name already exists in your organization")) {
            setFormError("El nombre del proyecto ya existe en la organización. El proyecto con el nombre ingresado puede estar activo o en la papelera.");
          }

        } else {
          if (setIsCreateModal) setIsCreateModal(false);
          if (handleCleanForm) handleCleanForm();
          return {
            success: true,
            data: response
          };
        }

      } else {
        if (setIsLoadingData) setIsLoadingData(false);
        if (setFormError) setFormError("Error al crear el proyecto. Inténtalo de nuevo.");
        if (dispatch && pushNotification) {
          dispatch(pushNotification({
            msg: response?.msg || "Error al crear el proyecto. Inténtalo de nuevo.",
            status: "err"
          }));
        }

        return {
          success: false,
          error: "Error al crear el proyecto"
        };
      }
    } else {
      if (setValidationErrors) setValidationErrors(validation.errors);
      if (setIsLoadingData) setIsLoadingData(false);
      if (dispatch && pushNotification) {
        dispatch(pushNotification({
          msg: response?.msg || "Error con el servidor. Inténtalo de nuevo.",
          status: "err"
        }));
      }

      return {
        success: false,
        validation
      };
    }

  } catch (error) {
    console.error('Error en createProject:', error);

    const { setIsLoadingData, setFormError } = stateSetters;
    if (setIsLoadingData) setIsLoadingData(false);

    return {
      success: false,
      error: error.message || 'Error desconocido'
    };
  }
};

export const editProject = async (params, stateSetters, callbacks) => {
  try {
    const { editProjectData, projectForm, tags, userToken, userId } = params;
    const {
      setIsLoadingData,
      dispatch
    } = stateSetters;
    const {
      setEditingId,
      handleProject,
      pushNotification
    } = callbacks;

    if (setIsLoadingData) setIsLoadingData(true);

    // Preparar datos del formulario
    // Extraer los role IDs de los permisos para comparación (necesitamos rol.id, no permission.id)
    // Intentar obtener edit_role_id desde diferentes fuentes
    if (!editProjectData.edit_role_id) {
      if (editProjectData.edit_permission?.rol?.id) {
        editProjectData.edit_role_id = editProjectData.edit_permission.rol.id;
      } else if (editProjectData.edit_role?.id) {
        editProjectData.edit_role_id = editProjectData.edit_role.id;
      } else if (editProjectData.edit_permission_id) {
        // Si ya tenemos edit_permission_id, usarlo como fallback
        editProjectData.edit_role_id = editProjectData.edit_permission_id;
      }
    }

    // Intentar obtener view_role_id desde diferentes fuentes
    if (!editProjectData.view_role_id) {
      if (editProjectData.view_permission?.rol?.id) {
        editProjectData.view_role_id = editProjectData.view_permission.rol.id;
      } else if (editProjectData.view_role?.id) {
        editProjectData.view_role_id = editProjectData.view_role.id;
      } else if (editProjectData.view_permission_id) {
        // Si ya tenemos view_permission_id, usarlo como fallback
        editProjectData.view_role_id = editProjectData.view_permission_id;
      }
    }

    // Mapear los valores del formulario a view_role_id y edit_role_id para comparación
    // El formulario usa view_permission_id y edit_permission_id, pero contienen role IDs
    const formViewRoleId = projectForm?.view_permission_id || projectForm?.view_role_id;
    const formEditRoleId = projectForm?.edit_permission_id || projectForm?.edit_role_id;

    // Campos a verificar para cambios (excluyendo permisos, los manejamos por separado)
    const FIELDS_TO_CHECK = ['name', 'description', 'tags', 'color'];
    const { hasChanges, changedFields } = getModifiedFields(editProjectData, projectForm, FIELDS_TO_CHECK);

    // Verificar si cambiaron los permisos comparando role IDs
    const viewPermissionChanged = formViewRoleId && editProjectData.view_role_id !== formViewRoleId;
    const editPermissionChanged = formEditRoleId && editProjectData.edit_role_id !== formEditRoleId;
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
          projectId: editProjectData.id, // Usar el ID del proyecto como ACL ID
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
              msg: "Error al actualizar los permisos del proyecto",
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

      // Preparar campos para actualizar el proyecto (excluyendo permisos si ya se actualizaron vía ACL)
      const requestBody = { ...changedFields };

      // Si actualizamos permisos vía ACL, no los incluimos en la actualización del proyecto
      if (hasPermissionChanges) {
        delete requestBody.view_permission_id;
        delete requestBody.edit_permission_id;
      }

      // Si después de excluir permisos no hay más cambios, solo devolver éxito
      if (Object.keys(requestBody).length === 0) {
        if (setIsLoadingData) setIsLoadingData(false);
        if (setEditingId) setEditingId(null);
        if (handleProject) handleProject();

        if (dispatch && pushNotification) {
          dispatch(pushNotification({
            msg: "Proyecto actualizado exitosamente",
            status: "ok"
          }));
        }

        return {
          success: true,
          permissionsOnly: true
        };
      }

      // Validar los datos usando la función de validación específica para edición
      const validationResult = validateEditProjectData(requestBody);

      if (validationResult.status) {
        // Llamar al servicio de edición (el ID se pasa en la URL, no en el payload)
        const response = await editProjectService(
          requestBody,
          {
            'Authorization': `Bearer ${userToken}`
          },
          editProjectData.id
        );

        if (response) {
          if (setIsLoadingData) setIsLoadingData(false);
          if (setEditingId) setEditingId(null);
          if (handleProject) handleProject();

          return {
            success: true,
            data: response
          };
        } else {
          if (setIsLoadingData) setIsLoadingData(false);

          return {
            success: false,
            error: "Error al actualizar el proyecto"
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
    console.error('Error en editProject:', error);

    const { setIsLoadingData, dispatch } = stateSetters;
    const { pushNotification } = callbacks;

    if (setIsLoadingData) setIsLoadingData(false);
    if (dispatch && pushNotification) {
      dispatch(pushNotification({
        msg: "Error inesperado al editar el proyecto. Inténtalo de nuevo.",
        status: "err"
      }));
    }

    return {
      success: false,
      error: error.message || 'Error desconocido'
    };
  }
};

// Función para mover proyecto a papelera (soft delete)
export const handleTrashProject = async (params, stateSetters, callbacks) => {
  try {
    const { projectId, userToken } = params;
    const { setIsLoadingTrash, dispatch } = stateSetters;
    const { pushNotification, getProjectList } = callbacks;

    if (setIsLoadingTrash) setIsLoadingTrash(true);

    const response = await trashProjectAPI(projectId, {
      'Authorization': `Bearer ${userToken}`
    });

    if (response && response.status === "success") {
      if (setIsLoadingTrash) setIsLoadingTrash(false);

      // Construir mensaje más descriptivo
      let successMsg = "Proyecto movido a la papelera exitosamente";

      // Verificar si hay información adicional en la respuesta
      const responseData = response.data || {};
      const folderCount = responseData.folders_count || responseData.associated_folders || 0;
      const resourceCount = responseData.resources_count || responseData.associated_resources || 0;

      if (folderCount > 0 || resourceCount > 0) {
        const details = [];
        if (folderCount > 0) details.push(`${folderCount} carpeta${folderCount > 1 ? 's' : ''}`);
        if (resourceCount > 0) details.push(`${resourceCount} recurso${resourceCount > 1 ? 's' : ''}`);

        successMsg = `Proyecto y ${details.join(' y ')} movido${details.length > 1 ? 's' : ''} a la papelera exitosamente`;
      }

      if (dispatch && pushNotification) {
        dispatch(pushNotification({
          msg: successMsg,
          status: "ok"
        }));
      }

      if (getProjectList) await getProjectList();

      return { success: true };
    } else {
      if (setIsLoadingTrash) setIsLoadingTrash(false);

      // Mensajes de error más descriptivos
      let errorMsg = response?.msg || response?.message || "No se pudo mover el proyecto a la papelera";

      // Verificar si ya está en papelera
      if (errorMsg.toLowerCase().includes('already in trash') ||
        errorMsg.toLowerCase().includes('ya está en la papelera') ||
        errorMsg.toLowerCase().includes('ya existe en la papelera')) {
        errorMsg = "Este proyecto ya se encuentra en la papelera";
      }
      // Verificar si hay errores de permisos
      else if (errorMsg.toLowerCase().includes('permission') ||
        errorMsg.toLowerCase().includes('permiso')) {
        errorMsg = "No tienes permisos para mover este proyecto a la papelera";
      }
      // Verificar si el proyecto no existe
      else if (errorMsg.toLowerCase().includes('not found') ||
        errorMsg.toLowerCase().includes('no encontrado')) {
        errorMsg = "El proyecto no existe o ya fue eliminado";
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
    console.error("Error al mover a papelera el proyecto:", error);

    const { setIsLoadingTrash, dispatch } = stateSetters;
    const { pushNotification } = callbacks;

    if (setIsLoadingTrash) setIsLoadingTrash(false);

    // Mensajes de error más descriptivos según el tipo de error
    let errorMsg = error?.response?.data?.msg || error?.message || "Ocurrió un error al momento de mover el proyecto a la papelera";

    // Verificar si ya está en papelera
    if (errorMsg.toLowerCase().includes('already in trash') ||
      errorMsg.toLowerCase().includes('ya está en la papelera') ||
      errorMsg.toLowerCase().includes('ya existe en la papelera')) {
      errorMsg = "Este proyecto ya se encuentra en la papelera";
    }
    // Verificar si hay errores de permisos
    else if (errorMsg.toLowerCase().includes('permission') ||
      errorMsg.toLowerCase().includes('permiso') ||
      error?.response?.status === 403) {
      errorMsg = "No tienes permisos para mover este proyecto a la papelera";
    }
    // Verificar si el proyecto no existe
    else if (errorMsg.toLowerCase().includes('not found') ||
      errorMsg.toLowerCase().includes('no encontrado') ||
      error?.response?.status === 404) {
      errorMsg = "El proyecto no existe o ya fue eliminado";
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

// Función para restaurar proyecto desde papelera
export const handleRestoreProject = async (params, stateSetters, callbacks) => {
  try {
    const { projectId, userToken } = params;
    const { setIsLoadingRestore, dispatch } = stateSetters;
    const { pushNotification, getProjectList } = callbacks;

    if (setIsLoadingRestore) setIsLoadingRestore(true);

    const response = await restoreProjectAPI({}, {
      'Authorization': `Bearer ${userToken}`
    }, projectId);

    if (response && response.status === "success") {
      if (setIsLoadingRestore) setIsLoadingRestore(false);

      if (dispatch && pushNotification) {
        dispatch(pushNotification({
          msg: "Proyecto restaurado exitosamente",
          status: "ok"
        }));
      }

      if (getProjectList) await getProjectList();

      return { success: true };
    } else {
      if (setIsLoadingRestore) setIsLoadingRestore(false);

      const errorMsg = response?.msg || response?.message || "No se pudo restaurar el proyecto";
      if (dispatch && pushNotification) {
        dispatch(pushNotification({
          msg: errorMsg,
          status: "err"
        }));
      }

      return { success: false, error: errorMsg };
    }
  } catch (error) {
    console.error("Error al restaurar el proyecto:", error);

    const { setIsLoadingRestore, dispatch } = stateSetters;
    const { pushNotification } = callbacks;

    if (setIsLoadingRestore) setIsLoadingRestore(false);

    const errorMsg = error?.response?.data?.msg || error?.message || "Ocurrió un error al momento de restaurar el proyecto";
    if (dispatch && pushNotification) {
      dispatch(pushNotification({
        msg: errorMsg,
        status: "err"
      }));
    }

    return { success: false, error: errorMsg };
  }
};

// Función para eliminar permanentemente proyecto (hard delete)
export const handleDeleteProject = async (params, stateSetters, callbacks) => {
  try {
    const { projectId, userToken } = params;
    const { setIsLoadingDelete, dispatch } = stateSetters;
    const { pushNotification, getProjectList } = callbacks;

    if (setIsLoadingDelete) setIsLoadingDelete(true);

    const response = await deleteProjectAPI(projectId, {
      'Authorization': `Bearer ${userToken}`
    });

    if (response && response.status === "success") {
      if (setIsLoadingDelete) setIsLoadingDelete(false);

      if (dispatch && pushNotification) {
        dispatch(pushNotification({
          msg: "Proyecto eliminado permanentemente",
          status: "ok"
        }));
      }

      if (getProjectList) await getProjectList();

      return { success: true };
    } else {
      if (setIsLoadingDelete) setIsLoadingDelete(false);

      const errorMsg = response?.msg || response?.message || "No se pudo eliminar el proyecto permanentemente";
      if (dispatch && pushNotification) {
        dispatch(pushNotification({
          msg: errorMsg,
          status: "err"
        }));
      }

      return { success: false, error: errorMsg };
    }
  } catch (error) {
    console.error("Error al eliminar permanentemente el proyecto:", error);

    const { setIsLoadingDelete, dispatch } = stateSetters;
    const { pushNotification } = callbacks;

    if (setIsLoadingDelete) setIsLoadingDelete(false);

    const errorMsg = error?.response?.data?.msg || error?.message || "Ocurrió un error al momento de eliminar el proyecto";
    if (dispatch && pushNotification) {
      dispatch(pushNotification({
        msg: errorMsg,
        status: "err"
      }));
    }

    return { success: false, error: errorMsg };
  }
};