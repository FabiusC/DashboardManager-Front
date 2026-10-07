import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Tooltip,
  CircularProgress,
  useTheme,
  alpha,
} from "@mui/material";
import { usePanelContext } from "../hooks/usePanelContext";

function PanelWorkspaceToolbar({ actions }) {
  const panel = usePanelContext();
  const buttonRefs = useRef({});
  const theme = useTheme();
  const [activeEntry, setActiveEntry] = useState(null);
  const [activeKey, setActiveKey] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);


  useEffect(() => {
    const entry = Object.entries(actions).find(
      ([, action]) => action.state?.isActive
    );
    setActiveEntry(entry);
    setActiveKey(entry?.[0] || null);
    setAnchorEl(entry ? buttonRefs.current[entry[0]] : null);
  }, [actions]);

  


  const renderActionButton = (action, key) => {
    if (panel.state.length === 0) return null;

    const isDisabled = action.state?.isDisabled;
    const isActive = activeKey === key;
    
    return (
      <Tooltip key={key} title={action.description} arrow>
        <Button
          ref={(el) => (buttonRefs.current[key] = el)}
          onClick={() => action.action()}
          disabled={isDisabled}
          size="medium"
          startIcon={
            action.state?.isLoading ? (
              <CircularProgress size={16} />
            ) : (
              action.icon
            )
          }
          sx={{
            color: isDisabled 
              ? alpha(theme.palette.text.disabled, 0.5) 
              : theme.palette.primary.main,
            backgroundColor: "white",
            textTransform: 'none',
            fontSize: '0.75rem',
            fontWeight: 500,
            padding: '4px 8px',
            minWidth: 'auto',
            '&:hover': {
              backgroundColor: isDisabled 
                ? 'transparent' 
                : alpha(theme.palette.primary.main, 0.08),
            },
            border: '1px solid ',
            borderColor: 'primary.main',
            borderRadius: '10px',
          }}
        >
          {action.label}
        </Button>
      </Tooltip>
    );
  };

  return (
    <Box>
      {Object.keys(panel).length > 0 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center', 
          gap: 0.3,
        }}>
          {Object.entries(actions).map(([key, action]) =>
            renderActionButton(action, key)
          )}
        </Box>
      )}
    </Box>
  );
}

export default PanelWorkspaceToolbar;