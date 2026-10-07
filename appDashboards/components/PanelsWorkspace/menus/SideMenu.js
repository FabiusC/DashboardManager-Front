import { Box, Typography, IconButton, Tooltip, darken } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import useTabs from "../hooks/useTabsContext";

export default function SideMenu() {
    const { tabsSideMenu, changeSideTabState } = useTabs();
    
    const handleClick = (name, key, value) => {
        const selectedTab = tabsSideMenu.find((tab) => tab.name === name);
        if (selectedTab) {
            if (!selectedTab.state["isDisabled"]) {
                changeSideTabState(name, key, value);
            }
        };
    };
    const activeCount = tabsSideMenu.filter((tab) => tab?.state?.isActive).length;
    const inactiveCount = tabsSideMenu.length - activeCount;
    const baseTabWidth = 45;
    const expandedWidth = 190;
    const baseInactiveWidth = baseTabWidth * tabsSideMenu.length;
    const totalWidth = (inactiveCount * baseTabWidth) + (activeCount * expandedWidth);

    return (
        <Box
            sx={{
                width: activeCount == 0 ? `${baseTabWidth+1}px` : activeCount > 0 ? `${totalWidth}px` : baseInactiveWidth,
                backgroundColor: '#f5f5f5',
                display: 'flex',
                flexDirection: activeCount == 0 ? 'column-reverse' : 'row-reverse',
                alignItems: 'flex-start',
                justifyContent: 'flex-end',
                height: '100%',
                transition: 'width 0.3s ease-in-out',
                borderRight: activeCount == 0 ? '1px solid #e2e8f0' : 'none',
                overflow: 'hidden',
            }}
        >
            {tabsSideMenu.map((tab) => {
                const isActive   = tab?.state?.isActive;
                const isDisabled = tab?.state?.isDisabled;
                return (
                    <Box
                        key={tab.name}
                        sx={{
                            width: activeCount == 0 ? `${baseTabWidth}px` : isActive ? `${expandedWidth}px` : `${baseTabWidth}px`,
                            height: activeCount == 0 ? 'auto' : '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            backgroundColor: isActive ? '#ffffff' : 'transparent',
                            borderRight: activeCount == 0 ? 'none' : '1px solid #e2e8f0',
                            color: theme => theme.palette.primary.main,
                            overflow: 'hidden',
                        }}
                    >
                        <Tooltip title={!isActive ? tab.description : ''} placement="right" arrow>
                            <Box
                                sx={{
                                    cursor: 'pointer',
                                    writingMode: isActive ? 'horizontal-tb' : 'vertical-rl',
                                    width: isActive ? '100%' : 'auto',
                                    transform: isActive ? 'none' : 'rotate(0deg)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: isActive ? 50 : 60,
                                    paddingBottom: isActive ? 0 : 1,
                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                    opacity: isDisabled ? 0.5 : 1,
                                    '&:hover': {
                                        color: theme => darken(theme.palette.primary.main, 0.1),
                                    },
                                    borderBottom: activeCount == 0 ? '1px solid #e2e8f0' : 'none',
                                }}
                                onClick={() => handleClick(tab.name, isDisabled)}
                                disabled={isDisabled}
                            >
                                <Box
                                    sx={{
                                        width: isActive ? tab.name == "data" ? '150px' : '170px' : 'auto',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: isActive ? tab.name == "data" ? 'space-between' : 'space-around' : 'center',
                                        flexDirection: isActive ? 'row-reverse' : 'row',
                                        gap: 0.5,
                                        paddingTop: isActive ? 0 : "11px",
                                        paddingBottom: isActive ? 0 : "4px",
                                    }}
                                    onClick={() => handleClick(tab.name, "isActive", !tab.state.isActive)}
                                    disabled={isDisabled}
                                >
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleClick(tab.name, "isActive", !tab.state.isActive);
                                        }}
                                        size="small"
                                        sx={{
                                            color: isActive ? theme => theme.palette.primary.main : 'inherit',
                                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                                            opacity: isDisabled ? 0.5 : 1,
                                            '&:hover': {
                                                color: theme => theme.palette.primary.main,
                                            }
                                        }}
                                    >
                                        {isActive ? <ChevronRightIcon sx={{ fontSize: "18px" }} /> : <ChevronLeftIcon sx={{ fontSize: "18px" }} />}
                                    </IconButton>
                                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.5 }}>
                                        {<Box sx={{ fontSize: "14px" }}>{tab.icon}</Box>}
                                        <Typography sx={{ fontSize: '14px', fontWeight: 'bold' }}>{tab.label}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Tooltip>
                        {isActive && (
                            <Box sx={{ 
                                width: '100%', 
                                flex: 1,
                                display: 'flex', 
                                flexDirection: 'row', 
                                justifyContent: 'center',
                                overflow: 'auto',
                                minHeight: 0
                            }}>
                                {tab.component && tab.component()}
                            </Box>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}