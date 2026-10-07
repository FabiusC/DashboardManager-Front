import { useMemo, useState, useEffect, useCallback } from "react"
import React from "react"
import { debounce } from 'lodash'

import { Box, Typography, TextField, InputAdornment, Tooltip, Divider, Slider, useTheme, IconButton, alpha, Switch, Button, FormControlLabel, Checkbox, CircularProgress, Select, MenuItem, FormControl } from "@mui/material"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import { Image, Build, Security, Visibility, Edit, Tune, Palette, VpnKey } from "@mui/icons-material"
import { useDispatch } from "react-redux"
import { useSelector } from "react-redux"
import { handleEditItemEntity } from "@helpers/dashboardAPI/genericRequest"
import { pushNotification } from "@redux/actions"
import { handleAddDashboard } from "../../../Dashboard/shared/utils/dashboardActions"
import SaveIcon from '@mui/icons-material/Save'
import { SaveAsRounded } from "@mui/icons-material"
import { getAclById, updateACL, getUserRol, updateACLPermissions } from "@services/creangelAuthAPI"
import validateFormContent from "@components/DashboardsWorkspace/utils/validateFormContent"
import { fontSize } from "@mui/system"

const Settings = React.memo(({
  dashboard = {},
  userToken,
  setDashboard,
}) => {
  const theme = useTheme()

  // Extraer valores del dashboard y configuración
  const config = dashboard.configuration || {}
  const dispatch = useDispatch()
  const appId = useSelector((state) => state.app?.id || null)

  const [form, setForm] = useState([
    { id: "name", title: "Nombre", type: "text", value: '', required: true },
    { id: "description", title: "Descripción", type: "textarea", value: '', required:true },
    { id: "is_public", title: "¿Es público?", type: "switch", value: false },
    { id: "is_published", title: "¿Está publicado?", type: "switch", value: false },
    { id: "use_index", title: "Usar Índice", type: "switch", value: false },
  ])

  const [configuration, setConfiguration] = useState([
    { id: "background_color", title: "Color de fondo", type: "color", value: '#F5F5F5' },
    { id: "grid_gap_x", title: "Margen (X)", type: "slider", value: 10 },
    { id: "grid_gap_y", title: "Margen (Y)", type: "slider", value: 10 },
  ])
  const [saving, setSaving] = useState(false)
  const [settingsChanged, setSettingsChanged] = useState({})
  const [configurationChanged, setConfigurationChanged] = useState({})
  
  // Estados para publicación y autorización
  const [aclData, setAclData] = useState(null)
  const [isLoadingAcl, setIsLoadingAcl] = useState(false)
  const [aclFormData, setAclFormData] = useState({
    url_image: '',
    url_builder: '',
    propagate_auth: false,
    view_role: null,
    edit_role: null
  })
  const [aclChanges, setAclChanges] = useState({})
  const [permissionChanges, setPermissionChanges] = useState({})
  const [viewRoles, setViewRoles] = useState([])
  const [editRoles, setEditRoles] = useState([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const [error, setError] = useState(false)

  // Sincronizar con dashboard cuando cambie (solo cuando cambia el dashboard inicial, no settingsChanged)
  useEffect(() => {
    // Solo sincronizar si dashboard.id cambia o si los valores base del dashboard cambian
    // No incluir dashboard.settingsChanged para evitar re-renders cuando se edita
    setForm([
      { id: "name", title: "Nombre", type: "text", value: dashboard.name || dashboard.settingsChanged?.name || '', required: true },
      { id: "description", title: "Descripción", type: "textarea", value: dashboard.description || dashboard.settingsChanged?.description || '', required: true },
      { id: "is_public", title: "Es público", type: "checkbox", value: dashboard.is_public || dashboard.settingsChanged?.is_public || false },
      { id: "is_published", title: "Está publicado", type: "checkbox", value: dashboard.is_published || dashboard.settingsChanged?.is_published || false },
      { id: "use_index", title: "Usar Índice", type: "checkbox", value: dashboard.use_index ?? dashboard.settingsChanged?.use_index ?? false },
    ])

    setConfiguration([
      { id: "background_color", title: "Color de fondo", type: "color", value: config.background_color || dashboard.settingsChanged?.configuration?.background_color || '#F5F5F5' },
      { id: "grid_gap_x", title: "Margen (X)", type: "slider", value: dashboard.settingsChanged?.configuration?.grid_gap_x || config.grid_gap_x || 10 },
      { id: "grid_gap_y", title: "Margen (Y)", type: "slider", value: dashboard.settingsChanged?.configuration?.grid_gap_y || config.grid_gap_y || 10 },
    ])
  }, [dashboard.id, dashboard.name, dashboard.description, dashboard.is_public, dashboard.is_published, dashboard.use_index, config.background_color, config.grid_gap_x, config.grid_gap_y])

  // Sincronizar estados locales con dashboard.settingsChanged solo al montar o cuando cambia el dashboard.id
  useEffect(() => {
    if (dashboard.settingsChanged && dashboard.id) {
      const { configuration: dashboardConfig, ...dashboardSettings } = dashboard.settingsChanged
      // Solo actualizar si realmente hay cambios (no vacío)
      if (Object.keys(dashboardSettings).length > 0 || (dashboardConfig && Object.keys(dashboardConfig).length > 0)) {
        setSettingsChanged(dashboardSettings)
        setConfigurationChanged(dashboardConfig || {})
      }
    }
  }, [dashboard.id]) // Solo cuando cambia el dashboard.id, no cuando cambia settingsChanged

  // Cleanup de debounces cuando el componente se desmonte
  useEffect(() => {
    return () => {
      debouncedConfigChange.cancel()
      debouncedColorChange.cancel()
    }
  }, [])

  // Función para obtener datos ACL del dashboard
  const fetchAclData = useCallback(async () => {
    const resourceId = dashboard.id;
    
    if (!resourceId) {
      console.warn('⚠️ No se encontró dashboard ID');
      return;
    }

    setIsLoadingAcl(true);

    try {
      const response = await getAclById(resourceId, {
        'Authorization': `Bearer ${userToken}`
      });

      if (response && response.status === 'success' && response.data) {
        setAclData(response.data);
        
        setAclFormData({
          url_image: response.data.url_image || '',
          url_builder: response.data.url_builder || '',
          propagate_auth: response.data.propagate_auth || false,
          view_role: response.data.view_role || null,
          edit_role: response.data.edit_role || null
        });
      }
    } catch (error) {
      console.error('Error al cargar datos de configuración ACL:', error);
    } finally {
      setIsLoadingAcl(false);
    }
  }, [dashboard.id, userToken]);

  // Función para obtener roles
  const fetchRoles = useCallback(async () => {
    const groupId = dashboard.group_id || sessionStorage.getItem('groupId');
    
    if (!groupId) {
      console.warn('⚠️ No se encontró groupId');
      return;
    }

    setIsLoadingRoles(true);

    try {
      const [viewResponse, editResponse] = await Promise.all([
        getUserRol(
          { group_id: groupId, type_mode: 'view' },
          { 'Authorization': `Bearer ${userToken}` }
        ),
        getUserRol(
          { group_id: groupId, type_mode: 'edit' },
          { 'Authorization': `Bearer ${userToken}` }
        )
      ]);

      setViewRoles(viewResponse?.status === 'ok' && Array.isArray(viewResponse.data) ? viewResponse.data : []);
      setEditRoles(editResponse?.status === 'ok' && Array.isArray(editResponse.data) ? editResponse.data : []);
    } catch (error) {
      console.error('Error al cargar roles:', error);
    } finally {
      setIsLoadingRoles(false);
    }
  }, [dashboard.group_id, userToken]);

  // Cargar datos ACL y roles al montar el componente
  useEffect(() => {
    if (dashboard.id) {
      fetchAclData();
      fetchRoles();
    }
  }, [dashboard.id, fetchAclData, fetchRoles]);

  // Handlers para cambios de ACL
  const handleAclFieldChange = useCallback((field, value) => {
    setAclFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    setAclChanges(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handlePermissionChange = useCallback((permissionType, roleId) => {
    const rolesList = permissionType === 'view_role' ? viewRoles : editRoles;
    const selectedRole = rolesList.find(r => r.id === roleId);
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

    const currentRole = aclData?.[permissionType];
    if (!currentRole?.id) {
      console.error('No se encontró el rol actual');
      return;
    }

    const viewOrEdit = permissionType === 'view_role' ? 'view' : 'edit';

    if (roleId === currentRole.id) {
      setPermissionChanges(prev => {
        const next = { ...prev };
        delete next[permissionType];
        return next;
      });
      return;
    }

    setPermissionChanges(prev => ({
      ...prev,
      [permissionType]: {
        new_role_id: roleId,
        view_or_edit: viewOrEdit
      }
    }));
  }, [viewRoles, editRoles, aclData]);

  // Handler that verifies form integrity
  const verifyForm = (data) => {
    let flaw = false; // Is any error
    // Verify required forms
    if(Object.keys(data).length > 0) {

      // Verify that 'data' is a valid object before trying to access its keys
      const isObject = (data && typeof data === 'object' && !Array.isArray(data))

      if(!isObject){
        return
      }

      const emptyFields = Object.keys(data).filter(key => !data[key])
      if(emptyFields.length > 0) {
      // Verify empty AND required fields
       const requiredFields = emptyFields.filter(key => form.find(field => field.id === key)?.required);
       if(requiredFields.length > 0){
        flaw = true;
       }
      }
    }
    // Verify individual fields
    // Description must have at least 3 words
    if(data.description) {
      const threeWords = validateFormContent(data.description);
      if(!threeWords) {
        flaw = true;
      }
    }

    return flaw;
  }

  // Handler para datos generales - memoizado para evitar recreaciones
  const handleFormChange = useCallback((id, value) => {
    const updatedForm = form.map((field) =>
      field.id === id ? { ...field, value } : field
    )
    setForm(updatedForm)
    
    // Actualizar el estado local y el dashboard
    const updatedSettings = { ...settingsChanged, [id]: value }
    setSettingsChanged(updatedSettings)

    const err = verifyForm(updatedSettings)
    setError(err);
    dashboard.functions.handleChangeSettings({ ...updatedSettings, configuration: { ...configurationChanged } })
  }, [form, settingsChanged, configurationChanged, dashboard.functions])

  // Debounce para cambios de configuración (especialmente color de fondo)
  const debouncedConfigChange = useMemo(() => debounce((id, value) => {
    setConfigurationChanged(prev => {
      const updatedConfiguration = { ...prev, [id]: value }
      dashboard.functions.handleChangeSettings({ 
        ...settingsChanged, 
        configuration: { ...updatedConfiguration } 
      })
      return updatedConfiguration
    })
  }, 300), [])

  // Debounce específico para color de fondo (más rápido para UI)
  const debouncedColorChange = useMemo(() => debounce((value) => {
    setConfigurationChanged(prev => {
      const updatedConfiguration = { ...prev, background_color: value }
      dashboard.functions.handleChangeSettings({ 
        ...settingsChanged, 
        configuration: { ...updatedConfiguration } 
      })
      return updatedConfiguration
    })
  }, 200), [])

  // Handler para configuración - memoizado para evitar recreaciones
  const handleConfigChange = useCallback((id, value) => {
    const updatedConfig = configuration.map((field) =>
      field.id === id ? { ...field, value } : field
    )
    setConfiguration(updatedConfig)
    
    // Usar debounce específico para color de fondo, general para otros campos
    if (id === 'background_color') {
      debouncedColorChange(value)
    } else {
      debouncedConfigChange(id, value)
    }
  }, [configuration])

  // Guardar ambos - memoizado para evitar recreaciones
  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      // Guardar datos generales
      const data = {
        ...settingsChanged
      }

      if(Object.keys(data).length > 0) {
        
        const response = await handleEditItemEntity(
          userToken,
          "dashboard",
          "Dashboard",
          { id: dashboard.id },
          data,
          dispatch,
          true,
        )

        if(response[1]) {
          setSettingsChanged({})
          // Limpiar los cambios guardados del dashboard
          setDashboard(prev => ({ 
            ...prev, 
            settingsChanged: {
              ...prev.settingsChanged,
              ...Object.keys(data).reduce((acc, key) => { 
                delete acc[key];
                return acc;
              }, { ...prev.settingsChanged })
            }
          }))
        }
      }

      // Guardar configuración
      if(Object.keys(configurationChanged).length > 0) {
        const configurationData = {
          ...configurationChanged,
          id: dashboard.configuration.id,
        }

        const response = await handleEditItemEntity(
          userToken,
          "dashboardConfiguration",
          "Configuración",
          { id: dashboard.configuration.id },
          configurationData,
          dispatch,
          true,
        )

        if(response[1]) {
          setDashboard(prev => ({ 
            ...prev, 
            configuration: response[1],
            settingsChanged: {
              ...prev.settingsChanged,
              configuration: {}
            }
          }))
          setConfigurationChanged({})
        }
      }

      // Guardar cambios de ACL
      const hasAclChanges = Object.keys(aclChanges).length > 0;
      const hasPermissionChanges = Object.keys(permissionChanges).length > 0;

      if (hasAclChanges || hasPermissionChanges) {
        let aclSuccess = true;
        let permissionsSuccess = true;

        // Guardar cambios de ACL básicos
        if (hasAclChanges) {
          const response = await updateACL(
            aclChanges,
            { 'Authorization': `Bearer ${userToken}` },
            dashboard.id
          );

          if (!response || (response.status !== 'success' && response.status !== 'ok')) {
            aclSuccess = false;
          } 
        }

        // Guardar cambios de permisos
        if (hasPermissionChanges) {
          for (const change of Object.values(permissionChanges)) {
            const response = await updateACLPermissions(
              { new_role_id: change.new_role_id, view_or_edit: change.view_or_edit },
              { 'Authorization': `Bearer ${userToken}` },
              aclData.id
            );

            if (!response || (response.status !== 'success' && response.status !== 'ok')) {
              permissionsSuccess = false;
            }
          }
        }

        if (aclSuccess && permissionsSuccess) {
          dispatch(pushNotification({
            msg: 'Configuración de publicación actualizada exitosamente',
            status: 'ok'
          }));

          setAclChanges({});
          setPermissionChanges({});
          await fetchAclData();
        } else {
          dispatch(pushNotification({
            msg: 'Error al actualizar algunos cambios de configuración',
            status: 'err'
          }));
        }
      }
    } catch (err) {
      console.log("Error:", err)
    } finally {
      setSaving(false)
    }
    }, [dashboard.id, dashboard.configuration?.id, settingsChanged, configurationChanged, aclChanges, permissionChanges, userToken, dispatch, setDashboard, aclData, fetchAclData])

  const fieldDescriptions = {
    name: "Nombre del tablero que se mostrará en la lista.",
    description: "Descripción del tablero para identificar su propósito.",
    is_public: "Si está activado, el tablero será visible para todo el mundo sin necesidad de autenticación.",
    is_published: "Si está activado, el tablero estará publicado y disponible para ser usado.",
    use_index: "Si está activado, los usuarios podrán desplegar el índice de tableros",
  };

  const errorsMessages = {
    emptyFields: "'{{fields}}' no puede estar vacío.",
    descriptionThreeWords: "La descripción debe tener al menos 3 palabras.",
  }
  return (
    <Box sx={{ display: "flex", height: "100%", maxHeight: "100%", overflow: "hidden" }}>
      <Box
        sx={{
          backgroundColor: '#ffffff',
          padding: 1,
          paddingTop: 0,
          overflowY: 'auto',
          width: '100%',
          height: '100%',
          maxHeight: '100%',
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", mb: 2 }}>
          <Tooltip title="Guardar cambios" arrow placement="top">
            <span>
              <IconButton 
              onClick={handleSave}
              disabled={(
                (!dashboard?.settingsChanged || Object.keys(dashboard.settingsChanged).length === 0) && 
                Object.keys(settingsChanged).length === 0 && 
                Object.keys(configurationChanged).length === 0 && 
                Object.keys(aclChanges).length === 0 && 
                Object.keys(permissionChanges).length === 0
              ) || saving || error}
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
                {saving ? <CircularProgress size={20} /> : <SaveAsRounded sx={{ fontSize: 20 }} />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Datos generales */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Tune sx={{ fontSize: 22, color: 'primary.main' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Datos Generales
          </Typography>
        </Box>
        {form.map((field) => {
          if (field.type === 'text') {
            return (
              <>
              <Box key={"field-err-"+field.id} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start', gap: 0.5, color: 'error.main', fontSize:13  }}>
               {field.value === '' && field.required &&(
                 <Typography variant="caption" sx={{ fontWeight: 100, color: 'error.main' }}>
                    {errorsMessages.emptyFields.replace('{{fields}}', field.title)}
                 </Typography>
                )}
               </Box>
              <Box key={field.id} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <TextField
                  label={field.title}
                  value={field.value}
                  onChange={e => handleFormChange(field.id, e.target.value)}
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
                <Tooltip title={fieldDescriptions[field.id] || ''} arrow placement="top">
                  <IconButton size="small" sx={{ p: 0.5, mt: 0.5 }}>
                    <InfoOutlinedIcon sx={{ fontSize: 16, color: alpha(theme.palette.primary.main, 0.7) }} />
                  </IconButton>
                </Tooltip>
              </Box>       
              </>
            )
          }
          if (field.type === 'textarea') {
            return (
              <>
               <Box key={"text-area-err-"+field.id} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start', gap: 0.5,  color: 'error.main' }}>
               {field.value === '' && field.required && !field.id === 'description' &&(
                   <Typography variant="caption" sx={{ fontWeight: 100, color: 'error.main' }}>
                     {errorsMessages.emptyFields.replace('{{fields}}', field.title)}
                   </Typography>
                )}
               </Box>
               <Box key={"description-err-"+field.id} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start', gap: 0.5,  color: 'error.main' }}>
               {field.id === 'description' && !validateFormContent(field.value) &&(
                   <Typography variant="caption" sx={{ fontWeight: 100, color: 'error.main' }}>
                     {errorsMessages.descriptionThreeWords.replace('{{fields}}', field.title)}
                   </Typography>
                )}
               </Box>
                <Box key={field.id} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <TextField
                  label={field.title}
                  value={field.value}
                  onChange={e => handleFormChange(field.id, e.target.value)}
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
                <Tooltip title={fieldDescriptions[field.id] || ''} arrow placement="top">
                  <IconButton size="small" sx={{ p: 0.5, mt: 0.5 }}>
                    <InfoOutlinedIcon sx={{ fontSize: 16, color: alpha(theme.palette.primary.main, 0.7) }} />
                  </IconButton>
                </Tooltip>
              </Box>
              </>
            )
          }
          if (field.type === 'checkbox') {
            return (
              <Box key={field.id} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FormControlLabel
                  control={<Checkbox checked={!!field.value} onChange={e => handleFormChange(field.id, e.target.checked)} />}
                  label={field.title}
                  sx={{ color: "text.primary", flex: 1, '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
                />
                <Tooltip title={fieldDescriptions[field.id] || ''} arrow placement="top">
                  <IconButton size="small" sx={{ p: 0.5 }}>
                    <InfoOutlinedIcon sx={{ fontSize: 16, color: alpha(theme.palette.primary.main, 0.7) }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )
          }
          return null
        })}
        <Divider sx={{ my: 2 }} />

        {/* Configuración */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Palette sx={{ fontSize: 22, color: 'primary.main' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Configuración Visual
          </Typography>
        </Box>
        {configuration.map((field) => {
          if (field.type === 'color') {
            return (
              <Box key={field.id} sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1, mb: 2 }}>
                <input
                  type="color"
                  value={field.value}
                  onChange={e => handleConfigChange(field.id, e.target.value)}
                  style={{
                    width: "30px",
                    height: "30px",
                    padding: 0,
                    cursor: "pointer",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                />
                <TextField
                  label={field.title}
                  value={field.value}
                  onChange={e => handleConfigChange(field.id, e.target.value)}
                  placeholder="#F5F5F5"
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Color de fondo del tablero" placement="top">
                          <IconButton>
                            <InfoOutlinedIcon sx={{ fontSize: 15, cursor: "pointer" }} />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            )
          }
          if (field.type === 'slider') {
            return (
              <Box key={field.id}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ color: "text.primary" }}>
                    {field.title}
                  </Typography>
                  <Tooltip title={`Espacio ${field.id === 'grid_gap_x' ? 'horizontal' : 'vertical'} entre paneles (1-20px)`} placement="top">
                    <IconButton>
                      <InfoOutlinedIcon sx={{ fontSize: 15, cursor: "pointer" }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Slider
                  value={field.value}
                  onChange={(_, newValue) => handleConfigChange(field.id, newValue)}
                  aria-labelledby={`${field.id}-slider`}
                  min={1}
                  max={20}
                  step={1}
                  valueLabelDisplay="auto"
                  sx={{
                    "& .MuiSlider-thumb": {
                      width: 12,
                      height: 12,
                      "&:hover": {
                        boxShadow: `0px 0px 0px 2px ${alpha(theme.palette.primary.main, 0.16)}`,
                      },
                      "&.Mui-focusVisible": {
                        boxShadow: `0px 0px 0px 2px ${alpha(theme.palette.primary.main, 0.16)}`,
                      },
                      "&.Mui-active": {
                        boxShadow: `0px 0px 0px 4px ${alpha(theme.palette.primary.main, 0.16)}`,
                      },
                    },
                    "& .MuiSlider-track": { height: 3 },
                    "& .MuiSlider-rail": { height: 3 },
                  }}
                />
              </Box>
            )
          }
          return null
        })}
        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Security sx={{ fontSize: 22, color: 'primary.main' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Publicación
          </Typography>
        </Box>

        {dashboard?.id && (dashboard?.is_public || dashboard?.settingsChanged?.is_public) && (dashboard?.is_published || dashboard?.settingsChanged?.is_published) && (
          <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: "text.primary" }}>
              Enlace público
            </Typography>
            <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mb: 1 }}>
              Para acceso público sin autenticación, comparte el enlace con <b>app_id</b>.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              disabled={!appId}
              onClick={async () => {
                const staticPrefix = process.env.staticPrefix || "";
                const url = `${window.location.origin}${staticPrefix}/dashboard/${dashboard.id}?app_id=${encodeURIComponent(appId)}`;
                try {
                  await navigator.clipboard.writeText(url);
                  dispatch(pushNotification({ msg: "Enlace público copiado al portapapeles.", status: "ok" }));
                } catch (_) {
                  dispatch(pushNotification({ msg: "No se pudo copiar el enlace. Copia manualmente desde la barra de direcciones.", status: "err" }));
                }
              }}
              sx={{ textTransform: "none" }}
            >
              Copiar enlace público
            </Button>
            {!appId && (
              <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 1 }}>
                No hay <b>app_id</b> cargado en la sesión actual.
              </Typography>
            )}
          </Box>
        )}
        
        {isLoadingAcl ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box sx={{ mt: 2, pb: 6 }}>
            {/* URL Image */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Image sx={{ fontSize: 18, color: alpha(theme.palette.primary.main, 0.7) }} />
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                  URL de Imagen
                </Typography>
                <Tooltip title="URL de la imagen que se mostrará en para el tablero" arrow placement="top">
                  <IconButton size="small" sx={{ p: 0.25 }}>
                    <InfoOutlinedIcon sx={{ fontSize: 14, color: theme.palette.primary.main }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <TextField
                fullWidth
                size="small"
                placeholder="https://ejemplo.com/imagen.png"
                value={aclFormData.url_image}
                onChange={(e) => handleAclFieldChange('url_image', e.target.value)}
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
                <Tooltip title="Si está activado, la autenticación se propagará para este tablero" arrow placement="top">
                  <IconButton size="small" sx={{ p: 0.25 }}>
                    <InfoOutlinedIcon sx={{ fontSize: 14, color: theme.palette.primary.main }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={aclFormData.propagate_auth}
                    onChange={(e) => handleAclFieldChange('propagate_auth', e.target.checked)}
                  />
                }
                label="Activar"
                sx={{ ml: 0, '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <VpnKey sx={{ fontSize: 22, color: 'primary.main' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Permisos de Acceso
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Visibility sx={{ fontSize: 18, color: alpha(theme.palette.primary.main, 0.7) }} />
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                  Permiso de Visualización
                </Typography>
                <Tooltip title="Rol mínimo requerido para visualizar el dashboard" arrow placement="top">
                  <IconButton size="small" sx={{ p: 0.25 }}>
                    <InfoOutlinedIcon sx={{ fontSize: 14, color: theme.palette.primary.main }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <FormControl fullWidth size="small">
                <Select
                  value={viewRoles.find(r => r.id === aclFormData.view_role?.id)?.id || ''}
                  onChange={(e) => handlePermissionChange('view_role', e.target.value)}
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

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Edit sx={{ fontSize: 18, color: alpha(theme.palette.primary.main, 0.7) }} />
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                  Permiso de Edición
                </Typography>
                <Tooltip title="Rol mínimo requerido para editar el dashboard" arrow placement="top">
                  <IconButton size="small" sx={{ p: 0.25 }}>
                    <InfoOutlinedIcon sx={{ fontSize: 14, color: theme.palette.primary.main }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <FormControl fullWidth size="small">
                <Select
                  value={editRoles.find(r => r.id === aclFormData.edit_role?.id)?.id || ''}
                  onChange={(e) => handlePermissionChange('edit_role', e.target.value)}
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
  )
})

export default Settings
