import { Box, Typography, TextField } from "@mui/material"
import { useState, useEffect } from "react"

const TextInput = ({
  keyName,
  type,
  value_type,
  type_es,
  value,
  id,
  handleInputChange,
  idComponent,
  parentData,
  content_options = {},
  getValue
}) => {
  const [localValue, setLocalValue] = useState(() => {
    const currentValue = getValue ? getValue(keyName, type, value, parentData) : value
    return currentValue || ""
  })

  // Solo sincronizar cuando cambie el componente o se recargue
  useEffect(() => {
    const currentValue = getValue ? getValue(keyName, type, value, parentData) : value
    console.log("Juan TextInput - useEffect currentValue:", currentValue, "value:", value)
    
    // Solo actualizar si el localValue está vacío (primera carga)
    if (localValue === "" && currentValue) {
      setLocalValue(currentValue)
    }
  }, [keyName, type]) // Solo cuando cambie el componente

  const handleChange = (event) => {
    const newValue = event.target.value
    //Actualizo el estado local
    setLocalValue(newValue)
    //Actualizo el estado global para enviar al darle guardar en el panel
    handleInputChange(keyName, type, id, newValue, value_type, idComponent, parentData)
  }

  console.log("Juan localValue", localValue)

  return (
    <Box>
      <Typography variant="body2" sx={{ display: "flex", alignItems: "center", marginBottom: 1 }}>
        {type_es}
      </Typography>
      <TextField
        fullWidth
        size="small"
        value={localValue}
        onChange={handleChange}
        placeholder={content_options?.placeholder || `Ingrese ${type_es.toLowerCase()}`}
        multiline={content_options?.multiline || false}
        rows={content_options?.rows || 1}
        maxRows={content_options?.maxRows || 4}
        inputProps={{
          maxLength: content_options?.maxLength,
          minLength: content_options?.minLength,
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "divider",
            },
            "&:hover fieldset": {
              borderColor: "primary.main",
            },
            "&.Mui-focused fieldset": {
              borderColor: "primary.main",
            },
          },
        }}
      />
    </Box>
  )
}

export default TextInput
