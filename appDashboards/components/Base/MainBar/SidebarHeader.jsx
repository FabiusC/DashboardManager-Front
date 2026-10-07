import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import { useSelector } from 'react-redux';

/**
 * Single toggle in the sidebar: when closed shows open (menu) icon; when open shows "IFindIT" + close icon.
 */
export default function SidebarHeader({ open, onToggle }) {
    const organization = useSelector((state) => state.organization?.[0]);

    return (
        <Box
            component="header"
            sx={{
                minHeight: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1.5,
                py: 0.5,
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    left: 12,
                    right: 8,
                    top: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: open ? 1 : 0,
                    visibility: open ? 'visible' : 'hidden',
                    pointerEvents: open ? 'auto' : 'none'
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
                    <Typography
                        variant="h6"
                        noWrap
                        component="span"
                        sx={{
                            color: '#fff',
                            fontWeight: 400,
                            letterSpacing: '0.02em',
                            fontSize: '1.1rem',
                            textTransform: 'capitalize',
                        }}
                    >
                        {(organization?.alias)}
                    </Typography>
                    {organization?.logo2 && (
                        <Box
                            component="img"
                            src={organization.logo2}
                            alt={organization?.alias}
                            sx={{ height: 14, width: 'auto', display: 'block', mt: 0.25 }}
                        />
                    )}
                </Box>
                <IconButton
                    onClick={onToggle}
                    aria-label="Collapse sidebar"
                    size="small"
                    sx={{
                        color: 'rgba(255,255,255,0.9)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                        flexShrink: 0,
                    }}
                >
                    <ChevronLeftRounded />
                </IconButton>
            </Box>

            <Box
                sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: open ? 0 : 1,
                    visibility: open ? 'hidden' : 'visible',
                    pointerEvents: open ? 'none' : 'auto'
                }}
            >
                <IconButton
                    onClick={onToggle}
                    aria-label="Expand sidebar"
                    size="small"
                    sx={{
                        color: 'rgba(255,255,255,0.95)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)' },
                    }}
                >
                    <MenuIcon />
                </IconButton>
            </Box>
        </Box>
    );
}
