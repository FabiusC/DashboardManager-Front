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
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Grid,
  IconButton,
  InputAdornment,
  Button,
} from "@mui/material"
import { BorderStyle, ColorLens, MoreVert, Summarize, TextFields, Tonality, Tune, Search, Close } from "@mui/icons-material"
import * as MuiIcons from "@mui/icons-material";
import { cloneElement, useCallback, useEffect, useMemo, useState } from "react"
import ColorHexInput from "./contentPanels/ColorHexInput"
import ColorRgbaInput from "./contentPanels/ColorRgbaInput"
import RangeInput from "./contentPanels/RangeInput"
import GeneralConfig from "./contentPanels/GeneralConfig"
import CheckerInput from "./contentPanels/CheckerInput"
import ShadowSelector from "./contentPanels/ShadowSelector"
import TextInput from "./contentPanels/TextInput"
import ImageSourcePicker from "./contentPanels/ImageSourcePicker"
import { getRequest } from "@helpers/dashboardAPI/genericRequest"
import { useChartContext } from "../../hooks/useChartContext"
import NumberInput from "./contentPanels/NumberInput";

const ChartSettings = ({ user, panel, onComponentChange, componentsState, currentComponentData, setCurrentComponentData, onComponentStateChange, setCurrentComponentType, currentComponentType, onContentChange, clearTrigger }) => {
  const [updateComponent, setUpdateComponent] = useState({})

  const [activeTab, setActiveTab] = useState(0)
  const [isLoadingTab, setIsLoadingTab] = useState(false)
  const [switchLoadingStates, setSwitchLoadingStates] = useState({})
  const [error, setError] = useState(null)
  const [iconSelectorOpen, setIconSelectorOpen] = useState(false)
  const [iconSelectorField, setIconSelectorField] = useState(null)
  const [iconSearchQuery, setIconSearchQuery] = useState("")
  const theme = useTheme()
  const chart = useChartContext()

  const dataComponentsPanel = useMemo(() => {
    return componentsState || []
  }, [componentsState])

  useEffect(() => {
      const componentIndex = dataComponentsPanel.findIndex((comp) => comp.name === currentComponentType.name)
      if (componentIndex !== -1) {
        setActiveTab(componentIndex)
      }
  }, [currentComponentType])

  // Sincronizar activeTab con currentComponentType
  useEffect(() => {
    onContentChange(updateComponent)
  }, [updateComponent, onContentChange])

  useEffect(() => {
    if (clearTrigger > 0) {
      setUpdateComponent({})
    }
  }, [clearTrigger])

  const handleTabChange = useCallback(
    async (event, newValue) => {
      setIsLoadingTab(true)
      setError(null)

      try {
        const selectedComponent = dataComponentsPanel[newValue]
        if (selectedComponent) {
          try {
            const ids = {
              panel_id: panel.state.panel.id,
              component_id: selectedComponent.id,
            }
            const response = await getRequest(
              null,
              user.userID,
              "",
              "",
              "chartComponent",
              "componentes del panel",
              ids,
            )

            const success = await onComponentChange(selectedComponent, response)
            if (success) {
              setActiveTab(newValue)
              setUpdateComponent({})
            }
          } catch (error) {
            // Si falla la carga, igual pregunta al padre si puede cambiar
            const success = await onComponentChange(selectedComponent, null)
            if (success) {
              setActiveTab(newValue)
              setUpdateComponent({})
              setError(`Error al cargar datos del componente ${selectedComponent.alias}`)
            }
          }
        }
      } catch (error) {
        setError(`Error al cambiar de pestaña`)
      } finally {
        setIsLoadingTab(false)
      }
    },
    [dataComponentsPanel, onComponentChange, panel.state.panel.id, user.userID]
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

  // handleInputChange con estructura plana del primer nivel 
  const handleInputChange = useCallback((sectionKey, fieldKey, componentID, value, value_type, id, parentData, options = {}) => {
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

    if (!options.saveOnly) {
      chart.actions.handleUpdateLiveChartProps(fieldKey, value, parentData, value_type);
    }
    if (options.hydrateChildren) {
      const config = {};
      for (const child of options.hydrateChildren) {
        if (child.frontend_input_type === 'checker') continue;
        let converted = child.value;
        if (child.value_type === 'boolean') {
          converted = child.value === 'true' || child.value === true;
        } else if (child.value_type === 'integer' || child.value_type === 'number') {
          converted = Number(child.value);
        } else if (child.value_type === 'float') {
          converted = parseFloat(child.value);
        }
        config[child.type] = converted;
      }
      const update = {};
      let node = update;
      for (const key of parentData) {
        node[key] = {};
        node = node[key];
      }
      node[fieldKey] = config;
      chart.actions.updateLiveProps(update);
    }

  }, [chart.actions]);


  const TabChart = useCallback(
    ({ children, value, index, ...other }) => (
      <div
        role="tabchart"
        hidden={value !== index}
        id={`chart-tabpanel-${index}`}
        aria-labelledby={`chart-tab-${index}`}
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
              maxHeight: "calc(100vh - 300px)",
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

  const getTabIcon = (alias, size = "sm") => {
    return (
      <Box sx={{
        height: size === "sm" ? "30px" : "50px",
        width: size === "sm" ? "30px" : "50px",
        marginBottom: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        color: theme.palette.primary.main,
        fontSize: size === "sm" ? "12px" : "24px",
        fontWeight: 500,
        fontFamily: "Roboto"
      }}>
        {alias?.trim()?.charAt(0)?.toUpperCase()}
      </Box>
    )
  }

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

  const getContentChildren = useCallback(
    async (componentID, contentID) => {
      
      const ids = {
        // panel_id: props.panel.id,
        component_id: componentID,
        content_id: contentID,
      }
      try {
        const response = await getRequest(
          null,
          user.userID,
          "",
          "",
          "panelChartContentChildren",
          "children del contenido del componente",
          ids,
        )
        return response
      } catch (error) {
        setError(`Error al cargar hijos del contenido`)
        return []
      }
    },
    [panel.id, user.userID, setError],
  )

  const renderInput = useCallback(
    (key, config, idComponent, recursiveProps = {}) => {      
      const { type, type_es, frontend_input_type, content_options, value, id, value_type } = config
      const {
        level = 1,
        parentData = [],
        multipleParents = true,
        allCheckersInGroup = [],
        onCheckerChange: recursiveOnCheckerChange,
      } = recursiveProps
      switch (frontend_input_type) {
        case "image_picker":
          return (
            <ImageSourcePicker
              key={key}
              keyName={key}
              type={type}
              value_type={value_type}
              type_es={type_es}
              value={getValue(key, type, value, parentData)}
              id={id}
              handleInputChange={handleInputChange}
              idComponent={idComponent}
              parentData={parentData}
              getValue={getValue}
              token={user?.userID}
              clearTrigger={clearTrigger}
            />
          )

        case "select":
          return (
            <Box key={key}>
              <Typography variant="body2" sx={{ display: "flex", alignItems: "center", marginBottom: 1 }}>
                {type_es}
              </Typography>
              <Select
                fullWidth
                defaultValue={value}
                onChange={(e) => handleInputChange(key, type, id, e.target.value, value_type, idComponent, parentData)}
                size="small"
              >
                {content_options.map((opt) => (
                  <MenuItem key={opt.value} className="dragg-handle" value={opt.value}>
                    {opt.type_es}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )

          case "text":
            return (
              <TextInput
                keyName={key}
                type={type}
                value_type={value_type}
                type_es={type_es}
                value={value}
                id={id}
                handleInputChange={handleInputChange}
                idComponent={idComponent}
                parentData={parentData}
                content_options={content_options}
                getValue={getValue}
              />
            )

          case "number":
            return (
              <NumberInput
                keyName={key}
                type={type}
                value_type={value_type}
                type_es={type_es}
                value={value}
                id={id}
                handleInputChange={handleInputChange}
                idComponent={idComponent}
                parentData={parentData}
                getValue={getValue}
              />
            )


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
              isFloat={false}
            />
          )

        case "range_float":
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
              isFloat={true}
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
              currentComponentData?.chart_parameter_component_content?.filter((item) => item.frontend_input_type === "checker") || []
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
        case "icon_selection":
          {
            const currentIconValue = getValue(key, type, value, parentData);
            
            // Función para obtener el componente del icono por nombre exacto
            const getIconComponent = (iconName) => {
              if (!iconName || typeof iconName !== 'string') return null;
              
              // Buscar el icono exactamente como viene (con o sin "Icon" al final)
              if (MuiIcons[iconName]) {
                return MuiIcons[iconName];
              }
              
              // Si no tiene "Icon" al final, intentar agregarlo
              const iconNameWithSuffix = iconName.endsWith('Icon') ? iconName : `${iconName}Icon`;
              if (MuiIcons[iconNameWithSuffix]) {
                return MuiIcons[iconNameWithSuffix];
              }
              
              return null;
            };
            
            // Buscar el icono seleccionado en content_options para obtener type_es
            const selectedOption = content_options?.find(opt => opt.value === currentIconValue);
            const selectedIconLabel = selectedOption?.type_es || "Seleccionar ícono";
            const SelectedIconComponent = getIconComponent(currentIconValue);
            
            return (
              <Box key={key} sx={{ width: "100%" }}>
                <Typography variant="body2" sx={{ display: "flex", alignItems: "center", marginBottom: 1 }}>
                  {type_es || "Ícono"}
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setIconSelectorField({ key, type, id, idComponent, parentData, value_type, content_options });
                    setIconSelectorOpen(true);
                    setIconSearchQuery("");
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textTransform: "none",
                    gap: 1,
                    minHeight: "40px",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                    {SelectedIconComponent ? (
                      <SelectedIconComponent sx={{ fontSize: 20 }} />
                    ) : (
                      <MuiIcons.InfoOutlined sx={{ fontSize: 20, opacity: 0.5 }} />
                    )}
                    <Typography variant="body2" sx={{ flex: 1, textAlign: "left" }}>
                      {selectedIconLabel}
                    </Typography>
                  </Box>
                  <MuiIcons.Search sx={{ fontSize: 16, opacity: 0.6 }} />
                </Button>
              </Box>
            );
          }
        default:
          return null
      }
    }, [currentComponentData, getValue, handleInputChange, updateComponent, setIconSelectorOpen, setIconSelectorField, setIconSearchQuery, theme]
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
              key={`${component.name}-${component.id}`}
              disabled={isLoadingTab}
              icon={
                <Tooltip title={component.alias} placement="top">
                  <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {getTabIcon(component.alias)}
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
          {dataComponentsPanel.length > 0 &&
            <TabChart key={`chart-${dataComponentsPanel[activeTab].name}-${dataComponentsPanel[activeTab].id}`} value={activeTab} index={activeTab}>
              {dataComponentsPanel[activeTab].is_active &&
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 600 }}
                    >
                      {getTabIcon(dataComponentsPanel[activeTab].alias)}
                      {dataComponentsPanel[activeTab].alias}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {switchLoadingStates[dataComponentsPanel[activeTab].name] && <CircularProgress size={16} />}
                      <Switch
                        size="small"
                        checked={dataComponentsPanel[activeTab].is_active}
                        disabled={switchLoadingStates[dataComponentsPanel[activeTab].name]}
                        onChange={(e) => handleToggle(dataComponentsPanel[activeTab].name, e.target.checked)}
                      />
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 2 }} />

                  {currentComponentData?.chart_parameter_component_content ? (
                    <Stack spacing={3}>
                      <>
                        {currentComponentData?.chart_parameter_component_content.length === 0 &&
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              height: "100%",
                              flexDirection: "column",
                              gap: 2,
                              textAlign: "center",
                            }}
                          >
                            <Box sx={{ opacity: 0.5 }}>{getTabIcon(dataComponentsPanel[activeTab].alias, "lg")}</Box>
                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }}>
                              El componente {<span style={{ fontWeight: 600 }}>{dataComponentsPanel[activeTab].alias}</span>} no tiene opciones para configurar
                            </Typography>
                          </Box>
                        }
                        {currentComponentData?.chart_parameter_component_content.length > 0 &&
                          currentComponentData.chart_parameter_component_content.map((config, index) => (
                            <Box key={config.id || index}>{renderInput(dataComponentsPanel[activeTab].name, config, dataComponentsPanel[activeTab].id)}</Box>
                          ))
                        }
                      </>
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
                  )
                  }
                </Box>
              }
              {!dataComponentsPanel[activeTab].is_active &&
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                    flexDirection: "column",
                    gap: 2,
                    textAlign: "center",
                  }}
                >
                  <Box sx={{ opacity: 0.5 }}>{getTabIcon(dataComponentsPanel[activeTab].alias, "lg")}</Box>
                  <Typography variant="h6" color="text.secondary">
                    Componente {<span style={{ fontWeight: 600 }}>{dataComponentsPanel[activeTab].alias}</span>} desactivado
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }}>
                    Usa el switch para activar este componente
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {switchLoadingStates[dataComponentsPanel[activeTab].name] && <CircularProgress size={16} />}
                    <Switch
                      checked={dataComponentsPanel[activeTab].is_active}
                      disabled={switchLoadingStates[dataComponentsPanel[activeTab].name]}
                      onChange={(e) => handleToggle(dataComponentsPanel[activeTab].name, e.target.checked)}
                    />
                  </Box>
                </Box>
              }
            </TabChart>
          }
        </Box>

      </Paper>
      
      {/* Dialog de selección de iconos */}
      <Dialog
        open={iconSelectorOpen}
        onClose={() => {
          setIconSelectorOpen(false);
          setIconSearchQuery("");
          setIconSelectorField(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6">Seleccionar Ícono</Typography>
          <IconButton
            size="small"
            onClick={() => {
              setIconSelectorOpen(false);
              setIconSearchQuery("");
              setIconSelectorField(null);
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar ícono..."
            value={iconSearchQuery}
            onChange={(e) => setIconSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Box
            sx={{
              maxHeight: "400px",
              overflowY: "auto",
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
            <Grid container spacing={1}>
              {iconSelectorField?.content_options
                ?.filter((option) => {
                  if (!iconSearchQuery) return true;
                  const searchText = iconSearchQuery.toLowerCase();
                  return (
                    option.type_es?.toLowerCase().includes(searchText) ||
                    option.value?.toLowerCase().includes(searchText)
                  );
                })
                .map((option) => {
                  // Función para obtener el componente del icono
                  const getIconComponent = (iconName) => {
                    if (!iconName || typeof iconName !== 'string') return null;
                    if (MuiIcons[iconName]) {
                      return MuiIcons[iconName];
                    }
                    const iconNameWithSuffix = iconName.endsWith('Icon') ? iconName : `${iconName}Icon`;
                    if (MuiIcons[iconNameWithSuffix]) {
                      return MuiIcons[iconNameWithSuffix];
                    }
                    return null;
                  };
                  
                  const IconComponent = getIconComponent(option.value);
                  
                  // Obtener el valor actual del icono seleccionado
                  const currentIconValue = iconSelectorField 
                    ? getValue(
                        iconSelectorField.key,
                        iconSelectorField.type,
                        "",
                        iconSelectorField.parentData
                      )
                    : "";
                  const isSelected = currentIconValue === option.value;
                  
                  return (
                    <Grid item xs={3} sm={2} md={1.5} key={option.value || option.type}>
                      <Tooltip title={option.type_es || option.value} arrow>
                        <Box
                          onClick={() => {
                            if (iconSelectorField && IconComponent) {
                              handleInputChange(
                                iconSelectorField.key,
                                iconSelectorField.type,
                                iconSelectorField.id,
                                option.value,
                                iconSelectorField.value_type,
                                iconSelectorField.idComponent,
                                iconSelectorField.parentData
                              );
                            }
                            setIconSelectorOpen(false);
                            setIconSearchQuery("");
                            setIconSelectorField(null);
                          }}
                          sx={{
                            p: 1.5,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: IconComponent ? "pointer" : "not-allowed",
                            borderRadius: 1,
                            border: isSelected
                              ? `2px solid ${theme.palette.primary.main}`
                              : "1px solid transparent",
                            backgroundColor: isSelected
                              ? alpha(theme.palette.primary.main, 0.1)
                              : "transparent",
                            opacity: IconComponent ? 1 : 0.5,
                            "&:hover": {
                              backgroundColor: IconComponent ? alpha(theme.palette.primary.main, 0.05) : "transparent",
                              border: IconComponent ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}` : "1px solid transparent",
                            },
                            transition: "all 0.2s ease-in-out",
                          }}
                        >
                          {IconComponent ? (
                            <IconComponent
                              sx={{
                                fontSize: 28,
                                color: isSelected ? theme.palette.primary.main : "inherit",
                                mb: 0.5,
                              }}
                            />
                          ) : (
                            <MuiIcons.InfoOutlined
                              sx={{
                                fontSize: 28,
                                color: isSelected ? theme.palette.primary.main : "inherit",
                                mb: 0.5,
                                opacity: 0.5,
                              }}
                            />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: "0.65rem",
                              textAlign: "center",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              width: "100%",
                              color: isSelected ? theme.palette.primary.main : "text.secondary",
                            }}
                          >
                            {option.type_es || option.value}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Grid>
                  );
                })}
            </Grid>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default ChartSettings
