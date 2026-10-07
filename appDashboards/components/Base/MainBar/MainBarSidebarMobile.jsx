import React from 'react';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import SidebarHeader from './SidebarHeader';
import MainBarNavList from './MainBarNavList';

const drawerPaperSx = {
    '& .MuiDrawer-paper': {
        width: 280,
        backgroundColor: (theme) => theme.palette.primary.main,
        top: 0,
        height: '100vh',
        minHeight: '100vh',
    },
    '& .MuiListItemIcon-root': { color: '#fff !important', fill: '#fff !important' },
    '& .MuiListItemText-primary': { color: '#fff' },
    '& .MuiListItemButton .MuiSvgIcon-root, & .MuiListItemIcon-root .MuiSvgIcon-root': {
        color: '#fff !important',
        fill: '#fff !important',
    },
    '& .list-item-button.selected': { backgroundColor: 'rgba(255,255,255,0.15)' },
};

/**
 * Mobile sidebar: temporary drawer, full height. Uses same SidebarHeader (open=true, onToggle=close).
 */
export default function MainBarSidebarMobile({
    open,
    onDrawerClose,
    stateDisplayOptions,
    selectedOption,
    actions,
    onOpenDisplayOption,
    onOpenUncollapse,
    onNavigate,
    options,
}) {
    return (
        <SwipeableDrawer variant="temporary" open={open} onClose={onDrawerClose} sx={drawerPaperSx}>
            <SidebarHeader open={true} onToggle={onDrawerClose} />
            <MainBarNavList
                options={options}
                stateDisplayOptions={stateDisplayOptions}
                selectedOption={selectedOption}
                openBar={true}
                actions={actions}
                onOpenDisplayOption={onOpenDisplayOption}
                onOpenUncollapse={onOpenUncollapse}
                onNavigate={onNavigate}
            />
        </SwipeableDrawer>
    );
}
