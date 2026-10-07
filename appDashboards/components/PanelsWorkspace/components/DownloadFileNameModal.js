import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Fade,
    Button,
    IconButton,
    useTheme,
    alpha,
    TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const DownloadFileNameModal = ({
    open,
    onClose,
    defaultFileName,
    onSubmit,
    title = 'Nombre del archivo',
    subtitle = 'Indica el nombre con el que se guardará el archivo',
}) => {
    const theme = useTheme();
    const [fileName, setFileName] = useState('');

    useEffect(() => {
        if (open && defaultFileName) {
            setFileName(defaultFileName);
        }
    }, [open, defaultFileName]);

    if (!open) return null;

    const handleSubmit = () => {
        onSubmit(fileName?.trim() || defaultFileName);
        onClose();
    };

    return (
        <Fade in={open} timeout={200}>
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: alpha('#000', 0.4),
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1300,
                    padding: 2
                }}
                elevation={0}
            >
                <Paper
                    elevation={0}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                        width: { xs: '90%', sm: '440px' },
                        maxWidth: '440px',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}
                >
                    {/* Header */}
                    <Box sx={{
                        p: 3,
                        pb: 2,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.3 }}>
                                    {title}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', mt: 0.25 }}>
                                    {subtitle}
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton
                            onClick={onClose}
                            size="small"
                            sx={{
                                color: 'text.secondary',
                                '&:hover': { backgroundColor: alpha(theme.palette.action.hover, 0.5) }
                            }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    {/* Contenido */}
                    <Box sx={{ p: 3, pt: 2.5 }}>
                        <TextField
                            autoFocus
                            fullWidth
                            label="Nombre del archivo"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            placeholder={defaultFileName}
                            variant="outlined"
                            size="small"
                            sx={{
                                mb: 3,
                                '& .MuiOutlinedInput-root': { borderRadius: 1.5 }
                            }}
                        />

                        {/* Botones de acción */}
                        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                            <Button
                                variant="text"
                                onClick={onClose}
                                sx={{
                                    minWidth: '90px',
                                    color: 'text.secondary',
                                    fontWeight: 500,
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.action.hover, 0.6),
                                        color: 'text.primary'
                                    }
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                sx={{
                                    minWidth: '110px',
                                    backgroundColor: theme.palette.primary.main,
                                    color: 'white',
                                    fontWeight: 600,
                                    boxShadow: 'none',
                                    '&:hover': {
                                        backgroundColor: theme.palette.primary.dark,
                                        boxShadow: 'none'
                                    }
                                }}
                            >
                                Descargar
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Fade>
    );
};

export default DownloadFileNameModal;
