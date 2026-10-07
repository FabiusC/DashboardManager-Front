import { getGroupsAvaiable, getUserRol } from '@services/creangelAuthAPI';
import { validatorAPIBasicParameters } from "@source/validators";

export const fetchGroups = async (params, stateSetters, callbacks) => {
  try {
    const { userToken } = params;
    const { setGroupsList } = stateSetters;

    const response = await getGroupsAvaiable({
      'Authorization': `Bearer ${userToken}`
    });

    const [validResponse, responseContent] = validatorAPIBasicParameters(response);

    if (
      validResponse &&
      responseContent?.status === 'ok' &&
      Array.isArray(responseContent.data?.results) &&
      responseContent.data?.results.length > 0
    ) {
      responseContent.data.results = responseContent.data.results.map(group => ({
        id: group.id,
        value: group.id,
        showed_name: group.name,
      }));
      if (setGroupsList) setGroupsList(responseContent.data.results);

      return {
        success: true,
        data: responseContent.data.results
      };
    } else {
      if (setGroupsList) setGroupsList([]);

      return {
        success: false,
        error: 'No se encontraron grupos disponibles'
      };
    }

  } catch (error) {
    console.error('Error en fetchGroups:', error);

    const { setGroupsList } = stateSetters;
    const { dispatch, pushNotification } = callbacks;

    if (setGroupsList) setGroupsList([]);
    if (dispatch && pushNotification) {
      dispatch(pushNotification({
        msg: 'Error al obtener los grupos.',
        status: 'err'
      }));
    }

    return {
      success: false,
      error: error.message || 'Error desconocido al obtener grupos'
    };
  }
};


// Servicio para obtener roles de un PROYECTO (sin parent)
export const getRolesForProject = async (params, stateSetters, callbacks) => {
  try {
    const { userToken, group_id, type_mode } = params;
    const { setRolesList } = stateSetters;
    const { dispatch, pushNotification } = callbacks;

    // Initialize rolesList with empty arrays for view and edit
    const rolesList = { view: [], edit: [] };

    // Fetch roles for each type_mode (view, edit)
    for (const mode of type_mode) {
      const requestData = {
        group_id,
        type_mode: mode,
      };

      const response = await getUserRol(
        requestData,
        {
          Authorization: `Bearer ${userToken}`,
        }
      );

      const [validResponse, responseContent] = validatorAPIBasicParameters(response);

      if (
        validResponse &&
        responseContent?.status === 'ok' &&
        Array.isArray(responseContent.data) &&
        responseContent.data.length > 0
      ) {

        // Map roles to the expected format (using role.id from /rol endpoint)
        const mappedRoles = responseContent.data.map((role) => ({
          id: role.id,
          value: role.id, // Use role.id for form value
          showed_name: role.type, // Use type for display
        }));

        rolesList[mode] = mappedRoles;
      } else {
        rolesList[mode] = [];
      }
    }

    // Update rolesList state
    if (setRolesList) {
      setRolesList(rolesList);
    }

    return {
      success: true,
      data: rolesList,
    };
  } catch (error) {
    const { setRolesList } = stateSetters;
    const { dispatch, pushNotification } = callbacks;

    if (setRolesList) {
      setRolesList({ view: [], edit: [] });
    }
    if (dispatch && pushNotification) {
      dispatch(
        pushNotification({
          msg: 'Error al obtener los roles del proyecto.',
          status: 'err',
        })
      );
    }

    return {
      success: false,
      error: error.message || 'Error desconocido al obtener roles',
    };
  }
};

