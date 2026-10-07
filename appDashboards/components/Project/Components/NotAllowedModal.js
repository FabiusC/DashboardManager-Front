import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Fade,
    Button,
    useTheme,
    alpha,
} from '@mui/material';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

const NotAllowedModal = ({ 
    open,
    onClose, 
    selectedItem, 
    context
}) => {
    const theme = useTheme();
        
    if (!selectedItem) return null;

    if (!open) return null;

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
                    <>
                        {/* Contenido */}
                        <Box sx={{ p: 3 }}>
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

                            {/* Mensaje de advertencia/confirmación */}
                            <Box sx={{ 
                                p: 2, 
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                borderRadius: 1.5,
                                borderLeft: `3px solid ${theme.palette.primary.main}`,
                                mb: 3
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <BlockRoundedIcon sx={{ fontSize: 30, color: theme.palette.error.main }} />
                                    <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.875rem', lineHeight: 1.5 }}>
                                        {'Acceso restringido. Su nivel de acceso no le permite editar o eliminar este ' + context.label + '.'}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Botones de acción */}
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
                        </Box>
                    </>
                </Paper>
            </Box>
        </Fade>
    );
};

export default NotAllowedModal;