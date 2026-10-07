import { useState } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  Tooltip
} from "@mui/material"
import { Save, Close } from '@mui/icons-material'

const SavePaletteDialog = ({ 
  open, 
  onClose, 
  onSave, 
  colors, 
  title = "Guardar Paleta",
  loading = false 
}) => {
  const [paletteData, setPaletteData] = useState({
    name: "",
    description: ""
  })

  const handleSave = () => {
    if (!paletteData.name.trim()) {
      return
    }
    onSave(paletteData)
  }

  const handleClose = () => {
    setPaletteData({ name: "", description: "" })
    onClose()
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <TextField
            label="Nombre de la paleta"
            value={paletteData.name}
            onChange={(e) => setPaletteData(prev => ({ ...prev, name: e.target.value }))}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          
          <TextField
            label="Descripción"
            value={paletteData.description}
            onChange={(e) => setPaletteData(prev => ({ ...prev, description: e.target.value }))}
            fullWidth
            multiline
            rows={2}
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Colores de la paleta ({colors.length}):
          </Typography>
          
          <Grid container spacing={1} sx={{ mb: 2 }}>
            {colors.map((color, index) => (
              <Grid item key={index}>
                <Tooltip title={color} arrow>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: color,
                      borderRadius: 1,
                      border: "2px solid #fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                    }}
                  />
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSave}
          disabled={!paletteData.name.trim() || loading}
          startIcon={<Save />}
        >
          Guardar Paleta
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SavePaletteDialog
