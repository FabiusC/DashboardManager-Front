import { useState } from "react"
import { Box, Typography, alpha, useTheme } from "@mui/material"

const ShadowSelector = ({
  keyName,
  type,
  value_type,
  type_es,
  value,
  id,
  content_options,
  handleInputChange,
  idComponent,
  parentData = [],
}) => {
  const theme = useTheme()
  const [selectedValue, setSelectedValue] = useState(value)

  const handleShadowSelect = (shadowValue) => {
    setSelectedValue(shadowValue)
    handleInputChange(keyName, type, id, shadowValue, value_type, idComponent, parentData)
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
        {type_es}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 1,
        }}
      >
        {content_options.map((option) => (
          <Box
            key={option.id}
            onClick={() => handleShadowSelect(option.value)}
            sx={{
              cursor: "pointer",
              padding: 1,
              borderRadius: 2,
              border:
                selectedValue === option.value
                  ? `2px solid ${theme.palette.primary.main}`
                  : `none`,
              backgroundColor:
                selectedValue === option.value
                  ? alpha(theme.palette.primary.main, 0.1)
                  : theme.palette.background.paper,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                borderColor: theme.palette.primary.main,
              },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            {/* Preview de la sombra */}
            <Box
              sx={{
                width: 60,
                height: 40,
                backgroundColor: theme.palette.background.paper,
                borderRadius: 1,
                boxShadow: option.value,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            />

            {/* Nombre de la sombra */}
            <Typography
              variant="caption"
              sx={{
                textAlign: "center",
                fontSize: "0.75rem",
                fontWeight: selectedValue === option.value ? 600 : 400,
                color: selectedValue === option.value ? theme.palette.primary.main : theme.palette.text.secondary,
              }}
            >
              {option.type_es}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default ShadowSelector
