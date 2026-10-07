/*
 * MainBar styled components.
 * Sidebar: full viewport height. Header: from sidebar right edge to viewport right.
 */
import { styled } from '@mui/material/styles';
import MuiAppBar from '@mui/material/AppBar';
import MuiDrawer from '@mui/material/Drawer';

const drawerOpenedMixin = (theme, width) => ({
    width,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.standard,
    }),
    overflowX: 'hidden',
});

const drawerClosedMixin = (theme, width) => ({
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.standard,
    }),
    overflowX: 'hidden',
    width,
});

export const StyledAppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => !['open', 'drawerWidth'].includes(prop),
})(({ theme, open, drawerWidth }) => ({
    backgroundColor: 'white',
    color: theme.palette.text.primary,
    boxShadow: 'none',
    outline: 'none',
    zIndex: theme.zIndex.drawer + 1,
    top: 0,
    left: open ? drawerWidth : 0,
    width: open ? `calc(100% - ${drawerWidth}px)` : '100%',
    transition: theme.transitions.create(['left', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.standard,
    }),
}));

export const StyledSidebarDrawer = styled(MuiDrawer, {
    shouldForwardProp: (prop) => !['open', 'drawerwidthmax', 'drawerwidthmin'].includes(prop),
})(({ theme, open, drawerwidthmax, drawerwidthmin }) => {
    const openedMixin = () => drawerOpenedMixin(theme, drawerwidthmax);
    const closedMixin = () => drawerClosedMixin(theme, drawerwidthmin);
    const paperStyles = (mixin) => ({
        ...mixin,
        top: 0,
        left: 0,
        height: '100vh',
        minHeight: '100vh',
        position: 'fixed',
        borderRight: 0,
    });
    return {
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        minHeight: '100vh',
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        zIndex: theme.zIndex.drawer,
        '& .MuiPaper-root': {
            backgroundColor: theme.palette.primary.main,
            ...paperStyles(open ? openedMixin() : closedMixin()),
        },
        '& .MuiListItemIcon-root': { color: '#fff' },
        '& .MuiListItemText-primary': { color: '#fff' },
        '& .MuiListItemButton .MuiSvgIcon-root': { color: '#fff !important', fill: '#fff !important' },
        '& .MuiListItemIcon-root .MuiSvgIcon-root': { color: '#fff !important', fill: '#fff !important' },
        '& .list-item-button.selected': { backgroundColor: 'rgba(255,255,255,0.15)' },
        ...(open
            ? {
                ...openedMixin(),
                '& .MuiDrawer-paper': paperStyles(openedMixin()),
            }
            : {
                ...closedMixin(),
                '& .MuiDrawer-paper': paperStyles(closedMixin()),
            }),
    };
});
