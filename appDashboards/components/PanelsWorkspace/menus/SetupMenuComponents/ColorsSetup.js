import { useState, useEffect, useMemo, useCallback } from "react"
import { Box, IconButton, Typography, Tooltip, CircularProgress, useTheme, alpha, Grid, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Switch, Divider } from "@mui/material"
import { AutoFixHigh, AutoAwesome, Close, SaveAsRounded, Stars } from "@mui/icons-material"
import { isEqual } from "lodash"
import { handleEditItemEntity } from "../../../../helpers/dashboardAPI/genericRequest"
import { dashboardGeneralRequest } from "../../../../services/dashboardAPI"
import { pushNotification } from "../../../../redux/actions"
import { componentContentExternalShadow } from "./external_shadow"
import GeneralPalleteColors from "./ColorsSetupComponents/GeneralPalleteColors"
import CustomPalleteColors from "./ColorsSetupComponents/CustomPalleteColors"
import SavedPaletteColors from "./ColorsSetupComponents/SavedPaletteColors"
import TabComponent from "./ColorsSetupComponents/TabComponent"
import { useDispatch } from "react-redux"
import useTabs from "../../hooks/useTabsContext";
import { usePanelContext } from "../../hooks/usePanelContext";
import { useChartContext } from "../../hooks/useChartContext";

