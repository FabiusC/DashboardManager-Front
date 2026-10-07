import { Box, Tooltip, IconButton, Typography, useTheme } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  getItemContainerStyles,
  getItemButtonStyles,
  getButtonContentStyles,
  getChevronButtonStyles,
  getActiveContentStyles,
} from './sideMenu.styles';

/**
 * Componente para cada item del SideMenu
 * @param {Object} props - Props del componente
 * @param {Object} props.tab - Objeto con la información del tab
 * @param {Function} props.handleClick - Función para manejar los clicks
 * @param {number} props.activeCount - Número de tabs activas
 * @param {number} props.baseTabWidth - Ancho base de cada tab
 * @param {number} props.expandedWidth - Ancho expandido de cada tab
 */
const SideMenuItem = ({ tab, handleClick, activeCount, baseTabWidth, expandedWidth }) => {
  const theme = useTheme();
  const isActive = tab?.state?.isActive;
  const isDisabled = tab?.state?.isDisabled;
  const itemExpandedWidth = tab?.expandedWidth ?? expandedWidth;

  return (
    <Box
      sx={getItemContainerStyles(isActive, activeCount, baseTabWidth, itemExpandedWidth)}
    >
      <Tooltip title={!isActive ? tab.description : ""} placement="right" arrow>
        <Box
          sx={getItemButtonStyles(isActive, isDisabled, activeCount)}
          onClick={() => handleClick(tab.name, "isActive", !tab.state.isActive)}
        >
          <Box
            sx={getButtonContentStyles(isActive)}
            onClick={(e) => {
              e.stopPropagation();
              handleClick(tab.name, "isActive", !tab.state.isActive);
            }}
          >
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleClick(tab.name, "isActive", !tab.state.isActive);
              }}
              size="small"
              sx={getChevronButtonStyles(isActive)}
            >
              {isActive ? (
                <ChevronRightIcon sx={{ fontSize: "18px" }} />
              ) : (
                <ChevronLeftIcon sx={{ fontSize: "18px" }} />
              )}
            </IconButton>
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ fontSize: "14px" }}>{tab.icon}</Box>
              <Typography sx={{ fontSize: "14px", fontWeight: "bold" }}>
                {tab.label}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Tooltip>
      {isActive && (
        <Box sx={getActiveContentStyles()}>
          {tab.component}
        </Box>
      )}
    </Box>
  );
};

export default SideMenuItem;
