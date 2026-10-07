import { useState, useEffect, useMemo, useCallback } from "react"
import { Box, IconButton, Typography, Tooltip, CircularProgress, useTheme, alpha, Grid, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material"
import { SaveAsRounded, Close } from "@mui/icons-material"
import { isEqual, update } from "lodash"
import { getRequest, handleEditItemEntity } from "../../../../helpers/dashboardAPI/genericRequest"
import { useDispatch } from "react-redux"
import { StyledButton } from "../../../Recursive/mui_styled_components"
import { pushNotification } from "../../../../redux/actions"
import { componentContentExternalShadow } from "./external_shadow"
import ChartSettings from "./ChartSettings"
import useTabs from "../../hooks/useTabsContext";
import { usePanelContext } from "../../hooks/usePanelContext";
import { useChartContext } from "../../hooks/useChartContext"
import {
  IMAGE_ENTITY_TYPES,
  IMAGE_REFERENCE_PURPOSE,
  linkImage,
  unlinkImage,
} from "../../../../services/imageServerAPI";

export default function ChartSetup(props) {
  const { changeSetupTabState } = useTabs();
  const [currentComponentType, setCurrentComponentType] = useState()
  const [currentComponentData, setCurrentComponentData] = useState({})
  const [componentChanges, setComponentChanges] = useState({})

  // Estados para componentes (is_active)
  const [componentsState, setComponentsState] = useState([])
  const [initialComponentsState, setInitialComponentsState] = useState([])

  // Estados generales
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingTabChange, setPendingTabChange] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [clearTrigger, setClearTrigger] = useState(0)
  const dispatch = useDispatch()
  const theme = useTheme()
  
  // Hooks de contexto
  const panel = usePanelContext();
  const panelState = panel.state

  const chart = useChartContext()
  const chartState = chart.state
  const chartActions = chart.actions

  const hasCurrentComponentChanged = useMemo(() => {
    return Object.keys(componentChanges).length > 0
  }, [componentChanges])

  // Inicializar estados de componentes desde el contexto
  useEffect(() => {
    if (chartState.chartComponents) {
      setComponentsState(chartState.chartComponents)
      setInitialComponentsState(chartState.chartComponents)
    }
  }, [chartState.chartComponents])

  // Inicializar currentComponentType con el primer componente disponible
  useEffect(() => {
    if (
      componentsState.length > 0 &&
      (!currentComponentType || Object.keys(currentComponentType).length === 0)
    ) {
      setCurrentComponentType(componentsState[0]);
    }
  }, [componentsState, currentComponentType]);

  // Función para refrescar datos del componente
  const refreshComponentData = useCallback(
    async (componentType) => {
      if (!componentType || !componentType.id) return;
      
      try {
        const ids = {
          panel_id: panelState.panel.id,
          component_id: componentType.id,
        }  
        let response = await getRequest(
          null,
          props.user.userID,
          "",
          "",
          "chartComponent",
          "componentes del panel",
          ids,
        )
        setCurrentComponentData(response)
        setComponentChanges({})
      } catch (error) {
        console.error("Error refreshing component data:", error)
        setCurrentComponentData({})
      }
    },
    [panelState.panel.id, props.user.userID]
  )

  // Efecto para refrescar datos cuando cambia currentComponentType
  useEffect(() => {
    if (currentComponentType && currentComponentType.id) {
      refreshComponentData(currentComponentType)
    }
  }, [currentComponentType, refreshComponentData , componentsState])

  // Handler para cambio de estado de componente (switch)
  const handleComponentStateChange = useCallback(
    async (componentType, isActive) => {
      const component = componentsState.find((comp) => comp.name === componentType)
      if (!component) {
        return
      }

      try {
        const dictIds = {
          panel_id: panelState.panel.id,
          component_id: component.id,
        }

        const response = await handleEditItemEntity(
          props.user.userID,
          "chartComponent",
          "Estado del componente del gráfico",
          dictIds,
          { is_active: isActive },
          dispatch,
          true,
        )

        // Actualizar estado inicial después de guardar exitosamente
        if (response[0]) {
          if (props.onPanelSaved) {
            props.onPanelSaved()
          }
          const updated = componentsState.map((comp) => {
            if (comp.name === componentType) {
              return { ...comp, is_active: isActive }
            }
            return comp
          })
          setComponentsState(updated)
          setInitialComponentsState(updated)
          chartActions.updateChartComponents(updated)
          if (!isActive) {
            chartActions.clearLiveProps()
            setClearTrigger((prev) => prev + 1)
          }
          chartActions.forceReloadConfig()
        }
        
      } catch (error) {
        throw error
      }
    },
    [componentsState, panelState.panel.id, props.user.userID, chartActions, dispatch, props.onPanelSaved],
  )

   // Handler para cambio de componente con confirmación
   const handleComponentChange = useCallback(
    async (newComponentType, newComponentData = null) => {
      // Si hay cambios sin guardar, mostrar confirmación
      if (hasCurrentComponentChanged) {
        setPendingTabChange({ type: newComponentType, data: newComponentData })
        setConfirmOpen(true)
        return false
      }

      // Cambiar componente directamente
      setCurrentComponentType(newComponentType)
      if (newComponentData) {
        setCurrentComponentData(newComponentData)
      } else {
        setCurrentComponentData({})
      }
      setComponentChanges({})
      return true
    },
    [hasCurrentComponentChanged],
  )

  // Función recursiva para recolectar todos los elementos editados en cualquier nivel de profundidad
  const collectEditedItems = useCallback((obj, path = []) => {
    const editedItems = [];

    const traverse = (currentObj, currentPath) => {
      if (!currentObj || typeof currentObj !== 'object') {
        return;
      }

      if (currentObj.edited === true && currentObj.content_id) {
        editedItems.push({
          path: currentPath,
          content_id: currentObj.content_id,
          value: currentObj.value,
          value_type: currentObj.value_type
        });
      }

      // Recorro todos los hijos
      for (const [key, value] of Object.entries(currentObj)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          traverse(value, [...currentPath, key]);
        }
      }
    };

    traverse(obj, path);
    return editedItems;
  }, []);

  const getImageIdFromComponentData = useCallback((componentData) => {
    const imageContent = componentData?.chart_parameter_component_content?.find(
      (content) =>
        content.type === "imageId" ||
        content.frontend_input_type === "image_picker",
    );
    return String(imageContent?.value || "").trim();
  }, []);

  const synchronizeImageReference = useCallback(
    async (previousImageId, nextImageId) => {
      const panelId = panelState.panel?.id;
      if (
        chartState.chartType?.name !== "image" ||
        !panelId ||
        previousImageId === nextImageId
      ) {
        return;
      }

      if (nextImageId) {
        await linkImage({
          imageId: nextImageId,
          entityType: IMAGE_ENTITY_TYPES.PANEL,
          entityId: panelId,
          purpose: IMAGE_REFERENCE_PURPOSE.CONTENT,
          token: props.user.userID,
        });
        return;
      }

      if (previousImageId) {
        await unlinkImage({
          imageId: previousImageId,
          entityType: IMAGE_ENTITY_TYPES.PANEL,
          entityId: panelId,
          purpose: IMAGE_REFERENCE_PURPOSE.CONTENT,
          token: props.user.userID,
        });
      }
    },
    [
      chartState.chartType?.name,
      panelState.panel?.id,
      props.user.userID,
    ],
  );

  const saveCurrentComponent = useCallback(async (afterSaveCallback = null, nextTabChange = null) => {
    setIsLoading(true)
    let previewSaved = false
    try {
        const results = []
        const editedImage = Object.values(componentChanges)
          .flatMap((componentData) => collectEditedItems(componentData))
          .find((item) => item.path[item.path.length - 1] === "imageId")
        // Guardar cambios de la componente específica
        if (Object.keys(componentChanges).length > 0) {
          for (const [componentKey, componentData] of Object.entries(componentChanges)) {
            const { id: componentId, ...contents } = componentData
            // Recolectar todos los elementos editados en cualquier nivel
            const editedItems = collectEditedItems(contents);
            // Procesar cada elemento editado
            for (const editedItem of editedItems) {
              const { content_id, value, value_type } = editedItem;
              const valueStr = String(value);
              const dictIds = {
                component_id: componentId,
                content_id: content_id,
              }
              const result = await handleEditItemEntity(
                props.user.userID,
                "panelChartContent",
                "contenido del panel",
                dictIds,
                { value: valueStr, value_type: value_type },
                dispatch,
                false,
              )
              results.push(result[0])
            }
          }
        }
        if (results.length > 0 && results.every(Boolean)) {
          previewSaved = true
          dispatch(pushNotification({ msg: "Todos los cambios se guardaron correctamente.", status: "ok" }));
          if (editedImage) {
            const previousImageId = getImageIdFromComponentData(currentComponentData);
            const nextImageId = String(editedImage.value || "").trim();
            try {
              await synchronizeImageReference(previousImageId, nextImageId);
            } catch (referenceError) {
              console.error("Error synchronizing image reference:", referenceError);
              dispatch(pushNotification({
                msg: "Los estilos se guardaron, pero no se pudo actualizar la referencia de la imagen.",
                status: "err",
              }));
            }
          }
          // Recargar configuración del gráfico
          chartActions.forceReloadConfig()
        }
        
        // Si hay cambio de tab pendiente, refresca el nuevo componente, si no, refresca el actual
        if (nextTabChange) {
          refreshComponentData(nextTabChange.type)
        } else {
          refreshComponentData(currentComponentType)
        }

        if (previewSaved && props.onPanelSaved) {
          props.onPanelSaved()
        }
        if (afterSaveCallback) {
          afterSaveCallback()
        }
    } catch (error) {
      console.error("Error saving changes:", error)
      clearChartSettingsState()

    } finally {
      setIsLoading(false)
    }
  }, [
    currentComponentType,
    componentChanges,
    props.user.userID,
    collectEditedItems,
    chartActions,
    refreshComponentData,
    props.onPanelSaved,
    currentComponentData,
    getImageIdFromComponentData,
    synchronizeImageReference,
  ])  

  // Función para limpiar el estado del ChartSettings
  const clearChartSettingsState = useCallback(() => {
    setComponentChanges({})
    chartActions.clearLiveProps()
    setClearTrigger(prev => prev + 1)
  }, [chartActions])

  // Confirmar cambio de tab después de guardar o descartar
  const confirmTabChange = useCallback(
    async (saveChanges = false) => {
      if (saveChanges) {
        await saveCurrentComponent(() => {
          if (pendingTabChange) {
            setCurrentComponentType(pendingTabChange.type)
            if (pendingTabChange.data) {
              setCurrentComponentData(pendingTabChange.data)
            } else {
              setCurrentComponentData({})
            }
            setComponentChanges({})
            setPendingTabChange(null)
          }
          setConfirmOpen(false)
        }, pendingTabChange)
      } else {
        // Limpiar cambios pendientes
        clearChartSettingsState()
        if (pendingTabChange) {
          setCurrentComponentType(pendingTabChange.type)
          if (pendingTabChange.data) {
            setCurrentComponentData(pendingTabChange.data)
          } else {
            setCurrentComponentData({})
          }
          setComponentChanges({})
          setPendingTabChange(null)
        }
        setConfirmOpen(false)
      }
    },
    [pendingTabChange, saveCurrentComponent, clearChartSettingsState]
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
            {props.tab?.label || "Configuraciones del gráfico"}
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
                    changeSetupTabState('setupChart', 'isActive', false)
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
            <ChartSettings
              user={props.user}
              panel={panel}
              onComponentChange={handleComponentChange}
              componentsState={componentsState}
              currentComponentData={currentComponentData}
              setCurrentComponentData={setCurrentComponentData} 
              onComponentStateChange={handleComponentStateChange}
              setCurrentComponentType={setCurrentComponentType}
              currentComponentType={currentComponentType}
              onContentChange={setComponentChanges}
              clearTrigger={clearTrigger}
            />
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
            que aún no han sido guardados. ¿Desea guardar los cambios antes de continuar?
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