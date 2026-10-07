import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Alert,
    AlertTitle,
    Box,
    Card,
    CardActionArea,
    Chip,
    IconButton,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import StorageIcon from '@mui/icons-material/Storage';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import { validateDashboardSources } from '@components/DashboardsWorkspace/features/Dashboard/shared/utils/dashboardActions';
import { useDataSourcesList } from '@components/DashboardsWorkspace/hooks/useDataSources';
import { useAppId } from 'hooks/useAppId';
import { useWizard } from '../hooks/useWizard';
import ImportWizardLoadingAnimation from '../components/ImportWizardLoadingAnimation';
import { validateSourcesLoadingProps } from '../constants/importWizardLoadingPresets';
import OriginSourceDetailModal from '../components/OriginSourceDetailModal';
import {
    buildSourcesByIdMap,
    filterCompatibleByGroupIds,
    getMultiSourceSharedGroupIds,
    getSourceGroupId,
    listCompatibleSources
} from '../services/parseImportSourceValidation';
import { resolveImportSourceSelection } from '../utils/resolveSourceGroup';
import { extractUniqueDatasourceNamesFromImport } from '../utils/extractFieldNamesFromImportPayload';
import { countPanelsFromImportPayload } from '../utils/importFileSummary';
import {
    formatGroupPanelsPreview,
    getAllPanelItemsFromImport,
    getGroupPanelItems,
    getImportDatasourceGroups,
    getLegacyFieldNames,
    groupFieldNames,
    groupOriginLabel,
    isMultiSourceImport
} from '../utils/importResponse';

function buildCompatSourcesInfoBody(panelCount) {
    const suffix = 'Si no ves la que necesitas, pídele a un administrador que la habilite.';
    if (panelCount == null) {
        return `Solo te mostramos las fuentes compatibles con tu tablero y todos sus paneles. ${suffix}`;
    }
    if (panelCount === 1) {
        return `Solo te mostramos las fuentes compatibles con el panel de tu tablero. ${suffix}`;
    }
    return `Solo te mostramos las fuentes compatibles con los ${panelCount} paneles de tu tablero. ${suffix}`;
}

function sourceAliasForDisplay(source) {
    if (!source || typeof source !== 'object') return '';
    const raw = source.alias;
    if (raw == null) return '';
    const t = String(raw).trim();
    return t;
}

function sourceTitleForCard(source) {
    const alias = sourceAliasForDisplay(source);
    if (alias) return alias;
    if (source?.name != null && String(source.name).trim()) return String(source.name).trim();
    return source?.id != null ? String(source.id) : '';
}

function sourceDescriptionForCard(source) {
    const raw = source?.description;
    if (raw != null && String(raw).trim()) return String(raw).trim();
    return 'Sin descripción';
}

function VisualConnector() {
    return (
        <Box
            sx={{
                gridArea: 'arrow',
                alignSelf: 'center',
                display: 'grid',
                placeItems: 'center',
                minWidth: 0,
                py: { xs: 0.5, lg: 0 }
            }}
        >
            <ArrowForwardIcon
                sx={{
                    fontSize: 26,
                    color: 'primary.main',
                    transform: { xs: 'rotate(90deg)', lg: 'none' }
                }}
            />
        </Box>
    );
}

