import React from 'react';
import { StyledSidebarDrawer } from './mainBarStyles';
import SidebarHeader from './SidebarHeader';
import MainBarNavList from './MainBarNavList';

/**
 * Desktop sidebar: full viewport height (top to bottom), permanent drawer on the left.
 * Single toggle lives in the sidebar (SidebarHeader).
 */
export default function MainBarSidebar({
    open,
    drawerwidthmax,
    drawerwidthmin,
    stateDisplayOptions,
    selectedOption,
    actions,
    onDrawerOpen,
    onDrawerClose,
    onOpenDisplayOption,
    onOpenUncollapse,
    onNavigate,
    options,
}) {
    const handleToggle = () => (open ? onDrawerClose() : onDrawerOpen());

    return (
        <StyledSidebarDrawer
            variant="permanent"
            open={open}
            drawerwidthmax={drawerwidthmax}
            drawerwidthmin={drawerwidthmin}
        >
            <SidebarHeader open={open} onToggle={handleToggle} />
            <MainBarNavList
                options={options}
                stateDisplayOptions={stateDisplayOptions}
                selectedOption={selectedOption}
                openBar={open}
                actions={actions}
                onOpenDisplayOption={onOpenDisplayOption}
                onOpenUncollapse={onOpenUncollapse}
                onNavigate={onNavigate}
            />
        </StyledSidebarDrawer>
    );
}
