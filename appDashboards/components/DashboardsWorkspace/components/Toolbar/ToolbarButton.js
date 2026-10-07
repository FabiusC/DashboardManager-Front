import { forwardRef } from "react";
import {
  Tooltip,
  CircularProgress,
  Button,
  useTheme,
  alpha,
} from "@mui/material";


const getButtonStyles = (theme, isDisabled) => ({
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
  border: isDisabled ? 'none' : '1px solid',
  borderColor: 'primary.main',
  borderRadius: '10px',
});


const ToolbarButton = forwardRef(({ action, actionKey, onClick }, ref) => {
  const theme = useTheme();
  const { label, icon, description, state } = action;
  const isDisabled = state?.isDisabled;
  const isLoading = state?.isLoading;

  const buttonStyles = getButtonStyles(theme, isDisabled);

  return (
    <Tooltip title={description} arrow>
      <Button
        ref={ref}
        onClick={onClick}
        disabled={isDisabled}
        size="medium"
        startIcon={isLoading ? <CircularProgress size={16} /> : icon}
        sx={buttonStyles}
      >
        {label}
      </Button>
    </Tooltip>
  );
});

ToolbarButton.displayName = 'ToolbarButton';

export default ToolbarButton;

