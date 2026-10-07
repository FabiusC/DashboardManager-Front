import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, SpeedDial, SpeedDialAction, Typography } from "@mui/material"
import { Add, Info, Palette, Settings, Tune } from "@mui/icons-material"
import { useState } from "react"
import { ColorConfig } from "./ColorConfig"

const SettingsConfig = ( { onUpdateConfig } ) => {
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [currentConfigType, setCurrentConfigType] = useState("")

  const openConfigModal = (configType) => {
      setCurrentConfigType(configType)
      setConfigModalOpen(true)
    }
  
    const closeConfigModal = () => {
      setConfigModalOpen(false)
    }
  
    const saveConfig = () => {
      if (onUpdateConfig) {
        onUpdateConfig(currentConfigType, { updated: true })
      }
      closeConfigModal()
    }
  
    const actions = [
      { icon: <Settings />, name: 'basic', tooltip: 'Básico' },
      { icon: <Tune />, name: 'advanced', tooltip: 'Avanzado' },
      { icon: <Palette />, name: 'color', tooltip: 'Color' },
      { icon: <Info />, name: 'tooltip', tooltip: 'Tooltip' },
    ];
  
  return (
    <>
      <SpeedDial
        sx={{ position: "fixed", right: 20, top: "50%", zIndex: 1000 }} 
        icon={<Settings />} 
        ariaLabel="SpeedDial"
        direction="down"
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.tooltip}
            onClick={() => openConfigModal(action.name.toLowerCase())}
            tooltipOpen
          />
        ))}
      </SpeedDial>

      {/* Modal de Configuración */}
      <Dialog open={configModalOpen} onClose={closeConfigModal} fullWidth maxWidth="md">
        <DialogTitle>
          {currentConfigType === "basic" && "Configuración Básica"}
          {currentConfigType === "advanced" && "Configuración Avanzada"}
          {currentConfigType === "color" && "Configuración de Color"}
          {currentConfigType === "tooltip" && "Configuración de Tooltip"}
        </DialogTitle>
        <DialogContent dividers>
          {currentConfigType === "basic" && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" paragraph>
                Configuración básica del gráfico
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aquí puede configurar las opciones básicas como título, subtítulo, leyendas, etc.
              </Typography>
            </Box>
          )}

          {currentConfigType === "advanced" && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" paragraph>
                Configuración avanzada del gráfico
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aquí puede configurar opciones avanzadas como animaciones, interacciones, etc.
              </Typography>
            </Box>
          )}

          {currentConfigType === "color" && (
            <ColorConfig/>
          )}

          {currentConfigType === "tooltip" && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body1" paragraph>
                Configuración de tooltips del gráfico
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aquí puede personalizar la información que se muestra al pasar el cursor sobre el gráfico.
              </Typography>
              
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfigModal} color="inherit">
            Cancelar
          </Button>
          <Button onClick={saveConfig} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default SettingsConfig