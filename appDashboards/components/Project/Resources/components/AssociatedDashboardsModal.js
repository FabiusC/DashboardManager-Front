import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Fade,
    Button,
    IconButton,
    useTheme,
    alpha,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import LinkIcon from '@mui/icons-material/Link';

const AssociatedDashboardsModal = ({ 
    open,
    onClose, 
    selectedProduct, 
    associatedDashboards = []
}) => {
    const theme = useTheme();
    
    if (!selectedProduct || !open) return null;

    const getContextLabel = () => {
        const isPanel = selectedProduct.acl_object_type === 'panel' || selectedProduct.type === 'panel';
        return isPanel ? 'Panel' : 'Dashboard';
    };

    const getContextIcon = () => {
        const isPanel = selectedProduct.acl_object_type === 'panel' || selectedProduct.type === 'panel';
        return isPanel ? <BarChartIcon sx={{ fontSize: '20px' }} /> : <DashboardIcon sx={{ fontSize: '20px' }} />;
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
                onClick={onClose}
            >
                <Paper
                    elevation={0}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                        width: { xs: '90%', sm: '540px' },
                        maxWidth: '540px',
                        maxHeight: '80vh',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        display: 'flex',
                        flexDirection: 'column'
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
                            <Box sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: alpha(theme.palette.warning.main, 0.1),
                                color: theme.palette.warning.main,
                            }}>
                                <WarningAmberRoundedIcon sx={{ fontSize: 22 }} />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.3 }}>
                                    No se puede eliminar
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
                    <Box sx={{ p: 3, pt: 2.5, flex: 1, overflowY: 'auto' }}>
                        {/* Información del producto */}
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2,
                            pt: 2,
                            pb: 2,
                            pl: 0,
                            pr: 0,
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
                                    {getContextLabel()}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Mensaje de advertencia */}
                        <Box sx={{ 
                            p: 2, 
                            backgroundColor: alpha(theme.palette.warning.main, 0.08),
                            borderRadius: 1.5,
                            borderLeft: `3px solid ${theme.palette.warning.main}`,
                            mb: 3
                        }}>
                            <Typography variant="body2" sx={{ 
                                color: 'text.primary',
                                fontSize: '0.875rem',
                                lineHeight: 1.5,
                                fontWeight: 500,
                                mb: 1
                            }}>
                                ⚠️ Este {getContextLabel().toLowerCase()} está asociado a {associatedDashboards.length} tablero(s)
                            </Typography>
                            <Typography variant="body2" sx={{ 
                                color: 'text.secondary',
                                fontSize: '0.8125rem',
                                lineHeight: 1.5
                            }}>
                                Antes de eliminarlo, debes removerlo de los siguientes dashboards:
                            </Typography>
                        </Box>

                        {/* Lista de dashboards asociados */}
                        <Box sx={{ 
                            borderRadius: 1.5,
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            overflow: 'hidden'
                        }}>
                            <List disablePadding>
                                {associatedDashboards.map((dashboard, index) => (
                                    <React.Fragment key={dashboard.id || index}>
                                        <ListItem sx={{ 
                                            py: 1.5,
                                            px: 2,
                                            '&:hover': {
                                                backgroundColor: alpha(theme.palette.action.hover, 0.3)
                                            }
                                        }}>
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                <LinkIcon sx={{ 
                                                    fontSize: '20px', 
                                                    color: theme.palette.primary.main 
                                                }} />
                                            </ListItemIcon>
                                            <ListItemText 
                                                primary={dashboard.name || dashboard.label || `Dashboard ${index + 1}`}
                                                secondary={dashboard.description || ''}
                                                primaryTypographyProps={{
                                                    variant: 'body2',
                                                    fontWeight: 500,
                                                    sx: { color: 'text.primary' }
                                                }}
                                                secondaryTypographyProps={{
                                                    variant: 'caption',
                                                    sx: { color: 'text.secondary', fontSize: '0.75rem' }
                                                }}
                                            />
                                        </ListItem>
                                        {index < associatedDashboards.length - 1 && (
                                            <Divider component="li" />
                                        )}
                                    </React.Fragment>
                                ))}
                            </List>
                        </Box>
                    </Box>

                    {/* Footer con botones */}
                    <Box sx={{ 
                        p: 3, 
                        pt: 2,
                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                        display: 'flex', 
                        gap: 1.5, 
                        justifyContent: 'flex-end' 
                    }}>
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
                            Entendido
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Fade>
    );
};

export default AssociatedDashboardsModal;

