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
    ClickAwayListener,
} from '@mui/material';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

const RestoreModal = ({ 
    open,
    onClose, 
    selectedProduct, 
    onRestore, 
    isLoadingRestore,
    context,
    isDelete = false,
}) => {
    const theme = useTheme();
    
    if (!selectedProduct) return null;

    const getContextLabel = () => {
        const isPanel = selectedProduct.acl_object_type === 'panel' || selectedProduct.type === 'panel';
        return isPanel ? 'Panel' : 'Dashboard';
    };

    const getContextIcon = () => {
        const isPanel = selectedProduct.acl_object_type === 'panel' || selectedProduct.type === 'panel';
        return isPanel ? <BarChartIcon sx={{ fontSize: '20px' }} /> : <DashboardIcon sx={{ fontSize: '20px' }} />;
    };

    const getActionIcon = () => {
        return isDelete ? <DeleteForeverIcon sx={{ fontSize: '28px' }} /> : <RestoreFromTrashIcon sx={{ fontSize: '28px' }} />;
    };

    const getActionText = () => {
        return isDelete ? 'Eliminar permanentemente' : 'Restaurar';
    };

    const getActionColor = () => {
        return isDelete ? theme.palette.error.main : theme.palette.primary.main;
    };

    if (!open) return null;
    
    return (
        <ClickAwayListener>
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
                    {isLoadingRestore ? (
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
                                sx={{ color: getActionColor() }} 
                            />
                            <Typography variant="body1" sx={{ 
                                fontWeight: 500, 
                                color: 'text.primary',
                            }}>
                                {isDelete ? 'Eliminando' : 'Restaurando'} {getContextLabel().toLowerCase()}...
                            </Typography>
                        </Box>
                    ) : (
                        /* Normal State */
                        <>
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
                            <Box sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: alpha(getActionColor(), 0.1),
                                color: getActionColor(),
                            }}>
                                {isDelete ? <WarningAmberRoundedIcon sx={{ fontSize: 22 }} /> : <RestoreFromTrashIcon sx={{ fontSize: 22 }} />}
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.3 }}>
                                    {isDelete ? 'Eliminar permanentemente' : 'Restaurar producto'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', mt: 0.25 }}>
                                    {selectedProduct?.name}
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
                            p: 2,
                            borderRadius: 1.5,
                            backgroundColor: alpha(theme.palette.background.default, 0.5),
                            mb: 3
                        }}>
                            <Box sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 1.5,
                                backgroundColor: selectedProduct?.color || (getContextLabel() === 'Panel' ? '#9c27b0' : '#1976d2'),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                {getContextIcon()}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25, color: 'text.primary' }}>
                                    {selectedProduct?.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {getContextLabel()} • Creado {moment(selectedProduct?.created_at).fromNow()}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Mensaje de advertencia/confirmación */}
                        <Box sx={{ 
                            p: 2, 
                            backgroundColor: alpha(getActionColor(), 0.08),
                            borderRadius: 1.5,
                            borderLeft: `3px solid ${getActionColor()}`,
                            mb: 3
                        }}>
                            <Typography variant="body2" sx={{ 
                                color: 'text.primary',
                                fontSize: '0.875rem',
                                lineHeight: 1.5
                            }}>
                                {isDelete ? 
                                    '⚠️ Esta acción es irreversible. El producto será eliminado permanentemente.' :
                                    '✓ El producto será restaurado y estará disponible nuevamente en su ubicación original.'
                                }
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
                                onClick={onRestore}
                                sx={{ 
                                    minWidth: '110px',
                                    backgroundColor: getActionColor(),
                                    color: 'white',
                                    fontWeight: 600,
                                    boxShadow: 'none',
                                    '&:hover': {
                                        backgroundColor: isDelete ? theme.palette.error.dark : theme.palette.primary.dark,
                                        boxShadow: 'none'
                                    }
                                }}
                            >
                                {isDelete ? 'Eliminar' : 'Restaurar'}
                            </Button>
                        </Box>
                    </Box>
                        </>
                    )}
                </Paper>
            </Box>
        </Fade>
        </ClickAwayListener>
            
    );
};

export default RestoreModal;
