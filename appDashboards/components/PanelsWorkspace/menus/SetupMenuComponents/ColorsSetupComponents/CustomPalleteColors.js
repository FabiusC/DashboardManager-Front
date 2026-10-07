import { useState, useCallback, useEffect } from "react"
import {
  Box,
  Typography,
  Divider,
  Stack,
  useTheme,
  Paper,
  Grid,
  IconButton,
  Button
} from "@mui/material"
import { 
  ColorLens,
  Add,
  Delete,
  ContentCopy,
  CheckCircle,
  Edit,
  Save
} from '@mui/icons-material';
import { handleEditItemEntity } from "../../../../../helpers/dashboardAPI/genericRequest"
import { useDispatch } from "react-redux"
import { pushNotification } from "../../../../../redux/actions"
import SavePaletteDialog from "./SavePaletteDialog"

const CustomPalleteColors = ({idPanel, chartHook, user, onStrategyChange, currentStrategyType, savePaletteByProject }) => {
  const theme = useTheme()
  const chart = chartHook.state
  const dispatch = useDispatch()
  const [customPalette, setCustomPalette] = useState(chart.colorStrategy.custom_palette.colors)
  const [copiedColor, setCopiedColor] = useState(null)
  const [editingIndex, setEditingIndex] = useState(null)
  const [tempColor, setTempColor] = useState("#3498db")
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [isSavingPalette, setIsSavingPalette] = useState(false)
  const MAX_COLORS = 12

  const saveCustomPaletteToPanel = useCallback(async (newPalette) => {
    try {
      let result = await handleEditItemEntity(
        user.userID,
        "updatePanelColorStrategy", 
        "estrategia de colores del chart",
        { panel_id: idPanel },
        { custom_palette: { colors: newPalette }},
        dispatch,
        false,
      )
      if (result[0]) {
        chartHook.actions.changeColorStrategy({
          ...chart.colorStrategy,
          custom_palette: { colors: newPalette }
        })
      }
    } catch (error) {
      dispatch(pushNotification({ msg: "Error al guardar la paleta personalizada.", status: "error" }))
    }
  }, [chart, user.userID, dispatch])

  const saveCurrentColor = useCallback(async () => {
    if (editingIndex !== null) {
      setIsSaving(true)
      let newPalette
      if (editingIndex === customPalette.length) {
        newPalette = [...customPalette, tempColor]
        setCustomPalette(newPalette)
        setEditingIndex(null)
      } else {
        newPalette = [...customPalette]
        newPalette[editingIndex] = tempColor
        setCustomPalette(newPalette)
        setEditingIndex(null)
      }
      await saveCustomPaletteToPanel(newPalette)
      setIsSaving(false)
    }
  }, [editingIndex, tempColor, customPalette, saveCustomPaletteToPanel])

  const handleColorChange = useCallback((event) => {
    const newColor = event.target.value
    setTempColor(newColor)
  }, [])

  const handleColorBlur = useCallback((event) => {
    if (editingIndex !== null) {
      setTimeout(() => {
        if (editingIndex !== null) {
          saveCurrentColor()
        }
      }, 100)
    }
  }, [editingIndex, tempColor, saveCurrentColor])

  const addNewColor = useCallback(async () => {
    if (customPalette.length < MAX_COLORS) {
      const defaultColor = "#3498db"
      const newPalette = [...customPalette, defaultColor]
      setCustomPalette(newPalette)
      setEditingIndex(null)
      await saveCustomPaletteToPanel(newPalette)
    }
  }, [customPalette, saveCustomPaletteToPanel])

  const startEditing = useCallback((index) => {
    setEditingIndex(index)
    const currentColor = customPalette[index] || "#3498db"
    setTempColor(currentColor)
    if (index < customPalette.length) {
      setTimeout(() => {
        const colorInput = document.querySelector(`input[type="color"][data-index="${index}"]`)
        if (colorInput) {
          colorInput.click()
        }
      }, 100)
    }
  }, [customPalette])

  const removeColorFromPalette = useCallback(async (index) => {
    const newPalette = customPalette.filter((_, i) => i !== index)
    setCustomPalette(newPalette)
    await saveCustomPaletteToPanel(newPalette)
  }, [customPalette, saveCustomPaletteToPanel])

  const handleSavePalette = useCallback(async (paletteData) => {
    setIsSavingPalette(true)
    try {
      // Prepare data according to API structure
      const saveData = {
        alias: paletteData.name,
        description: paletteData.description,
        color_items: customPalette.map((color, index) => ({
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
  }, [customPalette, dispatch, savePaletteByProject])

  const copyColorToClipboard = useCallback(async (color) => {
    try {
      const normalizedColor = color.toLowerCase()
      await navigator.clipboard.writeText(normalizedColor)
      setCopiedColor(normalizedColor)
      setTimeout(() => setCopiedColor(null), 2000)
    } catch (err) {
      console.error('Failed to copy color:', err)
    }
  }, [])
  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Escape' && editingIndex !== null) {
      setEditingIndex(null)
    }
  }, [editingIndex])

  useEffect(() => {
    setCustomPalette(chart.colorStrategy.custom_palette.colors)
  }, [chart.colorStrategy])

  useEffect(() => {
    const currentCustomPalette = chart.colorStrategy.custom_palette.colors || [];
    setCustomPalette(currentCustomPalette);
  }, []);

  useEffect(() => {
    document.addEventListener('keypress', handleKeyPress)
    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keypress', handleKeyPress)
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editingIndex !== null) {
        const editingPaper = document.querySelector(`[data-editing-index="${editingIndex}"]`)
        const colorInput = document.querySelector(`input[type="color"][data-index="${editingIndex}"]`)
        if (editingPaper && !editingPaper.contains(event.target) && 
            colorInput && !colorInput.contains(event.target)) {
          saveCurrentColor()
        }
      }
    }
    if (editingIndex !== null) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('click', handleClickOutside)
      }, 200)
      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [editingIndex, saveCurrentColor])

  return (
    <Stack spacing={3}>
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="subtitle1" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 600 }}>
            <ColorLens sx={{ color: theme.palette.primary.main }} />
            Paleta personalizada
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
        <Box>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold", color: "text.secondary" }}>
            Tu paleta personalizada ({customPalette.length}/{MAX_COLORS}):
          </Typography>
          <Grid container spacing={1} direction="column">
            {customPalette.map((color, index) => (
              <Grid item key={index} xs={12}>
                <Paper
                  data-editing-index={editingIndex === index ? index : undefined}
                  sx={{
                    p: 0.5,
                    backgroundColor: "#fafafa",
                    border: editingIndex === index ? `2px solid ${theme.palette.primary.main}` : "1px solid #e0e0e0",
                    borderRadius: 2,
                    transition: "all 0.2s",
                    "&:hover": {
                      transform: "scale(1.02)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {editingIndex === index ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Box
                          sx={{
                            position: "relative",
                            width: 40,
                            height: 40,
                            borderRadius: 1,
                            overflow: "hidden",
                            border: "3px solid #fff",
                            cursor: "pointer"
                          }}
                        >
                          <input
                            type="color"
                            value={tempColor}
                            onChange={handleColorChange}
                            onBlur={handleColorBlur}
                            data-index={index}
                            style={{
                              width: "100%",
                              height: "100%",
                              border: "none",
                              cursor: "pointer",
                              padding: 0
                            }}
                          />
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: "bold",
                            fontFamily: "monospace",
                            fontSize: "14px",
                            minWidth: "80px"
                          }}
                        >
                          {tempColor}
                        </Typography>
                        {isSaving && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: "success.main",
                              fontStyle: "italic",
                              fontSize: "11px"
                            }}
                          >
                            Guardando...
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            backgroundColor: color,
                            border: "3px solid #fff",
                            borderRadius: 1,
                            position: "relative"
                          }}
                        />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: "bold",
                            fontFamily: "monospace",
                            fontSize: "14px",
                            minWidth: "80px"
                          }}
                        >
                          {color}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => startEditing(index)}
                            data-action="edit"
                            sx={{
                              width: 24,
                              height: 24,
                              backgroundColor: "primary.main",
                              color: "white",
                              "&:hover": {
                                backgroundColor: "primary.dark",
                                transform: "scale(1.1)"
                              },
                              transition: "all 0.2s"
                            }}
                          >
                            <Edit sx={{ fontSize: 12 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => copyColorToClipboard(color)}
                            data-action="copy"
                            sx={{
                              width: 24,
                              height: 24,
                              backgroundColor: "success.main",
                              color: "white",
                              "&:hover": {
                                backgroundColor: "success.dark",
                                transform: "scale(1.1)"
                              },
                              transition: "all 0.2s"
                            }}
                          >
                            {copiedColor === color.toLowerCase() ? (
                              <CheckCircle sx={{ fontSize: 12 }} />
                            ) : (
                              <ContentCopy sx={{ fontSize: 12 }} />
                            )}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => removeColorFromPalette(index)}
                            data-action="delete"
                            sx={{
                              width: 24,
                              height: 24,
                              backgroundColor: "error.main",
                              color: "white",
                              "&:hover": {
                                backgroundColor: "error.dark",
                                transform: "scale(1.1)"
                              },
                              transition: "all 0.2s"
                            }}
                          >
                            <Delete sx={{ fontSize: 12 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
            ))}
            {customPalette.length < MAX_COLORS && (
              <Grid item xs={12}>
                <Paper
                  data-editing-index={editingIndex === customPalette.length ? customPalette.length : undefined}
                  sx={{
                    p: 0.5,
                    backgroundColor: "#f8f9fa",
                    border: editingIndex === customPalette.length ? `2px solid ${theme.palette.primary.main}` : "1px dashed #ccc",
                    borderRadius: 2,
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: "#f0f0f0"
                    }
                  }}
                >
                  {editingIndex === customPalette.length ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Box
                        sx={{
                          position: "relative",
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          overflow: "hidden",
                          border: "3px solid #fff",
                          cursor: "pointer"
                        }}
                      >
                        <input
                          type="color"
                          value={tempColor}
                          onChange={handleColorChange}
                          onBlur={handleColorBlur}
                          onFocus={handleColorFocus}
                          data-index={customPalette.length}
                          style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                            cursor: "pointer",
                            padding: 0
                          }}
                        />
                      </Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: "bold",
                          fontFamily: "monospace",
                          fontSize: "14px",
                          minWidth: "80px"
                        }}
                      >
                        {tempColor}
                      </Typography>
                      {isSaving && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: "success.main",
                            fontStyle: "italic",
                            fontSize: "11px"
                          }}
                        >
                          Guardando...
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Box 
                      sx={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 1, 
                        cursor: "pointer",
                        color: "text.secondary"
                      }}
                      onClick={addNewColor}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          border: "2px dashed #ccc",
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Add sx={{ fontSize: 20, color: "#ccc" }} />
                      </Box>
                      <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                        Agregar nuevo color
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>

      {/* Save Palette Dialog */}
      <SavePaletteDialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSavePalette}
        colors={customPalette}
        title="Guardar Paleta Personalizada"
        loading={isSavingPalette}
      />
    </Stack>
  )
}

export default CustomPalleteColors
