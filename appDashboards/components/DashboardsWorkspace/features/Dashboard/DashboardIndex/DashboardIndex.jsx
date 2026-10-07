import { useCallback, useRef, useState } from "react";
import AppsIcon from "@mui/icons-material/Apps";
import { Box, IconButton, Popover, Tooltip, alpha, useTheme } from "@mui/material";
import DashboardIndexPanel from "./components/DashboardIndexPanel";

const DashboardIndex = ({ currentDashboardId, embedded = false, renderTrigger }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const handleClose = useCallback(() => setOpen(false), []);
  const handleToggle = useCallback(() => setOpen((prev) => !prev), []);

  return (
    <Box
      ref={anchorRef}
      sx={{
        display: renderTrigger ? "block" : "inline-flex",
        width: renderTrigger ? "100%" : undefined,
        minWidth: 0,
      }}
    >
      {renderTrigger ? (
        renderTrigger({ open, onToggle: handleToggle, onClose: handleClose })
      ) : (
        <Tooltip title="Índice de Tableros" arrow>
          <IconButton
            onClick={handleToggle}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-label="Abrir índice de tableros"
            sx={{
              bgcolor: "transparent",
              color: theme.palette.primary.main,
              border: embedded ? "none" : `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              width: 36,
              height: 36,
              p: 0,
              borderRadius: 999,
              boxShadow: embedded ? "none" : `0 6px 16px ${alpha(theme.palette.primary.main, 0.1)}`,
              transition: "background-color 180ms ease, transform 180ms ease",
              "&:hover": {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                border: embedded
                  ? "none"
                  : `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              },
            }}
          >
            <AppsIcon sx={{ fontSize: 20, transition: "transform 180ms ease" }} />
          </IconButton>
        </Tooltip>
      )}

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: { xs: "calc(100vw - 32px)", sm: 640, md: 800, lg: 920 },
              maxWidth: "calc(100vw - 32px)",
              maxHeight: "min(80vh, calc(100dvh - 32px))",
              display: "flex",
              flexDirection: "column",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              boxShadow: "0 8px 32px rgba(15, 23, 42, 0.08)",
              overflow: "hidden",
            },
          },
        }}
      >
        <DashboardIndexPanel
          open={open}
          currentDashboardId={currentDashboardId}
          onClose={handleClose}
        />
      </Popover>
    </Box>
  );
};

export default DashboardIndex;
