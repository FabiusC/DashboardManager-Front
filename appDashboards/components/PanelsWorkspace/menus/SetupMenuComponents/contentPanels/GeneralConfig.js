import { useState, useCallback, useMemo, memo } from "react"
import {
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Grid,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Alert,
} from "@mui/material"
import { AddCircle, RemoveCircle } from "@mui/icons-material"

const TagInput = ({ config, value, onTagsChange }) => {
  const [newTag, setNewTag] = useState("")
  const [tagError, setTagError] = useState("")

  const handleAddTag = useCallback(() => {
    const tagTrimmed = newTag.trim()

    if (!tagTrimmed) {
      setTagError("La etiqueta no puede estar vacía.")
      return
    }

    if (value?.includes(tagTrimmed)) {
      setTagError("La etiqueta ya existe.")
      return
    }

    onTagsChange([...(value || []), tagTrimmed])
    setNewTag("")
    setTagError("")
  }, [newTag, value, onTagsChange])

  const handleRemoveTag = useCallback(
    (index) => {
      const newTags = (value || []).filter((_, i) => i !== index)
      onTagsChange(newTags)
    },
    [value, onTagsChange],
  )

  const handleNewTagChange = useCallback(
    (e) => {
      setNewTag(e.target.value)
      if (tagError) setTagError("")
    },
    [tagError],
  )

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleAddTag()
      }
    },
    [handleAddTag],
  )

  return (
    <Grid item key={config.id}>
      <Box sx={{ mb: 1 }}>
        <Typography variant="body2" sx={{ display: "flex", alignItems: "center", fontSize: "16px" }}>
          {config.title}
        </Typography>
      </Box>
      <TableContainer component={Paper} sx={{ maxHeight: "300px", overflowY: "auto", width: "auto" }}>
        <Table>
          <TableBody>
            {value?.length > 0 &&
              value.map((tag, index) => (
                <TableRow key={`tag-${index}-${tag}`} sx={{ backgroundColor: "rgba(0, 0, 0, 0.12)", p:0 }}>
                  <TableCell sx={{ p: 1 }}>
                    <IconButton onClick={() => handleRemoveTag(index)}>
                      <RemoveCircle sx={{ color: "#C62828" }} />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={tag} placement="right">
                      <span>{tag.length > 30 ? `${tag.substring(0, 30)}...` : tag}</span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            <TableRow>
              <TableCell align="center" sx={{ p: 1 }}>
                <IconButton onClick={handleAddTag} disabled={!newTag.trim()}>
                  <AddCircle color="primary" />
                </IconButton>
              </TableCell>
              <TableCell sx={{ p: 1 }}>
                <TextField
                  value={newTag}
                  onChange={handleNewTagChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Nueva etiqueta (presiona Enter)"
                  size="small"
                  fullWidth
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      {tagError && <Alert severity="error">{tagError}</Alert>}
    </Grid>
  )
}

const GeneralConfig = ({ panel, generalPanel, setGeneralPanel }) => {
  const generalConfigInputs = useMemo(
    () => [
      { id: "title", title: "Título", type: "text" },
      { id: "description", title: "Descripción", type: "textarea" },
      { id: "width", title: "Ancho", type: "number", min: 2, max: 12, step: 1 },
      { id: "height", title: "Alto", type: "number", min: 2, max: 25, step: 1 },
      { id: "tags", title: "Etiquetas", type: "tags" },
      { id: "expanded", title: "Expandido", type: "checkbox" },
      { id: "is_public", title: "Público", type: "checkbox" },
      { id: "is_published", title: "Publicado", type: "checkbox" },
    ],
    [],
  )

  const handleGeneralChange = useCallback(
    (key, value) => {
      setGeneralPanel((prev) => ({ ...prev, [key]: value }))
      console.log(`GeneralConfig change: ${key} = ${value}`)
      panel.actions.handleChangeState(key, value)
    },
    [setGeneralPanel],
  )

  // Handler específico para tags
  const handleTagsChange = useCallback(
    (newTags) => {
      handleGeneralChange("tags", newTags)
    },
    [handleGeneralChange],
  )

  const TextInput = useCallback(
    ({ config, value }) => (
      <TextField
        key={config.id}
        label={config.title}
        value={value || ""}
        multiline={config.type === "textarea"}
        rows={config.type === "textarea" ? 3 : undefined}
        type={config.type === "number" ? "number" : "text"}
        inputProps={config.type === "number" ? { min: config.min, max: config.max, step: config.step } : undefined}
        onChange={(e) =>
          handleGeneralChange(config.id, config.type === "number" ? Number(e.target.value) : e.target.value)
        }
        fullWidth
        size="small"
      />
    ),
    [handleGeneralChange],
  )

  const CheckboxInput = useCallback(
    ({ config, value }) => (
      <FormControlLabel
        key={config.id}
        control={<Checkbox checked={!!value} onChange={(e) => handleGeneralChange(config.id, e.target.checked)} />}
        label={config.title}
      />
    ),
    [handleGeneralChange],
  )

  const renderGeneralInput = useCallback(
    (config, value) => {
      switch (config.type) {
        case "text":
        case "textarea":
        case "number":
          return <TextInput config={config} value={value} />

        case "checkbox":
          return <CheckboxInput config={config} value={value} />

        case "tags":
          return <TagInput config={config} value={value} onTagsChange={handleTagsChange} />

        default:
          return null
      }
    },
    [TextInput, CheckboxInput, handleTagsChange],
  )

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {generalConfigInputs.map((config) => (
        <Box key={config.id}>{renderGeneralInput(config, generalPanel[config.id])}</Box>
      ))}
    </Box>
  )
}

export default memo(GeneralConfig)