// Servicio para obtener roles de una CARPETA (con parent del proyecto)
export const getRolesForFolder = async (params, stateSetters, callbacks) => {
  try {
    const { userToken, group_id, type_mode, parent_project_id } = params;
    const { setRolesList } = stateSetters;
    const { dispatch, pushNotification } = callbacks;

    // Initialize rolesList with empty arrays for view and edit
    const rolesList = { view: [], edit: [] };

    if (!parent_project_id) {
      return {
        success: false,
        error: "parent_project_id es requerido"
      };
    }

    // Fetch roles for each type_mode (view, edit)
    for (const mode of type_mode) {
      const requestData = {
        group_id,
        type_mode: mode,
      };

      const response = await getUserRol(
        requestData,
        {
          Authorization: `Bearer ${userToken}`,
        }
      );

      const [validResponse, responseContent] = validatorAPIBasicParameters(response);

      if (
        validResponse &&
        responseContent?.status === 'ok' &&
        Array.isArray(responseContent.data) &&
        responseContent.data.length > 0
      ) {
        // Map roles to the expected format (using role.id from /rol endpoint)
        const mappedRoles = responseContent.data.map((role) => ({
          id: role.id,
          value: role.id, // Use role.id for form value
          showed_name: role.type, // Use type for display
        }));

        rolesList[mode] = mappedRoles;
      } else {
        rolesList[mode] = [];
      }
    }

    // Update rolesList state
    if (setRolesList) {
      setRolesList(rolesList);
    }

    return {
      success: true,
      data: rolesList,
    };
  } catch (error) {
    const { setRolesList } = stateSetters;
    const { dispatch, pushNotification } = callbacks;

    if (setRolesList) {
      setRolesList({ view: [], edit: [] });
    }
    if (dispatch && pushNotification) {
      dispatch(
        pushNotification({
          msg: 'Error al obtener los roles de la carpeta.',
          status: 'err',
        })
      );
    }

    return {
      success: false,
      error: error.message || 'Error desconocido al obtener roles',
    };
  }
};

// Servicio para obtener roles para CREAR un proyecto (usa rol.id en lugar de permission_id)
export const getRolesForCreateProject = async (params, stateSetters, callbacks) => {
  try {
    const { userToken, group_id, type_mode } = params;
    const { setRolesList } = stateSetters;
    const { dispatch, pushNotification } = callbacks;

    // Initialize rolesList with empty arrays for view and edit
    const rolesList = { view: [], edit: [] };

    // Fetch roles for each type_mode (view, edit)
    if ( !group_id  ) {
      if (setRolesList) {
        setRolesList({ view: [], edit: [] });
      }
      return {
        success: false,
        error: "group_id es requerido"
      };
    }
    for (const mode of type_mode) {
      const requestData = {
        group_id,
        type_mode: mode,
      };

      const response = await getUserRol(
        requestData,
        {
          Authorization: `Bearer ${userToken}`,
        }
      );

      const [validResponse, responseContent] = validatorAPIBasicParameters(response);

      if (
        validResponse &&
        responseContent?.status === 'ok' &&
        Array.isArray(responseContent.data) &&
        responseContent.data.length > 0
      ) {
        // Map roles usando rol.id (NO permission_id) para crear proyectos
        const mappedRoles = responseContent.data.map((role) => ({
          id: role.id,                    // Usar rol.id
          value: role.id,                 // Usar rol.id para el valor del formulario
          showed_name: role.type,         // Use type for display
        }));

        rolesList[mode] = mappedRoles;
      } else {
        rolesList[mode] = [];
      }
    }

    // Update rolesList state
    if (setRolesList) {
      setRolesList(rolesList);
    }

    return {
      success: true,
      data: rolesList,
    };
  } catch (error) {
    const { setRolesList } = stateSetters;
    const { dispatch, pushNotification } = callbacks;

    if (setRolesList) {
      setRolesList({ view: [], edit: [] });
    }
    if (dispatch && pushNotification) {
      dispatch(
        pushNotification({
          msg: 'Error al obtener los roles para crear proyecto.',
          status: 'err',
        })
      );
    }

    return {
      success: false,
      error: error.message || 'Error desconocido al obtener roles',
    };
  }
};

// Mantener getRoles por compatibilidad (alias de getRolesForProject)
export const getRoles = getRolesForProject;