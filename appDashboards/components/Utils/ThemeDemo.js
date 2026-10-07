import React, { useState } from 'react';
import { Box, Button, Typography, Paper, IconButton } from '@mui/material';
import { Palette as PaletteIcon } from '@mui/icons-material';
import useOrganizationTheme from '../../hooks/useOrganizationTheme';

/**
 * ThemeDemo - Componente de demostración para probar diferentes temas
 * Útil para desarrollo y testing de personalización por organización
 */
const ThemeDemo = () => {
    const { applyTheme, resetTheme } = useOrganizationTheme();
    const [isOpen, setIsOpen] = useState(false);

    const themes = [
        {
            name: 'Por Defecto (Rojo)',
            colors: {
                primaryColor: '#9f2323',
                secondaryColor: '#6c757d',
            }
        },
        {
            name: 'Azul Corporativo',
            colors: {
                primaryColor: '#1976d2',
                secondaryColor: '#0d47a1',
                hoverSurfaceColor: 'rgba(25, 118, 210, 0.04)',
            }
        },
        {
            name: 'Verde Natural',
            colors: {
                primaryColor: '#388e3c',
                secondaryColor: '#1b5e20',
                hoverSurfaceColor: 'rgba(56, 142, 60, 0.04)',
            }
        },
        {
            name: 'Púrpura Creativo',
            colors: {
                primaryColor: '#7b1fa2',
                secondaryColor: '#4a148c',
                hoverSurfaceColor: 'rgba(123, 31, 162, 0.04)',
            }
        },
        {
            name: 'Naranja Energético',
            colors: {
                primaryColor: '#f57c00',
                secondaryColor: '#e65100',
                hoverSurfaceColor: 'rgba(245, 124, 0, 0.04)',
            }
        },
        {
            name: 'Rosa Moderno',
            colors: {
                primaryColor: '#e91e63',
                secondaryColor: '#c2185b',
                hoverSurfaceColor: 'rgba(233, 30, 99, 0.04)',
            }
        },
    ];

    if (!isOpen) {
        return (
            <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
                <IconButton
                    onClick={() => setIsOpen(true)}
                    sx={{
                        backgroundColor: 'white',
                        boxShadow: 3,
                        '&:hover': { backgroundColor: '#f5f5f5' }
                    }}
                >
                    <PaletteIcon />
                </IconButton>
            </Box>
        );
    }

    return (
        <Paper
            sx={{
                position: 'fixed',
                bottom: 20,
                right: 20,
                zIndex: 9999,
                p: 2,
                width: 300,
                maxHeight: 500,
                overflow: 'auto',
                boxShadow: 6,
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
                    🎨 Temas Disponibles
                </Typography>
                <Button size="small" onClick={() => setIsOpen(false)}>
                    Cerrar
                </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {themes.map((theme, index) => (
                    <Button
                        key={index}
                        variant="outlined"
                        onClick={() => applyTheme(theme.colors)}
                        sx={{
                            justifyContent: 'flex-start',
                            textAlign: 'left',
                            textTransform: 'none',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            <Box
                                sx={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: '4px',
                                    backgroundColor: theme.colors.primaryColor,
                                    border: '1px solid #e0e0e0',
                                }}
                            />
                            <Typography variant="body2">{theme.name}</Typography>
                        </Box>
                    </Button>
                ))}

                <Button
                    variant="contained"
                    onClick={resetTheme}
                    sx={{ mt: 1 }}
                >
                    Resetear a Por Defecto
                </Button>
            </Box>

            <Box sx={{ mt: 2, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontSize: '11px', color: '#666' }}>
                    💡 <strong>Tip:</strong> Los cambios se aplican inmediatamente a toda la UI de IFindit.
                </Typography>
            </Box>
        </Paper>
    );
};

export default ThemeDemo;
