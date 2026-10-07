  import { useState, useEffect, useMemo, useCallback } from "react"
  import { Box, IconButton, Typography, Tooltip, CircularProgress, useTheme, alpha, Grid, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material"
  import { SaveAsRounded, Close } from "@mui/icons-material"
  import { isEqual, update } from "lodash"
  import PanelSettings from "./PanelSettings"
  import { getRequest, handleEditItemEntity } from "../../../../helpers/dashboardAPI/genericRequest"
  import { useDispatch } from "react-redux"
  import { StyledButton } from "../../../Recursive/mui_styled_components"
  import { pushNotification } from "../../../../redux/actions"
  import { componentContentExternalShadow } from "./external_shadow"
  import useTabs from "../../hooks/useTabsContext";
  import {usePanelContext} from "../../hooks/usePanelContext";

  export default function PanelSetup(props) {
    const { changeSetupTabState } = useTabs();
    const panelHook = usePanelContext();
    const panelState = panelHook.state.panel;
    const panelStateSetup = panelHook.state.setUp;

    const panelActions = panelHook.actions;
    // Estados para componente individual
    const [currentComponentType, setCurrentComponentType] = useState("general")
    const [currentComponentData, setCurrentComponentData] = useState({})
    const [initialComponentData, setInitialComponentData] = useState({})
    const [componentChanges, setComponentChanges] = useState({})
    
      // Estados para componentes (is_active)
    const [componentsState, setComponentsState] = useState([])
    const [initialComponentsState, setInitialComponentsState] = useState([])

    // Estados para publicación ACL
    const [aclChanges, setAclChanges] = useState({})
    const [saveAclCallback, setSaveAclCallback] = useState(null)

    // Estados generales
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [pendingTabChange, setPendingTabChange] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [clearTrigger, setClearTrigger] = useState(0)
    const dispatch = useDispatch()
    const theme = useTheme()
    
    const [manualInitialPanel, setManualInitialPanel] = useState(null)

    const initialGeneralPanel = useMemo(() => {
      const basePanel = manualInitialPanel || {
        id: panelState?.id ?? "",
        title: panelState?.title ?? "",
        description: panelState?.description ?? "",
        width: panelState?.width ?? "",
        height: panelState?.height ?? "",
        tags: panelState?.tags ?? [],
        expanded: panelState?.expanded ?? false,
        is_public: panelState?.is_public ?? false,
        is_published: panelState?.is_published ?? false,
      }
      return basePanel
    }, [
      manualInitialPanel,
      panelState?.id,
    ])

    const [generalPanel, setGeneralPanel] = useState(initialGeneralPanel)


    // Sincronizar generalPanel cuando cambien las props
    useEffect(() => {
      setGeneralPanel(initialGeneralPanel)
    }, [initialGeneralPanel])

    // Inicializar estados de componentes
    useEffect(() => {

      if (panelStateSetup?.components) {
        const allowedComponentKeys = ["title", "description", "background", "external_border", "external_shadow", "menu_actions","dimensions"]
        const componentsArray = Object.values(panelStateSetup.components);

        const filteredComponents = componentsArray.filter((component) =>
          allowedComponentKeys.includes(component.type),
        )
        setComponentsState(filteredComponents)
        setInitialComponentsState(filteredComponents)
      }
    }, [panelStateSetup?.components])

    // Detectar cambios en la componente actual
    const hasCurrentComponentChanged = useMemo(() => {
      console.log("currentComponentType", currentComponentType, componentChanges);
      if (currentComponentType === "general") {
        return !isEqual(generalPanel, initialGeneralPanel)
      }
      if (currentComponentType === "publication") {
        return Object.keys(aclChanges).length > 0
      }
      return Object.keys(componentChanges).length > 0
    }, [currentComponentType, generalPanel, initialGeneralPanel, componentChanges, aclChanges])

    // Handler para cambio de estado de componente (switch)
    const handleComponentStateChange = useCallback(
      async (componentType, isActive) => {
        const component = componentsState.find((comp) => comp.type === componentType)
        if (!component) {
          return
        }
        const activeBorderContent =
          componentType === "external_border" && !isActive
            ? currentComponentData?.components_content?.find((content) => content.type === "active_border")
            : null

        let updateStateComponente = {
          [componentType]: {
            is_active: isActive,
            ...(activeBorderContent && { active_border: { value: "false" } }),
          }
        }

        panelActions.handleSetUpChangedPanel( updateStateComponente )

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
          if (activeBorderContent && String(activeBorderContent.value).toLowerCase() !== "false") {
            const result = await handleEditItemEntity(
              props.user.userID,
              "panelContent",
              "contenido del panel",
              {
                component_id: component.id,
                content_id: activeBorderContent.id,
              },
              { value: "false", value_type: activeBorderContent.value_type },
              dispatch,
              false,
            )
            if (!result?.[0]) {
              throw new Error("No se pudo desactivar el borde separador")
            }
          }

          if (activeBorderContent) {
            setCurrentComponentData((prev) => ({
              ...prev,
              components_content: prev.components_content?.map((content) =>
                content.type === "active_border" ? { ...content, value: "false" } : content,
              ),
            }))
          }

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
              ...(activeBorderContent && { active_border: { value: String(activeBorderContent.value) } }),
            }
          }
          panelActions.handleSetUpChangedPanel( updateStateComponente )
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
      [
        componentsState,
        initialComponentsState,
        generalPanel.id,
        props.user.userID,
        props.onPanelSaved,
        currentComponentData,
      ],
    )
    // Handler para cambio de componente con confirmación
    const handleComponentChange = useCallback(
      async (newComponentType, newComponentData = null) => {

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

    const refreshComponentData = useCallback(
      async (componentType, componentId) => {
        try {
          const ids = {
            panel_id: generalPanel.id,
            component_id: componentId,
          }
          const response = await getRequest(
            null,
            props.user.userID,
            "",
            "",
            "panelComponent",
            "componentes del panel",
            ids,
          )
          // Aquí actualizas el estado local con la nueva data
          setCurrentComponentType(componentType)
          setCurrentComponentData(response)
          setInitialComponentData(response)
          setComponentChanges({})
        } catch (error) {
          // Manejo de error, puedes notificar si quieres
          setCurrentComponentData({})
          setInitialComponentData({})
        }
      },
      [generalPanel.id, props.user.userID]
    )

    useEffect(() => {
      if (!componentsState?.length) return

      const hasSelectedComponent = componentsState.some((comp) => comp.type === currentComponentType)
      if (hasSelectedComponent) return

      const firstComponent = componentsState[0]
      if (!firstComponent?.id || !firstComponent?.type) return

      setCurrentComponentType(firstComponent.type)
      refreshComponentData(firstComponent.type, firstComponent.id)
    }, [componentsState, currentComponentType, refreshComponentData])

    const saveCurrentComponent = useCallback(async (afterSaveCallback = null, nextTabChange = null) => {
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
            dispatch(pushNotification({ msg: "Cambios guardados correctamente.", status: "ok" }));
          }

        } else if (currentComponentType === "publication") {
          // Guardar cambios de configuración ACL
          if (saveAclCallback) {
            const success = await saveAclCallback()
            if (success) {
              previewSaved = true
              setAclChanges({})
            }
          }
        } else {
          const results = []
          // Guardar cambios de la componente específica
          if (Object.keys(componentChanges).length > 0) {
            console.log("Juan componentChanges", componentChanges);
            for (const [componentKey, componentData] of Object.entries(componentChanges)) {
              const { id: componentId, ...contents } = componentData
              // Recolectar todos los elementos editados en cualquier nivel
              const editedItems = collectEditedItems(contents);
              console.log("Juan editedItems", editedItems);
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
          }
          if (results.length > 0 && results.every(Boolean)) {
            previewSaved = true
            dispatch(pushNotification({ msg: "Todos los cambios se guardaron correctamente.", status: "ok" }));
          }
        }

        // Actualizar estados iniciales después de guardar
        if (currentComponentType === "general") {
          // El estado inicial ya se actualiza automáticamente por el useMemo
        } else if (currentComponentType === "publication") {
          // Para publicación, solo limpiar cambios
          clearPanelSettingsState()
        } else {
          setInitialComponentData({ ...currentComponentData })
          // Si hay cambio de tab pendiente, refresca el nuevo componente, si no, refresca el actual
          if (nextTabChange) {
            refreshComponentData(nextTabChange.type, nextTabChange.data?.id)
          } else {
            refreshComponentData(currentComponentType, currentComponentData.id)
          }
          clearPanelSettingsState()
        }

        panelActions.refreshSetUp({reduxDispatch: dispatch, userID: props.user.userID, panelId: generalPanel.id})
        if (previewSaved && props.onPanelSaved) {
          props.onPanelSaved()
        }
        if (afterSaveCallback) {
          afterSaveCallback()
        }
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
      collectEditedItems,
      saveAclCallback,
      props.onPanelSaved,
    ])

    // Función para limpiar el estado del PanelSettings
    const clearPanelSettingsState = useCallback(() => {
      setComponentChanges({})
      setAclChanges({})
      panelActions.handleSetUpChangedPanel({})
      setClearTrigger(prev => prev + 1)
    }, [props.panel])

    // Confirmar cambio de tab después de guardar o descartar
    const confirmTabChange = useCallback(
      async (saveChanges = false) => {
        if (saveChanges) {
          await saveCurrentComponent(() => {
            console.log("pendingTabChange", pendingTabChange);
            if (pendingTabChange) {
              // Si el cambio pendiente es cerrar el panel
              if (pendingTabChange.type === "close") {
                changeSetupTabState('setupPanel', 'isActive', false)
              } else {
                setCurrentComponentType(pendingTabChange.type)
                if (pendingTabChange.data) {
                  setCurrentComponentData(pendingTabChange.data)
                  setInitialComponentData(pendingTabChange.data)
                } else {
                  setCurrentComponentData({})
                  setInitialComponentData({})
                }
                setComponentChanges({})
              }
              setPendingTabChange(null)
            }
            setConfirmOpen(false)
          }, pendingTabChange)
        } else {
          clearPanelSettingsState()
          if (pendingTabChange) {
            // Si el cambio pendiente es cerrar el panel
            if (pendingTabChange.type === "close") {
              changeSetupTabState('setupPanel', 'isActive', false)
            } else {
              setCurrentComponentType(pendingTabChange.type)
              if (pendingTabChange.data) {
                setCurrentComponentData(pendingTabChange.data)
                setInitialComponentData(pendingTabChange.data)
              } else {
                setCurrentComponentData({})
                setInitialComponentData({})
              }
              setComponentChanges({})
            }
            setPendingTabChange(null)
          }
          setConfirmOpen(false)
        }
      },
      [pendingTabChange, saveCurrentComponent, clearPanelSettingsState],
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
              {props.tab?.label || "Panel Setup"}
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
                      changeSetupTabState('setupPanel', 'isActive', false)
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
              <PanelSettings
                user={props.user}
                panel={panelHook}
                currentComponentData={currentComponentData}
                setCurrentComponentData={setCurrentComponentData}
                onComponentChange={handleComponentChange}
                generalPanel={generalPanel}
                setGeneralPanel={setGeneralPanel}
                componentsState={componentsState}
                onContentChange={setComponentChanges}
                currentComponentType={currentComponentType}
                setCurrentComponentType={setCurrentComponentType}
                onComponentStateChange={handleComponentStateChange}
                clearTrigger={clearTrigger}
                onAclChanges={setAclChanges}
                onSaveAclCallback={setSaveAclCallback}
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
              {currentComponentType === "general" 
                ? "la configuración general" 
                : currentComponentType === "publication"
                ? "la configuración de publicación"
                : `el componente ${currentComponentData.type_es}`}{" "}
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