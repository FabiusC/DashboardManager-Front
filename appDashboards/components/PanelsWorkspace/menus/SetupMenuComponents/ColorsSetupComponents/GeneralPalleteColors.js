import { useState, useCallback, useEffect, useRef } from "react"
import {
  Box,
  Typography,
  Divider,
  Stack,
  useTheme,
  Tooltip,
  Paper,
  Grid,
  Menu,
  MenuItem,
  TextField,
  Button
} from "@mui/material"
import { 
  ColorLens,
  ContentCopy,
  CheckCircle,
  Save
} from '@mui/icons-material';
import tinycolor from "tinycolor2";
import iro from "@jaames/iro";
import { connect } from 'react-redux';
import { handleEditItemEntity } from "../../../../../helpers/dashboardAPI/genericRequest"
import { useDispatch } from "react-redux"
import { pushNotification } from "../../../../../redux/actions"
import SavePaletteDialog from "./SavePaletteDialog"

const GeneralPalleteColors = ({ idPanel, chartHook, user, organization, onStrategyChange, currentStrategyType, savePaletteByProject }) => {
  const theme = useTheme()
  const dispatch = useDispatch()
  const colorPickerRef = useRef(null)
  const pickerInstance = useRef(null)
  const shouldAutoSave = useRef(false)
  const debounceTimer = useRef(null)
  const saveTimer = useRef(null)
  const currentSelectedPaletteRef = useRef(null)
  const currentAllPalettesRef = useRef([])

  const chart = chartHook.state

  const [selectedColor, setSelectedColor] = useState(chart.colorStrategy.preset_palette.base_color || "#3498db")
  const [copiedColor, setCopiedColor] = useState(null)
  const [allPalettes, setAllPalettes] = useState([])
  const [selectedPalette, setSelectedPalette] = useState(chart.colorStrategy.preset_palette.palette_type || "monochromatic")
  const [contextMenu, setContextMenu] = useState(null)
  const [showRgbInput, setShowRgbInput] = useState(false)
  const [rgbValues, setRgbValues] = useState({ r: 0, g: 0, b: 0 })
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [isSavingPalette, setIsSavingPalette] = useState(false)
  const [hexInput, setHexInput] = useState(selectedColor)
  const [hexError, setHexError] = useState(false)
  useEffect(() => {
    const currentBaseColor = chart.colorStrategy.preset_palette.base_color || "#3498db";
    const currentPaletteType = chart.colorStrategy.preset_palette.palette_type || "monochromatic";
    
    setSelectedColor(currentBaseColor);
    setHexInput(currentBaseColor);
    setSelectedPalette(currentPaletteType);
    if (currentBaseColor) {
      generateAllColorCombinations(currentBaseColor);
    }
  }, [chart.colorStrategy.preset_palette.base_color, chart.colorStrategy.preset_palette.palette_type]);

  useEffect(() => {
    currentSelectedPaletteRef.current = selectedPalette;
  }, [selectedPalette]);

  useEffect(() => {
    currentAllPalettesRef.current = allPalettes;
  }, [allPalettes]);

  const savePresetPaletteToPanel = useCallback(async (paletteName, colors) => {
    try {
      const updateData = {
        preset_palette: {
          palette_type: paletteName,
          colors: colors,
          base_color: selectedColor
        },
        custom_palette: chart.colorStrategy.custom_palette,
        strategy_type: "preset"
      }
      let result = await handleEditItemEntity(
        user.userID,
        "updatePanelColorStrategy",
        "estrategia de colores del chart",
        { panel_id: idPanel},
        updateData,
        dispatch,
        false,
      )
      if (result[0]) {
        chartHook.actions.changeColorStrategy ({
          ...chart.colorStrategy,
          preset_palette: { palette_type: paletteName, colors: colors, base_color: selectedColor },
          strategy_type: "preset",
          custom_palette: chart.colorStrategy.custom_palette,
        })
      }
    } catch (error) {
      dispatch(pushNotification({ msg: "Error al guardar la paleta predefinida.", status: "error" }))
    }
  }, [chart.id, chart.colorStrategy.custom_palette, user.userID, dispatch, selectedColor])

  const handleSavePalette = useCallback(async (paletteData) => {
    setIsSavingPalette(true)
    try {
      const currentPalette = allPalettes.find(p => p.name === selectedPalette)
      if (!currentPalette) {
        dispatch(pushNotification({ msg: "No se pudo obtener la paleta actual.", status: "error" }))
        return
      }
      const saveData = {
        alias: paletteData.name,
        description: paletteData.description,
        color_items: currentPalette.colors.map((color, index) => ({
          color: color,
          order: index + 1
        }))
      }
      const result = await savePaletteByProject(saveData)
      if (result) {
        dispatch(pushNotification({ 
          msg: `Paleta "${paletteData.name}" guardada correctamente.`, 
          status: "ok" 
        }))
        setShowSaveDialog(false)
      } else {
        throw new Error('Failed to save palette')
      }
    } catch (error) {
      console.error('Error saving palette:', error)
      dispatch(pushNotification({ msg: "Error al guardar la paleta.", status: "error" }))
    } finally {
      setIsSavingPalette(false)
    }
  }, [allPalettes, selectedPalette, dispatch, savePaletteByProject])

  const debouncedSavePalette = useCallback((paletteName, colors) => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    saveTimer.current = setTimeout(() => {
      savePresetPaletteToPanel(paletteName, colors);
    }, 200);
  }, [savePresetPaletteToPanel]);

  const generateAllColorCombinations = useCallback((baseColor) => {
    const color = tinycolor(baseColor);
    const lightened40 = color.clone().lighten(40).toHexString();
    const lightened20 = color.clone().lighten(20).toHexString();
    const darkened20 = color.clone().darken(20).toHexString();
    const darkened40 = color.clone().darken(40).toHexString();
    const complement = color.complement().toHexString();
    const spinNeg30 = color.clone().spin(-30).toHexString();
    const spinNeg15 = color.clone().spin(-15).toHexString();
    const spin15 = color.clone().spin(15).toHexString();
    const spin30 = color.clone().spin(30).toHexString();
    const spin90 = color.clone().spin(90).toHexString();
    const spin120 = color.clone().spin(120).toHexString();
    const spin150 = color.clone().spin(150).toHexString();
    const spin180 = color.clone().spin(180).toHexString();
    const spin210 = color.clone().spin(210).toHexString();
    const spin240 = color.clone().spin(240).toHexString();
    const spin270 = color.clone().spin(270).toHexString();

    const organizationPalette = organization?.[0]?.palette ? {
      name: "organizational",
      alias: `Paleta de la organización ${organization[0].name}`,
      colors: organization[0].palette
    } : null;
    const combinations = [
      ...(organizationPalette ? [organizationPalette] : []),
      {
        name: "monochromatic",
        alias: "Monocromático",
        colors: [lightened40, lightened20, baseColor, darkened20, darkened40]
      },
      {
        name: "complementary",
        alias: "Complementario",
        colors: [baseColor, complement]
      },
      {
        name: "analogous",
        alias: "Análogo",
        colors: [spinNeg30, spinNeg15, baseColor, spin15, spin30]
      },
      {
        name: "triadic",
        alias: "Tríada",
        colors: [baseColor, spin120, spin240]
      },
      {
        name: "split-complementary",
        alias: "Complementario dividido",
        colors: [baseColor, spin150, spin210]
      },
      {
        name: "tetradic",
        alias: "Tetrada",
        colors: [baseColor, spin90, spin180, spin270]
      }
    ];
    setAllPalettes(combinations);
  }, [organization]);

  const debouncedGeneratePalettes = useCallback((color) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      generateAllColorCombinations(color);
    }, 10);
  }, [generateAllColorCombinations]);

  useEffect(() => {
    if (colorPickerRef.current && !pickerInstance.current) {
      pickerInstance.current = new iro.ColorPicker(colorPickerRef.current, {
        width: 120,
        color: selectedColor,
        borderWidth: 0,
        borderColor: "transparent",
        layoutDirection: "horizontal",
        layout: [
          {
            component: iro.ui.Wheel,
            options: {
              wheelLightness: false,
              wheelAngle: 0,
              wheelDirection: 'clockwise'
            }
          },
          {
            component: iro.ui.Slider,
            options: {
              sliderType: 'value',
              sliderSize: 15
            }
          }
        ]
      });

      pickerInstance.current.on("color:change", (color) => {
        const newColor = color.hexString;
        setSelectedColor(newColor);
        setHexInput(newColor); // Sincronizar con el input
        setHexError(false); // Limpiar error
        setTimeout(() => {
          const currentSelectedPalette = currentSelectedPaletteRef.current;
          const currentAllPalettes = currentAllPalettesRef.current;
          const currentShouldAutoSave = shouldAutoSave.current;
          if (currentSelectedPalette && currentShouldAutoSave) {
            const selectedPaletteData = currentAllPalettes.find(palette => palette.name === currentSelectedPalette);
            if (selectedPaletteData) {
              debouncedSavePalette(currentSelectedPalette, selectedPaletteData.colors);
            } else {
              console.log("No palette data found for:", currentSelectedPalette);
              console.log("Available palettes:", currentAllPalettes.map(p => p.name));
            }
          } else {
            console.log("Auto-save conditions not met:", { 
              currentSelectedPalette, 
              currentShouldAutoSave 
            });
          }
        }, 40);
      });
    }
  }, [selectedPalette, allPalettes, debouncedSavePalette]);

  useEffect(() => {
    if (pickerInstance.current && selectedColor) {
      pickerInstance.current.color.set(selectedColor);
    }
  }, [selectedColor]);

  useEffect(() => {
    if (selectedColor) {
      debouncedGeneratePalettes(selectedColor);
      setHexInput(selectedColor); // Sincronizar input cuando cambie el color
    }
  }, [selectedColor, debouncedGeneratePalettes]);

  useEffect(() => {
    shouldAutoSave.current = true;
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, []);

  const getColorInfo = useCallback((color) => {
    const tc = tinycolor(color);
    return {
      hex: tc.toHexString(),
      rgb: tc.toRgbString(),
      hsl: tc.toHslString(),
      name: tc.toName() || "Custom Color",
      brightness: tc.getBrightness(),
      isLight: tc.isLight(),
      isDark: tc.isDark()
    };
  }, []);

  const copyColorToClipboard = useCallback(async (color, format = 'hex') => {
    const colorInfo = getColorInfo(color);
    const colorValue = colorInfo[format];
    try {
      await navigator.clipboard.writeText(colorValue);
      setCopiedColor(color);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (err) {
    }
  }, [getColorInfo]);

  const handlePaletteSelection = useCallback(async (paletteName) => {
    setSelectedPalette(paletteName);
    const selectedPaletteData = allPalettes.find(palette => palette.name === paletteName);
    if (selectedPaletteData) {
      debouncedSavePalette(paletteName, selectedPaletteData.colors);
    }
  }, [allPalettes, debouncedSavePalette])

  const handleColorBoxRightClick = useCallback((event) => {
    event.preventDefault();
    const color = tinycolor(selectedColor);
    const rgb = color.toRgb();
    setRgbValues({ r: rgb.r, g: rgb.g, b: rgb.b });
    setContextMenu(event.currentTarget);
  }, [selectedColor]);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(null);
    setShowRgbInput(false);
  }, []);

  const handleRgbValueChange = useCallback((component, value) => {
    const numValue = Math.min(255, Math.max(0, parseInt(value) || 0));
    setRgbValues(prev => ({
      ...prev,
      [component]: numValue
    }));
  }, []);

  const handleRgbInputSubmit = useCallback(async () => {
    const color = tinycolor(`rgb(${rgbValues.r}, ${rgbValues.g}, ${rgbValues.b})`);
    if (color.isValid()) {
      const newColor = color.toHexString();
      setSelectedColor(newColor);
      if (pickerInstance.current) {
        pickerInstance.current.color.set(newColor);
      }
      handleContextMenuClose();
    }
  }, [rgbValues, handleContextMenuClose])

  const handleRgbInputKeyPress = useCallback((event) => {
    if (event.key === 'Enter') {
      handleRgbInputSubmit();
    }
  }, [handleRgbInputSubmit]);

  const handleHexInputChange = useCallback((event) => {
    let value = event.target.value.trim();
    
    // Permitir escribir sin el # inicial
    if (value && !value.startsWith('#')) {
      value = '#' + value;
    }
    
    setHexInput(value);
    
    // Validar si es un color válido (solo actualizar si es válido)
    if (value.length >= 4) { // Al menos #RGB
      const color = tinycolor(value);
      if (color.isValid()) {
        setHexError(false);
        const validHex = color.toHexString();
        setSelectedColor(validHex);
        if (pickerInstance.current) {
          pickerInstance.current.color.set(validHex);
        }
      } else {
        setHexError(true);
      }
    }
  }, []);

  const handleHexInputKeyPress = useCallback((event) => {
    if (event.key === 'Enter') {
      const color = tinycolor(hexInput);
      if (color.isValid()) {
        const validHex = color.toHexString();
        setSelectedColor(validHex);
        setHexInput(validHex);
        setHexError(false);
        if (pickerInstance.current) {
          pickerInstance.current.color.set(validHex);
        }
      }
    }
  }, [hexInput]);

  return (
    <Stack spacing={3}>
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="subtitle1" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 600 }}>
            <ColorLens sx={{ color: theme.palette.primary.main }} />
            Configuración de paleta
          </Typography>
          {/* TODO: unable with backend integration
            <Button
              variant="outlined"
              startIcon={<Save />}
              onClick={() => setShowSaveDialog(true)}
              size="small"
              sx={{ borderRadius: 2 }}
            >
              Guardar Paleta
            </Button>
          */}
        </Box>
        <Divider sx={{ mb: 2 }} />
         {/* Input para escribir el color HEX */}
              <Box sx={{ width: "100%" , mb: 1 }}>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: "bold", color: "text.secondary" }}>
                  Código HEX:
                </Typography>
                <TextField
                  size="small"
                  value={hexInput}
                  onChange={handleHexInputChange}
                  onKeyPress={handleHexInputKeyPress}
                  error={hexError}
                  helperText={hexError ? "Color inválido" : "Presiona Enter para aplicar"}
                  placeholder="#3498db"
                  inputProps={{
                    style: { fontFamily: 'monospace', fontSize: '14px' }
                  }}
                  sx={{ 
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white'
                    }
                  }}
                />
              </Box>
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box ref={colorPickerRef} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, flex: 1 }}>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: "bold", color: "text.secondary" }}>
                  Color Principal:
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: selectedColor,
                      border: "2px solid #ccc",
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: tinycolor(selectedColor).isLight() ? "#000" : "#fff",
                      fontSize: "8px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      userSelect: "none",
                      "&:hover": {
                        borderColor: theme.palette.primary.main,
                        transform: "scale(1.02)"
                      },
                      transition: "all 0.2s"
                    }}
                    onContextMenu={handleColorBoxRightClick}
                    title="Click derecho para buscar color RGB"
                  />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: "bold",
                      fontFamily: "monospace",
                      fontSize: "12px"
                    }}
                  >
                    {selectedColor}
                  </Typography>
                </Box>
              </Box>
              
             
            </Box>
          </Box>
        </Box>
        
        <Menu
          anchorEl={contextMenu}
          open={Boolean(contextMenu)}
          onClose={handleContextMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <MenuItem sx={{ minWidth: 250 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Buscar color RGB
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1 }}>
                Ingresa los valores de Rojo, Verde y Azul (0-255)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    R - Rojo
                  </Typography>
                  <TextField
                    size="small"
                    value={rgbValues.r}
                    onChange={(e) => handleRgbValueChange('r', e.target.value)}
                    onKeyPress={handleRgbInputKeyPress}
                    placeholder="0"
                    type="number"
                    inputProps={{ min: 0, max: 255 }}
                    sx={{ width: '100%' }}
                    autoFocus
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    G - Verde
                  </Typography>
                  <TextField
                    size="small"
                    value={rgbValues.g}
                    onChange={(e) => handleRgbValueChange('g', e.target.value)}
                    onKeyPress={handleRgbInputKeyPress}
                    placeholder="0"
                    type="number"
                    inputProps={{ min: 0, max: 255 }}
                    sx={{ width: '100%' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    B - Azul
                  </Typography>
                  <TextField
                    size="small"
                    value={rgbValues.b}
                    onChange={(e) => handleRgbValueChange('b', e.target.value)}
                    onKeyPress={handleRgbInputKeyPress}
                    placeholder="0"
                    type="number"
                    inputProps={{ min: 0, max: 255 }}
                    sx={{ width: '100%' }}
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button size="small" onClick={handleContextMenuClose}>
                  Cancelar
                </Button>
                <Button size="small" variant="contained" onClick={handleRgbInputSubmit}>
                  Buscar
                </Button>
              </Box>
            </Box>
          </MenuItem>
        </Menu>
        {allPalettes.length > 0 && (
          <Box>
            <Stack spacing={1}>
              {allPalettes.map((palette, paletteIndex) => (
                <Paper 
                  key={palette.name} 
                  sx={{ 
                    p: 0.8,
                    backgroundColor: selectedPalette === palette.name ? `${theme.palette.primary.main}12` : "#fafafa",
                    border: selectedPalette === palette.name ? `2px solid ${theme.palette.primary.main}` : "1px solid #e0e0e0",
                    boxShadow: selectedPalette === palette.name ? `0 4px 12px rgba(0, 0, 0, 0.15)` : "none",
                    transition: "all 0.2s",
                    cursor: "pointer",
                    "&:hover": {
                      borderColor: theme.palette.primary.light,
                      backgroundColor: selectedPalette === palette.name ? `${theme.palette.primary.main}12` : "#f5f5f5",
                      boxShadow: selectedPalette === palette.name ? `0 6px 16px rgba(0, 0, 0, 0.2)` : `0 2px 8px rgba(0, 0, 0, 0.1)`
                    }
                  }}
                  onClick={() => handlePaletteSelection(palette.name)}
                >
                  <Typography variant="subtitle2" sx={{ mb: 0.5, display: "flex", alignItems: "center", gap: 0.5, fontSize: "14px" }}>
                    {palette.alias}
                  </Typography>
                  <Grid container spacing={0} sx={{ 
                    flexWrap: 'nowrap', 
                    overflowX: 'auto',
                    "&::-webkit-scrollbar": {
                      height: "15px"
                    },
                    "&::-webkit-scrollbar-track": {
                      backgroundColor: "#f1f1f1",
                      borderRadius: "7.5px"
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "#c1c1c1",
                      borderRadius: "7.5px",
                      "&:hover": {
                        backgroundColor: "#a8a8a8"
                      }
                    }
                  }}>
                    {palette.colors.map((color, colorIndex) => {
                      const colorInfo = getColorInfo(color);
                      return (
                        <Grid item key={colorIndex} sx={{ flexShrink: 0 }}>
                          <Tooltip
                            title={
                              <Box sx={{ p: 1 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                  {colorInfo.name}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                  <strong>HEX:</strong> {colorInfo.hex}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                  <strong>RGB:</strong> {colorInfo.rgb}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                  <strong>HSL:</strong> {colorInfo.hsl}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                  <strong>Brillo:</strong> {Math.round(colorInfo.brightness)}%
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Tipo:</strong> {colorInfo.isLight ? "Claro" : "Oscuro"}
                                </Typography>
                              </Box>
                            }
                            arrow
                            placement="top"
                          >
                            <Box
                              sx={{
                                position: "relative",
                                cursor: "pointer",
                                transition: "transform 0.2s",
                                "&:hover": {
                                  transform: "scale(1.05)",
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                copyColorToClipboard(color, "hex");
                              }}
                            >
                              <Box
                                sx={{
                                  width: 35,
                                  height: 35,
                                  backgroundColor: color,
                                  borderRadius: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  position: "relative",
                                  color: colorInfo.isLight ? "#000" : "#fff",
                                  fontSize: "6px",
                                  fontWeight: "bold",
                                  textAlign: "center",
                                  wordBreak: "break-all",
                                  "& .copy-icon": {
                                    opacity: 0,
                                    transition: "opacity 0.2s"
                                  },
                                  "&:hover .copy-icon": {
                                    opacity: 1
                                  }
                                }}
                              >
                                <Box 
                                  className="copy-icon"
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                  }}
                                >
                                  {copiedColor === color ? (
                                    <CheckCircle sx={{ fontSize: 10 }} />
                                  ) : (
                                    <ContentCopy sx={{ fontSize: 8 }} />
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          </Tooltip>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      {/* Save Palette Dialog */}
      <SavePaletteDialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSavePalette}
        colors={allPalettes.find(p => p.name === selectedPalette)?.colors || []}
        title="Guardar Paleta Predefinida"
        loading={isSavingPalette}
      />
    </Stack>
  )
}

const mapStateToProps = state => ({
  organization: state.organization
});

export default connect(mapStateToProps)(GeneralPalleteColors);
