import { useState, useCallback, useEffect, useMemo } from "react"
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Stack,
  Divider,
  useTheme,
  CircularProgress,
  IconButton,
  Chip,
  Tooltip,
  Button,
  Autocomplete,
  TextField,
} from "@mui/material"
import { alpha } from "@mui/material/styles"
import {
  MenuBook,
  StorageOutlined,
  Link as LinkIcon,
  VisibilityOutlined,
  VisibilityOffOutlined,
  SaveAsRounded,
} from "@mui/icons-material"
import { useDispatch } from "react-redux"
import { useQueryClient } from "@tanstack/react-query"
import { StyledSwitch } from "@components/Recursive/mui_styled_components"
import { handleEditItemEntity } from "../../../../../helpers/dashboardAPI/genericRequest"
import { pushNotification } from "../../../../../redux/actions"
import { useChartContext } from "@components/PanelsWorkspace/hooks/useChartContext"
import { usePanelContext } from "@components/PanelsWorkspace/hooks/usePanelContext"
import { useDataSourcesList, useDataSourceById } from "@components/DashboardsWorkspace/hooks/useDataSources"
import { useFieldsByDataSourceId, useFieldById } from "@components/DashboardsWorkspace/hooks/useFields"
import { useDictionaryMap } from "@components/PanelsWorkspace/hooks/useDictionaryMap"
import {
  areDictionaryDraftsEqual,
  buildDictionaryRulePayload,
  canSaveDictionaryRule,
  DICTIONARY_RECORDS_LIMIT,
  DICTIONARY_RECORDS_QUERY_KEY,
  EMPTY_DICTIONARY_DRAFT,
  EMPTY_DICTIONARY_RULE,
  evaluateDictionaryTranslation,
  getDictionaryValidationMessage,
  getOriginFieldValueCandidates,
  getUniqueValuesFromRawData,
  isDictionaryTranslationUsable,
  resolveOriginFieldAlias,
  resolveOriginFieldName,
  resolvePanelMainData,
  ruleToDraft,
} from "@components/PanelsWorkspace/utils/dictionaryUtils"

const SectionLabel = ({ icon: Icon, children, action = null, compact = false }) => (
  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: compact ? 0.5 : 0.75 }}>
    <Stack direction="row" alignItems="center" spacing={0.75}>
      {Icon && <Icon sx={{ fontSize: 14, color: "text.secondary" }} />}
      <Typography
        variant="overline"
        sx={{ fontWeight: 600, letterSpacing: "0.08em", color: "text.secondary", lineHeight: 1 }}
      >
        {children}
      </Typography>
    </Stack>
    {action}
  </Stack>
)

