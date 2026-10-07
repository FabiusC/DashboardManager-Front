import { useState, useCallback, useMemo, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useQuery } from "@tanstack/react-query"
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import {
  Add as AddIcon,
  CloseRounded as CloseIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material"
import { alpha } from "@mui/material/styles"
import { useChartContext } from "@components/PanelsWorkspace/hooks/useChartContext"
import { useFieldsByDataSourceId } from "@components/DashboardsWorkspace/hooks/useFields"
import { handleQuery } from "@helpers/QueryManagerAPI/queryRequest"

const COMPARISON_OPERATORS = [
  { value: "EQUALS", label: "Igual (=)" },
  { value: "NOT_EQUALS", label: "Diferente (!=)" },
  { value: "BETWEEN", label: "Entre dos valores" },
]

const GROUP_OPERATORS = [
  { value: "AND", label: "Y(AND)" },
  { value: "OR", label: "O(OR)" },
]
const MAX_GROUP_LEVEL = 1
const VALUE_OPTIONS_QUERY_KEY = "custom-filter-value-options"

const createCondition = () => ({
  operator: "EQUALS",
  field: "",
  value: "",
})

const createGroup = () => ({
  operator: "AND",
  conditions: [],
})

const isGroup = (item) => Array.isArray(item?.conditions)

const hasValue = (value) => {
  if (value === null || value === undefined) return false
  if (typeof value === "string") return value.trim().length > 0
  return true
}

const normalizeFilterNode = (node) => {
  if (!node || typeof node !== "object") return null

  if (isGroup(node)) {
    const normalizedConditions = (node.conditions || [])
      .map((child) => normalizeFilterNode(child))
      .filter(Boolean)
    if (normalizedConditions.length === 0) return null
    return {
      operator: node.operator === "OR" ? "OR" : "AND",
      conditions: normalizedConditions,
    }
  }

  if (!node.field || !node.operator) return null
  if (node.operator === "BETWEEN") {
    const from = node?.value?.from
    const to = node?.value?.to
    if (!hasValue(from) || !hasValue(to)) return null
    return {
      operator: node.operator,
      field: node.field,
      value: { from, to },
    }
  }

  if (!hasValue(node.value)) return null
  return {
    operator: node.operator,
    field: node.field,
    value: node.value,
  }
}

const buildGroupContext = (operator, conditions) => {
  if (!Array.isArray(conditions) || conditions.length === 0) return null
  if (conditions.length === 1) return conditions[0]
  return {
    operator: operator === "OR" ? "OR" : "AND",
    conditions,
  }
}

const buildScopedContextByOperator = (operator, previousSiblingNodes) => {
  // Con OR, los hermanos previos no deben restringir la rama actual.
  if (operator !== "AND") return null
  return buildGroupContext("AND", previousSiblingNodes)
}

const mergeWithAnd = (left, right) => {
  if (!left) return right || null
  if (!right) return left || null

  const leftConditions = left.operator === "AND" && Array.isArray(left.conditions) ? left.conditions : [left]
  const rightConditions = right.operator === "AND" && Array.isArray(right.conditions) ? right.conditions : [right]

  return {
    operator: "AND",
    conditions: [...leftConditions, ...rightConditions],
  }
}

const countRules = (node) =>
  (node?.conditions || []).reduce((total, item) => (isGroup(item) ? total + countRules(item) : total + 1), 0)

const getOperatorVisual = (operator) => {
  const isOr = operator === "OR"
  return {
    color: isOr ? "#ff9800" : "#4caf50",
    bg: isOr ? alpha("#ff9800", 0.08) : alpha("#4caf50", 0.08),
  }
}

const normalizeFieldType = (rawType) => {
  const parsedType = String(rawType || "").toLowerCase()
  if (["int", "integer", "number", "float", "double", "decimal"].includes(parsedType)) return "number"
  if (["measure", "metric"].includes(parsedType)) return "number"
  if (["dimension"].includes(parsedType)) return "string"
  if (["bool", "boolean"].includes(parsedType)) return "boolean"
  if (["date", "datetime", "timestamp"].includes(parsedType)) return "date"
  return "string"
}

const isValidUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""))

