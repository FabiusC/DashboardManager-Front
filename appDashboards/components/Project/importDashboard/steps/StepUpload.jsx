import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Alert,
    AlertTitle,
    Box,
    Stack,
    Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { pushNotification } from '@redux/actions';
import { useWizard } from '../hooks/useWizard';
import ZipUploadDropzone from '../components/ZipUploadDropzone';
import { validateZipFile } from '../utils/fileUploadUtils';
import { handleImportDashboard } from '@components/DashboardsWorkspace/features/Dashboard/shared/utils/dashboardActions';
import { useAppId } from 'hooks/useAppId';
import { buildWizardImportPayload, parseImportUploadResponse } from '../utils/importResponse';

export default function StepUpload() {
    const {
        updateWizardActions,
        resetWizardActions,
        updateWizardData,
        nextStep
    } = useWizard();
    const dispatch = useDispatch();
    const userToken = useSelector((state) => state.user?.[0]?.userID);
    const { appId } = useAppId();

    const [selectedFile, setSelectedFile] = useState(null);
    const [isReading, setIsReading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [successText, setSuccessText] = useState('');
    const [isDragActive, setIsDragActive] = useState(false);
    const [isGlobalDragActive, setIsGlobalDragActive] = useState(false);
    const [dragError, setDragError] = useState(null);
    const [uploadError, setUploadError] = useState(null);
    const [flashSuccess, setFlashSuccess] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        let dragDepth = 0;

        const handleGlobalDragEnter = (event) => {
            if (event.dataTransfer?.types?.includes('Files')) {
                dragDepth += 1;
                setIsGlobalDragActive(true);
            }
        };

        const handleGlobalDragLeave = () => {
            dragDepth = Math.max(dragDepth - 1, 0);
            if (dragDepth === 0) setIsGlobalDragActive(false);
        };

        const handleGlobalDrop = () => {
            dragDepth = 0;
            setIsGlobalDragActive(false);
        };

        window.addEventListener('dragenter', handleGlobalDragEnter);
        window.addEventListener('dragleave', handleGlobalDragLeave);
        window.addEventListener('drop', handleGlobalDrop);

        return () => {
            window.removeEventListener('dragenter', handleGlobalDragEnter);
            window.removeEventListener('dragleave', handleGlobalDragLeave);
            window.removeEventListener('drop', handleGlobalDrop);
        };
    }, []);

    const resetUploadState = () => {
        setSelectedFile(null);
        setIsReading(false);
        setIsUploading(false);
        setSuccessText('');
        setDragError(null);
        setUploadError(null);
        setFlashSuccess(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isUploading || isReading) return;

        const file = e.dataTransfer.files?.[0];
        if (file) {
            const validation = validateZipFile(file);
            setDragError(validation.isValid ? null : validation);
        }
        setIsDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        setDragError(null);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        setDragError(null);
        if (isUploading || isReading) return;
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            selectFile(files[0]);
        }
    };

    const handleBoxClick = () => {
        if (!isUploading && !isReading) fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            selectFile(files[0]);
        }
    };

    const selectFile = (file) => {
        setUploadError(null);
        setSuccessText('');
        const validation = validateZipFile(file);

        if (!validation.isValid) {
            setSelectedFile(null);
            setUploadError(validation);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsReading(true);
        setTimeout(() => {
            setSelectedFile(file);
            setIsReading(false);
            setFlashSuccess(true);
            dispatch(pushNotification({ msg: `Archivo cargado: ${file.name}`, status: 'ok' }));
            setTimeout(() => setFlashSuccess(false), 400);
        }, 200);
    };

    const processFile = useCallback(async () => {
        if (!selectedFile) {
            setUploadError({
                title: 'Selecciona un archivo',
                description: 'Selecciona un archivo .ifz válido antes de continuar.'
            });
            return;
        }

        if (!userToken) {
            setUploadError({
                title: 'No pudimos validar tu sesión',
                description: 'Vuelve a iniciar sesión e intenta nuevamente.'
            });
            return;
        }

        setUploadError(null);
        setSuccessText('');
        setIsUploading(true);

        try {
            const result = await handleImportDashboard(selectedFile, userToken);
            const { dashboardData, datasourceGroups } = parseImportUploadResponse(result?.data);
            if (!dashboardData) {
                throw new Error('El servidor no devolvió datos válidos del tablero.');
            }
            updateWizardData({
                uploadedFile: {
                    name: selectedFile.name,
                    size: selectedFile.size
                },
                unzippedData: buildWizardImportPayload(dashboardData, datasourceGroups),
                importDestination: null,
                importDashboardSource: null,
                importDatasourceMappings: null
            });
            setSuccessText('Archivo cargado y validado con éxito. Continuando al siguiente paso...');
            setTimeout(() => {
                nextStep();
            }, 700);
        } catch (error) {
            setUploadError({
                title: 'No pudimos leer el archivo',
                description: error?.message || 'El archivo .ifz parece estar dañado o no contiene un tablero válido.'
            });
        } finally {
            setIsUploading(false);
        }
    }, [appId, nextStep, selectedFile, updateWizardData, userToken]);

    useEffect(() => {
        updateWizardActions({
            continueLabel: isUploading ? 'Cargando...' : successText ? 'Completado' : 'Continuar',
            continueDisabled: !selectedFile || isUploading || Boolean(successText),
            isLoading: isUploading,
            onContinue: processFile,
            onBack: null
        });
    }, [
        isUploading,
        processFile,
        selectedFile,
        successText,
        updateWizardActions
    ]);

    useEffect(() => {
        return () => {
            resetWizardActions();
        };
    }, [resetWizardActions]);

    return (
        <Stack
            spacing={2}
            alignItems="stretch"
            sx={{
                width: '100%',
                flex: 1,
                minHeight: 0,
                boxSizing: 'border-box',
                pb: 0
            }}
        >
            <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ flexShrink: 0 }}>
                <Box
                    sx={(theme) => ({
                        width: 46,
                        height: 46,
                        borderRadius: 2.5,
                        flexShrink: 0,
                        display: 'grid',
                        placeItems: 'center',
                        color: 'common.white',
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                        boxShadow: 'none'
                    })}
                >
                    <CloudUploadIcon sx={{ fontSize: 26 }} />
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                        variant="caption"
                        color="primary"
                        sx={{ fontWeight: 800, letterSpacing: '0.08em' }}
                    >
                        PASO 1 DE 4
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        Selecciona el archivo IFindIT-zip del tablero a importar
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                        Arrastra el archivo IFindIT-Zip (.ifz) que contiene la configuración exportada del tablero.
                        Nosotros lo descomprimiremos y validaremos por ti.
                    </Typography>
                </Box>
            </Stack>

            <Alert
                severity="info"
                icon={<InfoOutlinedIcon fontSize="small" />}
                sx={{
                    flexShrink: 0,
                    borderRadius: 2,
                    alignItems: 'center',
                    '& .MuiAlert-message': {
                        fontSize: 12
                    }
                }}
            >
                <strong>Consejo:</strong> exporta el tablero desde IFindIT para obtener un archivo .ifz listo para importar.
            </Alert>

            <Box
                sx={{
                    flex: 1,
                    width: '100%',
                    minHeight: { xs: 280, md: 360 },
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <ZipUploadDropzone
                    fillHeight
                    dragError={dragError}
                    fileInputRef={fileInputRef}
                    flashSuccess={flashSuccess}
                    isDragActive={isDragActive}
                    isGlobalDragActive={isGlobalDragActive}
                    isReading={isReading}
                    isUploading={isUploading}
                    uploadError={uploadError}
                    onChangeFile={handleFileChange}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onOpenFileDialog={handleBoxClick}
                    onRemoveFile={resetUploadState}
                    selectedFile={selectedFile}
                />
            </Box>

            {(uploadError || successText) && (
                <Stack spacing={1.5} sx={{ flexShrink: 0 }}>
                    {uploadError && (
                        <Alert
                            severity="error"
                            icon={<WarningAmberRoundedIcon />}
                            onClose={() => setUploadError(null)}
                            sx={{
                                width: '100%',
                                borderRadius: 2,
                                boxSizing: 'border-box',
                                '& .MuiAlert-message': {
                                    minWidth: 0,
                                    overflow: 'hidden'
                                }
                            }}
                        >
                            <AlertTitle sx={{ wordBreak: 'break-word' }}>{uploadError.title}</AlertTitle>
                            <Typography component="span" variant="body2" sx={{ wordBreak: 'break-word' }}>
                                {uploadError.description}
                            </Typography>
                        </Alert>
                    )}

                    {successText && (
                        <Alert severity="success" sx={{ width: '100%' }}>
                            {successText}
                        </Alert>
                    )}
                </Stack>
            )}
        </Stack>
    );
}