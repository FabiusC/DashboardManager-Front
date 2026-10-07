import { Box, Typography } from "@mui/material";
import { Check } from "@mui/icons-material";

const DashboardIndexItem = ({ dashboard, isActive, onSelect, dense = false }) => (
  <Box
    component="button"
    type="button"
    draggable
    onDragStart={(event) => {
      event.dataTransfer.setData("application/x-dashboard-id", String(dashboard.id));
      event.dataTransfer.effectAllowed = "copy";
    }}
    onClick={() => onSelect(dashboard.id)}
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 0.75,
      width: "100%",
      border: "none",
      textAlign: "left",
      cursor: "pointer",
      borderRadius: dense ? "6px" : "8px",
      px: dense ? 0.75 : 1.25,
      py: dense ? 0.5 : dashboard.group_name ? 1 : 0.875,
      minHeight: dense ? 34 : undefined,
      bgcolor: isActive ? "#F1F5F9" : "transparent",
      transition: "background-color 160ms ease",
      "&:hover": { bgcolor: isActive ? "#F1F5F9" : "#F8FAFC" },
      "&:focus-visible": {
        outline: "2px solid",
        outlineColor: "primary.main",
        outlineOffset: 1,
      },
    }}
  >
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        variant="body2"
        noWrap
        sx={{
          fontSize: dense ? "0.75rem" : "0.8125rem",
          fontWeight: isActive ? 500 : 400,
          color: "text.primary",
          lineHeight: dashboard.group_name ? 1.35 : 1.2,
        }}
      >
        {dashboard.name}
      </Typography>

      {dashboard.group_name && (
        <Typography
          variant="caption"
          noWrap
          sx={{
            display: "block",
            mt: 0.25,
            fontSize: "0.6875rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: "text.secondary",
            textTransform: "uppercase",
            lineHeight: 1.3,
          }}
        >
          {dashboard.group_name}
        </Typography>
      )}
    </Box>

    {isActive && (
      <Check sx={{ fontSize: dense ? 15 : 18, color: "text.secondary", flexShrink: 0 }} />
    )}
  </Box>
);

export default DashboardIndexItem;