const getFieldKind = (field) => {
  if (field?.isDimension) return "Categoría"
  if (field?.isNumeric) return "Métrica numérica"
  return "Métrica"
}

const OperatorBadge = ({ value }) => {
  const operator = value || "AND"
  const { color, bg } = getOperatorVisual(operator)
  const option = GROUP_OPERATORS.find((item) => item.value === operator)

  return (
    <Typography
      sx={{
        px: 1.2,
        py: 0.15,
        borderRadius: 1,
        fontSize: "10px",
        fontWeight: 700,
        color,
        backgroundColor: bg,
        border: `1px solid ${alpha(color, 0.3)}`,
        letterSpacing: "0.2px",
      }}
    >
      {option?.label || operator}
    </Typography>
  )
}

const OperatorDividerSelect = ({ value, onChange }) => {
  const operator = value || "AND"
  const { color, bg } = getOperatorVisual(operator)

  return (
    <FormControl size="small" sx={{ minWidth: 92 }}>
      <Select
        value={operator}
        onChange={(event) => onChange(event.target.value)}
        sx={{
          height: 24,
          borderRadius: 1,
          fontSize: "10px",
          fontWeight: 700,
          color,
          backgroundColor: bg,
          border: `1px solid ${alpha(color, 0.3)}`,
          "& .MuiSelect-select": {
            py: 0.2,
            px: 1,
            pr: "22px !important",
            letterSpacing: "0.2px",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            border: "none",
          },
          "& .MuiSvgIcon-root": {
            fontSize: 16,
            color,
          },
        }}
      >
        {GROUP_OPERATORS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

const ValueAutocomplete = ({ label, value, options, loading, disabled, onChange }) => {
  return (
    <Autocomplete
      size="small"
      fullWidth
      options={options}
      value={value || null}
      loading={loading}
      disabled={disabled}
      onChange={(_, nextValue) => onChange(nextValue || "")}
      isOptionEqualToValue={(option, currentValue) => option === currentValue}
      noOptionsText={loading ? "Cargando..." : "Sin resultados"}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder="Buscar..."
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={16} sx={{ mr: 0.5 }} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  )
}

const RuleEditor = ({
  condition,
  onUpdate,
  onRemove,
  availableFields,
  scopedFilters,
  queryContext,
  disableAllInputs = false,
  globalFiltersHash = "",
}) => {
  const selectedField = availableFields.find((field) => field.value === condition.field)
  const isCategoricalField = !!selectedField?.isDimension
  const isBetween = condition.operator === "BETWEEN"
  const betweenValue =
    typeof condition.value === "object" && condition.value !== null
      ? condition.value
      : { from: "", to: "" }
  const scopedFilterHash = useMemo(() => JSON.stringify(scopedFilters || null), [scopedFilters])
  const selectedFieldId = selectedField?.raw?.id ?? selectedField?.raw?.field_id

  const { data: fieldValueOptions = [], isLoading: isLoadingOptions } = useQuery({
    queryKey: [
      VALUE_OPTIONS_QUERY_KEY,
      queryContext?.datasourceId,
      selectedFieldId,
      selectedField?.value,
      scopedFilterHash,
      globalFiltersHash,
    ],
    enabled:
      isCategoricalField &&
      !!selectedField &&
      !!queryContext?.datasourceId &&
      !!queryContext?.userToken &&
      !!queryContext?.dispatch,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    placeholderData: undefined,
    queryFn: async () => {
      const normalizedFieldId = String(selectedField?.raw?.id ?? selectedField?.raw?.field_id ?? "")
      if (!isValidUuid(normalizedFieldId)) return []

      const groupField = {
        id: normalizedFieldId,
        field_id: normalizedFieldId,
        name: selectedField.value,
        alias: selectedField.label,
        type: selectedField.sourceType || "dimension",
        description: selectedField.raw?.description || selectedField.label,
        is_dimension: true,
        metric: "count",
      }
      const countAggregation = {
        id: normalizedFieldId,
        name: groupField.name,
        alias: `Conteo de ${groupField.alias || groupField.name}`,
        type: "measure",
        metric: "count",
      }

      const [ok, data] = await handleQuery(
        queryContext.dispatch,
        queryContext.userToken,
        "query",
        "valores de filtro",
        {
          query_type: "aggregation",
          datasource_id: queryContext.datasourceId,
          group_by: [groupField],
          aggregations: [countAggregation],
          limit: 1000,
          ...(scopedFilters ? { filters: scopedFilters } : {}),
        },
        {}
      )

      if (!ok || !Array.isArray(data)) return []

      return Array.from(
        new Set(
          data
            .map((row) => row?.[groupField.name] ?? row?.[groupField.alias])
            .filter((value) => value !== null && value !== undefined && String(value).trim() !== "")
            .map((value) => String(value))
        )
      )
    },
  })

  const isInputsDisabled = disableAllInputs || isLoadingOptions

  useEffect(() => {
    if (!isCategoricalField) return
    if (isLoadingOptions) return
    if (fieldValueOptions.length === 0) return

    if (isBetween) {
      const nextFrom = fieldValueOptions.includes(String(betweenValue.from || "")) ? betweenValue.from : ""
      const nextTo = fieldValueOptions.includes(String(betweenValue.to || "")) ? betweenValue.to : ""
      if (nextFrom !== betweenValue.from || nextTo !== betweenValue.to) {
        onUpdate({
          ...condition,
          value: { from: nextFrom, to: nextTo },
        })
      }
      return
    }

    const currentValue = typeof condition.value === "object" ? "" : String(condition.value || "")
    if (currentValue && !fieldValueOptions.includes(currentValue)) {
      onUpdate({ ...condition, value: "" })
    }
  }, [
    isCategoricalField,
    isLoadingOptions,
    fieldValueOptions,
    isBetween,
    betweenValue.from,
    betweenValue.to,
    condition,
    onUpdate,
  ])

  const handleOperatorChange = useCallback(
    (operator) => {
      if (operator === "BETWEEN") {
        onUpdate({ ...condition, operator, value: betweenValue })
        return
      }

      const normalizedValue = typeof condition.value === "object" ? "" : condition.value
      onUpdate({ ...condition, operator, value: normalizedValue || "" })
    },
    [betweenValue, condition, onUpdate]
  )

  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.default",
      }}
    >
      <Stack spacing={1}>
        <FormControl size="small" fullWidth>
          <Autocomplete
            options={availableFields}
            value={selectedField || null}
            disabled={disableAllInputs}
            getOptionLabel={(option) => option?.label || ""}
            isOptionEqualToValue={(option, current) => option.value === current.value}
            onChange={(_, nextField) => onUpdate({ ...condition, field: nextField?.value || "", value: "" })}
            renderOption={(props, option) => (
              <Box
                component="li"
                {...props}
                sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}
              >
                <Typography variant="body2" sx={{ pr: 1 }}>
                  {option.label}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "11px", whiteSpace: "nowrap" }}>
                  {getFieldKind(option)}
                </Typography>
              </Box>
            )}
            renderInput={(params) => <TextField {...params} label="Campo" placeholder="Buscar campo..." size="small" />}
          />
        </FormControl>

        <FormControl size="small" fullWidth>
          <InputLabel>Operador</InputLabel>
          <Select
            value={condition.operator || "EQUALS"}
            label="Operador"
            disabled={isInputsDisabled}
            onChange={(event) => handleOperatorChange(event.target.value)}
          >
            {COMPARISON_OPERATORS.map((operator) => (
              <MenuItem key={operator.value} value={operator.value}>
                {operator.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {isBetween ? (
          <Stack direction="row" spacing={1} alignItems="center">
            {isCategoricalField ? (
              <>
                <ValueAutocomplete
                  label="Desde"
                  value={betweenValue.from || ""}
                  options={fieldValueOptions}
                  loading={isLoadingOptions}
                  disabled={isInputsDisabled}
                  onChange={(nextValue) =>
                    onUpdate({
                      ...condition,
                      value: { ...betweenValue, from: nextValue },
                    })
                  }
                />
                <ValueAutocomplete
                  label="Hasta"
                  value={betweenValue.to || ""}
                  options={fieldValueOptions}
                  loading={isLoadingOptions}
                  disabled={isInputsDisabled}
                  onChange={(nextValue) =>
                    onUpdate({
                      ...condition,
                      value: { ...betweenValue, to: nextValue },
                    })
                  }
                />
              </>
            ) : (
              <>
                <TextField
                  size="small"
                  fullWidth
                  disabled={isInputsDisabled}
                  label="Desde"
                  value={betweenValue.from || ""}
                  type={selectedField?.type === "number" ? "number" : "text"}
                  placeholder="Valor inicial"
                  onChange={(event) =>
                    onUpdate({
                      ...condition,
                      value: { ...betweenValue, from: event.target.value },
                    })
                  }
                />
                <TextField
                  size="small"
                  fullWidth
                  disabled={isInputsDisabled}
                  label="Hasta"
                  value={betweenValue.to || ""}
                  type={selectedField?.type === "number" ? "number" : "text"}
                  placeholder="Valor final"
                  onChange={(event) =>
                    onUpdate({
                      ...condition,
                      value: { ...betweenValue, to: event.target.value },
                    })
                  }
                />
              </>
            )}
            <IconButton size="small" color="error" onClick={onRemove} aria-label="Eliminar condición" disabled={isInputsDisabled}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1} alignItems="center">
            {isCategoricalField ? (
              <ValueAutocomplete
                label="Valor"
                value={typeof condition.value === "object" ? "" : condition.value || ""}
                options={fieldValueOptions}
                loading={isLoadingOptions}
                disabled={isInputsDisabled}
                onChange={(nextValue) => onUpdate({ ...condition, value: nextValue })}
              />
            ) : (
              <TextField
                size="small"
                fullWidth
                disabled={isInputsDisabled}
                label="Valor"
                value={typeof condition.value === "object" ? "" : condition.value || ""}
                type={selectedField?.type === "number" ? "number" : "text"}
                placeholder={selectedField?.type === "boolean" ? "true/false" : "Escribe un valor"}
                onChange={(event) => onUpdate({ ...condition, value: event.target.value })}
              />
            )}
            <IconButton size="small" color="error" onClick={onRemove} aria-label="Eliminar condición" disabled={isInputsDisabled}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        )}
        {isCategoricalField && isLoadingOptions && (
          <Typography sx={{ fontSize: "11px", color: "text.secondary" }}>
            Cargando valores disponibles...
          </Typography>
        )}
        {isCategoricalField && !isLoadingOptions && fieldValueOptions.length === 0 && (
          <Typography sx={{ fontSize: "11px", color: "warning.main" }}>
            No hay valores disponibles para este campo.
          </Typography>
        )}
      </Stack>
    </Box>
  )
}

const GroupEditor = ({
  group,
  onUpdate,
  onRemove,
  isRoot = false,
  level = 0,
  availableFields,
  ancestorScopedFilter = null,
  queryContext,
  disableAllInputs = false,
  globalFiltersHash = "",
}) => {
  const [expanded, setExpanded] = useState(level <= 1)
  const conditions = group?.conditions || []
  const operatorValue = group?.operator || "AND"
  const { color, bg } = getOperatorVisual(operatorValue)
  const canAddSubgroup = level < MAX_GROUP_LEVEL

  const addCondition = useCallback(() => {
    onUpdate({ ...group, conditions: [...conditions, createCondition()] })
  }, [conditions, group, onUpdate])

  const addGroup = useCallback(() => {
    if (!canAddSubgroup) return
    onUpdate({ ...group, conditions: [...conditions, createGroup()] })
  }, [canAddSubgroup, conditions, group, onUpdate])

  const updateOperator = useCallback(
    (nextOperator) => {
      onUpdate({ ...group, operator: nextOperator })
    },
    [group, onUpdate]
  )

  const updateChild = useCallback(
    (index, updatedChild) => {
      const nextConditions = [...conditions]
      nextConditions[index] = updatedChild
      onUpdate({ ...group, conditions: nextConditions })
    },
    [conditions, group, onUpdate]
  )

  const removeChild = useCallback(
    (index) => {
      onUpdate({ ...group, conditions: conditions.filter((_, currentIndex) => currentIndex !== index) })
    },
    [conditions, group, onUpdate]
  )

  if (isRoot) {
    return (
      <Box
        sx={{
          ml: 0,
          pl: 1.25,
          borderLeft: `3px solid ${color}`,
        }}
      >
        <Stack spacing={1}>
          {conditions.length === 0 && (
            <Typography sx={{ fontSize: "12px", color: "text.secondary", px: 0.5 }}>
              Este grupo no tiene condiciones aún.
            </Typography>
          )}

          {conditions.map((item, index) => (
            <Box key={`${level}-${index}`}>
              {(() => {
                const previousSiblingNodes = conditions
                  .slice(0, index)
                  .map((node) => normalizeFilterNode(node))
                  .filter(Boolean)
                const localPrecedingContext = buildScopedContextByOperator(operatorValue, previousSiblingNodes)
                const scopedFilters = mergeWithAnd(ancestorScopedFilter, localPrecedingContext)

                return (
                  <>
              {index > 0 && (
                <Box sx={{ display: "flex", justifyContent: "center", my: 0.5 }}>
                  <OperatorDividerSelect value={operatorValue} onChange={updateOperator} />
                </Box>
              )}

              {isGroup(item) ? (
                level < MAX_GROUP_LEVEL ? (
                <GroupEditor
                  group={item}
                  onUpdate={(nextGroup) => updateChild(index, nextGroup)}
                  onRemove={() => removeChild(index)}
                  level={level + 1}
                  availableFields={availableFields}
                  ancestorScopedFilter={scopedFilters}
                  queryContext={queryContext}
                  disableAllInputs={disableAllInputs}
                  globalFiltersHash={globalFiltersHash}
                />
                ) : (
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: 1.5,
                      border: "1px dashed",
                      borderColor: "warning.main",
                      bgcolor: (theme) => alpha(theme.palette.warning.main, 0.06),
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                      <Typography sx={{ fontSize: "12px", color: "warning.dark", fontWeight: 600 }}>
                        Máximo de anidamiento alcanzado (2 niveles).
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeChild(index)}
                        aria-label="Eliminar subgrupo no permitido"
                      >
                        <CloseIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Stack>
                  </Box>
                )
              ) : (
                <RuleEditor
                  condition={item}
                  onUpdate={(nextRule) => updateChild(index, nextRule)}
                  onRemove={() => removeChild(index)}
                  availableFields={availableFields}
                  scopedFilters={scopedFilters}
                  queryContext={queryContext}
                  disableAllInputs={disableAllInputs}
                  globalFiltersHash={globalFiltersHash}
                />
              )}
                  </>
                )
              })()}
            </Box>
          ))}

          <Stack direction="row" spacing={1} sx={{ pt: 0.25 }}>
            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addCondition}>
              Condición
            </Button>
            {canAddSubgroup && (
              <Button size="small" variant="text" startIcon={<AddIcon />} onClick={addGroup}>
                Subgrupo
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>
    )
  }

  return (
    <Card
      variant="outlined"
      sx={{
        ml: 1.2,
        borderLeft: `3px solid ${color}`,
        background: `linear-gradient(to right, ${alpha(color, 0.03)} 0%, transparent 12px)`,
      }}
    >
      <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
        <Stack spacing={1.2}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <IconButton size="small" onClick={() => setExpanded((current) => !current)}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>

            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {`Subgrupo nivel ${level}`}
            </Typography>

            <Chip
              label={`${conditions.length} item${conditions.length === 1 ? "" : "s"}`}
              size="small"
              sx={{
                height: 22,
                fontWeight: 500,
                fontSize: "11px",
                backgroundColor: bg,
                border: `1px solid ${alpha(color, 0.25)}`,
              }}
            />

            <Box sx={{ flex: 1 }} />

            <Button
              size="small"
              color="error"
              variant="text"
              onClick={onRemove}
              startIcon={<CloseIcon sx={{ fontSize: 14 }} />}
              sx={{ minWidth: "auto", px: 0.5 }}
            >
              Eliminar
            </Button>
          </Stack>

          <Collapse in={expanded}>
            <Stack spacing={1}>
              {conditions.length === 0 && (
                <Typography sx={{ fontSize: "12px", color: "text.secondary", px: 0.5 }}>
                  Este grupo no tiene condiciones aún.
                </Typography>
              )}

              {conditions.map((item, index) => (
                <Box key={`${level}-${index}`}>
                  {(() => {
                    const previousSiblingNodes = conditions
                      .slice(0, index)
                      .map((node) => normalizeFilterNode(node))
                      .filter(Boolean)
                    const localPrecedingContext = buildScopedContextByOperator(operatorValue, previousSiblingNodes)
                    const scopedFilters = mergeWithAnd(ancestorScopedFilter, localPrecedingContext)

                    return (
                      <>
                  {index > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "center", my: 0.5 }}>
                      <OperatorDividerSelect value={operatorValue} onChange={updateOperator} />
                    </Box>
                  )}

                  {isGroup(item) ? (
                    level < MAX_GROUP_LEVEL ? (
                    <GroupEditor
                      group={item}
                      onUpdate={(nextGroup) => updateChild(index, nextGroup)}
                      onRemove={() => removeChild(index)}
                      level={level + 1}
                      availableFields={availableFields}
                      ancestorScopedFilter={scopedFilters}
                      queryContext={queryContext}
                      disableAllInputs={disableAllInputs}
                      globalFiltersHash={globalFiltersHash}
                    />
                    ) : (
                      <Box
                        sx={{
                          p: 1.25,
                          borderRadius: 1.5,
                          border: "1px dashed",
                          borderColor: "warning.main",
                          bgcolor: (theme) => alpha(theme.palette.warning.main, 0.06),
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                          <Typography sx={{ fontSize: "12px", color: "warning.dark", fontWeight: 600 }}>
                            Máximo de anidamiento alcanzado (2 niveles).
                          </Typography>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeChild(index)}
                            aria-label="Eliminar subgrupo no permitido"
                          >
                            <CloseIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Stack>
                      </Box>
                    )
                  ) : (
                    <RuleEditor
                      condition={item}
                      onUpdate={(nextRule) => updateChild(index, nextRule)}
                      onRemove={() => removeChild(index)}
                      availableFields={availableFields}
                      scopedFilters={scopedFilters}
                      queryContext={queryContext}
                      disableAllInputs={disableAllInputs}
                      globalFiltersHash={globalFiltersHash}
                    />
                  )}
                      </>
                    )
                  })()}
                </Box>
              ))}

              <Stack direction="row" spacing={1} sx={{ pt: 0.25 }}>
                <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addCondition}>
                  Condición
                </Button>
                {canAddSubgroup && (
                  <Button size="small" variant="text" startIcon={<AddIcon />} onClick={addGroup}>
                    Subgrupo
                  </Button>
                )}
              </Stack>
            </Stack>
          </Collapse>
        </Stack>
      </CardContent>
    </Card>
  )
}