function CompatibleCard({ source, selected, onToggle }) {
    const theme = useTheme();
    const idStr = String(source.id);
    const titleText = sourceTitleForCard(source);
    const descText = sourceDescriptionForCard(source);

    return (
        <Card
            elevation={0}
            sx={{
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: selected ? 'primary.main' : alpha(theme.palette.grey[500], 0.32),
                bgcolor: selected ? alpha(theme.palette.primary.main, 0.12) : 'background.paper',
                transition: theme.transitions.create(['border-color', 'background-color'], {
                    duration: theme.transitions.duration.shorter
                }),
                '&:hover': {
                    borderColor: selected ? 'primary.main' : alpha(theme.palette.grey[500], 0.45),
                    bgcolor: selected ? alpha(theme.palette.primary.main, 0.14) : alpha(theme.palette.primary.main, 0.04)
                }
            }}
        >
            <CardActionArea
                onClick={() => onToggle(idStr)}
                aria-pressed={selected}
                aria-label={
                    selected
                        ? `Deseleccionar fuente ${titleText || idStr}`
                        : `Seleccionar fuente ${titleText || idStr}`
                }
                sx={{
                    alignItems: 'stretch',
                    p: 1.25,
                    display: 'block',
                    textAlign: 'left',
                    width: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box'
                }}
            >
                <Box sx={{ position: 'relative', pr: 3.5, minWidth: 0 }}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: 26,
                            height: 26,
                            display: 'grid',
                            placeItems: 'center',
                            pointerEvents: 'none'
                        }}
                        aria-hidden
                    >
                        {selected ? (
                            <CheckCircleIcon sx={{ fontSize: 24, color: 'primary.main' }} />
                        ) : (
                            <RadioButtonUncheckedIcon
                                sx={{ fontSize: 24, color: alpha(theme.palette.text.primary, 0.28) }}
                            />
                        )}
                    </Box>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: '36px 1fr',
                            columnGap: 1,
                            rowGap: 0.5,
                            alignItems: 'start',
                            minWidth: 0
                        }}
                    >
                        <Box
                            sx={{
                                gridColumn: 1,
                                gridRow: 1,
                                alignSelf: 'center',
                                width: 36,
                                height: 36,
                                borderRadius: 1.5,
                                display: 'grid',
                                placeItems: 'center',
                                bgcolor: selected ? 'primary.main' : alpha(theme.palette.primary.main, 0.1),
                                color: selected ? theme.palette.getContrastText(theme.palette.primary.main) : 'primary.main',
                                transition: theme.transitions.create(['background-color', 'color'], {
                                    duration: theme.transitions.duration.shorter
                                })
                            }}
                        >
                            <StorageIcon sx={{ fontSize: 20 }} />
                        </Box>
                        <Typography
                            sx={{
                                gridColumn: 2,
                                gridRow: 1,
                                alignSelf: 'center',
                                minWidth: 0,
                                fontWeight: 700,
                                fontSize: theme.typography.pxToRem(14),
                                lineHeight: 1.3,
                                wordBreak: 'break-word'
                            }}
                        >
                            {titleText || 'Fuente'}
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                gridColumn: 2,
                                gridRow: 2,
                                minWidth: 0,
                                lineHeight: 1.4,
                                wordBreak: 'break-word'
                            }}
                        >
                            {descText}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ mt: 1, display: 'flex', minWidth: 0, maxWidth: '100%' }}>
                    <Chip
                        size="small"
                        icon={<VerifiedRoundedIcon sx={{ fontSize: '14px' }} />}
                        label=" 100% compatible"
                        sx={(t) => ({
                            height: 22,
                            maxWidth: '100%',
                            fontWeight: 100,
                            bgcolor: alpha(t.palette.success.main, 0.12),
                            color: t.palette.success.main,
                            border: `1px solid ${alpha(t.palette.success.main, 0.35)}`,
                            '& .MuiChip-icon': { color: t.palette.success.main },
                            '& .MuiChip-label': {
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }
                        })}
                    />
                </Box>
            </CardActionArea>
        </Card>
    );
}

const MAPPING_GRID_SX = {
    display: 'grid',
    width: '100%',
    gap: 2,
    alignItems: 'start',
    gridTemplateColumns: { xs: '1fr', lg: 'minmax(220px, 1fr) auto minmax(0, 2fr)' },
    gridTemplateAreas: { xs: '"origin"\n"arrow"\n"compat"', lg: '"origin arrow compat"' }
};

function compatCardsGridSx(count, theme) {
    const gap = theme.spacing(1.25);
    const twoColTracks = `repeat(2, minmax(0, calc((100% - ${gap}) / 2)))`;

    return {
        display: 'grid',
        gap: 1.25,
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        alignItems: 'stretch',
        gridTemplateColumns:
            count > 1 ? twoColTracks : { xs: '1fr', sm: twoColTracks },
        '& > *': { minWidth: 0, maxWidth: '100%', width: '100%', boxSizing: 'border-box' }
    };
}

