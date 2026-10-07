import { Box } from '@mui/material';
import { useTabsNavigation } from '../hooks/useTabsNavigation';
import SideMenuItem from './SideMenuItem';
import { getContainerStyles } from './sideMenu.styles';

/**
 * Componente contenedor del SideMenu (Layout)
 */
const SideMenu = ({ tabs, changeTabSideState }) => {
  const {
    activeCount,
    totalWidth,
    handleClick,
    baseTabWidth,
    expandedWidth,
  } = useTabsNavigation(tabs, changeTabSideState);

  return (
    <Box sx={getContainerStyles(activeCount, totalWidth, baseTabWidth)}>
      {tabs.map((tab) => (
        <SideMenuItem
          key={tab.name}
          tab={tab}
          handleClick={handleClick}
          activeCount={activeCount}
          baseTabWidth={baseTabWidth}
          expandedWidth={expandedWidth}
        />
      ))}
    </Box>
  );
};

export default SideMenu;

