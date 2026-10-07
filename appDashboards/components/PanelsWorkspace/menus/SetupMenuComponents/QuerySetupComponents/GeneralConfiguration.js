import { useState, useCallback, useEffect, useMemo } from "react"
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Divider,
  Stack,
  useTheme,
} from "@mui/material"

import { SwapVert, ColorLens } from '@mui/icons-material';
import RangeInput from '../contentPanels/RangeInput';
import { handleEditItemEntity } from "../../../../../helpers/dashboardAPI/genericRequest";
import { useDispatch } from "react-redux";
import { useChartContext } from "@components/PanelsWorkspace/hooks/useChartContext";
import { usePanelContext } from "@components/PanelsWorkspace/hooks/usePanelContext";

const GeneralConfiguration = ({ panel, user }) => {
  const theme = useTheme()
  const dispatch = useDispatch()
  const chartContext = useChartContext()
  const chartState = chartContext.state
  const panelContext = usePanelContext()
  const panelState = panelContext.state
  const [limit, setLimit] = useState(chartState.queryParameters.limit)
  const [sortField, setSortField] = useState("")
  const [sortDirection, setSortDirection] = useState("asc")
  const [sortCriterion, setSortCriterion] = useState("lexicographic")


  const sortFields = useMemo(() => {
    return chartState.queryParameters.selected_fields?.map(field => ({
      value: field.name, // El nombre del campo es el value
      label: field.alias || field.name,
      id: field.id,
      field_id: field.field_id
    })) || []
  }, [chartState.queryParameters.selected_fields])


  // Sincronizar valores del estado del contexto
  useEffect(() => {
    if (chartState.queryParameters?.sort_rule?.field !== undefined && sortFields.length > 0) {
      let foundField = sortFields.find(field => field.field_id === chartState.queryParameters.sort_rule.field)
      if (foundField) {
        setSortField(foundField.value)
      } else {
        setSortField("")
      }
    }
    if (chartState.queryParameters?.sort_rule?.direction !== undefined) {
      setSortDirection(chartState.queryParameters.sort_rule.direction)
    }
    if (chartState.queryParameters?.sort_rule?.order !== undefined) {
      setSortCriterion(chartState.queryParameters.sort_rule.order)
    }
  }, [chartState.queryParameters?.sort_rule?.field, chartState.queryParameters?.sort_rule?.direction, chartState.queryParameters?.sort_rule?.order, sortFields])

  const sortDirections = [
    { value: "asc", label: "Ascendente" },
    { value: "desc", label: "Descendente" },
  ]

  const sortCriteria = [
    { value: "lexicographic", label: "Lexicográfico" },
    { value: "numeric", label: "Numérico" },
    { value: "alphanumeric", label: "Alfanumérico" },
  ]

  const savePanelQueryParameter = async (newLimit) => {
    if (panelState.panel.id) {
        const requestBody = { limit: newLimit }
        const id = { panel_id: panelState.panel.id }
        const response = await handleEditItemEntity(
            user.userID,
            'updatePanelQueryParameters',
            'parámetros de la consulta',
            id,
            requestBody,
            dispatch,
            false
        );
        if (response[0]) {
          chartContext.actions.updateQueryParams({"limit": newLimit});
        }
    }
  }

  const saveSortParameters = useCallback(async (field, direction, criterion) => {
    if (panelState.panel.id && field) {
        const requestBody = {
          sort_rule: {
            field: field.field_id,
            direction: direction,
            order: criterion
          }
        }
        const id = { panel_id: panelState.panel.id }
        const response = await handleEditItemEntity(
            user.userID,
            'updatePanelQueryParameters',
            'parámetros de la consulta',
            id,
            requestBody,
            dispatch,
            false
        );
        if (response[0]) {
          chartContext.actions.updateQueryParams({
            sort_field: field.value,
            sort_direction: direction,
            sort_criterion: criterion
          });
        }
    }
  }, [panelState.panel.id, user.userID, dispatch, chartContext.actions])

  const handleLimitChange = useCallback((keyName, type, id, newValue, value_type, idComponent) => {
    setLimit(newValue)
    // Call the endpoint when limit changes
    savePanelQueryParameter(newValue)
  }, [panelState.panel.id, user.userID])

  const handleSortFieldChange = useCallback((e) => {
    const newField = e.target.value
    setSortField(newField)
    if (newField) {
      saveSortParameters(sortFields.find(field => field.value === newField), sortDirection, sortCriterion)
    }
  }, [sortDirection, sortCriterion, saveSortParameters])

  const handleSortDirectionChange = useCallback((e) => {
    const newDirection = e.target.value
    setSortDirection(newDirection)
    if (sortField) {
      saveSortParameters(sortFields.find(field => field.value === sortField), newDirection, sortCriterion)
    }
  }, [sortField, sortCriterion, saveSortParameters])

  const handleSortCriterionChange = useCallback((e) => {
    const newCriterion = e.target.value
    setSortCriterion(newCriterion)
    if (sortField) {
      saveSortParameters(sortFields.find(field => field.value === sortField), sortDirection, newCriterion)
    }
  }, [sortField, sortDirection, saveSortParameters])

  const limitContentOptions = [
    { type: "limit_lower", value: "1" },
    { type: "limit_upper", value: "100" },
    { type: "step", value: "1" }
  ]

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle1" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 600, mb: 2 }}>
        <ColorLens sx={{ color: theme.palette.primary.main }} />
          Límite de resultados
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box>
          <RangeInput
            keyName="limit"
            type="limit"
            value_type="number"
            type_es="Límite"
            value={limit}
            id="limit-input"
            handleInputChange={handleLimitChange}
            content_options={limitContentOptions}
            idComponent="general-config"
          />
        </Box>
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 600, mb: 2 }}>
          <SwapVert sx={{ color: theme.palette.primary.main }} />
          Regla de Ordenamiento
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={3}>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 600 }}
            >   
            </Typography>
            <Typography variant="body2" sx={{ display: "flex", alignItems: "center", marginBottom: 1 }}>
              Campo a ordenar
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={sortField}
                onChange={handleSortFieldChange}
                displayEmpty
              >
                <MenuItem value="">
                  <em>Seleccionar campo</em>
                </MenuItem>
                {sortFields.map((field) => (
                  <MenuItem key={field.id} value={field.value}>
                    {field.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ display: "flex", alignItems: "center", marginBottom: 1 }}>
              Dirección
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={sortDirection}
                onChange={handleSortDirectionChange}
              >
                {sortDirections.map((direction) => (
                  <MenuItem key={direction.value} value={direction.value}>
                    {direction.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ display: "flex", alignItems: "center", marginBottom: 1 }}>
              Criterio
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={sortCriterion}
                onChange={handleSortCriterionChange}
              >
                {sortCriteria.map((criterion) => (
                  <MenuItem key={criterion.value} value={criterion.value}>
                    {criterion.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Stack>
      </Box>
     
    </Stack>
  )
}

export default GeneralConfiguration