function SourceMappingGrid({
    theme,
    originLine,
    fieldCount,
    panelCount,
    fieldNames = [],
    panelItems = [],
    panelsPreviewLine = null,
    compatibleSources,
    selectedSourceId,
    onToggleSource
}) {
    const [originDetailOpen, setOriginDetailOpen] = useState(false);

    const openOriginDetail = useCallback(() => {
        setOriginDetailOpen(true);
    }, []);

    const handleOriginContextMenu = useCallback((event) => {
        event.preventDefault();
        openOriginDetail();
    }, [openOriginDetail]);

    const handleOriginInfoClick = useCallback((event) => {
        event.stopPropagation();
        openOriginDetail();
    }, [openOriginDetail]);

    return (
        <Box sx={{ ...MAPPING_GRID_SX, mb: 0.5, minWidth: 0, maxWidth: '100%' }}>
            <OriginSourceDetailModal
                open={originDetailOpen}
                onClose={() => setOriginDetailOpen(false)}
                originName={originLine}
                fieldNames={fieldNames}
                panelItems={panelItems}
            />
            <Card
                elevation={0}
                onContextMenu={handleOriginContextMenu}
                sx={{
                    gridArea: 'origin',
                    minWidth: 0,
                    p: 1.75,
                    borderRadius: 2.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.07),
                    boxShadow: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.25,
                    cursor: 'context-menu'
                }}
            >
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography variant="overline" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: '0.12em' }}>
                        Fuente de origen
                    </Typography>
                    <Tooltip title="Ver detalle de la fuente">
                        <IconButton
                            size="small"
                            aria-label="Ver detalle de la fuente"
                            onClick={handleOriginInfoClick}
                            sx={{ color: 'primary.main', mr: -0.5, mt: -0.5 }}
                        >
                            <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                    <Box
                        sx={(t) => ({
                            width: 40,
                            height: 40,
                            borderRadius: 1.5,
                            flexShrink: 0,
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: alpha(t.palette.primary.main, 0.28)
                        })}
                    >
                        <StorageIcon sx={{ fontSize: 22, color: 'primary.main' }} />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: theme.typography.pxToRem(16), lineHeight: 1.3, wordBreak: 'break-word' }}>
                            {originLine}
                        </Typography>
                        {panelsPreviewLine ? (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.4, display: 'block' }}>
                                {panelsPreviewLine}
                            </Typography>
                        ) : null}
                    </Box>
                </Stack>
                <Stack direction="row" spacing={1}>
                    {[
                        ['PANELES', panelCount ?? 0],
                        ['CAMPOS', fieldCount]
                    ].map(([label, value]) => (
                        <Box
                            key={label}
                            sx={(t) => ({
                                flex: 1,
                                py: 0.75,
                                px: 1,
                                borderRadius: 1.5,
                                bgcolor: 'background.paper',
                                border: `1px solid ${t.palette.divider}`
                            })}
                        >
                            <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.12em', display: 'block', mb: 0.35, fontSize: 10 }}>
                                {label}
                            </Typography>
                            <Typography sx={{ fontSize: 13, lineHeight: 1.1 }}>{value}</Typography>
                        </Box>
                    ))}
                </Stack>
            </Card>
            <VisualConnector />
            <Stack spacing={1.25} sx={{ gridArea: 'compat', minWidth: 0, maxWidth: '100%' }}>
                <Typography variant="overline" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: '0.1em', fontSize: 11 }}>
                    Compatible con
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45, fontSize: 13 }}>
                    <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
                        {compatibleSources.length}{' '}
                        {compatibleSources.length === 1 ? 'fuente disponible' : 'fuentes disponibles'}
                    </Box>{' '}
                    en el sistema con los mismos campos requeridos.
                </Typography>
                {compatibleSources.length > 0 ? (
                    <Box sx={compatCardsGridSx(compatibleSources.length, theme)}>
                        {compatibleSources.map((src) => (
                            <CompatibleCard
                                key={String(src.id)}
                                source={src}
                                selected={selectedSourceId === String(src.id)}
                                onToggle={onToggleSource}
                            />
                        ))}
                    </Box>
                ) : null}
            </Stack>
        </Box>
    );
}

