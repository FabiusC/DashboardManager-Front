import { Box } from '@mui/material';
import useTabs from "../hooks/useTabsContext";

export default function SetupMenu(props) {
    const { tabsSetupMenu, changeSetupTabState } = useTabs();
    const expandedWidth = 300;

    return (
        <Box
            sx={{
                width: `${expandedWidth}px`,
                backgroundColor: '#ffffff',
                transition: 'width 0.3s ease-in-out',
                overflow: 'hidden'
            }}
        >
            {tabsSetupMenu.map((tab) => {
                if (tab?.state?.isActive) {
                    return (
                        <Box
                            key={tab.name}
                            sx={{
                                width: '100%',
                                height: 'auto',
                                borderRight: '1px solid #e2e8f0',
                                color: theme => theme.palette.primary.main,
                            }}
                        >
                            {tab.component && tab.component({
                                panel: props.panel,
                                user: props.user,
                                tab: tab,
                                onPanelSaved: props.onPanelSaved,
                            })}
                        </Box>
                    );
                }
            })}
        </Box>
    );
}