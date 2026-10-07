import React from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Paper,
    Fade,
    Button,
    IconButton,
    useTheme,
    alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

const TrashModal = ({ 
    open,
    onClose, 
    selectedItem, 
    onTrash, 
    isLoadingTrash,
    entityName,
    context,
    trashResult
}) => {
    const theme = useTheme();
    let resultErrorMessageES = '';
        
    if (!selectedItem) return null;

    if (!open) return null;

    if (Object.keys(trashResult).length > 0 && trashResult.success === false) {
        if (trashResult.error.includes('associated with other objects')) {
            resultErrorMessageES = 'El elemento ' + context.label.toLowerCase() + ' contiene objetos asociados activos y/o en papelera, debe eliminarlos definitivamente antes de continuar';
        } else {
            resultErrorMessageES = trashResult.error;
        }
    }


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
                onClick={onClose}
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
                                    {'Enviar a papelera'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', mt: 0.25 }}>
                                    {entityName}
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
                        {/* Información del producto */}
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2,
                            borderRadius: 1.5,
                            backgroundColor: alpha(theme.palette.background.default, 0.5),
                            mb: 3
                        }}>
                            <Box sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 1.5,
                                backgroundColor: selectedItem?.color || '#1976d2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                {context.icon}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25, color: 'text.primary' }}>
                                    {selectedItem?.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Creado {moment(selectedItem?.created_at).fromNow()}
                                </Typography>
                            </Box>
                        </Box>
                        
                        {isLoadingTrash ? (
                            /* Loading State */
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '240px',
                                p: 4,
                                gap: 2
                            }}>
                                <CircularProgress 
                                    size={48} 
                                    thickness={3.5}
                                    sx={{ color: theme.palette.primary.main }} 
                                />
                                <Typography variant="body1" sx={{ 
                                    fontWeight: 500, 
                                    color: 'text.primary',
                                }}>
                                    Eliminando {context.label.toLowerCase()}...
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                {Object.keys(trashResult).length == 0 ? (
                                    <>
                                        {/* Mensaje de advertencia/confirmación */}
                                        <Box sx={{ 
                                            p: 2, 
                                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                            borderRadius: 1.5,
                                            borderLeft: `3px solid ${theme.palette.primary.main}`,
                                            mb: 3
                                        }}>
                                            <Typography variant="body2" sx={{ 
                                                color: 'text.primary',
                                                fontSize: '0.875rem',
                                                lineHeight: 1.5
                                            }}>
                                                {'⚠️ El elemento será enviado a la papelera, si desea continuar, haga clic en "Aceptar".'}
                                            </Typography>
                                        </Box>

                                        {/* Botones de acción */}
                                        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                                            <Button
                                                variant="outlined"
                                                onClick={onClose}
                                                sx={{ 
                                                    minWidth: '90px',
                                                    borderColor: alpha(theme.palette.divider, 0.3),
                                                    color: 'text.secondary',
                                                    '&:hover': {
                                                        borderColor: theme.palette.divider,
                                                        backgroundColor: alpha(theme.palette.action.hover, 0.5)
                                                    }
                                                }}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                variant="contained"
                                                onClick={() => onTrash(selectedItem)}
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
                                                Aceptar
                                            </Button>
                                        </Box>
                                    </>
                                ) : (
                                    trashResult.success === true ? (
                                        <>
                                        <Box sx={{ 
                                                p: 2, 
                                                backgroundColor: alpha(theme.palette.success.main, 0.08),
                                                borderRadius: 1.5,
                                                borderLeft: `3px solid ${theme.palette.success.main}`,
                                                mb: 3
                                            }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CheckCircleRoundedIcon sx={{ fontSize: 30, color: theme.palette.success.main }} />
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.875rem', lineHeight: 1.5 }}>
                                                        {`${selectedItem?.name} movido a la papelera exitosamente.`}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                        
                                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                            <Button
                                                variant="contained"
                                                onClick={onClose}
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
                                                {'Aceptar'}
                                            </Button>
                                        </Box>
                                        </>
                                    ) : (
                                        <>
                                            <Box sx={{ 
                                                p: 2, 
                                                backgroundColor: alpha(theme.palette.error.main, 0.08),
                                                borderRadius: 1.5,
                                                borderLeft: `3px solid ${theme.palette.error.main}`,
                                                mb: 3
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <ErrorRoundedIcon sx={{ fontSize: 30, color: theme.palette.error.main }} />
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                        <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.875rem', lineHeight: 1.5 }}>
                                                            {'Error al mover a la papelera.'}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.875rem', lineHeight: 1.5 }}>
                                                            {resultErrorMessageES + '.'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>

                                            {<Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                <Button
                                                    variant="contained"
                                                    onClick={onClose}
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
                                                    {'Entendido'}
                                                </Button>
                                            </Box>}
                                        </>
                                    )

                                )}
                            </>
                        )}
                    </Box>
                </Paper>
            </Box>
        </Fade>
    );
};

export default TrashModal;