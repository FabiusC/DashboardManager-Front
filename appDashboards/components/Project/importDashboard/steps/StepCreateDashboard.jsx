import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import {
    Alert,
    AlertTitle,
    Box,
    CircularProgress,
    Stack,
    Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DashboardCustomizeOutlinedIcon from '@mui/icons-material/DashboardCustomizeOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { getAclById } from '@services/creangelAuthAPI';
import { useAppId } from 'hooks/useAppId';
import { useWizard } from '../hooks/useWizard';
import ImportWizardLoadingAnimation from '../components/ImportWizardLoadingAnimation';
import { dashboardCreatingLoadingProps } from '../constants/importWizardLoadingPresets';
import ImportSummaryMiniCard from '../components/summary/ImportSummaryMiniCard';
import ImportSummaryValidations from '../components/summary/ImportSummaryValidations';
import ImportWizardFooter from '../components/ImportWizardFooter';
import { WIZARD_FOOTER_WRAPPER_SX } from '../constants/wizardFooterStyles';
import { createDashboardFromImportJson } from '../services/createDashboardFromImportJson';
import { normalizeDashboardDataForCreate } from '../utils/buildCreateFromImportJsonPayload';
import { countPanelsFromImportPayload } from '../utils/importFileSummary';
import { extractCreatedDashboardId } from '../utils/extractCreatedDashboardId';
import { openImportedDashboardEditor } from '../utils/openImportedDashboardEditor';
import { openImportedDashboardViewer } from '../utils/openImportedDashboardViewer';

export default function StepCreateDashboard() {
    const router = useRouter();
    const { appId } = useAppId();
    const userToken = useSelector((state) => state.user?.[0]?.userID);
    const {
        wizardData,
        updateWizardData,
        resetWizardActions,
        resetWizardData,
        prevStep
    } = useWizard();

    const [folderPermissions, setFolderPermissions] = useState(null);
    const [permissionsError, setPermissionsError] = useState(null);
    const [permissionsLoading, setPermissionsLoading] = useState(true);
    const [createError, setCreateError] = useState(null);

    const destination = wizardData.importDestination;
    const source = wizardData.importDashboardSource;
    const sourceMappings = wizardData.importDatasourceMappings?.length > 0 ? wizardData.importDatasourceMappings : source ? [source] : [];
    const successResult = wizardData.result?.success;
    const panelCount = countPanelsFromImportPayload(wizardData.unzippedData);

    const dashboardName = useMemo(() => {
        const data = normalizeDashboardDataForCreate(wizardData.unzippedData);
        return data?.dashboard?.name || wizardData.uploadedFile?.name || 'Tablero importado';
    }, [wizardData.unzippedData, wizardData.uploadedFile?.name]);

    const destinationMeta = useMemo(
        () =>
            [destination?.groupName, destination?.projectName]
                .filter((v) => v != null && String(v).trim() !== '')
                .join(' / '),
        [destination?.groupName, destination?.projectName]
    );

    const isMultiSource = sourceMappings.length > 1;
    const sourceDisplayName = isMultiSource ? `${sourceMappings.length} fuentes` : source?.alias || source?.id || 'Sin fuente';
    const sourceMeta = isMultiSource ? sourceMappings.map((m) => m.alias || m.id).filter(Boolean).join(' · ') : source?.groupName?.trim() || destination?.groupName?.trim() || '';
    const mappingsReady =
        sourceMappings.length > 0 &&
        sourceMappings.every((m) => m?.id && m?.instance_id && m?.groupId) &&
        sourceMappings.every((m) => String(m.groupId) === String(destination?.groupId));

    const prerequisitesOk = Boolean(
        wizardData.unzippedData &&
            destination?.groupId &&
            destination?.folderId &&
            mappingsReady &&
            appId &&
            userToken &&
            folderPermissions &&
            !permissionsError
    );

    const validationItems = useMemo(
        () => [
            wizardData.unzippedData ? 'Tablero configurado' : 'Tablero pendiente',
            destination?.folderId ? 'Destino seleccionado' : 'Destino pendiente',
            mappingsReady ? 'Fuente conectada' : 'Fuente pendiente'
        ],
        [wizardData.unzippedData, destination?.folderId, mappingsReady]
    );

    useEffect(() => {
        let cancelled = false;

        async function loadPermissions() {
            setPermissionsLoading(true);
            setPermissionsError(null);
            setFolderPermissions(null);

            const folderId = destination?.folderId;
            if (!folderId || !userToken) {
                setPermissionsLoading(false);
                if (!folderId) {
                    setPermissionsError('Falta la carpeta de destino. Vuelve al paso anterior.');
                }
                return;
            }

            try {
                const response = await getAclById(folderId, {
                    Authorization: `Bearer ${userToken}`
                });
                if (cancelled) return;
                const aclData = response?.data || response;
                if (response?.status === 'error' || !aclData) {
                    setPermissionsError('No se pudieron cargar los permisos de la carpeta.');
                    return;
                }
                setFolderPermissions(aclData);
            } catch (e) {
                if (!cancelled) {
                    setPermissionsError(e?.message || 'Error al obtener permisos de la carpeta.');
                }
            } finally {
                if (!cancelled) setPermissionsLoading(false);
            }
        }

        loadPermissions();
        return () => {
            cancelled = true;
        };
    }, [destination?.folderId, userToken]);

    const runCreate = useCallback(async () => {
        if (!prerequisitesOk || wizardData.isCreating) return;

        setCreateError(null);
        updateWizardData({ isCreating: true, result: null });

        try {
            const response = await createDashboardFromImportJson({
                unzippedData: wizardData.unzippedData,
                importDestination: {
                    groupId: destination.groupId,
                    projectId: destination.projectId,
                    folderId: destination.folderId
                },
                targetSource: source,
                importDatasourceMappings: sourceMappings,
                applicationId: appId,
                folderPermissions,
                userToken
            });

            const created = response?.data?.dashboard || response?.data || null;
            const dashboardId = extractCreatedDashboardId(response);
            const resolvedName =
                (typeof created === 'object' && created?.name) ||
                response?.data?.name ||
                dashboardName;

            if (!dashboardId) {
                updateWizardData({ isCreating: false, result: null });
                setCreateError(
                    'El tablero se importó pero no se recibió su identificador. Revisa Recursos o intenta de nuevo.'
                );
                return;
            }

            updateWizardData({
                isCreating: false,
                result: {
                    success: true,
                    dashboardId,
                    dashboardName: resolvedName,
                    raw: response?.data
                }
            });
        } catch (e) {
            updateWizardData({ isCreating: false, result: null });
            setCreateError(e?.message || 'No se pudo importar el tablero.');
        }
    }, [
        appId,
        dashboardName,
        destination,
        folderPermissions,
        prerequisitesOk,
        source,
        sourceMappings,
        updateWizardData,
        userToken,
        wizardData.isCreating,
        wizardData.unzippedData
    ]);

    const resolveCreatedDashboardId = useCallback(() => {
        const createdId = wizardData.result?.dashboardId;
        if (!createdId) {
            setCreateError(
                'No se encontró el identificador del tablero importado. Vuelve a importar o ábrelo desde Recursos.'
            );
            return null;
        }
        return createdId;
    }, [wizardData.result?.dashboardId]);

    const handleOpenDashboardEditor = useCallback(() => {
        const createdId = resolveCreatedDashboardId();
        if (!createdId) return;
        if (!destination?.projectId || !destination?.folderId) {
            setCreateError('Falta la ruta de destino. Vuelve al paso anterior y selecciona proyecto y carpeta.');
            return;
        }
        openImportedDashboardEditor(router, {
            dashboardId: createdId,
            dashboardName: wizardData.result?.dashboardName || dashboardName,
            destination
        });
    }, [
        dashboardName,
        destination,
        resolveCreatedDashboardId,
        router,
        wizardData.result?.dashboardName
    ]);

    const handleOpenDashboardViewer = useCallback(() => {
        const createdId = resolveCreatedDashboardId();
        if (!createdId) return;
        openImportedDashboardViewer(router, { dashboardId: createdId });
    }, [resolveCreatedDashboardId, router]);

    const handleImportAnother = useCallback(() => {
        resetWizardData();
    }, [resetWizardData]);

    useEffect(() => {
        resetWizardActions();
    }, [resetWizardActions]);

    const panelMeta =
        panelCount != null
            ? `${panelCount} panel${panelCount === 1 ? '' : 'es'}`
            : 'Sin paneles';

    const primaryDisabled =
        permissionsLoading ||
        Boolean(permissionsError) ||
        wizardData.isCreating ||
        (successResult && !wizardData.result?.dashboardId) ||
        (!successResult && !prerequisitesOk);

    const renderAlerts = () => (
        <Stack spacing={1.5}>
            {permissionsError && (
                <Alert severity="error" icon={<WarningAmberRoundedIcon />} sx={{ borderRadius: 2 }}>
                    <AlertTitle>Permisos</AlertTitle>
                    {permissionsError}
                </Alert>
            )}
            {!source?.instance_id && source?.id && !successResult && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    <AlertTitle>Fuente incompleta</AlertTitle>
                    La fuente seleccionada no tiene instance_id. Vuelve al paso anterior y elige otra fuente.
                </Alert>
            )}
            {createError && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    <AlertTitle>Error al importar</AlertTitle>
                    {createError}
                </Alert>
            )}
            {successResult && (
                <Alert severity="success" icon={<CheckCircleOutlineIcon />} sx={{ borderRadius: 2 }}>
                    <AlertTitle>Importación completada</AlertTitle>
                    Se importó el tablero{' '}
                    <strong>{wizardData.result?.dashboardName || dashboardName}</strong> correctamente.
                </Alert>
            )}
        </Stack>
    );

    if (wizardData.isCreating) {
        return (
            <Stack
                spacing={2}
                sx={{
                    width: '100%',
                    maxWidth: '100%',
                    flex: 1,
                    minHeight: 0,
                    height: '100%',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Box
                    sx={{
                        flex: '1 1 auto',
                        minHeight: 0,
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        boxSizing: 'border-box',
                        px: 0.5
                    }}
                >
                    <ImportWizardLoadingAnimation {...dashboardCreatingLoadingProps} />
                </Box>

                <Box sx={{ ...WIZARD_FOOTER_WRAPPER_SX, mt: 'auto', flexShrink: 0 }}>
                    <ImportWizardFooter
                        showBack
                        backLabel="Volver"
                        onBack={() => prevStep()}
                        backDisabled
                        continueLabel="Importando tablero..."
                        onContinue={runCreate}
                        continueDisabled
                        continueLoading
                    />
                </Box>
            </Stack>
        );
    }

    return (
        <Stack
            spacing={2}
            sx={{
                width: '100%',
                maxWidth: '100%',
                flex: 1,
                minHeight: 0,
                height: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                pb: 0
            }}
        >
            <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ flexShrink: 0 }}>
                <Box
                    sx={(theme) => ({
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        flexShrink: 0,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: alpha(theme.palette.primary.main, 0.12)
                    })}
                >
                    <DashboardCustomizeOutlinedIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                        variant="caption"
                        color="primary"
                        sx={{ fontWeight: 800, letterSpacing: '0.08em', display: 'block' }}
                    >
                        PASO 4 DE 4 · CASI LISTO
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, color: 'text.primary', mt: 0.25 }}>
                        {successResult ? 'Tablero importado' : 'Resumen'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, mt: 0.4, lineHeight: 1.45 }}>
                        {successResult
                            ? 'Tu tablero está listo. Visualízalo o ábrelo en el editor para seguir configurándolo.'
                            : 'Revisa los datos antes de importar el tablero en tu proyecto.'}
                    </Typography>
                </Box>
            </Stack>

            {permissionsLoading && (
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexShrink: 0 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                        Preparando permisos de la carpeta...
                    </Typography>
                </Stack>
            )}

            {renderAlerts()}

            <Box
                sx={{
                    flex: '1 1 auto',
                    minHeight: 0,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    gap: 2,
                    pt: { xs: 0.5, md: 1 }
                }}
            >
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1.5}
                    sx={{
                        width: '100%',
                        alignItems: 'stretch'
                    }}
                >
                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex' }}>
                        <ImportSummaryMiniCard
                            icon={DashboardCustomizeOutlinedIcon}
                            label="Tablero"
                            value={successResult ? wizardData.result?.dashboardName || dashboardName : dashboardName}
                            meta={panelMeta}
                        />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex' }}>
                        <ImportSummaryMiniCard
                            icon={FolderOutlinedIcon}
                            label="Destino"
                            value={destination?.folderName || 'Sin carpeta'}
                            meta={destinationMeta || 'Sin ruta'}
                        />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex' }}>
                        <ImportSummaryMiniCard
                            icon={StorageOutlinedIcon}
                            label="Fuente de datos"
                            value={sourceDisplayName}
                            meta={sourceMeta}
                        />
                    </Box>
                </Stack>

                <ImportSummaryValidations items={validationItems} />
            </Box>

            <Box sx={{ ...WIZARD_FOOTER_WRAPPER_SX, mt: 'auto', flexShrink: 0 }}>
                <ImportWizardFooter
                    showBack
                    backLabel={successResult ? 'Importar otro tablero' : 'Volver'}
                    onBack={successResult ? handleImportAnother : () => prevStep()}
                    backDisabled={wizardData.isCreating}
                    showSecondaryContinue={successResult}
                    secondaryContinueLabel="Ver tablero"
                    onSecondaryContinue={handleOpenDashboardViewer}
                    secondaryContinueDisabled={primaryDisabled || permissionsLoading}
                    continueLabel={
                        wizardData.isCreating
                            ? 'Importando tablero...'
                            : successResult
                              ? 'Editar tablero'
                              : 'Importar tablero'
                    }
                    onContinue={successResult ? handleOpenDashboardEditor : runCreate}
                    continueDisabled={primaryDisabled || permissionsLoading}
                    continueLoading={wizardData.isCreating}
                />
            </Box>
        </Stack>
    );
}