const DictionaryConfiguration = ({ user }) => {
  const theme = useTheme()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const chartContext = useChartContext()
  const chartState = chartContext.state
  const panelContext = usePanelContext()
  const panelState = panelContext.state

  const savedRule = chartState.queryParameters?.dictionary_rule || EMPTY_DICTIONARY_RULE
  const [draftRule, setDraftRule] = useState(() => ruleToDraft(savedRule))
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setDraftRule(ruleToDraft(savedRule))
  }, [
    savedRule?.is_dictionary,
    savedRule?.datasource_id,
    savedRule?.key_field,
    savedRule?.value_field,
    savedRule?.origin_field,
  ])

  const isDirty = !areDictionaryDraftsEqual(draftRule, ruleToDraft(savedRule))

  const useDictionary = !!draftRule?.is_dictionary
  const dictionarySourceId = useDictionary ? draftRule.datasource_id || "" : ""
  const dictionaryKeyFieldId = useDictionary ? draftRule.key_field || "" : ""
  const dictionaryValueFieldId = useDictionary ? draftRule.value_field || "" : ""
  const originFieldId = useDictionary ? draftRule.origin_field || "" : ""

  const [previewEnabled, setPreviewEnabled] = useState(false)
  const [panelDataCacheVersion, setPanelDataCacheVersion] = useState(0)

  useEffect(() => {
    if (!panelState.panel?.id) return undefined

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      const queryKey = event?.query?.queryKey
      if (queryKey?.[0] === "panelData" && queryKey?.[1] === panelState.panel.id) {
        setPanelDataCacheVersion((version) => version + 1)
      }
    })

    return unsubscribe
  }, [panelState.panel?.id, queryClient])

  const panelDatasourceId = chartState.queryParameters?.datasource_id
  const chartSelectedFields = chartState.queryParameters?.selected_fields || []
  const { data: panelDatasource, isLoading: isLoadingPanelDatasource } = useDataSourceById(
    panelDatasourceId || undefined
  )
  const { data: savedOriginField, isLoading: isLoadingSavedOriginField } = useFieldById(
    useDictionary && originFieldId ? originFieldId : null
  )

  const { data: dataSourcesData = [], isLoading: isLoadingDataSources } = useDataSourcesList()
  const {
    data: dictionarySourceFields = [],
    isLoading: isLoadingDictionaryFields,
  } = useFieldsByDataSourceId(useDictionary && dictionarySourceId ? dictionarySourceId : undefined)

  const { data: savedKeyField, isLoading: isLoadingSavedKeyField } = useFieldById(
    useDictionary && dictionaryKeyFieldId ? dictionaryKeyFieldId : null
  )
  const { data: savedValueField, isLoading: isLoadingSavedValueField } = useFieldById(
    useDictionary && dictionaryValueFieldId ? dictionaryValueFieldId : null
  )

  const showDataSourcesLoading = isLoadingDataSources && dataSourcesData.length === 0
  const dataSourceOptions = useMemo(
    () =>
      dataSourcesData.map((source) => ({
        id: source.id,
        label: source.alias || source.name,
      })),
    [dataSourcesData]
  )
  const selectedDataSource = useMemo(() => {
    if (!dictionarySourceId) return null
    const found = dataSourceOptions.find((source) => source.id === dictionarySourceId)
    if (found) return found
    const source = dataSourcesData.find((item) => item.id === dictionarySourceId)
    if (source) {
      return { id: dictionarySourceId, label: source.alias || source.name }
    }
    return null
  }, [dataSourceOptions, dictionarySourceId, dataSourcesData])
  const showFieldsLoading =
    isLoadingDictionaryFields && dictionarySourceFields.length === 0 && !savedKeyField && !savedValueField

  const originFieldOptions = useMemo(
    () =>
      chartSelectedFields.map((field) => {
        const id = field.field_id ?? field.id
        return {
          id: id != null ? String(id) : "",
          label: field.alias || field.name,
        }
      }).filter((field) => field.id),
    [chartSelectedFields]
  )

  const normalizedOriginFieldId = originFieldId != null ? String(originFieldId) : ""

  const dictionaryRuleForQuery = useMemo(
    () => ({
      is_dictionary: useDictionary,
      datasource_id: dictionarySourceId,
      key_field: dictionaryKeyFieldId,
      value_field: dictionaryValueFieldId,
      origin_field: normalizedOriginFieldId,
    }),
    [useDictionary, dictionarySourceId, dictionaryKeyFieldId, dictionaryValueFieldId, normalizedOriginFieldId]
  )

  const hasDuplicateFields =
    !!dictionaryKeyFieldId &&
    !!dictionaryValueFieldId &&
    dictionaryKeyFieldId === dictionaryValueFieldId

  const hasPreviewSelection =
    !!normalizedOriginFieldId &&
    !!dictionarySourceId &&
    !!dictionaryKeyFieldId &&
    !!dictionaryValueFieldId &&
    !hasDuplicateFields

  const getOriginFieldLabel = useCallback(
    (fieldId) => {
      const normalizedId = fieldId != null ? String(fieldId) : ""
      const option = originFieldOptions.find((field) => field.id === normalizedId)
      if (option) return option.label
      if (normalizedId === normalizedOriginFieldId && savedOriginField) {
        return savedOriginField.alias || savedOriginField.name
      }
      return ""
    },
    [originFieldOptions, normalizedOriginFieldId, savedOriginField]
  )

  const getFieldSelectLabel = useCallback(
    (fieldId) => {
      if (!fieldId) return null
      const field =
        dictionarySourceFields.find((item) => item.id === fieldId) ??
        (fieldId === dictionaryKeyFieldId ? savedKeyField : null) ??
        (fieldId === dictionaryValueFieldId ? savedValueField : null)
      if (field) return field.alias || field.name
      return null
    },
    [dictionarySourceFields, dictionaryKeyFieldId, dictionaryValueFieldId, savedKeyField, savedValueField]
  )

  const isDictionaryFieldResolving = useCallback(
    (fieldId, isLoadingSavedField) =>
      !!fieldId &&
      !getFieldSelectLabel(fieldId) &&
      (showFieldsLoading || isLoadingSavedField || isLoadingDictionaryFields),
    [getFieldSelectLabel, showFieldsLoading, isLoadingDictionaryFields]
  )

  const getSourceLabel = useCallback(
    (sourceId) => {
      if (!sourceId) return null
      const source = dataSourcesData.find((item) => item.id === sourceId)
      if (source) return source.alias
      return null
    },
    [dataSourcesData]
  )

  const isSourceResolving = useCallback(
    (sourceId) =>
      !!sourceId && !getSourceLabel(sourceId) && (showDataSourcesLoading || isLoadingDataSources),
    [getSourceLabel, showDataSourcesLoading, isLoadingDataSources]
  )

  const isOriginFieldResolving = useCallback(
    (fieldId) =>
      !!fieldId &&
      !getOriginFieldLabel(fieldId) &&
      (isLoadingSavedOriginField || originFieldOptions.length === 0),
    [getOriginFieldLabel, isLoadingSavedOriginField, originFieldOptions.length]
  )

  const renderLoadingValue = () => (
    <Typography component="span" variant="body2" color="text.secondary">
      Cargando...
    </Typography>
  )

  const queryFieldsDistribution = chartState.queryParameters?.query_fields_distribution
  const originFieldName = resolveOriginFieldName(
    dictionaryRuleForQuery,
    chartSelectedFields,
    queryFieldsDistribution
  )
  const originFieldAlias = resolveOriginFieldAlias(
    dictionaryRuleForQuery,
    chartSelectedFields,
    queryFieldsDistribution
  )
  const originFieldCandidates = useMemo(
    () =>
      getOriginFieldValueCandidates(
        dictionaryRuleForQuery,
        chartSelectedFields,
        queryFieldsDistribution
      ),
    [dictionaryRuleForQuery, chartSelectedFields, queryFieldsDistribution]
  )

  const panelRawData = useMemo(() => {
    const fromContext = resolvePanelMainData(chartState.queryParameters?.rawData)
    if (fromContext.length > 0) return fromContext

    const cachedQueries = queryClient.getQueriesData({
      queryKey: ["panelData", panelState.panel?.id],
    })
    for (const [, cachedData] of cachedQueries) {
      const fromCache = resolvePanelMainData(cachedData)
      if (fromCache.length > 0) return fromCache
    }

    return []
  }, [chartState.queryParameters?.rawData, panelState.panel?.id, queryClient, panelDataCacheVersion])

  const originValues = useMemo(
    () => getUniqueValuesFromRawData(panelRawData, originFieldCandidates),
    [panelRawData, originFieldCandidates]
  )

  const canFetchDictionaryRecords =
    hasPreviewSelection &&
    originFieldCandidates.length > 0 &&
    originValues.length > 0 &&
    originValues.length <= DICTIONARY_RECORDS_LIMIT

  const {
    dictionaryMap,
    isLoading: isLoadingDictionaryRecords,
    isError: isDictionaryRecordsError,
  } = useDictionaryMap(
    useDictionary && canFetchDictionaryRecords ? dictionaryRuleForQuery : null,
    user?.userID
  )

  const dictionaryTranslation = useMemo(
    () =>
      evaluateDictionaryTranslation({
        rawData: panelRawData,
        originFieldName,
        originFieldAlias,
        originFieldCandidates,
        dictionaryMap: canFetchDictionaryRecords ? dictionaryMap : {},
        isDictionaryLoading: canFetchDictionaryRecords && isLoadingDictionaryRecords,
      }),
    [
      panelRawData,
      originFieldName,
      originFieldAlias,
      originFieldCandidates,
      dictionaryMap,
      canFetchDictionaryRecords,
      isLoadingDictionaryRecords,
    ]
  )

  const isDictionaryCompatible = isDictionaryTranslationUsable(dictionaryTranslation)
  const validationMessage = getDictionaryValidationMessage(dictionaryTranslation)
  const isVerifyingCompatibility =
    hasPreviewSelection &&
    !hasDuplicateFields &&
    dictionaryTranslation.reason === "loading"
  const showValidationMessage =
    hasPreviewSelection &&
    !isVerifyingCompatibility &&
    !isDictionaryCompatible &&
    !!validationMessage

  const canSave = canSaveDictionaryRule(draftRule, dictionaryTranslation)

  useEffect(() => {
    if (!isDictionaryCompatible) {
      setPreviewEnabled(false)
    }
  }, [isDictionaryCompatible])

  const dictionaryRecordPairs = useMemo(
    () =>
      Object.entries(dictionaryMap).map(([key, value]) => ({
        key,
        value,
      })),
    [dictionaryMap]
  )

  const showRecordsLoading =
    previewEnabled && isLoadingDictionaryRecords && dictionaryRecordPairs.length === 0

  const handleDisableDictionary = useCallback(async () => {
    if (!panelState.panel?.id) {
      setDraftRule({ ...EMPTY_DICTIONARY_DRAFT })
      chartContext.actions.updateQueryParams({ dictionary_rule: EMPTY_DICTIONARY_RULE })
      queryClient.removeQueries({ queryKey: [DICTIONARY_RECORDS_QUERY_KEY] })
      return
    }

    const response = await handleEditItemEntity(
      user.userID,
      "updatePanelQueryParameters",
      "parámetros de la consulta",
      { panel_id: panelState.panel.id },
      { dictionary_rule: { is_dictionary: false } },
      dispatch,
      false
    )

    if (!response[0]) return

    setDraftRule({ ...EMPTY_DICTIONARY_DRAFT })
    chartContext.actions.updateQueryParams({ dictionary_rule: EMPTY_DICTIONARY_RULE })
    queryClient.removeQueries({ queryKey: [DICTIONARY_RECORDS_QUERY_KEY] })
  }, [panelState.panel?.id, user.userID, dispatch, chartContext.actions, queryClient])

  const handleSaveDictionary = useCallback(async () => {
    if (!panelState.panel?.id || !canSave) {
      dispatch(
        pushNotification({
          msg:
            getDictionaryValidationMessage(dictionaryTranslation) ||
            "Completa todos los campos y verifica que el campo clave incluya todos los valores del origen antes de guardar.",
          status: "err",
        })
      )
      return
    }

    setIsSaving(true)
    try {
      const payload = buildDictionaryRulePayload(draftRule)
      const response = await handleEditItemEntity(
        user.userID,
        "updatePanelQueryParameters",
        "parámetros de la consulta",
        { panel_id: panelState.panel.id },
        { dictionary_rule: payload },
        dispatch,
        false
      )

      if (!response[0]) return

      const savedDictionaryRule = response[1]?.dictionary_rule
        ? { ...payload, ...response[1].dictionary_rule, is_dictionary: true }
        : payload

      chartContext.actions.updateQueryParams({ dictionary_rule: savedDictionaryRule })
      setDraftRule(ruleToDraft(savedDictionaryRule))
      dispatch(
        pushNotification({
          msg: "La configuración del diccionario se guardó correctamente.",
          status: "ok",
        })
      )
    } finally {
      setIsSaving(false)
    }
  }, [
    panelState.panel?.id,
    canSave,
    draftRule,
    dictionaryTranslation,
    user.userID,
    dispatch,
    chartContext.actions,
  ])

  useEffect(() => {
    if (!normalizedOriginFieldId || originFieldOptions.length === 0) return
    const isStillSelected = originFieldOptions.some((field) => field.id === normalizedOriginFieldId)
    if (!isStillSelected && useDictionary) {
      setDraftRule((prev) => ({ ...prev, origin_field: "" }))
    }
  }, [originFieldOptions, normalizedOriginFieldId, useDictionary])

  const handleUseDictionaryChange = useCallback(
    async (e) => {
      const enabled = e.target.checked
      if (!enabled) {
        setPreviewEnabled(false)
        await handleDisableDictionary()
        return
      }
      setDraftRule({ ...EMPTY_DICTIONARY_DRAFT, is_dictionary: true })
    },
    [handleDisableDictionary]
  )

  const handleClearDictionary = useCallback(() => {
    setPreviewEnabled(false)
    setDraftRule({ ...EMPTY_DICTIONARY_DRAFT, is_dictionary: true })
    chartContext.actions.updateQueryParams({ dictionary_rule: { is_dictionary: true } })
    queryClient.removeQueries({ queryKey: [DICTIONARY_RECORDS_QUERY_KEY] })
  }, [chartContext.actions, queryClient])

  const handleDictionarySourceChange = useCallback((e) => {
    const newSourceId = e.target.value
    setDraftRule((prev) => ({
      ...prev,
      datasource_id: newSourceId,
      key_field: "",
      value_field: "",
    }))
  }, [])

  const handleDictionaryKeyFieldChange = useCallback((e) => {
    const newFieldId = e.target.value
    setDraftRule((prev) => ({
      ...prev,
      key_field: newFieldId,
      value_field: newFieldId && newFieldId === prev.value_field ? "" : prev.value_field,
    }))
  }, [])

  const handleDictionaryValueFieldChange = useCallback((e) => {
    setDraftRule((prev) => ({ ...prev, value_field: e.target.value }))
  }, [])

  const handleOriginFieldChange = useCallback((e) => {
    setDraftRule((prev) => ({ ...prev, origin_field: e.target.value }))
  }, [])

  const valueFieldOptions = useMemo(
    () => dictionarySourceFields.filter((field) => field.id !== dictionaryKeyFieldId),
    [dictionarySourceFields, dictionaryKeyFieldId]
  )

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            width: 36,
            height: 36,
            display: "grid",
            placeItems: "center",
            borderRadius: 1.5,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            flexShrink: 0,
          }}
        >
          <MenuBook sx={{ fontSize: 20, color: "primary.main" }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Diccionario
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Traduce códigos a etiquetas
          </Typography>
        </Box>
        {isDirty && (
          <Tooltip
            title={
              canSave
                ? "Guardar configuración del diccionario"
                : isVerifyingCompatibility
                  ? "Verificando compatibilidad entre origen y clave..."
                  : validationMessage || "Completa todos los campos y verifica que clave cubra todos los valores del origen"
            }
            arrow
          >
            <span>
              <IconButton
                size="small"
                onClick={handleSaveDictionary}
                disabled={!canSave || isSaving}
                sx={{ color: canSave ? "primary.main" : "text.disabled" }}
              >
                {isSaving ? <CircularProgress size={18} /> : <SaveAsRounded sx={{ fontSize: 20 }} />}
              </IconButton>
            </span>
          </Tooltip>
        )}
        <StyledSwitch
          size="small"
          checked={useDictionary}
          onChange={handleUseDictionaryChange}
          inputProps={{ "aria-label": "Usar diccionario" }}
        />
      </Stack>

      {useDictionary && (
        <Stack spacing={3}>
          <Divider />
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 600, mb: 2 }}
            >
              <StorageOutlined sx={{ color: theme.palette.primary.main }} />
              Fuente de origen
            </Typography>
            <Box sx={{ mb: 2, mt: 2 }}>
              {isLoadingPanelDatasource && !panelDatasource ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CircularProgress size={14} />
                  <Typography variant="body2" color="text.secondary">
                    Cargando...
                  </Typography>
                </Stack>
              ) : panelDatasource ? (
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: "primary.main",
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    px: 1.25,
                    py: 0.5,
                    borderRadius: 1,
                    display: "inline-block",
                  }}
                >
                  {panelDatasource.alias || panelDatasource.name}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Sin fuente de datos asignada al panel
                </Typography>
              )}
            </Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Campo origen
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={normalizedOriginFieldId}
                onChange={handleOriginFieldChange}
                displayEmpty
                disabled={originFieldOptions.length === 0}
                renderValue={(value) => {
                  if (!value) return <em>Seleccionar campo origen</em>
                  const label = getOriginFieldLabel(value)
                  if (label) return label
                  if (isOriginFieldResolving(value)) return renderLoadingValue()
                  return renderLoadingValue()
                }}
              >
                <MenuItem value="">
                  <em>Seleccionar campo origen</em>
                </MenuItem>
                {originFieldOptions.map((field) => (
                  <MenuItem key={field.id} value={field.id}>
                    {field.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {originFieldOptions.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                Selecciona campos en la gráfica para habilitar la traducción.
              </Typography>
            )}
            <Divider sx={{ mt: 2 }} />
          </Box>

          <Box>
            <Typography
              variant="subtitle1"
              sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 600, mb: 2 }}
            >
              <StorageOutlined sx={{ color: theme.palette.primary.main }} />
              Fuente diccionario
            </Typography>
            <Autocomplete
              size="small"
              fullWidth
              options={dataSourceOptions}
              value={selectedDataSource}
              loading={showDataSourcesLoading}
              disabled={showDataSourcesLoading && !dictionarySourceId}
              getOptionLabel={(option) => option?.label || ""}
              isOptionEqualToValue={(option, current) => option.id === current.id}
              noOptionsText={showDataSourcesLoading ? "Cargando..." : "Sin resultados"}
              onChange={(_, nextOption) => {
                handleDictionarySourceChange({ target: { value: nextOption?.id || "" } })
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={
                    isSourceResolving(dictionarySourceId)
                      ? "Cargando..."
                      : "Buscar fuente..."
                  }
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {showDataSourcesLoading && !dictionarySourceId ? (
                          <CircularProgress color="inherit" size={16} sx={{ mr: 0.5 }} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Box>

          {!!dictionarySourceId && (
            <Stack spacing={1}>
              <Box>
                <SectionLabel icon={LinkIcon}>Mapeo de campos</SectionLabel>
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Clave
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={dictionaryKeyFieldId}
                        onChange={handleDictionaryKeyFieldChange}
                        displayEmpty
                        disabled={showFieldsLoading && !dictionaryKeyFieldId}
                        renderValue={(value) => {
                          if (!value) return <em>Seleccionar campo clave</em>
                          const label = getFieldSelectLabel(value)
                          if (label) return label
                          if (isDictionaryFieldResolving(value, isLoadingSavedKeyField)) return renderLoadingValue()
                          return renderLoadingValue()
                        }}
                      >
                        <MenuItem value="">
                          <em>Seleccionar campo clave</em>
                        </MenuItem>
                        {dictionarySourceFields.map((field) => (
                          <MenuItem key={field.id} value={field.id}>
                            {field.alias}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Valor
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={dictionaryValueFieldId}
                        onChange={handleDictionaryValueFieldChange}
                        displayEmpty
                        disabled={showFieldsLoading && !dictionaryValueFieldId}
                        renderValue={(value) => {
                          if (!value) return <em>Seleccionar campo valor</em>
                          const label = getFieldSelectLabel(value)
                          if (label) return label
                          if (isDictionaryFieldResolving(value, isLoadingSavedValueField)) return renderLoadingValue()
                          return renderLoadingValue()
                        }}
                      >
                        <MenuItem value="">
                          <em>Seleccionar campo valor</em>
                        </MenuItem>
                        {valueFieldOptions.map((field) => (
                          <MenuItem key={field.id} value={field.id}>
                            {field.alias}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Stack>

                {showFieldsLoading && !dictionaryKeyFieldId && !dictionaryValueFieldId && (
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.75 }}>
                    <CircularProgress size={14} />
                    <Typography variant="caption" color="text.secondary">
                      Cargando campos...
                    </Typography>
                  </Stack>
                )}

                {hasDuplicateFields && (
                  <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.75 }}>
                    El campo clave y el campo valor deben ser diferentes.
                  </Typography>
                )}

                {isVerifyingCompatibility && (
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.75 }}>
                    <CircularProgress size={14} />
                    <Typography variant="caption" color="text.secondary">
                      Verificando compatibilidad...
                    </Typography>
                  </Stack>
                )}

                {showValidationMessage && (
                  <Typography
                    variant="caption"
                    color={dictionaryTranslation.reason === "exceeds_limit" ? "warning.main" : "error"}
                    sx={{ display: "block", mt: 0.75 }}
                  >
                    {validationMessage}
                  </Typography>
                )}

                <Divider sx={{ mt: 2 }} />
              </Box>

              {hasPreviewSelection && isDictionaryCompatible && (
                <Box>
                  <SectionLabel
                    compact
                    action={
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        {previewEnabled && !showRecordsLoading && dictionaryRecordPairs.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            {dictionaryRecordPairs.length} par{dictionaryRecordPairs.length === 1 ? "" : "es"}
                          </Typography>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => setPreviewEnabled((prev) => !prev)}
                          disabled={isLoadingDictionaryRecords}
                          aria-label={previewEnabled ? "Ocultar vista previa" : "Mostrar vista previa"}
                          sx={{ color: previewEnabled ? "primary.main" : "text.secondary", p: 0.25 }}
                        >
                          {previewEnabled ? (
                            <VisibilityOutlined sx={{ fontSize: 18 }} />
                          ) : (
                            <VisibilityOffOutlined sx={{ fontSize: 18 }} />
                          )}
                        </IconButton>
                      </Stack>
                    }
                  >
                    Vista previa
                  </SectionLabel>

                  {!previewEnabled ? (
                    <Typography variant="caption" color="text.secondary">
                      Mapeo compatible. Activa la vista previa para consultar los pares clave → valor.
                    </Typography>
                  ) : showRecordsLoading ? (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CircularProgress size={16} />
                      <Typography variant="caption" color="text.secondary">
                        Cargando registros...
                      </Typography>
                    </Stack>
                  ) : isDictionaryRecordsError ? (
                    <Typography variant="caption" color="error">
                      No se pudieron cargar los registros del diccionario.
                    </Typography>
                  ) : dictionaryRecordPairs.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      No hay pares clave → valor para estos campos.
                    </Typography>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                        p: 1,
                        borderRadius: 1.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                        maxHeight: 260,
                        overflowY: "auto",
                      }}
                    >
                      {dictionaryRecordPairs.map((pair, index) => (
                        <Chip
                          key={`${pair.key}-${pair.value}-${index}`}
                          label={`${pair.key} → ${pair.value}`}
                          size="small"
                          title={`${pair.key} → ${pair.value}`}
                          sx={{
                            height: "auto",
                            maxWidth: "100%",
                            borderRadius: 3,
                            bgcolor: "background.paper",
                            border: "1px solid",
                            borderColor: alpha(theme.palette.primary.main, 0.2),
                            boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.04)}`,
                            color: "text.primary",
                            transition: "background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
                            "&:hover": {
                              bgcolor: alpha(theme.palette.primary.main, 0.06),
                              borderColor: alpha(theme.palette.primary.main, 0.35),
                              boxShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.12)}`,
                            },
                            "& .MuiChip-label": {
                              px: 1.75,
                              py: 1,
                              fontSize: "0.8125rem",
                              lineHeight: 1.4,
                              fontWeight: 500,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              display: "block",
                            },
                          }}
                        />
                      ))}
                      {dictionaryRecordPairs.length >= DICTIONARY_RECORDS_LIMIT && (
                        <Typography variant="caption" color="text.secondary" sx={{ width: "100%", pt: 0.25 }}>
                          Mostrando hasta {DICTIONARY_RECORDS_LIMIT} registros
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Stack>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              size="small"
              variant="contained"
              onClick={handleClearDictionary}
              sx={{
                minWidth: 0,
                px: 1.25,
                py: 0.2,
                fontSize: "0.6875rem",
                fontWeight: 600,
                lineHeight: 1.4,
                letterSpacing: "0.02em",
                textTransform: "none",
                borderRadius: 7,
                bgcolor: "primary.main",
                color: "common.white",
                "&:hover": {
                  bgcolor: "primary.dark",
                },
              }}
            >
              Vaciar
            </Button>
          </Box>
        </Stack>
      )}
    </Stack>
  )
}

export default DictionaryConfiguration
