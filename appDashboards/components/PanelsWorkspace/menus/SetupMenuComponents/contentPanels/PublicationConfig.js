import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  FormControlLabel,
  CircularProgress,
  Divider,
  Select,
  MenuItem,
  FormControl,
  Checkbox,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from "@mui/material";
import { Image, Security, Visibility, Edit, VpnKey, SaveAsRounded, Tune, InfoOutlined } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { getAclById, updateACL, getUserRol, updateACLPermissions } from "@services/creangelAuthAPI";
import { pushNotification } from "@redux/actions";
import { handleEditItemEntity } from "../../../../../helpers/dashboardAPI/genericRequest";
import { usePanelContext } from "../../../hooks/usePanelContext";

export default function PublicationConfig({ userToken, onPanelSaved }) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const panel = usePanelContext();

  // Obtener IDs del panel o sessionStorage
  const resourceId = panel?.state?.panel?.id || sessionStorage.getItem('resourceId');
  const groupId = panel?.state?.panel?.group_id || sessionStorage.getItem('groupId');

  // Estados ACL
  const [aclData, setAclData] = useState(null);
  const [isLoadingAcl, setIsLoadingAcl] = useState(false);
  const [aclFormData, setAclFormData] = useState({
    url_image: '',
    propagate_auth: false,
    view_role: null,
    edit_role: null
  });
  const [viewRoles, setViewRoles] = useState([]);
  const [editRoles, setEditRoles] = useState([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados generales
  const [generalFormData, setGeneralFormData] = useState({
    title: '',
    description: '',
    width: '',
    height: '',
    expanded: false,
    is_public: false,
    is_published: false,
  });
  const [initialData, setInitialData] = useState(null);
  const panelSnapshotRef = useRef('');
  const isSavingRef = useRef(false);

  // Inicializar datos del panel - SOLO cuando cambia el ID del panel
  useEffect(() => {
    const panelData = panel?.state?.panel;
    if (!panelData || !panelData.id) return;

    // Solo procesar si cambió el ID del panel (nuevo panel seleccionado)
    const currentPanelId = panelData.id;
    const lastPanelId = panelSnapshotRef.current ? panelSnapshotRef.current.split(':')[0] : null;

    if (currentPanelId !== lastPanelId) {
      // Nuevo panel o primera carga - inicializar todo
      const currentData = {
        title: panelData.title ?? '',
        description: panelData.description ?? '',
        width: panelData.width ?? '',
        height: panelData.height ?? '',
        expanded: panelData.expanded ?? false,
        is_public: panelData.is_public ?? false,
        is_published: panelData.is_published ?? false,
      };

      panelSnapshotRef.current = `${currentPanelId}:${JSON.stringify(currentData)}`;
      setInitialData(currentData);
      setGeneralFormData(currentData);
    }
  }, [panel?.state?.panel?.id]);

  // Cargar datos ACL
  const fetchAclData = useCallback(async () => {
    if (!resourceId) return;

    setIsLoadingAcl(true);
    try {
      const response = await getAclById(resourceId, {
        'Authorization': `Bearer ${userToken}`
      });

      if (response?.status === 'success' && response.data) {
        setAclData(response.data);
        setAclFormData({
          url_image: response.data.url_image || '',
          propagate_auth: response.data.propagate_auth || false,
          view_role: response.data.view_role || null,
          edit_role: response.data.edit_role || null
        });
      }
    } catch (error) {
      console.error('Error al cargar datos ACL:', error);
    } finally {
      setIsLoadingAcl(false);
    }
  }, [resourceId, userToken]);

  // Cargar roles
  const fetchRoles = useCallback(async () => {
    if (!groupId) return;

    setIsLoadingRoles(true);
    try {
      const [viewResponse, editResponse] = await Promise.all([
        getUserRol({ group_id: groupId, type_mode: 'view' }, { 'Authorization': `Bearer ${userToken}` }),
        getUserRol({ group_id: groupId, type_mode: 'edit' }, { 'Authorization': `Bearer ${userToken}` })
      ]);

      setViewRoles(viewResponse?.data || []);
      setEditRoles(editResponse?.data || []);
    } catch (error) {
      console.error('Error al cargar roles:', error);
    } finally {
      setIsLoadingRoles(false);
    }
  }, [groupId, userToken]);

  // Cargar datos al montar
  useEffect(() => {
    if (resourceId) fetchAclData();
    if (groupId) fetchRoles();
  }, [resourceId, groupId, fetchAclData, fetchRoles]);

  // Handler para cambios generales
  const handleGeneralChange = useCallback((field, value) => {
    setGeneralFormData(prev => ({ ...prev, [field]: value }));
    panel?.actions?.handleChangeState?.(field, value);
  }, [panel]);

  // Handler para cambios ACL
  const handleAclChange = useCallback((field, value) => {
    setAclFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handler para cambios de permisos
  const handlePermissionChange = useCallback((permissionType, roleId) => {
    const selectedRole = permissionType === 'view_role' ? viewRoles.find(r => r.id === roleId) : editRoles.find(r => r.id === roleId);
    if (!selectedRole) return;

    setAclFormData(prev => ({
      ...prev,
      [permissionType]: {
        id: selectedRole.id,
        type: selectedRole.type,
        value: selectedRole.value,
        description: selectedRole.description
      }
    }));
  }, [viewRoles, editRoles]);

  // Guardar cambios generales
  const saveGeneralChanges = useCallback(async () => {
    if (!initialData || !panel?.state?.panel?.id) return true;

    const changes = Object.keys(generalFormData).reduce((acc, key) => {
      if (generalFormData[key] !== initialData[key]) {
        acc[key] = generalFormData[key];
      }
      return acc;
    }, {});

    if (Object.keys(changes).length === 0) return true;

    try {
      isSavingRef.current = true;

      // Guardar los cambios actuales del formulario antes de hacer la petición
      const savedFormData = { ...generalFormData };

      await handleEditItemEntity(
        userToken,
        "panel",
        "panel",
        { id: panel.state.panel.id },
        changes,
        dispatch,
        false
      );

      // Actualizar initialData con los valores guardados inmediatamente
      // Esto hace que el botón desaparezca solo cuando realmente no hay cambios
      setInitialData(savedFormData);

      // Esperar un poco para que el contexto se actualice antes de permitir
      // que el useEffect vuelva a sincronizar
      setTimeout(() => {
        isSavingRef.current = false;
      }, 1000);

      return true;
    } catch (error) {
      console.error('Error al guardar cambios generales:', error);
      isSavingRef.current = false;
      return false;
    }
  }, [generalFormData, initialData, panel?.state?.panel?.id, userToken, dispatch]);

  // Guardar cambios ACL
  const saveAclChanges = useCallback(async () => {
    if (!resourceId || !aclData?.id) return true;

    const aclChanges = {};
    const permissionChanges = {};

    // Detectar cambios ACL
    if (aclFormData.url_image !== (aclData.url_image || '')) {
      aclChanges.url_image = aclFormData.url_image;
    }
    if (aclFormData.propagate_auth !== (aclData.propagate_auth || false)) {
      aclChanges.propagate_auth = aclFormData.propagate_auth;
    }

    // Detectar cambios de permisos usando role IDs (según EditPermissions schema)
    const viewRoleId = aclFormData.view_role?.id;
    const editRoleId = aclFormData.edit_role?.id;
    const currentViewRoleId = aclData.view_role?.id;
    const currentEditRoleId = aclData.edit_role?.id;

    if (viewRoleId && viewRoleId !== currentViewRoleId) {
      permissionChanges.view = {
        new_role_id: viewRoleId, // Use new_role_id according to EditPermissions schema
        view_or_edit: 'view'
      };
    }

    if (editRoleId && editRoleId !== currentEditRoleId) {
      permissionChanges.edit = {
        new_role_id: editRoleId, // Use new_role_id according to EditPermissions schema
        view_or_edit: 'edit'
      };
    }

    if (Object.keys(aclChanges).length === 0 && Object.keys(permissionChanges).length === 0) {
      return true;
    }

    try {
      // Guardar cambios ACL
      if (Object.keys(aclChanges).length > 0) {
        const response = await updateACL(aclChanges, { 'Authorization': `Bearer ${userToken}` }, aclData.id);
        if (response?.status !== 'success' && response?.status !== 'ok') {
          throw new Error('Error al actualizar ACL');
        }
      }

      // Guardar cambios de permisos usando EditPermissions schema
      for (const change of Object.values(permissionChanges)) {
        const response = await updateACLPermissions(
          {
            new_role_id: change.new_role_id, // Use new_role_id according to EditPermissions schema
            view_or_edit: change.view_or_edit
          },
          { 'Authorization': `Bearer ${userToken}` },
          aclData.id
        );
        if (response?.status !== 'success' && response?.status !== 'ok') {
          throw new Error('Error al actualizar permisos');
        }
      }

      await fetchAclData();
      return true;
    } catch (error) {
      console.error('Error al guardar cambios ACL:', error);
      return false;
    }
  }, [aclFormData, aclData, viewRoles, editRoles, resourceId, userToken, fetchAclData]);


  const hasGeneralChanges = useMemo(() => {
    if (!initialData) return false;
    return Object.keys(generalFormData).some(key => generalFormData[key] !== initialData[key]);
  }, [generalFormData, initialData]);

  const hasAclChanges = useMemo(() => {
    if (!aclData) return false;
    return (
      aclFormData.url_image !== (aclData.url_image || '') ||
      aclFormData.propagate_auth !== (aclData.propagate_auth || false) ||
      aclFormData.view_role?.id !== aclData.view_role?.id ||
      aclFormData.edit_role?.id !== aclData.edit_role?.id
    );
  }, [aclFormData, aclData]);

  const hasChanges = hasGeneralChanges || hasAclChanges;

  // Guardar todos los cambios
  const saveAllChanges = useCallback(async () => {
    setIsSaving(true);
    try {
      const generalSuccess = await saveGeneralChanges();
      const aclSuccess = await saveAclChanges();

      if (generalSuccess && aclSuccess) {
        if (hasGeneralChanges && onPanelSaved) {
          onPanelSaved();
        }
        dispatch(pushNotification({
          msg: 'Cambios guardados exitosamente',
          status: 'ok'
        }));
      } else {
        dispatch(pushNotification({
          msg: 'Error al guardar algunos cambios',
          status: 'err'
        }));
      }
    } catch (error) {
      isSavingRef.current = false;
      dispatch(pushNotification({
        msg: 'Error inesperado al guardar cambios',
        status: 'err'
      }));
    } finally {
      setIsSaving(false);
    }
  }, [hasGeneralChanges, saveGeneralChanges, saveAclChanges, dispatch, onPanelSaved]);

  if (isLoadingAcl) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flexDirection: 'column', gap: 2 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Cargando configuración...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", height: "100%", maxHeight: "100%", overflow: "hidden" }}>
      <Box
        sx={{
          backgroundColor: '#ffffff',
          padding: 1.5,
          paddingTop: 0,
          overflowY: 'auto',
          width: '100%',
          height: '100%',
          maxHeight: '100%',
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", mb: 1 }}>
          <Tooltip title="Guardar cambios" arrow placement="top">
            <span>
              <IconButton
                onClick={saveAllChanges}
                disabled={!hasChanges || isSaving}
                sx={{
                  "&:hover": {
                    color: theme.palette.primary.dark,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  },
                  color: theme.palette.primary.main,
                  borderRadius: "20px",
                  transition: "all 0.3s ease-in-out",
                  padding: "4px",
                  margin: "4px",
                }}>
                {isSaving ? <CircularProgress size={20} /> : <SaveAsRounded sx={{ fontSize: 20 }} />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        {/* Datos generales */}
        {panel?.state?.panel && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Tune sx={{ fontSize: 22, color: 'primary.main' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Datos Generales
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Título"
                value={generalFormData.title}
                onChange={(e) => handleGeneralChange('title', e.target.value)}
                fullWidth
                size="small"
                sx={{
                  '& .MuiInputBase-root': {
                    '& .MuiInputBase-input': {
                      fontSize: '14px',
                    },
                  }
                }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Descripción"
                value={generalFormData.description}
                onChange={(e) => handleGeneralChange('description', e.target.value)}
                fullWidth
                size="small"
                multiline
                minRows={2}
                sx={{
                  '& .MuiInputBase-root': {
                    '& .MuiInputBase-input': {
                      fontSize: '14px',
                    },
                  }
                }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Ancho"
                value={generalFormData.width}
                onChange={(e) => handleGeneralChange('width', Number(e.target.value))}
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 2, max: 12, step: 1 }}
                sx={{
                  '& .MuiInputBase-root': {
                    '& .MuiInputBase-input': {
                      fontSize: '14px',
                    },
                  }
                }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Alto"
                value={generalFormData.height}
                onChange={(e) => handleGeneralChange('height', Number(e.target.value))}
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 2, max: 25, step: 1 }}
                sx={{
                  '& .MuiInputBase-root': {
                    '& .MuiInputBase-input': {
                      fontSize: '14px',
                    },
                  }
                }}
              />
            </Box>

            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FormControlLabel
                control={<Checkbox checked={!!generalFormData.is_public} onChange={(e) => handleGeneralChange('is_public', e.target.checked)} />}
                label="Es público"
                sx={{ color: "text.primary", flex: 1, '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
              />
              <Tooltip title="Si está activado, el panel será visible para todo el mundo sin necesidad de autenticación." arrow placement="top">
                <IconButton size="small" sx={{ p: 0.5 }}>
                  <InfoOutlined sx={{ fontSize: 16, color: alpha(theme.palette.primary.main, 0.7) }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FormControlLabel
                control={<Checkbox checked={!!generalFormData.is_published} onChange={(e) => handleGeneralChange('is_published', e.target.checked)} />}
                label="Está publicado"
                sx={{ color: "text.primary", flex: 1, '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
              />
              <Tooltip title="Si está activado, el panel estará publicado y disponible para ser usado." arrow placement="top">
                <IconButton size="small" sx={{ p: 0.5 }}>
                  <InfoOutlined sx={{ fontSize: 16, color: alpha(theme.palette.primary.main, 0.7) }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Divider sx={{ my: 2 }} />
          </>
        )}

        {/* Publicación */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Security sx={{ fontSize: 22, color: 'primary.main' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Publicación
          </Typography>
        </Box>

        {isLoadingAcl ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            {/* URL Image */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Image sx={{ fontSize: 18, color: alpha(theme.palette.primary.main, 0.7) }} />
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                  URL de Imagen
                </Typography>
                <Tooltip title="URL de la imagen que se mostrará para el panel" arrow placement="top">
                  <IconButton size="small" sx={{ p: 0.25 }}>
                    <InfoOutlined sx={{ fontSize: 14, color: theme.palette.primary.main }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <TextField
                fullWidth
                size="small"
                placeholder="https://ejemplo.com/imagen.png"
                value={aclFormData.url_image}
                onChange={(e) => handleAclChange('url_image', e.target.value)}
                sx={{ '& .MuiInputBase-input': { fontSize: '14px' } }}
              />
            </Box>

            {/* Propagate Auth */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Security sx={{ fontSize: 18, color: alpha(theme.palette.primary.main, 0.7) }} />
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                  Propagar Autenticación
                </Typography>
                <Tooltip title="Si está activado, la autenticación se propagará para este panel" arrow placement="top">
                  <IconButton size="small" sx={{ p: 0.25 }}>
                    <InfoOutlined sx={{ fontSize: 14, color: theme.palette.primary.main }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={aclFormData.propagate_auth}
                    onChange={(e) => handleAclChange('propagate_auth', e.target.checked)}
                  />
                }
                label="Activar"
                sx={{ ml: 0, '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Permisos */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <VpnKey sx={{ fontSize: 22, color: 'primary.main' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Permisos de Acceso
              </Typography>
            </Box>

            {/* Permiso de Visualización */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Visibility sx={{ fontSize: 18, color: alpha(theme.palette.primary.main, 0.7) }} />
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                  Permiso de Visualización
                </Typography>
                <Tooltip title="Rol mínimo requerido para visualizar el panel" arrow placement="top">
                  <IconButton size="small" sx={{ p: 0.25 }}>
                    <InfoOutlined sx={{ fontSize: 14, color: theme.palette.primary.main }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <FormControl fullWidth size="small">
                <Select
                  value={
                    viewRoles.find(r => r.id === aclFormData.view_role?.id)?.id || ''
                  }
                  onChange={(e) => {
                    const selectedRole = viewRoles.find(r => r.id === e.target.value);
                    if (selectedRole) {
                      handlePermissionChange('view_role', e.target.value);
                    }
                  }}
                  disabled={isLoadingRoles}
                  displayEmpty
                  sx={{
                    '& .MuiSelect-select': {
                      fontSize: '14px',
                      padding: '8.5px 14px',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.divider, 0.5),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.primary.main, 0.7),
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: '1px',
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    {isLoadingRoles ? 'Cargando roles...' : 'Selecciona un rol'}
                  </MenuItem>
                  {viewRoles.map((role) => (
                    <MenuItem key={role.id} value={role.id} sx={{ fontSize: '14px' }}>
                      {role.type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Permiso de Edición */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Edit sx={{ fontSize: 18, color: alpha(theme.palette.primary.main, 0.7) }} />
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                  Permiso de Edición
                </Typography>
                <Tooltip title="Rol mínimo requerido para editar el panel" arrow placement="top">
                  <IconButton size="small" sx={{ p: 0.25 }}>
                    <InfoOutlined sx={{ fontSize: 14, color: theme.palette.primary.main }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <FormControl fullWidth size="small">
                <Select
                  value={
                    editRoles.find(r => r.id === aclFormData.edit_role?.id)?.id || ''
                  }
                  onChange={(e) => {
                    const selectedRole = editRoles.find(r => r.id === e.target.value);
                    if (selectedRole) {
                      handlePermissionChange('edit_role', e.target.value);
                    }
                  }}
                  disabled={isLoadingRoles}
                  displayEmpty
                  sx={{
                    '& .MuiSelect-select': {
                      fontSize: '14px',
                      padding: '8.5px 14px',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.divider, 0.5),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.primary.main, 0.7),
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: '1px',
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    {isLoadingRoles ? 'Cargando roles...' : 'Selecciona un rol'}
                  </MenuItem>
                  {editRoles.map((role) => (
                    <MenuItem key={role.id} value={role.id} sx={{ fontSize: '14px' }}>
                      {role.type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        )}

      </Box>
    </Box>
  );
}
