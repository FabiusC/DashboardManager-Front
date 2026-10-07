import React from "react";
import {
  Box,
  Typography,
  Paper,
  Fade,
  Button,
  IconButton,
  useTheme,
  alpha,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";

/**
 * Confirmation dialog styled like TrashModal (overlay + Paper, header, message, actions).
 * Drop-in replacement for ConfirmationDialog in PanelsWorkspace.
 */
const ConfirmationModal = ({
  open,
  onClose,
  onConfirm,
  title = "Confirmación",
  description,
  confirmLabel = "Aceptar",
  cancelLabel = "Cancelar",
  icon,
}) => {
  const theme = useTheme();

  if (!open) return null;

  return (
    <Fade in={open} timeout={200}>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: alpha("#000", 0.4),
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1300,
          padding: 2,
        }}
        onClick={onClose}
      >
        <Paper
          elevation={0}
          onClick={(e) => e.stopPropagation()}
          sx={{
            width: { xs: "90%", sm: "440px" },
            maxWidth: "440px",
            borderRadius: 2,
            overflow: "hidden",
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 3,
              pb: 2,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1.5,
                  backgroundColor: alpha(theme.palette.warning.main, 0.12),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {icon ?? <WarningRoundedIcon sx={{ fontSize: 28, color: "warning.main" }} />}
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, fontSize: "1.125rem", lineHeight: 1.3 }}
                >
                  {title}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: "text.secondary",
                "&:hover": {
                  backgroundColor: alpha(theme.palette.action.hover, 0.5),
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ p: 3, pt: 2.5 }}>
            <Box
              sx={{
                p: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                borderRadius: 1.5,
                borderLeft: `3px solid ${theme.palette.primary.main}`,
                mb: 3,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "text.primary",
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                  textAlign: "justify",
                }}
              >
                {description}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                onClick={onClose}
                sx={{
                  minWidth: "90px",
                  borderColor: alpha(theme.palette.divider, 0.3),
                  color: "text.secondary",
                  "&:hover": {
                    borderColor: theme.palette.divider,
                    backgroundColor: alpha(theme.palette.action.hover, 0.5),
                  },
                }}
              >
                {cancelLabel}
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  onConfirm?.();
                }}
                sx={{
                  minWidth: "110px",
                  backgroundColor: theme.palette.primary.main,
                  color: "white",
                  fontWeight: 600,
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: theme.palette.primary.dark,
                    boxShadow: "none",
                  },
                }}
              >
                {confirmLabel}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Fade>
  );
};

export default ConfirmationModal;
