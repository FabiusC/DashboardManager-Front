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
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from "@mui/material"
import { dashboardGeneralRequest } from "../../../../../services/dashboardAPI"
import { 
  ColorLens,
  Search,
  Add,
  Delete,
  ContentCopy,
  CheckCircle,
  Edit,
  Star,
  StarBorder,
  Palette,
  Save,
  Close,
  ChevronLeft,
  ChevronRight,
  WarningRounded
} from '@mui/icons-material';
import { handleEditItemEntity } from "../../../../../helpers/dashboardAPI/genericRequest"
import { useDispatch } from "react-redux"
import { pushNotification } from "../../../../../redux/actions"

const SavedPaletteColors = ({idPanel, chartHook, user, onStrategyChange, currentStrategyType }) => {
  const theme = useTheme()
  const chart = chartHook.state
  const dispatch = useDispatch()
  
  const [savedPalettes, setSavedPalettes] = useState([])
  const [isLoadingPalettes, setIsLoadingPalettes] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingPalette, setEditingPalette] = useState(null)
  const [newPaletteData, setNewPaletteData] = useState({
    name: "",
    description: "",
    colors: ["#3498db", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6"],
    category: "Custom"
  })

  const [carouselIndexes, setCarouselIndexes] = useState({})
  const [selectedPaletteId, setSelectedPaletteId] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [paletteToDelete, setPaletteToDelete] = useState(null)
  const [usedByPanels, setUsedByPanels] = useState([])

  const MAX_VISIBLE_COLORS = 12

  useEffect(() => {
    if (chart.colorStrategy && chart.colorStrategy.saved_palette && chart.colorStrategy.saved_palette.color_palette_id) {
      setSelectedPaletteId(chart.colorStrategy.saved_palette.color_palette_id)
    }
  }, [chart.colorStrategy])

  const handleSavePaletteRequest = useCallback(async (palette) => {
    const updateData = {
      saved_palette: {
        color_palette_id: palette.id,
      },
      strategy_type: "saved"
    }
    const result = await dashboardGeneralRequest({
      nameUrl: "updatePanelColorStrategy",
      version: "v1",
      dynamicParams: { panel_id: idPanel },
      typeRequest: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${user.userID}`
      },
      body: updateData
    })
    chartHook.actions.changeColorStrategy ({
      ...chart.colorStrategy,
      saved_palette: {
        color_palette_id: palette.id,
        colors: palette.colors,
      },
      strategy_type: "saved"
    })
    return result
  }, [user.userID])

  const filteredPalettes = savedPalettes.filter(palette => {
    const matchesSearch = palette.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         palette.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const applyPaletteToPanel = useCallback(async (palette) => {
    setIsLoading(true)
    try {
      const updateData = {
        saved_palette: {
          color_palette_id: palette.id
        },
        strategy_type: "saved"
      }
      
      let result = await handleEditItemEntity(
        user.userID,
        "updatePanelColorStrategy",
        "estrategia de colores del chart",
        { panel_id: idPanel },
        updateData,
        dispatch,
        false,
      )
      
              if (result[0]) {
          chartHook.actions.changeColorStrategy({
            ...chart.colorStrategy,
            saved_palette: {
              color_palette_id: palette.id,
              colors: palette.colors,
            },
            strategy_type: "saved"
          })
          setSelectedPaletteId(palette.id)
          let result_request = await handleSavePaletteRequest(palette)
          chartHook.actions.changeColorStrategy({
            ...chart.colorStrategy,
            saved_palette: {
              color_palette_id: palette.id,
              colors: palette.colors,
            },
            strategy_type: "saved"
          })
          if (result_request) {
            dispatch(pushNotification({ msg: `Paleta "${palette.name}" aplicada correctamente.`, status: "ok" }))
          } else {
            dispatch(pushNotification({ msg: "Error al aplicar la paleta.", status: "error" }))
          }
        }
    } catch (error) {
      console.error('Error applying palette:', error)
      dispatch(pushNotification({ msg: "Error al aplicar la paleta.", status: "error" }))
    } finally {
      setIsLoading(false)
    }
  }, [chart.colorStrategy, user.userID, dispatch, idPanel, handleSavePaletteRequest])

  const handleGetPalettesByProject = useCallback(async () => {
    const result = await dashboardGeneralRequest({
      nameUrl: "getPalettesByProject",
      version: "v1",
      typeRequest: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${user.userID}`
      },
      dynamicParams: { project_id: sessionStorage.getItem('projectId') || null }
    })
    return result
  }, [user.userID])

  const handleGetPaletteUsedBy = useCallback(async (paletteId) => {
    const result = await dashboardGeneralRequest({
      nameUrl: "getPaletteUsedBy",
      version: "v1",
      typeRequest: "GET",
      dynamicParams: { palette_id: paletteId }
    })
    return result
  }, [])

  const transformApiDataToPalettes = useCallback((apiData) => {
    return apiData.map((palette) => ({
      id: palette.id,
      name: palette.alias,
      description: palette.description,
      colors: palette.color_items.map(item => item.color).sort((a, b) => {
        const orderA = palette.color_items.find(item => item.color === a)?.order || 0
        const orderB = palette.color_items.find(item => item.color === b)?.order || 0
        return orderA - orderB
      }),
      category: "Custom",
      isFavorite: false,
      createdAt: palette.created_at ? new Date(palette.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      editedAt: palette.edited_at ? new Date(palette.edited_at).toISOString().split('T')[0] : null,
      usageCount: 0
    }))
  }, [])

  const handleEditPaletteRequest = useCallback(async (palette) => {
    const requestBody = {
      alias: palette.alias,
      description: palette.description,
      color_items: palette.color_items.map(item => ({
        color: item.color,
        order: item.order
      }))
    }

    const result = await dashboardGeneralRequest({
      nameUrl: "editPalette",
      version: "v1",
      typeRequest: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${user.userID}`
      },
      dynamicParams: { palette_id: palette.id },
      body: requestBody
    })
    return result
  }, [user.userID])

  const handleDeletePaletteRequest = useCallback(async (palette) => {
    const result = await dashboardGeneralRequest({
      nameUrl: "deletePalette",
      version: "v1",
      typeRequest: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${user.userID}`
      },
      dynamicParams: { palette_id: palette.id }
    })
    return result
  }, [])

  useEffect(() => {
    const fetchPalettes = async () => {
      setIsLoadingPalettes(true)
      try {
        const result = await handleGetPalettesByProject()
        if (result && result.status === "success" && result.data) {
          const transformedPalettes = transformApiDataToPalettes(result.data)
          setSavedPalettes(transformedPalettes)
        } else {
          console.error('Failed to fetch palettes:', result)
          setSavedPalettes([])
        }
      } catch (error) {
        console.error('Error fetching palettes:', error)
        setSavedPalettes([])
        dispatch(pushNotification({ msg: "Error al cargar las paletas guardadas.", status: "error" }))
      } finally {
        setIsLoadingPalettes(false)
      }
    }

    fetchPalettes()
  }, [handleGetPalettesByProject, transformApiDataToPalettes, dispatch])

  const handleEditPalette = useCallback((palette) => {
    setNewPaletteData({
      name: palette.name,
      description: palette.description,
      colors: [...palette.colors],
      category: palette.category
    })
    setEditingPalette(palette)
    setShowCreateDialog(true)
  }, [])

  const handleSavePalette = useCallback(async () => {
    if (!newPaletteData.name.trim()) {
      dispatch(pushNotification({ msg: "El nombre de la paleta es requerido.", status: "error" }))
      return
    }

    try {
      if (editingPalette) {
        const updatedPalette = {
          ...editingPalette,
          alias: newPaletteData.name,
          description: newPaletteData.description,
          color_items: newPaletteData.colors.map((color, index) => ({
            color: color,
            order: index + 1
          }))
        }
        const result = await handleEditPaletteRequest(updatedPalette)
        if (result) {
          setSavedPalettes(prev => prev.map(palette => 
            palette.id === editingPalette.id 
              ? {
                  ...palette,
                  name: newPaletteData.name,
                  description: newPaletteData.description,
                  colors: newPaletteData.colors,
                  editedAt: new Date().toISOString().split('T')[0]
                }
              : palette
          ))
          
          // Update chartHook only if the edited palette is currently applied
          if (selectedPaletteId === editingPalette.id) {
            chartHook.actions.changeColorStrategy({
              ...chart.colorStrategy,
              saved_palette: {
                color_palette_id: editingPalette.id,
                colors: newPaletteData.colors,
              },
              strategy_type: "saved"
            })
          }
          
          dispatch(pushNotification({ msg: "Paleta actualizada correctamente.", status: "ok" }))
        } else {
          dispatch(pushNotification({ msg: "Error al actualizar la paleta.", status: "error" }))
          return
        }
      } else {
        const newPalette = {
          id: Date.now(),
          ...newPaletteData,
          isFavorite: false,
          createdAt: new Date().toISOString().split('T')[0],
          usageCount: 0
        }
        setSavedPalettes(prev => [newPalette, ...prev])
        dispatch(pushNotification({ msg: "Paleta creada correctamente.", status: "ok" }))
      }
      
      setShowCreateDialog(false)
      setEditingPalette(null)
    } catch (error) {
      console.error('Error saving palette:', error)
      dispatch(pushNotification({ msg: "Error al guardar la paleta.", status: "error" }))
    }
  }, [newPaletteData, editingPalette, dispatch, handleEditPaletteRequest, selectedPaletteId, chart.colorStrategy, chartHook.actions])

  const handleDeletePalette = useCallback(async (palette) => {
    try {
      const usedByResult = await handleGetPaletteUsedBy(palette.id)      
      if (usedByResult && usedByResult.data && usedByResult.data.length > 0) {
        setUsedByPanels(usedByResult.data)
        setPaletteToDelete(palette)
        setShowDeleteModal(true)
      } else {
        await confirmDeletePalette(palette)
      }
    } catch (error) {
      console.error('Error checking palette usage:', error)
      dispatch(pushNotification({ msg: "Error al verificar el uso de la paleta.", status: "error" }))
    }
  }, [handleGetPaletteUsedBy, dispatch])

  const confirmDeletePalette = useCallback(async (palette) => {
    try {
      const result = await handleDeletePaletteRequest(palette)
      if (result) {
        setSavedPalettes(prev => prev.filter(p => p.id !== palette.id))
        dispatch(pushNotification({ msg: "Paleta eliminada correctamente.", status: "ok" }))
      } else {
        dispatch(pushNotification({ msg: "Error al eliminar la paleta.", status: "error" }))
      }
    } catch (error) {
      console.error('Error deleting palette:', error)
      dispatch(pushNotification({ msg: "Error al eliminar la paleta.", status: "error" }))
    }
  }, [handleDeletePaletteRequest, dispatch])

  const handleColorChange = useCallback((index, newColor) => {
    setNewPaletteData(prev => ({
      ...prev,
      colors: prev.colors.map((color, i) => i === index ? newColor : color)
    }))
  }, [])

  const addColorToPalette = useCallback(() => {
    if (newPaletteData.colors.length < 8) {
      setNewPaletteData(prev => ({
        ...prev,
        colors: [...prev.colors, "#000000"]
      }))
    }
  }, [newPaletteData.colors.length])

  const removeColorFromPalette = useCallback((index) => {
    if (newPaletteData.colors.length > 2) {
      setNewPaletteData(prev => ({
        ...prev,
        colors: prev.colors.filter((_, i) => i !== index)
      }))
    }
  }, [newPaletteData.colors.length])

  const nextCarousel = useCallback((paletteId) => {
    setCarouselIndexes(prev => {
      const currentIndex = prev[paletteId] || 0
      const palette = savedPalettes.find(p => p.id === paletteId)
      const maxIndex = palette ? Math.max(0, palette.colors.length - MAX_VISIBLE_COLORS) : 0
      return {
        ...prev,
        [paletteId]: Math.min(currentIndex + 1, maxIndex)
      }
    })
  }, [savedPalettes])

  const prevCarousel = useCallback((paletteId) => {
    setCarouselIndexes(prev => {
      const currentIndex = prev[paletteId] || 0
      return {
        ...prev,
        [paletteId]: Math.max(0, currentIndex - 1)
      }
    })
  }, [])

  return (
    <Stack spacing={3}>
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="subtitle1" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 600 }}>
            <ColorLens sx={{ color: theme.palette.primary.main }} />
            Paletas Guardadas
          </Typography>
        </Box>
        <Divider sx={{ mb: 0.1}} />
      </Box>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <TextField
          placeholder="Buscar paletas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
          size="small"
        />
      </Box>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {filteredPalettes.length} paleta{filteredPalettes.length !== 1 ? 's' : ''} encontrada{filteredPalettes.length !== 1 ? 's' : ''}
      </Typography>
      {isLoadingPalettes ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2}>
          {filteredPalettes.map((palette) => (
          <Card 
            key={palette.id}
            sx={{ 
              transition: "all 0.2s",
              border: selectedPaletteId === palette.id ? `2px solid ${theme.palette.primary.main}` : "1px solid transparent",
              backgroundColor: selectedPaletteId === palette.id ? theme.palette.primary.light + "10" : "transparent",
              "&:hover": {
                transform: "translateX(4px)",
                boxShadow: theme.shadows[8]
              }
            }}
          >
            <CardContent sx={{ p: 1 }}>
              <Box sx={{ display: "flex", alignItems: "left", justifyContent: "space-between", mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "12px" }}>
                    {palette.name}
                  </Typography>
                  {selectedPaletteId === palette.id && (
                    <Chip
                      label="Aplicada"
                      size="small"
                      color="primary"
                      sx={{ 
                        fontSize: "10px", 
                        height: "20px",
                        backgroundColor: theme.palette.primary.main,
                        color: "white"
                      }}
                    />
                  )}
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "left", alignItems: "left", mb: 1, gap: 1 }}>
                {palette.colors.length > MAX_VISIBLE_COLORS && (
                  <IconButton
                    size="small"
                    onClick={() => prevCarousel(palette.id)}
                    disabled={!carouselIndexes[palette.id]}
                    sx={{
                      backgroundColor: "rgba(0,0,0,0.1)",
                      color: "text.primary",
                      width: 24,
                      height: 24,
                      "&:hover": { backgroundColor: "rgba(0,0,0,0.2)" },
                      "&:disabled": { opacity: 0.3 }
                    }}
                  >
                    <ChevronLeft sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
                
                <Box sx={{ display: "flex", gap: 0.5, overflow: "hidden" }}>
                  {palette.colors
                    .slice(
                      carouselIndexes[palette.id] || 0,
                      (carouselIndexes[palette.id] || 0) + MAX_VISIBLE_COLORS
                    )
                    .map((color, index) => (
                      <Tooltip key={index} title={color} arrow>
                        <Box
                          sx={{
                            width: 30,
                            height: 30,
                            backgroundColor: color,
                            borderRadius: 1,
                            border: "2px solid #fff",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                            cursor: "pointer",
                            transition: "transform 0.1s",
                            "&:hover": {
                              transform: "scale(1.1)"
                            }
                          }}
                          onClick={() => copyColorToClipboard(color)}
                        />
                      </Tooltip>
                    ))}
                </Box>

                {palette.colors.length > MAX_VISIBLE_COLORS && (
                  <IconButton
                    size="small"
                    onClick={() => nextCarousel(palette.id)}
                    disabled={
                      (carouselIndexes[palette.id] || 0) >= 
                      Math.max(0, palette.colors.length - MAX_VISIBLE_COLORS)
                    }
                    sx={{
                      backgroundColor: "rgba(0,0,0,0.1)",
                      color: "text.primary",
                      width: 24,
                      height: 24,
                      "&:hover": { backgroundColor: "rgba(0,0,0,0.2)" },
                      "&:disabled": { opacity: 0.3 }
                    }}
                  >
                    <ChevronRight sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1, textAlign: "left", fontSize: "11px" }}>
                {palette.description}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant={selectedPaletteId === palette.id ? "outlined" : "contained"}
                    size="small"
                    startIcon={selectedPaletteId === palette.id ? <CheckCircle /> : <Palette />}
                    onClick={() => applyPaletteToPanel(palette)}
                    disabled={isLoading}
                    sx={{
                      ...(selectedPaletteId === palette.id && {
                        borderColor: theme.palette.primary.main,
                        color: theme.palette.primary.main,
                        "&:hover": {
                          backgroundColor: theme.palette.primary.light + "20"
                        }
                      })
                    }}
                  >
                    {selectedPaletteId === palette.id ? "Aplicada" : "Aplicar"}
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => handleEditPalette(palette)}
                    sx={{ 
                      backgroundColor: "primary.main",
                      color: "white",
                      "&:hover": { backgroundColor: "primary.dark" }
                    }}
                  >
                    <Edit sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeletePalette(palette)}
                    sx={{ 
                      backgroundColor: "error.main",
                      color: "white",
                      "&:hover": { backgroundColor: "error.dark" }
                    }}
                  >
                    <Delete sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
        </Stack>
      )}
      {filteredPalettes.length === 0 && !isLoadingPalettes && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <ColorLens sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" sx={{ color: "text.secondary", mb: 1 }}>
            No se encontraron paletas
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {searchTerm 
              ? "Intenta ajustar los filtros de búsqueda"
              : "Crea tu primera paleta personalizada"
            }
          </Typography>
        </Box>
      )}
      <Dialog 
        open={showCreateDialog} 
        onClose={() => setShowCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {editingPalette ? "Editar Paleta" : "Crear Nueva Paleta"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Nombre de la paleta"
              value={newPaletteData.name}
              onChange={(e) => setNewPaletteData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Descripción"
              value={newPaletteData.description}
              onChange={(e) => setNewPaletteData(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={2}
            />
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Colores ({newPaletteData.colors.length}/8)
                </Typography>
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={addColorToPalette}
                  disabled={newPaletteData.colors.length >= 8}
                >
                  Agregar Color
                </Button>
              </Box>
              
              <Grid container spacing={1}>
                {newPaletteData.colors.map((color, index) => (
                  <Grid item xs={6} sm={4} key={index}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          position: "relative",
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          overflow: "hidden",
                          border: "2px solid #fff",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                        }}
                      >
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => handleColorChange(index, e.target.value)}
                          style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                            cursor: "pointer",
                            padding: 0
                          }}
                        />
                      </Box>
                      {newPaletteData.colors.length > 2 && (
                        <IconButton
                          size="small"
                          onClick={() => removeColorFromPalette(index)}
                          sx={{ 
                            backgroundColor: "error.main",
                            color: "white",
                            width: 24,
                            height: 24,
                            "&:hover": { backgroundColor: "error.dark" }
                          }}
                        >
                          <Close sx={{ fontSize: 12 }} />
                        </IconButton>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowCreateDialog(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSavePalette}
            startIcon={<Save />}
          >
            {editingPalette ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog 
        open={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            No se puede eliminar la paleta
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <Box sx={{ 
              p: 3, 
              backgroundColor: "rgba(255,255,255,0.95)", 
              borderRadius: 2,
              border: "1px solid rgba(0,0,0,0.1)"
            }}>
              <Typography 
                component="div" 
                sx={{ 
                  textAlign: "center", 
                  fontWeight: "500", 
                  marginBottom: "10px", 
                  fontSize: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1
                }}
              >
                <WarningRounded fontSize="medium" color="warning" />
                Paleta en uso
              </Typography>
              <Typography 
                component="div" 
                sx={{ 
                  textAlign: "justify", 
                  fontWeight: "500", 
                  marginBottom: "10px", 
                  fontSize: "16px" 
                }}
              >
                No se puede eliminar la paleta <strong>{paletteToDelete?.name}</strong> porque está siendo utilizada actualmente.
              </Typography>
              <Typography 
                component="div" 
                sx={{ 
                  textAlign: "justify", 
                  fontWeight: "500", 
                  marginBottom: "10px", 
                  fontSize: "16px",
                  color: "warning.main"
                }}
              >
                <strong>⚠️ Acción requerida:</strong> Esta paleta está siendo utilizada por {usedByPanels.length} panel{usedByPanels.length > 1 ? 'es' : ''}. 
                Para poder eliminarla, primero debe desvincular todos los paneles que la están utilizando.
              </Typography>
              <Typography 
                component="div" 
                sx={{ 
                  textAlign: "justify", 
                  fontWeight: "500", 
                  marginBottom: "10px", 
                  fontSize: "16px" 
                }}
              >
                <strong>Pasos para desvincular:</strong>
                <br />
                1. Vaya a cada panel que utiliza esta paleta
                <br />
                2. Cambie la configuración de colores a otra paleta o estrategia
                <br />
                3. Una vez desvinculados todos los paneles, podrá eliminar esta paleta
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => {
              setShowDeleteModal(false)
              setPaletteToDelete(null)
              setUsedByPanels([])
            }}
            variant="contained"
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
export default SavedPaletteColors
