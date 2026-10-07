import React from 'react';
import {
    Box,
    Chip,
    IconButton,
    Stack,
    Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AlertCircleOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import LoopRoundedIcon from '@mui/icons-material/LoopRounded';
import UploadRoundedIcon from '@mui/icons-material/UploadRounded';
import { formatFileSize } from '../utils/fileUploadUtils';

function ProcessingStatus() {
    return (
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ width: '100%', mt: 2, minWidth: 0 }}>
            <LoopRoundedIcon
                color="primary"
                sx={{
                    fontSize: 16,
                    animation: 'zipSpin 900ms linear infinite',
                    '@keyframes zipSpin': {
                        from: { transform: 'rotate(0deg)' },
                        to: { transform: 'rotate(360deg)' }
                    }
                }}
            />
            <Typography variant="body2" color="text.secondary" noWrap>
                Procesando archivo en el servidor...
            </Typography>
        </Stack>
    );
}

function ZipUploadDropzone({
    dragError,
    fileInputRef,
    flashSuccess,
    fillHeight = false,
    isDragActive,
    isGlobalDragActive,
    isReading,
    isUploading,
    onChangeFile,
    onDragLeave,
    onDragOver,
    onDrop,
    onOpenFileDialog,
    onRemoveFile,
    selectedFile
}) {
    const hasFile = Boolean(selectedFile);
    const isActiveDrop = isDragActive || isGlobalDragActive;
    const showInvalidDrag = Boolean(dragError);

    const idleTitle = isDragActive ? 'Suelta para cargar' : 'Arrastra tu archivo .ifz aquí';
    const Icon = showInvalidDrag ? AlertCircleOutlinedIcon : isDragActive ? UploadRoundedIcon : InsertDriveFileIcon;

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: '100%',
                height: fillHeight ? '100%' : 'auto',
                flex: fillHeight ? 1 : undefined,
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box'
            }}
        >
            <input
                type="file"
                accept=".ifz"
                hidden
                ref={fileInputRef}
                onChange={onChangeFile}
            />

            {hasFile ? (
                <Box
                    sx={(theme) => ({
                        width: '100%',
                        boxSizing: 'border-box',
                        borderRadius: 3,
                        border: `1px solid ${
                            flashSuccess
                                ? alpha(theme.palette.success.main, 0.45)
                                : alpha(theme.palette.text.primary, 0.10)
                        }`,
                        p: 2,
                        opacity: isUploading ? 0.72 : 1,
                        backgroundColor: 'background.paper',
                        boxShadow: flashSuccess
                            ? `0 0 0 2px ${alpha(theme.palette.success.main, 0.28)}`
                            : 'none',
                        animation: 'fileCardEnter 200ms ease-out both',
                        transition: 'opacity 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
                        '@keyframes fileCardEnter': {
                            from: { opacity: 0, transform: 'translateY(8px)' },
                            to: { opacity: 1, transform: 'translateY(0)' }
                        }
                    })}
                >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                            sx={(theme) => ({
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                display: 'grid',
                                placeItems: 'center',
                                color: 'primary.main',
                                backgroundColor: alpha(theme.palette.primary.main, 0.10),
                                flexShrink: 0
                            })}
                        >
                            <InsertDriveFileIcon sx={{ fontSize: 28 }} />
                        </Box>

                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                                {selectedFile.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                                {selectedFile.name} · {formatFileSize(selectedFile.size)}
                            </Typography>
                        </Box>

                        <Chip
                            size="small"
                            icon={<CheckCircleRoundedIcon sx={{ fontSize: '16px !important' }} />}
                            label="Listo"
                            sx={(theme) => ({
                                borderRadius: 999,
                                color: theme.palette.success.dark,
                                backgroundColor: alpha(theme.palette.success.main, 0.10),
                                fontWeight: 700,
                                fontSize: 11
                            })}
                        />

                        <IconButton
                            size="small"
                            onClick={onRemoveFile}
                            disabled={isUploading}
                            aria-label="Quitar archivo seleccionado"
                        >
                            <CloseRoundedIcon fontSize="small" />
                        </IconButton>
                    </Stack>

                    {isUploading && <ProcessingStatus />}
                </Box>
            ) : (
                <Box
                    component="button"
                    type="button"
                    aria-label="Cargar archivo .ifz del tablero"
                    disabled={isReading}
                    onClick={onOpenFileDialog}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    sx={(theme) => ({
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                        border: '2px dashed',
                        borderColor: showInvalidDrag
                            ? 'error.main'
                            : isDragActive
                            ? 'primary.main'
                            : isActiveDrop
                            ? alpha(theme.palette.primary.main, 0.40)
                            : alpha(theme.palette.text.primary, 0.16),
                        backgroundColor: showInvalidDrag
                            ? alpha(theme.palette.error.main, 0.05)
                            : isDragActive
                            ? alpha(theme.palette.primary.main, 0.10)
                            : isActiveDrop
                            ? alpha(theme.palette.primary.main, 0.05)
                            : alpha(theme.palette.text.primary, 0.03),
                        borderStyle: isDragActive || showInvalidDrag ? 'solid' : 'dashed',
                        borderRadius: 3,
                        minHeight: fillHeight ? '100%' : { xs: 240, md: 300 },
                        height: fillHeight ? '100%' : 'auto',
                        flex: fillHeight ? 1 : undefined,
                        py: { xs: 3, md: 4 },
                        px: { xs: 2.5, md: 4 },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: showInvalidDrag ? 'not-allowed' : 'pointer',
                        color: 'inherit',
                        font: 'inherit',
                        outline: 'none',
                        boxShadow: isDragActive
                            ? `0 16px 34px ${alpha(theme.palette.primary.main, 0.14)}`
                            : 'none',
                        transform: isReading ? 'scale(0.98)' : 'scale(1)',
                        transition: 'all 180ms ease',
                        '&:focus-visible': {
                            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.22)}`
                        }
                    })}
                >
                    <Stack spacing={1.5} alignItems="center" textAlign="center">
                        <Box
                            sx={(theme) => ({
                                position: 'relative',
                                width: 50,
                                height: 50,
                                borderRadius: 3,
                                display: 'grid',
                                placeItems: 'center',
                                color: showInvalidDrag ? 'error.main' : isDragActive ? 'primary.main' : 'common.white',
                                backgroundColor: showInvalidDrag
                                    ? alpha(theme.palette.error.main, 0.10)
                                    : isDragActive
                                    ? alpha(theme.palette.primary.main, 0.12)
                                    : theme.palette.primary.main,
                                transform: isActiveDrop ? 'translateY(-2px)' : 'translateY(0)',
                                transition: 'transform 200ms ease, background-color 180ms ease',
                                '&::before': isDragActive
                                    ? {
                                        content: '""',
                                        position: 'absolute',
                                        inset: -7,
                                        borderRadius: 4,
                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.24)}`,
                                        animation: 'pulseRing 1100ms ease-out infinite'
                                    }
                                    : {},
                                '@keyframes pulseRing': {
                                    from: { opacity: 0.9, transform: 'scale(0.86)' },
                                    to: { opacity: 0, transform: 'scale(1.18)' }
                                }
                            })}
                        >
                            {isReading ? (
                                <LoopRoundedIcon
                                    sx={{
                                        fontSize: 28,
                                        animation: 'zipSpin 900ms linear infinite'
                                    }}
                                />
                            ) : (
                                <Icon sx={{ fontSize: 28 }} />
                            )}
                        </Box>

                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 800,
                                color: showInvalidDrag ? 'error.main' : isDragActive ? 'primary.main' : 'text.primary'
                            }}
                        >
                            {showInvalidDrag ? dragError.title : isReading ? 'Leyendo archivo...' : idleTitle}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            {showInvalidDrag
                                ? dragError.description
                                : isReading
                                ? 'Validando formato y tamaño del archivo.'
                                : 'o haz clic para seleccionarlo'}
                        </Typography>

                        {!showInvalidDrag && !isReading && (
                            <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8, mt: 1 }}>
                                Tamaño máximo: 50 MB
                            </Typography>
                        )}
                    </Stack>
                </Box>
            )}
        </Box>
    );
}

export default ZipUploadDropzone;
