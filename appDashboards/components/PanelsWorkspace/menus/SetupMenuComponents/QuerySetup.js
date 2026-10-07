import { useState, useEffect, useMemo, useCallback } from "react"
import { Box, IconButton, Typography, Tooltip, CircularProgress, useTheme, alpha, Grid, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material"
import { SaveAsRounded, Close, FilterAlt, Tune, MenuBook } from "@mui/icons-material"
import { isEqual, update } from "lodash"
import PanelSettings from "./PanelSettings"
import { handleEditItemEntity } from "../../../../helpers/dashboardAPI/genericRequest"
import { useDispatch } from "react-redux"
import { StyledButton } from "../../../Recursive/mui_styled_components"
import { pushNotification } from "../../../../redux/actions"
import { componentContentExternalShadow } from "./external_shadow"



import GeneralConfiguration from "./QuerySetupComponents/GeneralConfiguration"
import CustomFilters from "./QuerySetupComponents/CustomFilters"
import DictionaryConfiguration from "./QuerySetupComponents/DictionaryConfiguration"
import TabComponent from "./QuerySetupComponents/TabComponent"
import useTabs from "../../hooks/useTabsContext";
import { useChartContext } from "../../hooks/useChartContext";


export default function QuerySetup(props) {
  const { changeSetupTabState } = useTabs();
  const chartContext = useChartContext();


  // Estados para componente individual
  const [currentComponentType, setCurrentComponentType] = useState("general")
  const [currentComponentData, setCurrentComponentData] = useState({})
  const [initialComponentData, setInitialComponentData] = useState({})
  const [componentChanges, setComponentChanges] = useState({})

    // Estados para componentes (is_active)
  const [componentsState, setComponentsState] = useState([])
  const [initialComponentsState, setInitialComponentsState] = useState([])

  // Estados generales
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingTabChange, setPendingTabChange] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const dispatch = useDispatch()
  const theme = useTheme()
  
  // Estado inicial del panel general
  const [manualInitialPanel, setManualInitialPanel] = useState(null)

  const handleCustomFiltersChange = useCallback(
    (nextFilters) => {
      chartContext.actions.updateQueryParams({
        filters: nextFilters,
      });
    },
    [chartContext.actions]
  );

  const setupComponents = useMemo(
    () => [
      {
        type: "general",
        title: "Configuración general",
        component: <GeneralConfiguration panel={props.panel} user={props.user} />,
        icon: <Tune sx={{ fontSize: 20 }} />,
      },
      {
        type: "custom_filters",
        title: "Filtros personalizados",
        component: (
          <CustomFilters
            filters={chartContext.state.queryParameters?.filters}
            onFiltersChange={handleCustomFiltersChange}
          />
        ),
        icon: <FilterAlt sx={{ fontSize: 20 }} />,
      },
      {
        type: "dictionary",
        title: "Diccionario",
        component: <DictionaryConfiguration user={props.user} />,
        icon: <MenuBook sx={{ fontSize: 20 }} />,
      },
    ],
    [props.panel, props.user, chartContext.state.queryParameters?.filters, handleCustomFiltersChange]
  );

  const initialGeneralPanel = useMemo(() => {
    const basePanel = manualInitialPanel || {
      id: props.panel?.id ?? "",
      title: props.panel?.title ?? "",
      description: props.panel?.description ?? "",
      width: props.panel?.width ?? "",
      height: props.panel?.height ?? "",
      tags: props.panel?.tags ?? [],
      expanded: props.panel?.expanded ?? false,
      is_public: props.panel?.is_public ?? false,
      is_published: props.panel?.is_published ?? false,
    }
    return basePanel
  }, [
    manualInitialPanel,
    props.panel?.id,
  ])

  const [generalPanel, setGeneralPanel] = useState(initialGeneralPanel)
  // Sincronizar generalPanel cuando cambien las props
  useEffect(() => {
    setGeneralPanel(initialGeneralPanel)
  }, [initialGeneralPanel])

  // Inicializar estados de componentes
  useEffect(() => {
    if (props.panel?.components) {
      const allowedComponentKeys = ["title", "description", "background", "external_border", "external_shadow", "menu_actions"]
      const filteredComponents = props.panel.components.filter((component) =>
        allowedComponentKeys.includes(component.type),
      )
      setComponentsState(filteredComponents)
      setInitialComponentsState(filteredComponents)
    }
  }, [props.panel?.components])

  // Detectar cambios en la componente actual
  const hasCurrentComponentChanged = useMemo(() => {
    if (currentComponentType === "general") {
      return !isEqual(generalPanel, initialGeneralPanel)
    }
    return Object.keys(componentChanges).length > 0
  }, [currentComponentType, generalPanel, initialGeneralPanel, componentChanges])

  // Handler para cambio de estado de componente (switch)
  const handleComponentStateChange = useCallback(
    async (componentType, isActive) => {

      // Buscar el componente ANTES de actualizar el estado
      const component = componentsState.find((comp) => comp.type === componentType)
      if (!component) {
        return
      }
      
      let updateStateComponente = {
        [componentType]: {
          is_active: isActive,
        }
      }

      props.panel.functions.handleSetUpPanel( updateStateComponente )

      // Actualizar estado inmediatamente
      setComponentsState((prev) => {
        const updated = prev.map((comp) => {
          if (comp.type === componentType) {
            return { ...comp, is_active: isActive }
          }
          return comp
        })
        return updated
      })

      // Enviar petición inmediatamente
      try {
        const dictIds = {
          panel_id: generalPanel.id,
          component_id: component.id,
        }

        const result = await handleEditItemEntity(
          props.user.userID,
          "panelComponent",
          "estado del componente del panel",
          dictIds,
          { is_active: isActive },
          dispatch,
          true,
        )
        if (result && result[0] && props.onPanelSaved) {
          props.onPanelSaved()
        }

        // Actualizar estado inicial después de guardar exitosamente
        setInitialComponentsState((prev) =>
          prev.map((comp) => {
            if (comp.type === componentType) {
              return { ...comp, is_active: isActive }
            }
            return comp
          }),
        )
      } catch (error) {
        // Revertir cambio en caso de error
        updateStateComponente = {
          [componentType]: {
            is_active: !isActive, 
          },
        }
        props.panel.functions.handleSetUpPanel( updateStateComponente )
        setComponentsState((prev) =>
          prev.map((comp) => {
            if (comp.type === componentType) {
              const originalComponent = initialComponentsState.find((c) => c.type === componentType)
              return { ...comp, is_active: originalComponent?.is_active ?? false }
            }
            return comp
          }),
        )
        throw error
      }
    },
    [componentsState, initialComponentsState, generalPanel.id, props.user.userID, props.onPanelSaved],
  )
  // Handler para cambio de componente con confirmación
  const handleComponentChange = useCallback(
    async (newComponentType, newComponentData = null) => {

      //! Esto es solo de prueba eliminar cuando este el nuevo shadow
      const external_shadowComponent= componentContentExternalShadow
      // Si hay cambios sin guardar, mostrar confirmación
      if (hasCurrentComponentChanged) {
        setPendingTabChange({ type: newComponentType, data: newComponentData })
        setConfirmOpen(true)
        return false
      }

      // Cambiar componente directamente
      setCurrentComponentType(newComponentType)
      if (newComponentData) {
        if (newComponentType === "external_shadow_") {
          const updateComponent = {
            ...newComponentData,
            components_content: [external_shadowComponent],
          }

          console.log("Setting up external shadow component:", updateComponent);
          
          setCurrentComponentData(updateComponent)
          setInitialComponentData(updateComponent)
        } else {
          setCurrentComponentData(newComponentData)
          setInitialComponentData(newComponentData)
        }
      } else if (newComponentType === "general") {
        setCurrentComponentData({})
        setInitialComponentData({})
      } else {
        setCurrentComponentData({})
        setInitialComponentData({})
      }
      setComponentChanges({})
      return true
    },
    [hasCurrentComponentChanged],
  )

  // Guardar cambios de la componente actual
  const saveCurrentComponent = useCallback(async () => {
    setIsLoading(true)
    let previewSaved = false
    try {
      if (currentComponentType === "general") {
        // Guardar cambios del panel general
        const changedGeneralPanel = Object.keys(generalPanel).reduce((acc, key) => {
          if (generalPanel[key] !== initialGeneralPanel[key]) {
            acc[key] = generalPanel[key]
          }
          return acc
        }, {})

        if (Object.keys(changedGeneralPanel).length > 0) {
          const result = await handleEditItemEntity(
            props.user.userID,
            "panel",
            "panel",
            { id: generalPanel.id },
            changedGeneralPanel,
            dispatch,
            false,
          )
          previewSaved = Boolean(result && result[0])
          setManualInitialPanel({ ...generalPanel })
        }
      } else {
        const results= []
        // Guardar cambios de la componente específica
        if (Object.keys(componentChanges).length > 0) {
          for (const [componentKey, componentData] of Object.entries(componentChanges)) {
            const { id: componentId, ...contents } = componentData
            for (const [contentKey, contentValue] of Object.entries(contents)) {
              const { content_id, value, value_type } = contentValue
              
              const valueStr = String(value)

              const dictIds = {
                panel_id: generalPanel.id,
                component_id: componentId,
                content_id: content_id,
              }

              const result = await handleEditItemEntity(
                props.user.userID,
                "panelContent",
                "contenido del panel",
                dictIds,
                { value: valueStr, value_type: value_type },
                dispatch,
                false,
              )
              results.push(result && result[0])
            }
          }
          console.log("Saving component changes:", componentChanges)
        }
        console.log("results from saving component changes:", results);
        if (results.length > 0 && results.every(Boolean)) {
          previewSaved = true
          dispatch(pushNotification({ msg: "Todos los cambios se guardaron correctamente.", status: "ok" }));
        }
      }

      if (previewSaved && props.onPanelSaved) {
        props.onPanelSaved()
      }
      // Actualizar estados iniciales después de guardar
      if (currentComponentType === "general") {
        // El estado inicial ya se actualiza automáticamente por el useMemo
      } else {
        setInitialComponentData({ ...currentComponentData })
      }
      setComponentChanges({})
    } catch (error) {
      console.error("Error saving changes:", error)
    } finally {
      setIsLoading(false)
    }
  }, [
    currentComponentType,
    generalPanel,
    initialGeneralPanel,
    componentChanges,
    currentComponentData,
    props.user.userID,
    props.onPanelSaved,
  ])

  // Confirmar cambio de tab después de guardar o descartar
  const confirmTabChange = useCallback(
    async (saveChanges = false) => {
      if (saveChanges) {
        await saveCurrentComponent()
      }

      if (pendingTabChange) {
        setCurrentComponentType(pendingTabChange.type)
        if (pendingTabChange.data) {
          setCurrentComponentData(pendingTabChange.data)
          setInitialComponentData(pendingTabChange.data)
        } else {
          setCurrentComponentData({})
          setInitialComponentData({})
        }
        setComponentChanges({})
        setPendingTabChange(null)
      }
      setConfirmOpen(false)
    },
    [pendingTabChange, saveCurrentComponent],
  )

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Box sx={{ width: "100%", height: "100%" }}>
        <Box
          sx={{
            width: "95%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexDirection: "row",
            gap: 0.5,
            paddingTop: 0,
            paddingBottom: 0,
            minHeight: 50,
            paddingLeft: 2,
            paddingRight: 2,
          }}
        >
          <Typography sx={{ fontSize: "15px", fontWeight: "bold", width: "70%" }}>
            {props.tab?.label || "Parámetros de consulta"}
          </Typography>
          <Box
            sx={{
              width: "20%",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 0.2,
            }}
          >
            {hasCurrentComponentChanged && (
              <Tooltip title="Guardar cambios" arrow>
                <IconButton
                  onClick={saveCurrentComponent}
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
                  }}
                >
                  {isLoading ? <CircularProgress size={20} /> : <SaveAsRounded sx={{ fontSize: "20px" }} />}
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Cerrar" arrow>
              <IconButton
                onClick={() => {
                  if (hasCurrentComponentChanged) {
                    setPendingTabChange({ type: "close" })
                    setConfirmOpen(true)
                  } else {
                    changeSetupTabState('setupQuery', 'isActive', false)
                  }
                }}
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
                }}
              >
                <Close sx={{ fontSize: "20px" }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Box sx={{ width: "100%" }}>
          <Grid container spacing={0} sx={{ height: "100%" }}>
            <TabComponent setupComponents={setupComponents} />
          </Grid>
        </Box>
      </Box>

      {/* Dialog de confirmación para cambios sin guardar */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Cambios sin guardar
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Has realizado cambios en{" "}
            {currentComponentType === "general" ? "la configuración general" : `el componente ${currentComponentData.type_es}`}{" "}
            que aún no han sido guardados. ¿Deseas guardar los cambios antes de continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: "space-between",
            paddingX: 3,
            paddingBottom: 2,
          }}
        >
          <Button onClick={() => confirmTabChange(false)} color="error" variant="contained">
            Descartar cambios
          </Button>
          <Box display="flex" gap={1}>
            <Button
              onClick={() => {
                setConfirmOpen(false)
                setPendingTabChange(null)
              }}
              color="primary"
              variant="outlined"
            >
              Cancelar
            </Button>
            <Button onClick={() => confirmTabChange(true)} variant="contained" color="primary">
              Guardar cambios
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  )
}