export default function ColorsSetup(props) {
  const { changeSetupTabState } = useTabs();
  const panelHook = usePanelContext()
  const panel = panelHook.state.panel
  const chartHook = useChartContext()
  const chart = chartHook.state
  const colorStrategy   = chart.colorStrategy 
  const chartType = chart.chartType
  const chartTypeId = chart.chartTypeId
  const queryParameters = chart.queryParameters

  const selectedFields = queryParameters.selected_fields
  const fieldsDistribution = queryParameters.fields_distribution
  const queryFieldsDistribution = queryParameters.query_fields_distribution
  const hasChartType = chartType && chartTypeId && selectedFields && fieldsDistribution && queryFieldsDistribution

  const [currentStrategyType, setCurrentStrategyType] = useState(colorStrategy.strategy_type || "preset")
  const [currentComponentData, setCurrentComponentData] = useState({})
  const [initialComponentData, setInitialComponentData] = useState({})
  const [componentChanges, setComponentChanges] = useState({})

  const [componentsState, setComponentsState] = useState([])
  const [initialComponentsState, setInitialComponentsState] = useState([])

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingTabChange, setPendingTabChange] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [switchLoadingStates, setSwitchLoadingStates] = useState({})
  const dispatch = useDispatch()
  const theme = useTheme()

  const savePaletteByProject = useCallback(async (paletteData) => {
    const dataWithProjectId = {
      ...paletteData,
      project_id: sessionStorage.getItem('projectId') || null
    }
    const result = await dashboardGeneralRequest({
      nameUrl: "savePalette",
      version: "v1",
      typeRequest: "POST",
      body: dataWithProjectId,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${props.user.userID}`
      }
    })
    return result
  }, [props.user.userID, panel.project_id, dispatch])

  const handleStrategyTypeChange = useCallback(
    async (newStrategyType) => {
      setSwitchLoadingStates(prev => ({ ...prev, [newStrategyType]: true }))
      try {
        console.log("new id" , panel)
        let result = await handleEditItemEntity(
          props.user.userID,
          "updatePanelColorStrategy", 
          "estrategia de colores del panel",
          { panel_id: panel.id },
          {
            strategy_type: newStrategyType
          },
          dispatch,
          false,
        )
        if (result[0]) {
          chartHook.actions.changeColorStrategy ({
            strategy_type: newStrategyType
          })
          if (props.onPanelSaved) {
            props.onPanelSaved()
          }
        }
        setCurrentStrategyType(newStrategyType)
        dispatch(pushNotification({ msg: "Estrategia de colores actualizada correctamente.", status: "ok" }))
      } catch (error) {
        console.error("Error updating strategy type:", error)
        dispatch(pushNotification({ msg: "Error al actualizar la estrategia de colores.", status: "error" }))
      } finally {
        setSwitchLoadingStates(prev => ({ ...prev, [newStrategyType]: false }))
      }
    },
    [panel, props.user.userID, dispatch, props.onPanelSaved]
  )

  const setupComponents = useMemo(() => [
    {
      type: "preset",
      title: "Colores de la gráfica basados en paleta",
      component: <GeneralPalleteColors idPanel={panel.id} chartHook={chartHook} user={props.user} onStrategyChange={handleStrategyTypeChange} currentStrategyType={currentStrategyType} savePaletteByProject={savePaletteByProject} />,
      icon: <AutoFixHigh sx={{ fontSize: 20 }} />,
    },
    /* 
    {
      type: "custom",
      title: "Paleta de la gráfica personalizada",
      component: <CustomPalleteColors idPanel={panel.id} chartHook={chartHook} user={props.user} onStrategyChange={handleStrategyTypeChange} currentStrategyType={currentStrategyType} savePaletteByProject={savePaletteByProject} />,
      icon: <AutoAwesome sx={{ fontSize: 20 }} />,
    },
    { 
      type: "saved",
      title: "Paletas guardadas",
      component: <SavedPaletteColors idPanel={panel.id} chartHook={chartHook} user={props.user} onStrategyChange={handleStrategyTypeChange} currentStrategyType={currentStrategyType} />,
      icon: <Stars sx={{ fontSize: 20 }} />,
    }*/
  ], [currentStrategyType, String(colorStrategy ), props.user, handleStrategyTypeChange, savePaletteByProject]);

  useEffect(() => {
    const panelStrategyType = colorStrategy.strategy_type || "preset";
    if (panelStrategyType !== currentStrategyType) {
      setCurrentStrategyType(panelStrategyType);
    }
  }, [colorStrategy.strategy_type, currentStrategyType]);

  const [manualInitialPanel, setManualInitialPanel] = useState(null)

  const initialGeneralPanel = useMemo(() => {
    const basePanel = manualInitialPanel || {
      id: panel?.id ?? "",
      title: panel?.title ?? "",
      description: panel?.description ?? "",
      width: panel?.width ?? "",
      height: panel?.height ?? "",
      tags: panel?.tags ?? [],
      expanded: panel?.expanded ?? false,
      is_public: panel?.is_public ?? false,
      is_published: panel?.is_published ?? false,
    }
    return basePanel
  }, [
    manualInitialPanel,
    panel?.id,
  ])

  const [generalPanel, setGeneralPanel] = useState(initialGeneralPanel)
  useEffect(() => {
    setGeneralPanel(initialGeneralPanel)
  }, [initialGeneralPanel])

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

  const hasCurrentComponentChanged = useMemo(() => {
    return Object.keys(componentChanges).length > 0
  }, [componentChanges])

  const saveCurrentComponent = useCallback(async () => {
    setIsLoading(true)
    let previewSaved = false
    try {
      const results = []
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

      if (previewSaved && props.onPanelSaved) {
        props.onPanelSaved()
      }
      setInitialComponentData({ ...currentComponentData })
      setComponentChanges({})
    } catch (error) {
      console.error("Error saving changes:", error)
    } finally {
      setIsLoading(false)
    }
  }, [
    componentChanges,
    currentComponentData,
    props.user.userID,
    props.onPanelSaved,
  ])

  const confirmTabChange = useCallback(
    async (saveChanges = false) => {
      if (saveChanges) {
        await saveCurrentComponent()
      }

      if (pendingTabChange) {
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
            {props.tab?.label || "Colores de la gráfica"}
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
                    changeSetupTabState('setupColors', 'isActive', false)
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
            <TabComponent
              setupComponents={setupComponents}
              currentComponentType={currentStrategyType}
              onStrategyChange={handleStrategyTypeChange}
              showActivationButtons={false}
              switchLoadingStates={switchLoadingStates}
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
            Has realizado cambios que aún no han sido guardados. ¿Deseas guardar los cambios antes de continuar?
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