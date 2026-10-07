import {
  Box,
  Typography,
  Select,
  Divider,
  MenuItem,
  Switch,
  Paper,
  Tabs,
  Tab,
  Tooltip,
  alpha,
  useTheme,
  Stack,
  CircularProgress,
  Alert,
  TextField,
} from "@mui/material"
import { BorderStyle, ColorLens, MoreVert, Summarize, TextFields, Tonality, Straighten } from "@mui/icons-material"
import { cloneElement, useCallback, useEffect, useMemo, useState } from "react"
import { getRequest } from "../../../../helpers/dashboardAPI/genericRequest"
import ColorHexInput from "./contentPanels/ColorHexInput"
import ColorRgbaInput from "./contentPanels/ColorRgbaInput"
import RangeInput from "./contentPanels/RangeInput"
import CheckerInput from "./contentPanels/CheckerInput"
import ShadowSelector from "./contentPanels/ShadowSelector"

const PanelSettings = ({
  user,
  panel,
  currentComponentData,
  setCurrentComponentData,
  onComponentChange,
  generalPanel,
  setGeneralPanel,
  componentsState,
  onContentChange,
  currentComponentType,
  setCurrentComponentType,
  onComponentStateChange,
  clearTrigger,
  onAclChanges,
  onSaveAclCallback,
}) => {
  const [updateComponent, setUpdateComponent] = useState({})
  const [activeTab, setActiveTab] = useState(0)
  const [isLoadingTab, setIsLoadingTab] = useState(false)
  const [switchLoadingStates, setSwitchLoadingStates] = useState({})
  const [error, setError] = useState(null)
  const theme = useTheme()

  // Sincronizar cambios con el componente padre
  useEffect(() => {
    onContentChange(updateComponent)
    panel.actions.handleSetUpChangedPanel(updateComponent)
  }, [updateComponent, onContentChange])

  // Limpiar updateComponent cuando se descartan cambios
  useEffect(() => {
    if (clearTrigger > 0) {
      setUpdateComponent({})
    }
  }, [clearTrigger])

  // handleInputChange con estructura plana del primer nivel
  const handleInputChange = useCallback((sectionKey, fieldKey, componentID, value, value_type, id, parentData) => {
    const parentKeys = [...parentData, fieldKey];

    setUpdateComponent((prev) => {
      const updatedComponent = { ...prev };

      let currentLevel = updatedComponent[sectionKey] || { id };
      updatedComponent[sectionKey] = currentLevel;

      for (let i = 0; i < parentKeys.length - 1; i++) {
        const key = parentKeys[i];
        if (!currentLevel[key]) {
          currentLevel[key] = {};
        }
        currentLevel = currentLevel[key];
      }

      const lastKey = parentKeys[parentKeys.length - 1];

      currentLevel[lastKey] = {
        content_id: componentID,
        value,
        value_type,
        edited: true,
      };

      return updatedComponent;
    });
  }, []);

  // getValue que busca en la estructura anidada usando parentData como path
  const getNestedValue = (obj, keys, defaultValue) => {
    let current = obj;
    for (let key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }
    return current?.value !== undefined ? current.value : defaultValue;
  };

  const getValue = useCallback(
    (sectionKey, fieldKey, defaultValue, parentData) => {

      // Construir el path completo: [sectionKey, ...parentData, fieldKey]
      const keys = Array.isArray(parentData) && parentData.length > 0
        ? [sectionKey, ...parentData, fieldKey]
        : [sectionKey, fieldKey];

      const value = getNestedValue(updateComponent, keys, undefined);
      if (value !== undefined) {
        if (typeof value === "string") {
          if (value.toLowerCase() === "true") return true;
          if (value.toLowerCase() === "false") return false;
        }
        return value;
      } else if (currentComponentData) {
        // Buscar también en currentComponentData, usando solo parentData y fieldKey
        const dataKeys = Array.isArray(parentData) && parentData.length > 0
          ? [...parentData, fieldKey]
          : [fieldKey];
        const rawValue = getNestedValue(currentComponentData, dataKeys, defaultValue);
        if (typeof rawValue === "string") {
          if (rawValue.toLowerCase() === "true") return true;
          if (rawValue.toLowerCase() === "false") return false;
        }
        return rawValue;
      }
      return defaultValue;
    },
    [updateComponent, currentComponentData],
  );

  // handleCheckerChange restaurado
  const handleCheckerChange = useCallback(
    (checkedId, newValue, allCheckersInGroup, parentData) => {
      if (newValue) {
        allCheckersInGroup.forEach((checker) => {
          const isCurrentChecker = checker.id === checkedId
          const checkerValue = isCurrentChecker ? "true" : "false"
          handleInputChange(currentComponentType, checker.type, checker.id, checkerValue, checker.value_type, currentComponentData.id, parentData)
        })
      } else {
        const currentChecker = allCheckersInGroup.find((c) => c.id === checkedId)
        if (currentChecker) {
          handleInputChange(currentComponentType, currentChecker.type, currentChecker.id, "false", currentChecker.value_type, currentComponentData.id, parentData)
        }
      }
    },
    [currentComponentType, currentComponentData, handleInputChange],
  )

  const allowedComponentKeys = useMemo(
    () => ["title", "description", "background", "external_border", "external_shadow", "menu_actions","dimensions"],
    [],
  )

  const dictIcons = useMemo(
    () => ({
      title: <TextFields sx={{ color: theme.palette.primary.main }} />,
      description: <Summarize sx={{ color: theme.palette.primary.main }} />,
      background: <ColorLens sx={{ color: theme.palette.primary.main }} />,
      external_border: <BorderStyle sx={{ color: theme.palette.primary.main }} />,
      external_shadow: <Tonality sx={{ color: theme.palette.primary.main }} />,
      menu_actions: <MoreVert sx={{ color: theme.palette.primary.main }} />,
      dimensions: <Straighten sx={{color: theme.palette.primary.main}} />
    }),
    [theme.palette.primary.main],
  )

  const dataComponentsPanel = useMemo(() => {
    return componentsState?.filter((component) => allowedComponentKeys.includes(component.type)) || []
  }, [componentsState, allowedComponentKeys])

  // Sincronizar activeTab con currentComponentType
  useEffect(() => {
    const componentIndex = dataComponentsPanel.findIndex((comp) => comp.type === currentComponentType)
    if (componentIndex !== -1) {
      setActiveTab(componentIndex)
    }
  }, [currentComponentType, dataComponentsPanel])

  const handleTabChange = useCallback(
    async (event, newValue) => {
      setIsLoadingTab(true)
      setError(null)

      try {
        const selectedComponent = dataComponentsPanel[newValue]
        if (selectedComponent) {
          try {
            const ids = {
              panel_id: generalPanel.id,
              component_id: selectedComponent.id,
            }
            const response = await getRequest(
              null,
              user.userID,
              "",
              "",
              "panelComponent",
              "componentes del panel",
              ids,
            )

            const success = await onComponentChange(selectedComponent.type, response)
            if (success) {
              setActiveTab(newValue)
              setUpdateComponent({})
            }
          } catch (error) {
            const success = await onComponentChange(selectedComponent.type, null)
            if (success) {
              setActiveTab(newValue)
              setUpdateComponent({})
              setError(`Error al cargar datos del componente ${selectedComponent.type_es}`)
            }
          }
        }
      } catch (error) {
        setError(`Error al cambiar de pestaña`)
      } finally {
        setIsLoadingTab(false)
      }
    },
    [dataComponentsPanel, onComponentChange, generalPanel.id, user.userID],
  )

  const getContentChildren = useCallback(
    async (componentID, contentID) => {
      const ids = {
        panel_id: generalPanel.id,
        component_id: componentID,
        content_id: contentID,
      }
      try {
        const response = await getRequest(
          null,
          user.userID,
          "",
          "",
          "panelContentChildren",
          "children del contenido del componente",
          ids,
        )
        return response
      } catch (error) {
        setError(`Error al cargar hijos del contenido`)
        return []
      }
    },
    [generalPanel.id, user.userID, setError],
  )

  const handleToggle = useCallback(
    async (componentType, isActive) => {
      setSwitchLoadingStates((prev) => ({ ...prev, [componentType]: true }))

      try {
        await onComponentStateChange(componentType, isActive)
      } catch (error) {
        setError(`Error al cambiar estado del componente`)
      } finally {
        setSwitchLoadingStates((prev) => ({ ...prev, [componentType]: false }))
      }
    },
    [onComponentStateChange],
  )

  // renderInput restaurado
  const renderInput = useCallback(
    (key, config, idComponent, recursiveProps = {}) => {
      const { type, type_es, content_input, content_options, value, id, value_type } = config
      const {
        level = 1,
        parentData = [],
        multipleParents = true,
        allCheckersInGroup = [],
        onCheckerChange: recursiveOnCheckerChange,
      } = recursiveProps
      
      switch (content_input) {
        case "select":
          {
            const selectValue = getValue ? getValue(key, type, value, parentData) : value
            const selectValueStr = selectValue === null || selectValue === undefined ? "" : String(selectValue)

          return (
            <Box key={key}>
              <Typography variant="body2" sx={{ display: "flex", alignItems: "center", marginBottom: 1 }}>
                {type_es}
              </Typography>
              <Select
                fullWidth
                value={selectValueStr}
                onChange={(e) => handleInputChange(key, type, id, e.target.value, value_type, idComponent, parentData)}
                size="small"
              >
                {content_options.map((opt) => (
                  <MenuItem key={String(opt.value)} className="dragg-handle" value={String(opt.value)}>
                    {opt.type_es}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )
          }

        case "color_hex":
          return (
            <ColorHexInput
              keyName={key}
              type={type}
              value_type={value_type}
              type_es={type_es}
              value={getValue(key, type, value, parentData)}
              id={id}
              handleInputChange={handleInputChange}
              idComponent={idComponent}
              parentData={parentData}
            />
          )

        case "range_integer":
          return (
            <RangeInput
              keyName={key}
              type={type}
              value_type={value_type}
              type_es={type_es}
              value={getValue(key, type, value, parentData)}
              id={id}
              handleInputChange={handleInputChange}
              content_options={content_options}
              idComponent={idComponent}
              parentData={parentData}
            />
          )

        case "color_rgba":
          return (
            <ColorRgbaInput
              keyName={key}
              type={type}
              value_type={value_type}
              type_es={type_es}
              value={getValue(key, type, value, parentData)}
              id={id}
              handleInputChange={handleInputChange}
              idComponent={idComponent}
              parentData={parentData}
            />
          )

        case "selector_shadow":
          return (
            <ShadowSelector
              keyName={key}
              type={type}
              value_type={value_type}
              type_es={type_es}
              value={getValue(key, type, value, parentData)}
              id={id}
              content_options={content_options}
              handleInputChange={handleInputChange}
              idComponent={idComponent}
              parentData={parentData}
            />
          )

        case "checker":
          if (level === 1) {
            const allCheckersInGroup =
              currentComponentData?.components_content?.filter((item) => item.content_input === "checker") || []
            return (
              <CheckerInput
                keyName={key}
                config={config}
                idComponent={idComponent}
                getValue={getValue}
                handleInputChange={handleInputChange}
                renderInput={renderInput}
                getContentChildren={getContentChildren}
                setError={setError}
                multipleParents={currentComponentData?.multiple_parents !== false}
                allCheckersInGroup={allCheckersInGroup}
                onCheckerChange={handleCheckerChange}
                level={level}
                parentData={parentData}
                clearTrigger={clearTrigger}
              />
            )
          } else {
            return (
              <CheckerInput
                keyName={key}
                config={config}
                idComponent={idComponent}
                getValue={getValue}
                handleInputChange={handleInputChange}
                renderInput={renderInput}
                getContentChildren={getContentChildren}
                setError={setError}
                multipleParents={multipleParents}
                allCheckersInGroup={allCheckersInGroup}
                onCheckerChange={recursiveOnCheckerChange}
                level={level}
                parentData={parentData}
                clearTrigger={clearTrigger}
              />
            )
          }

        default:
          return null
      }
    }, [getValue, handleInputChange, getContentChildren, currentComponentData, handleCheckerChange])

  const TabPanel = useCallback(
    ({ children, value, index, ...other }) => (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`panel-tabpanel-${index}`}
        aria-labelledby={`panel-tab-${index}`}
        style={{
          height: "100%",
          display: value === index ? "flex" : "none",
          flexDirection: "column",
        }}
        {...other}
      >
        {value === index && (
          <Box
            sx={{
              p: 2,
              overflowY: "auto",
              overflowX: "hidden",
              flex: 1,
              maxHeight: "calc(100vh - 250px)",
              "&::-webkit-scrollbar": {
                width: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: "#f1f1f1",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#c1c1c1",
                borderRadius: "4px",
                "&:hover": {
                  background: "#a8a8a8",
                },
              },
            }}
          >
            {children}
          </Box>
        )}
      </div>
    ),
    [],
  )

  return (
    <Box display="flex" flexDirection="column" sx={{ width: "100%", height: "100%" }}>
      <Paper sx={{ width: "100%", boxShadow: "none", display: "flex", flexDirection: "column", height: "100%" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            minHeight: 48,
            flexShrink: 0,
            "& .MuiTabs-scrollButtons": {
              "&.Mui-disabled": {
                opacity: 0.3,
              },
            },
            "& .MuiTab-root": {
              minWidth: 48,
              width: 48,
              height: 48,
              padding: 0,
              margin: "0 2px",
            },
          }}
        >
          {dataComponentsPanel.map((component, index) => (
            <Tab
              key={`${component.type}-${component.id}`}
              disabled={isLoadingTab}
              icon={
                <Tooltip title={component.type_es} placement="top">
                  <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {cloneElement(dictIcons[component.type], {
                      sx: {
                        fontSize: 20,
                        color: component.is_active ? "primary.main" : "text.disabled",
                      },
                    })}
                    <Box
                      sx={{
                        position: "absolute",
                        top: -2,
                        right: -2,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: component.is_active ? "success.main" : "error.main",
                        border: "1px solid white",
                      }}
                    />
                  </Box>
                </Tooltip>
              }
              onClick={(e) => {
                if (e.detail === 2) {
                  handleToggle(component.type, !component.is_active)
                }
              }}
              sx={{
                backgroundColor: activeTab === index ? alpha(theme.palette.primary.main, 0.15) : "transparent",
                borderRadius: 1,
                margin: "4px 2px",
                opacity: component.is_active ? 1 : 0.6,
              }}
            />
          ))}
        </Tabs>

        <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2, mb: 0 }}>
              {error}
            </Alert>
          )}

          {dataComponentsPanel.map((component, index) => (
            <TabPanel key={`panel-${component.type}-${component.id}`} value={activeTab} index={index}>
              {component.is_active && index === activeTab ? (
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 600 }}
                    >
                      {dictIcons[component.type]}
                      {component.type_es}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {switchLoadingStates[component.type] && <CircularProgress size={16} />}
                      <Switch
                        size="small"
                        checked={component.is_active}
                        disabled={switchLoadingStates[component.type]}
                        onChange={(e) => handleToggle(component.type, e.target.checked)}
                      />
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 2 }} />

                  {currentComponentData?.components_content ? (
                    <Stack spacing={3}>
                      {currentComponentData.components_content.map((config, index) => (
                        <Box key={config.id || index}>{renderInput(component.type, config, component.id)}</Box>
                      ))}
                    </Stack>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "200px",
                        flexDirection: "column",
                        gap: 2,
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="h6" color="text.secondary">
                        No se pudieron cargar los datos
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Hubo un error al cargar la configuración de este componente
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "200px",
                    flexDirection: "column",
                    gap: 2,
                    textAlign: "center",
                  }}
                >
                  <Box sx={{ opacity: 0.5 }}>{cloneElement(dictIcons[component.type], { sx: { fontSize: 48 } })}</Box>
                  <Typography variant="h6" color="text.secondary">
                    Componente desactivado
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }}>
                    Usa el switch para activar este componente
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {switchLoadingStates[component.type] && <CircularProgress size={16} />}
                    <Switch
                      checked={component.is_active}
                      disabled={switchLoadingStates[component.type]}
                      onChange={(e) => handleToggle(component.type, e.target.checked)}
                    />
                  </Box>
                </Box>
              )}
            </TabPanel>
          ))}
        </Box>
      </Paper>
    </Box>
  )
}

export default PanelSettings