const CustomFilters = ({ filters, onFiltersChange }) => {
  const dispatch = useDispatch()
  const userToken = useSelector((state) => state.user?.[0]?.userID || state.user?.userID)
  const chartContext = useChartContext()
  const dataSourceId = chartContext.state.queryParameters?.datasource_id
  const { data: sourceFields = [], isLoading: isLoadingSourceFields } = useFieldsByDataSourceId(dataSourceId)
  const [filterStructure, setFilterStructure] = useState(filters || createGroup())

  useEffect(() => {
    if (filters) setFilterStructure(filters)
  }, [filters])

  const hasFilters = (filterStructure?.conditions || []).length > 0
  const rulesCount = useMemo(() => countRules(filterStructure), [filterStructure])
  const globalFiltersHash = useMemo(() => JSON.stringify(filterStructure || null), [filterStructure])
  const availableFields = useMemo(() => {
    if (!Array.isArray(sourceFields)) return []

    const seen = new Set()

    return sourceFields
      .map((field, index) => {
        const source = field?.field && typeof field.field === "object" ? field.field : field
        const value =
          source?.name ||
          source?.field_name ||
          source?.key ||
          source?.column ||
          source?.alias ||
          (source?.field_id != null ? String(source.field_id) : "") ||
          (source?.id != null ? String(source.id) : "")

        if (!value || seen.has(value)) return null
        seen.add(value)

        return {
          value,
          label: source?.alias || source?.label || source?.name || source?.field_name || `Campo ${index + 1}`,
          type: normalizeFieldType(source?.type ?? source?.value_type ?? source?.data_type ?? source?.field_type),
          sourceType: source?.type,
          isDimension: source?.is_dimension === true || String(source?.type || "").toLowerCase() === "dimension",
          isNumeric: source?.is_numeric === true || String(source?.type || "").toLowerCase() === "measure",
          raw: source,
        }
      })
      .filter(Boolean)
  }, [sourceFields])

  const hasAvailableFields = availableFields.length > 0

  const queryContext = useMemo(
    () => ({
      dispatch,
      userToken,
      datasourceId: dataSourceId,
    }),
    [dispatch, userToken, dataSourceId]
  )

  const handleFilterChange = useCallback(
    (nextFilters) => {
      setFilterStructure(nextFilters)
      onFiltersChange?.(nextFilters)
    },
    [onFiltersChange]
  )

  const clearAll = useCallback(() => {
    handleFilterChange(createGroup())
  }, [handleFilterChange])

  const addRootCondition = useCallback(() => {
    handleFilterChange({
      ...filterStructure,
      conditions: [...(filterStructure?.conditions || []), createCondition()],
    })
  }, [filterStructure, handleFilterChange])

  const addRootGroup = useCallback(() => {
    handleFilterChange({
      ...filterStructure,
      conditions: [...(filterStructure?.conditions || []), createGroup()],
    })
  }, [filterStructure, handleFilterChange])

  return (
    <Stack spacing={3}>
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 600 }}>
            <FilterIcon sx={{ color: "primary.main" }} />
            Filtros personalizados
          </Typography>
          {hasFilters && (
            <Chip
              size="small"
              color="primary"
              label={`${rulesCount} regla${rulesCount === 1 ? "" : "s"}`}
              sx={{ fontWeight: 600 }}
            />
          )}
          <Box sx={{ flex: 1 }} />
          {hasFilters && (
            <Button size="small" color="error" variant="text" onClick={clearAll}>
              Limpiar
            </Button>
          )}
        </Stack>
        <Divider sx={{ mb: 2 }} />

        {!hasAvailableFields ? (
          <Box
            sx={{
              textAlign: "center",
              border: "1px dashed",
              borderColor: "warning.main",
              borderRadius: 2,
              py: 4,
              px: 2,
              bgcolor: (theme) => alpha(theme.palette.warning.main, 0.06),
            }}
          >
            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Debe agregar campos primero</Typography>
            <Typography sx={{ fontSize: "13px", color: "text.secondary" }}>
              No hay campos disponibles en la fuente de datos seleccionada.
            </Typography>
          </Box>
        ) : !hasFilters ? (
          <Box
            sx={{
              textAlign: "center",
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 2,
              py: 4,
              px: 2,
              bgcolor: "background.default",
            }}
          >
            <FilterIcon sx={{ fontSize: 42, color: "text.disabled", mb: 1 }} />
            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>No hay filtros configurados</Typography>
            <Typography sx={{ fontSize: "13px", color: "text.secondary", mb: 2 }}>
              Crea una condición o un grupo para empezar.
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
              <Button variant="contained" startIcon={<AddIcon />} onClick={addRootCondition}>
                Agregar condición
              </Button>
            </Stack>
          </Box>
        ) : (
          <GroupEditor
            group={filterStructure}
            onUpdate={handleFilterChange}
            onRemove={clearAll}
            isRoot
            level={0}
            availableFields={availableFields}
            queryContext={queryContext}
            disableAllInputs={isLoadingSourceFields}
            globalFiltersHash={globalFiltersHash}
          />
        )}
      </Box>
    </Stack>
  )
}

export default CustomFilters
