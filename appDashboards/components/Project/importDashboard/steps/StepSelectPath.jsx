import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Alert,
    AlertTitle,
    Box,
    Stack,
    Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { mapRecordToSelectOption } from '../utils/mapRecordToSelectOption';
import { getProjectList } from '@components/Project/Project/services/Project';
import { getFolderList } from '@components/Project/Folders/services/Folder';
import { useWizard } from '../hooks/useWizard';
import ImportPathColumn from '../components/ImportPathColumn';
import ImportWizardFooter from '../components/ImportWizardFooter';
import { WIZARD_FOOTER_WRAPPER_COMPACT_SX } from '../constants/wizardFooterStyles';
import useDebounce from 'hooks/useDebounce';
import { fetchGroupDisplayName } from '../services/fetchGroupDisplayName';
import { countPanelsFromImportPayload, formatBytes } from '../utils/importFileSummary';

const LIST_LIMIT = 200;

export default function StepSelectPath() {
    const {
        wizardData,
        updateWizardData,
        resetWizardActions,
        nextStep,
        prevStep
    } = useWizard();
    const userToken = useSelector((state) => state.user?.[0]?.userID);

    const lockedGroup = useMemo(() => {
        const src = wizardData.importDashboardSource;
        if (!src?.groupId) return null;
        const fromSource = src.groupName?.trim();
        const fromDestination =
            wizardData.importDestination?.groupId != null &&
            String(wizardData.importDestination.groupId) === String(src.groupId)
                ? wizardData.importDestination.groupName?.trim()
                : '';
        return {
            id: String(src.groupId),
            name: fromSource || fromDestination || ''
        };
    }, [wizardData.importDashboardSource, wizardData.importDestination]);

    const [groupDisplayName, setGroupDisplayName] = useState(lockedGroup?.name || '');

    useEffect(() => {
        let cancelled = false;

        async function resolveName() {
            if (!lockedGroup?.id) {
                setGroupDisplayName('');
                return;
            }
            if (lockedGroup.name) {
                setGroupDisplayName(lockedGroup.name);
                return;
            }
            if (!userToken) return;

            const fetched = await fetchGroupDisplayName(lockedGroup.id, userToken);
            if (!cancelled) {
                setGroupDisplayName(fetched);
            }
        }

        resolveName();
        return () => {
            cancelled = true;
        };
    }, [lockedGroup?.id, lockedGroup?.name, userToken]);

    const initialDestination = wizardData.importDestination;

    const [projectOptions, setProjectOptions] = useState([]);
    const [folderOptions, setFolderOptions] = useState([]);

    const [selectedProject, setSelectedProject] = useState(() =>
        initialDestination?.projectId
            ? {
                  id: initialDestination.projectId,
                  label: initialDestination.projectName || String(initialDestination.projectId)
              }
            : null
    );
    const [selectedFolder, setSelectedFolder] = useState(() =>
        initialDestination?.folderId
            ? {
                  id: initialDestination.folderId,
                  label: initialDestination.folderName || String(initialDestination.folderId)
              }
            : null
    );

    const [projectSearch, setProjectSearch] = useState('');
    const [folderSearch, setFolderSearch] = useState('');
    const debouncedProjectSearch = useDebounce(projectSearch, 400);
    const debouncedFolderSearch = useDebounce(folderSearch, 400);

    const [loadingProjects, setLoadingProjects] = useState(false);
    const [loadingFolders, setLoadingFolders] = useState(false);
    const [listError, setListError] = useState(null);

    const hasImportPayload = Boolean(wizardData.unzippedData);
    const hasSourceWithGroup = Boolean(lockedGroup);
    const pathComplete = Boolean(hasSourceWithGroup && selectedProject && selectedFolder);

    const loadProjects = useCallback(async () => {
        if (!userToken || !lockedGroup?.id) {
            setProjectOptions([]);
            return;
        }
        setLoadingProjects(true);
        setListError(null);
        try {
            const { results, error } = await getProjectList(
                {
                    projectsPerPage: LIST_LIMIT,
                    offset: 0,
                    searchValue: debouncedProjectSearch,
                    sortField: 'name',
                    sortDirection: 'asc',
                    userToken,
                    groupId: lockedGroup.id,
                    showLoading: false
                },
                {
                    setIsLoadingList: () => {},
                    setProjects: () => {},
                    setTotalProjects: () => {},
                    setCurrentPage: () => {}
                }
            );
            if (error) {
                setProjectOptions([]);
                setListError(error);
                return;
            }
            setProjectOptions((results || []).map((p) => mapRecordToSelectOption(p)).filter(Boolean));
        } catch (e) {
            console.error(e);
            setProjectOptions([]);
            setListError('Error al cargar proyectos.');
        } finally {
            setLoadingProjects(false);
        }
    }, [userToken, lockedGroup?.id, debouncedProjectSearch]);

    const loadFolders = useCallback(async () => {
        if (!userToken || !selectedProject?.id) {
            setFolderOptions([]);
            return;
        }
        setLoadingFolders(true);
        setListError(null);
        try {
            const { results, error } = await getFolderList(
                {
                    foldersPerPage: LIST_LIMIT,
                    offset: 0,
                    searchValue: debouncedFolderSearch,
                    sortField: 'name',
                    sortDirection: 'asc',
                    userToken,
                    projectId: selectedProject.id,
                    showLoading: false
                },
                {
                    setIsLoadingList: () => {},
                    setFolders: () => {}
                }
            );
            if (error) {
                setFolderOptions([]);
                setListError(error);
                return;
            }
            setFolderOptions((results || []).map((f) => mapRecordToSelectOption(f)).filter(Boolean));
        } catch (e) {
            console.error(e);
            setFolderOptions([]);
            setListError('Error al cargar carpetas.');
        } finally {
            setLoadingFolders(false);
        }
    }, [userToken, selectedProject?.id, debouncedFolderSearch]);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    useEffect(() => {
        loadFolders();
    }, [loadFolders]);

    useEffect(() => {
        setSelectedProject(null);
        setSelectedFolder(null);
        setFolderOptions([]);
        setProjectSearch('');
        setFolderSearch('');
    }, [lockedGroup?.id]);

    useEffect(() => {
        setSelectedFolder(null);
        setFolderOptions([]);
        setFolderSearch('');
    }, [selectedProject?.id]);

    const handleContinue = useCallback(() => {
        if (!pathComplete || !lockedGroup) return;
        updateWizardData({
            importDestination: {
                groupId: lockedGroup.id,
                projectId: selectedProject.id,
                folderId: selectedFolder.id,
                groupName: groupDisplayName || lockedGroup.name || undefined,
                projectName: selectedProject.label,
                folderName: selectedFolder.label
            }
        });
        nextStep();
    }, [
        groupDisplayName,
        lockedGroup,
        nextStep,
        pathComplete,
        selectedFolder,
        selectedProject,
        updateWizardData
    ]);

    useEffect(() => {
        return () => {
            resetWizardActions();
        };
    }, [resetWizardActions]);

    const uploaded = wizardData.uploadedFile;
    const panelCount = countPanelsFromImportPayload(wizardData.unzippedData);
    const fileMetaLine = [
        uploaded?.name,
        panelCount != null ? `${panelCount} panel${panelCount === 1 ? '' : 'es'}` : null,
        uploaded?.size != null ? formatBytes(uploaded.size) : null
    ]
        .filter(Boolean)
        .join(' · ');

    const visibleBreadcrumbLabels = [
        groupDisplayName || null,
        selectedProject?.label,
        selectedFolder?.label
    ].filter((v) => v != null && String(v).trim() !== '');

    const busy = loadingProjects || loadingFolders;
    const sourceLabel =
        wizardData.importDashboardSource?.alias ||
        wizardData.importDashboardSource?.id ||
        '';

    return (
        <Stack
            spacing={1.25}
            alignItems="stretch"
            sx={{
                width: '100%',
                maxWidth: '100%',
                height: '100%',
                minHeight: 0,
                overflow: 'hidden',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                pb: 0
            }}
        >
            <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flexShrink: 0 }}>
                <Box
                    sx={(theme) => ({
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        flexShrink: 0,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        boxShadow: 'none'
                    })}
                >
                    <AccountTreeOutlinedIcon sx={{ fontSize: 24, color: 'primary.main' }} />
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 800, letterSpacing: '0.08em' }}>
                        PASO 3 DE 4
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, color: 'text.primary' }}>
                        ¿Dónde quieres guardar el tablero?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, mt: 0.4 }}>
                        El grupo viene de la fuente que elegiste. Solo selecciona proyecto y carpeta dentro de ese
                        grupo.
                    </Typography>
                    {fileMetaLine ? (
                        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1 }}>
                            <AttachFileOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                                {fileMetaLine}
                            </Typography>
                        </Stack>
                    ) : null}
                    {sourceLabel ? (
                        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.5 }}>
                            <StorageOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                                {sourceLabel}
                            </Typography>
                        </Stack>
                    ) : null}
                </Box>
            </Stack>

            {!hasImportPayload && (
                <Alert severity="warning" icon={<WarningAmberRoundedIcon />} sx={{ borderRadius: 2 }}>
                    <AlertTitle>Falta el archivo importado</AlertTitle>
                    Vuelve al paso 1 y carga un .ifz válido.
                </Alert>
            )}

            {!hasSourceWithGroup && hasImportPayload && (
                <Alert severity="warning" icon={<WarningAmberRoundedIcon />} sx={{ borderRadius: 2 }}>
                    <AlertTitle>Falta la fuente</AlertTitle>
                    Vuelve al paso 2 y elige una fuente compatible (debe incluir grupo).
                </Alert>
            )}

            <Alert
                severity="info"
                icon={<InfoOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
                sx={(theme) => ({
                    borderRadius: 2,
                    alignItems: 'center',
                    border: 'none',
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    color: 'text.primary',
                    '& .MuiAlert-icon': { color: 'primary.main', opacity: 1 },
                    '& .MuiAlert-message': { fontSize: 13, lineHeight: 1.45, padding: 0, fontWeight: 400 }
                })}
            >
                Solo verás proyectos y carpetas del grupo{' '}
                {groupDisplayName ? (
                    <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
                        {groupDisplayName}
                    </Box>
                ) : (
                    'seleccionado'
                )}
                . Si necesitas otra carpeta, créala antes en Recursos dentro de ese mismo grupo.
            </Alert>

            {listError ? (
                <Alert severity="error" icon={<WarningAmberRoundedIcon />} sx={{ borderRadius: 2 }}>
                    {listError}
                </Alert>
            ) : null}

            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1.25}
                sx={{
                    alignItems: 'stretch',
                    flex: '1 1 auto',
                    minHeight: 0,
                    overflow: 'hidden'
                }}
            >
                <ImportPathColumn
                    title="Proyecto"
                    icon={BusinessOutlinedIcon}
                    options={projectOptions}
                    selectedId={selectedProject?.id}
                    loading={loadingProjects}
                    disabled={!hasSourceWithGroup || !hasImportPayload}
                    searchValue={projectSearch}
                    onSearchChange={setProjectSearch}
                    searchPlaceholder="Buscar proyecto…"
                    emptyHint={
                        !hasSourceWithGroup
                            ? 'Primero elige una fuente en el paso anterior.'
                            : undefined
                    }
                    onSelect={(opt) => {
                        setSelectedProject(opt);
                        setSelectedFolder(null);
                        setFolderOptions([]);
                    }}
                />
                <ImportPathColumn
                    title="Carpeta"
                    icon={FolderOutlinedIcon}
                    options={folderOptions}
                    selectedId={selectedFolder?.id}
                    loading={loadingFolders}
                    disabled={!selectedProject || !hasImportPayload}
                    searchValue={folderSearch}
                    onSearchChange={setFolderSearch}
                    searchPlaceholder="Buscar carpeta…"
                    emptyHint={
                        !selectedProject || !hasImportPayload
                            ? 'Elige un proyecto para ver las carpetas.'
                            : undefined
                    }
                    onSelect={(opt) => setSelectedFolder(opt)}
                />
            </Stack>

            <Box sx={{ ...WIZARD_FOOTER_WRAPPER_COMPACT_SX, mt: 'auto', flexShrink: 0 }}>
                <ImportWizardFooter
                showBack
                backLabel="Volver"
                onBack={() => prevStep()}
                backDisabled={busy}
                continueLabel="Continuar"
                onContinue={handleContinue}
                continueDisabled={!pathComplete || !hasImportPayload || busy}
                centerInline
                centerContent={
                    <Stack
                        direction="row"
                        alignItems="center"
                        flexWrap="wrap"
                        justifyContent="center"
                        columnGap={0.35}
                        rowGap={0.35}
                    >
                        {visibleBreadcrumbLabels.length === 0 ? (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                Selecciona proyecto y carpeta
                            </Typography>
                        ) : (
                            visibleBreadcrumbLabels.map((label, idx) => (
                                <React.Fragment key={`${idx}-${label}`}>
                                    {idx > 0 ? (
                                        <Typography component="span" variant="caption" sx={{ color: '#A8B0BA', px: 0.125 }}>
                                            /
                                        </Typography>
                                    ) : null}
                                    <Typography
                                        component="span"
                                        variant="caption"
                                        title={label}
                                        noWrap
                                        sx={{
                                            display: 'inline-block',
                                            px: 0.85,
                                            py: 0.3,
                                            borderRadius: '3px',
                                            bgcolor: '#F1F4F8',
                                            fontSize: '0.7rem',
                                            maxWidth: { xs: 120, sm: 160 }
                                        }}
                                    >
                                        {label}
                                    </Typography>
                                </React.Fragment>
                            ))
                        )}
                    </Stack>
                }
                />
            </Box>
        </Stack>
    );
}
