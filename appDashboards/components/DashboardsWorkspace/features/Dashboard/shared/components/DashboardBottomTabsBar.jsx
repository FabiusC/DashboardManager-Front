import React from 'react';
import { Box, Tabs, Tab, useTheme, alpha } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';

const DashboardBottomTabsBar = ({ currentDashboardId, groupedDashboards = [], onSelectDashboard }) => {
  const theme = useTheme();

  // Ocultar si no hay tableros en el grupo o solo existe el tablero actual
  if (!groupedDashboards || groupedDashboards.length <= 1) {
    return null; 
  }

  const handleChange = (event, newValue) => {
    if (newValue !== currentDashboardId && onSelectDashboard) {
      onSelectDashboard(newValue);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
        boxShadow: `0px -4px 12px ${alpha(theme.palette.common.black, 0.05)}`,
        display: 'flex',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Tabs
        value={currentDashboardId}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        indicatorColor="primary"
        textColor="primary"
        sx={{
          minHeight: 48,
          '& .MuiTab-root': {
            minHeight: 48,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            mx: 1,
          }
        }}
      >
        {groupedDashboards.map((dashboard) => (
          <Tab
            key={dashboard.id}
            value={dashboard.id}
            label={dashboard.name || dashboard.title || 'Tablero sin nombre'}
            icon={<DashboardIcon fontSize="small" />}
            iconPosition="start"
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default DashboardBottomTabsBar;