export default function StepValidateSources() {
    const {
        wizardData,
        updateWizardData,
        updateWizardActions,
        resetWizardActions,
        nextStep
    } = useWizard();
    const theme = useTheme();
    const { appId } = useAppId();
    const userToken = useSelector((state) => state.user?.[0]?.userID);

    const datasourceGroups = useMemo(
        () => getImportDatasourceGroups(wizardData.unzippedData),
        [wizardData.unzippedData]
    );
    const isMultiSource = isMultiSourceImport(wizardData.unzippedData);
    const fieldNames = useMemo(() => {
        if (isMultiSource) return datasourceGroups.flatMap((g) => groupFieldNames(g));
        if (datasourceGroups.length === 1) {
            const fromGroup = groupFieldNames(datasourceGroups[0]);
            if (fromGroup.length) return fromGroup;
        }
        return getLegacyFieldNames(wizardData.unzippedData);
    }, [wizardData.unzippedData, datasourceGroups, isMultiSource]);
    const fieldNamesKey = fieldNames.join('\u0001');

    const originDatasourceLine = useMemo(() => {
        const names = extractUniqueDatasourceNamesFromImport(wizardData.unzippedData);
        return names.length ? names.join(', ') : 'No se encontró datasource_name en el JSON del export.';
    }, [wizardData.unzippedData]);

    const panelCount = countPanelsFromImportPayload(wizardData.unzippedData);

    const allPanelItems = useMemo(
        () => getAllPanelItemsFromImport(wizardData.unzippedData),
        [wizardData.unzippedData]
    );

    const [selectedSourceId, setSelectedSourceId] = useState(null);
    const [selectedByGroupIndex, setSelectedByGroupIndex] = useState({});
    const [validateError, setValidateError] = useState(null);
    const [validateDone, setValidateDone] = useState(false);
    const [groupValidations, setGroupValidations] = useState([]);
    const [isSavingSource, setIsSavingSource] = useState(false);

    const { data: allSources, isLoading: listLoading, isError: listError } = useDataSourcesList();

    const groupsValidationKey = useMemo(
        () =>
            datasourceGroups
                .map((g) => `${g?.group_key?.type ?? ''}:${g?.group_key?.value ?? ''}:${groupFieldNames(g).join(',')}`)
                .join('\u0002'),
        [datasourceGroups]
    );

    useEffect(() => {
        let cancelled = false;
        async function run() {
            setValidateError(null);
            setGroupValidations([]);
            if (!appId || !userToken) {
                setValidateDone(true);
                return;
            }
            const groupsToValidate = datasourceGroups.length > 0 ? datasourceGroups : fieldNames.length > 0 ? [{ group_key: { type: 'name', value: 'default' }, field_names: fieldNames, panel_refs: [] }] : [];
            if (!groupsToValidate.length) {
                setValidateDone(true);
                return;
            }
            setValidateDone(false);
            try {
                const results = await Promise.all(
                    groupsToValidate.map(async (group) => {
                        const names = groupFieldNames(group);
                        if (!names.length) return { group, validationResponse: null, error: null };
                        const resp = await validateDashboardSources({ appId, userToken, fieldNames: names });
                        const st = resp?.status;
                        if (st && st !== 'success' && st !== 'ok') {
                            return { group, validationResponse: null, error: resp?.msg || 'No se pudo validar las fuentes.' };
                        }
                        return { group, validationResponse: resp, error: null };
                    })
                );
                if (cancelled) return;
                const firstError = results.find((r) => r.error)?.error;
                if (firstError) setValidateError(firstError);
                setGroupValidations(results);
            } catch (e) {
                if (!cancelled) {
                    setGroupValidations([]);
                    setValidateError(e?.message || 'Error al validar fuentes.');
                }
            } finally {
                if (!cancelled) setValidateDone(true);
            }
        }
        run();
        return () => {
            cancelled = true;
        };
    }, [appId, userToken, groupsValidationKey, datasourceGroups, fieldNames]);

    const sourcesById = useMemo(() => buildSourcesByIdMap(allSources), [allSources]);

    const groupCompat = useMemo(() => {
        const entries =
            groupValidations.length > 0 ? groupValidations : datasourceGroups.map((group) => ({ group, validationResponse: null }));
        const built = entries.map(({ group, validationResponse }) => ({
            group,
            fieldNames: groupFieldNames(group),
            validationResponse,
            strictCompatible: listCompatibleSources(sourcesById, validationResponse)
        }));

        if (!isMultiSource) {
            return built.map(({ strictCompatible, ...rest }) => ({
                ...rest,
                compatibleSources: strictCompatible
            }));
        }

        const sharedGroupIds = getMultiSourceSharedGroupIds(built.map((e) => e.strictCompatible));
        return built.map(({ strictCompatible, ...rest }) => ({
            ...rest,
            compatibleSources: filterCompatibleByGroupIds(strictCompatible, sharedGroupIds)
        }));
    }, [groupValidations, datasourceGroups, sourcesById, isMultiSource]);

    const displayGroupCompat = useMemo(() => {
        if (!isMultiSource) return groupCompat;

        let lockedGroupId = null;
        for (let i = 0; i < groupCompat.length; i += 1) {
            const sel = selectedByGroupIndex[i];
            if (!sel) continue;
            const src = groupCompat[i]?.compatibleSources?.find((s) => String(s.id) === String(sel));
            const gid = src ? getSourceGroupId(src) : null;
            if (gid) {
                lockedGroupId = gid;
                break;
            }
        }
        if (!lockedGroupId) return groupCompat;

        const lock = new Set([lockedGroupId]);
        return groupCompat.map((entry) => ({
            ...entry,
            compatibleSources: filterCompatibleByGroupIds(entry.compatibleSources, lock)
        }));
    }, [groupCompat, isMultiSource, selectedByGroupIndex]);

    const compatibleSources = displayGroupCompat[0]?.compatibleSources ?? groupCompat[0]?.compatibleSources ?? [];
    const compatibleKey = compatibleSources.map((s) => String(s.id)).join(',');

    const handleToggleCompatibleSource = useCallback((idStr) => {
        setSelectedSourceId((prev) => (prev === idStr ? null : idStr));
    }, []);

    useEffect(() => {
        setSelectedSourceId(null);
        setSelectedByGroupIndex({});
    }, [fieldNamesKey]);

    useEffect(() => {
        if (!isMultiSource) return;
        setSelectedByGroupIndex((prev) => {
            let changed = false;
            const next = { ...prev };
            datasourceGroups.forEach((_, i) => {
                const sel = prev[i];
                if (!sel) return;
                const list = displayGroupCompat[i]?.compatibleSources ?? [];
                if (!list.some((s) => String(s.id) === String(sel))) {
                    next[i] = null;
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [displayGroupCompat, isMultiSource, datasourceGroups.length]);

    useEffect(() => {
        if (!validateDone || !compatibleKey) return;
        const saved = wizardData.importDashboardSource?.id;
        if (saved && compatibleSources.some((s) => String(s.id) === String(saved))) {
            setSelectedSourceId(String(saved));
            return;
        }
        if (compatibleSources.length === 1) {
            setSelectedSourceId(String(compatibleSources[0].id));
        }
    }, [validateDone, compatibleKey, wizardData.importDashboardSource?.id, compatibleSources]);

    const validationHasResults = groupCompat.some((g) => g.compatibleSources.length > 0);

    const isLoading = !validateDone || listLoading;
    const hasPayload = Boolean(wizardData.unzippedData);
    const extractionEmpty = hasPayload && fieldNames.length === 0;

    const selectionOk = isMultiSource
        ? datasourceGroups.every((_, i) => {
              const list = displayGroupCompat[i]?.compatibleSources || [];
              const sel = selectedByGroupIndex[i];
              return sel && list.some((s) => String(s.id) === String(sel));
          })
        : Boolean(selectedSourceId && compatibleSources.some((s) => String(s.id) === String(selectedSourceId)));

    const handleContinue = useCallback(async () => {
        if (!selectionOk || fieldNames.length === 0) return;
        try {
            if (isMultiSource) {
                const mappings = [];
                for (let i = 0; i < datasourceGroups.length; i += 1) {
                    const { group, compatibleSources: list, validationResponse } = displayGroupCompat[i] || {};
                    const picked = list?.find((s) => String(s.id) === String(selectedByGroupIndex[i]));
                    if (!picked) return;
                    mappings.push({
                        ...(await resolveImportSourceSelection(picked, validationResponse, userToken)),
                        originalKey: group.group_key
                    });
                }
                updateWizardData({
                    importDatasourceMappings: mappings,
                    importDashboardSource: mappings[0],
                    importDestination: null
                });
            } else {
                const picked = compatibleSources.find((s) => String(s.id) === String(selectedSourceId));
                if (!picked) return;
                const resolved = await resolveImportSourceSelection(
                    picked,
                    groupCompat[0]?.validationResponse,
                    userToken
                );
                updateWizardData({
                    importDashboardSource: resolved,
                    importDatasourceMappings: [resolved],
                    importDestination: null
                });
            }
            nextStep();
        } catch (e) {
            setValidateError(e?.message || 'No se pudo guardar la fuente seleccionada.');
        }
    }, [
        selectionOk,
        fieldNames.length,
        isMultiSource,
        datasourceGroups,
        displayGroupCompat,
        selectedByGroupIndex,
        compatibleSources,
        selectedSourceId,
        nextStep,
        updateWizardData,
        userToken
    ]);

    useEffect(() => {
        updateWizardActions({
            continueLabel: isSavingSource ? 'Guardando...' : 'Continuar',
            continueDisabled:
                !hasPayload ||
                extractionEmpty ||
                isLoading ||
                isSavingSource ||
                Boolean(validateError) ||
                (Boolean(listError) && !validationHasResults) ||
                !selectionOk ||
                !validationHasResults,
            isLoading: isLoading || isSavingSource,
            onContinue: async () => {
                setIsSavingSource(true);
                try {
                    await handleContinue();
                } finally {
                    setIsSavingSource(false);
                }
            },
            onBack: null
        });
    }, [
        isMultiSource,
        groupCompat,
        extractionEmpty,
        handleContinue,
        hasPayload,
        isLoading,
        isSavingSource,
        listError,
        selectionOk,
        updateWizardActions,
        validateError,
        validationHasResults
    ]);

    useEffect(() => {
        return () => {
            resetWizardActions();
        };
    }, [resetWizardActions]);

    if (isLoading) {
        return (
            <Box
                sx={{
                    width: '100%',
                    flex: '1 1 auto',
                    minHeight: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    px: 0.5
                }}
            >
                <ImportWizardLoadingAnimation {...validateSourcesLoadingProps} />
            </Box>
        );
    }

    const showMapping = !extractionEmpty && fieldNames.length > 0 && validateDone && !validateError;

    return (
        <Stack
            spacing={1.25}
            alignItems="stretch"
            sx={{
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                flex: '1 1 auto',
                minHeight: 0,
                height: '100%',
                overflow: 'hidden',
                pb: 0
            }}
        >
            <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flexShrink: 0 }}>
                <Box
                    sx={(t) => ({
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        flexShrink: 0,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: alpha(t.palette.primary.main, 0.12),
                        boxShadow: 'none'
                    })}
                >
                    <StorageOutlinedIcon sx={{ fontSize: 24, color: 'primary.main' }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 800, letterSpacing: '0.06em' }}>
                        Paso 2 de 4
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, color: 'text.primary', mt: 0.2, fontSize: '1.05rem' }}>
                        {isMultiSource ? 'Asigna las fuentes del tablero' : 'Selecciona la fuente del tablero'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.45, fontSize: 13 }}>
                        {isMultiSource ? 'Elige una fuente destino compatible para cada grupo de origen.' : 'Esta fuente se aplicará al tablero y a todos sus paneles.'}
                    </Typography>
                </Box>
            </Stack>

            {hasPayload && !extractionEmpty && fieldNames.length > 0 && (
                <Box sx={{ width: '100%', minWidth: 0, maxWidth: '100%', flexShrink: 0 }}>
                <Alert
                    severity="info"
                    icon={<InfoOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
                    sx={(t) => ({
                        width: '100%',
                        maxWidth: '100%',
                        minWidth: 0,
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        borderRadius: 2,
                        alignItems: 'center',
                        border: 'none',
                        bgcolor: alpha(t.palette.primary.main, 0.08),
                        color: 'text.primary',
                        '& .MuiAlert-icon': {
                            color: 'primary.main',
                            opacity: 1,
                            flexShrink: 0,
                            alignSelf: 'center',
                            mr: 1,
                            py: 0
                        },
                        '& .MuiAlert-message': {
                            minWidth: 0,
                            flex: '1 1 auto',
                            alignSelf: 'center',
                            overflow: 'hidden',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            fontSize: 13,
                            lineHeight: 1.45,
                            padding: 0,
                            fontWeight: 400
                        }
                    })}
                >
                    {buildCompatSourcesInfoBody(panelCount)}
                </Alert>
                </Box>
            )}

            {!hasPayload && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    <AlertTitle>Falta el archivo importado</AlertTitle>
                    Vuelve atrás y completa los pasos anteriores antes de asignar fuentes.
                </Alert>
            )}

            {!appId && hasPayload && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    No hay <strong>app_id</strong> en el contexto. Activa o selecciona una aplicación y vuelve a cargar
                    el archivo para obtener las fuentes compatibles desde el servidor.
                </Alert>
            )}

            {extractionEmpty && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    <AlertTitle>No se detectaron nombres de campo</AlertTitle>
                    No se puede validar fuentes sin campos reconocibles en el JSON. Vuelve al paso 1 y comprueba el
                    archivo.
                </Alert>
            )}

            {validateError && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {validateError}
                </Alert>
            )}

            {listError && !validationHasResults && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {typeof listError === 'string' ? listError : 'No se pudo cargar el listado de fuentes.'}
                </Alert>
            )}

            <Box
                sx={{
                    width: '100%',
                    flex: '1 1 auto',
                    minHeight: 0,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    pr: 0.25
                }}
            >
            <Stack spacing={1.5} sx={{ width: '100%', pt: 0.25, pb: 0.5 }}>
                {showMapping && !validationHasResults && (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                        {isMultiSource
                            ? 'No hay fuentes 100% compatibles en un mismo grupo para todas las fuentes de origen. Revisa la configuración en el administrador de fuentes.'
                            : 'No hay fuentes compatibles para los campos de este tablero. Revisa la configuración en el administrador de fuentes.'}
                    </Alert>
                )}

                {showMapping && isMultiSource && (
                    <Stack spacing={1.5} sx={{ pb: 0.5 }}>
                        {displayGroupCompat.map((entry, index) => (
                            <SourceMappingGrid
                                key={`${entry.group?.group_key?.value ?? index}`}
                                theme={theme}
                                originLine={groupOriginLabel(entry.group)}
                                fieldCount={entry.fieldNames.length}
                                fieldNames={entry.fieldNames}
                                panelCount={getGroupPanelItems(entry.group, wizardData.unzippedData).length}
                                panelItems={getGroupPanelItems(entry.group, wizardData.unzippedData)}
                                panelsPreviewLine={formatGroupPanelsPreview(entry.group, 2, wizardData.unzippedData)}
                                compatibleSources={entry.compatibleSources}
                                selectedSourceId={selectedByGroupIndex[index] ?? null}
                                onToggleSource={(idStr) =>
                                    setSelectedByGroupIndex((prev) => ({
                                        ...prev,
                                        [index]: prev[index] === idStr ? null : idStr
                                    }))
                                }
                            />
                        ))}
                    </Stack>
                )}

                {showMapping && !isMultiSource && (
                    <SourceMappingGrid
                        theme={theme}
                        originLine={originDatasourceLine}
                        fieldCount={fieldNames.length}
                        fieldNames={fieldNames}
                        panelCount={allPanelItems.length || panelCount}
                        panelItems={allPanelItems}
                        panelsPreviewLine={
                            allPanelItems.length
                                ? formatGroupPanelsPreview({ panel_items: allPanelItems }, 2)
                                : null
                        }
                        compatibleSources={compatibleSources}
                        selectedSourceId={selectedSourceId}
                        onToggleSource={handleToggleCompatibleSource}
                    />
                )}
            </Stack>
            </Box>
        </Stack>
    );
}
