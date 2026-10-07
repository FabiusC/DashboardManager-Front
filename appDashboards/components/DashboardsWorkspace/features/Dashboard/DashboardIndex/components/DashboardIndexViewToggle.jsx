import { Box, Typography, useTheme } from "@mui/material";
import { LocalOffer, ViewList } from "@mui/icons-material";
import { DASHBOARD_INDEX_VIEW } from "../services/dashboardIndexService";

const VIEW_OPTIONS = [
  { value: DASHBOARD_INDEX_VIEW.GROUPED, label: "Por etiquetas", Icon: LocalOffer },
  { value: DASHBOARD_INDEX_VIEW.ALL, label: "Todos los tableros", Icon: ViewList },
];

const DashboardIndexViewToggle = ({ value, onChange }) => {
  const theme = useTheme();
  const activeColor = theme.palette.primary.main;
  const activeContrast = theme.palette.primary.contrastText;

  return (
    <Box
      sx={{
        display: "inline-flex",
        width: { xs: "70%", sm: "auto" },
        maxWidth: "100%",
        flexWrap: { xs: "wrap", sm: "nowrap" },
        flexShrink: 0,
        p: 0.375,
        borderRadius: "999px",
        border: "1px solid #E2E8F0",
        bgcolor: "#F8FAFC",
        gap: 0.25,
      }}
    >
      {VIEW_OPTIONS.map((option) => {
        const isActive = value === option.value;
        const Icon = option.Icon;

        return (
          <Box
            key={option.value}
            component="button"
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              flexShrink: 0,
              gap: 0.5,
              border: "none",
              borderRadius: "999px",
              px: 1.25,
              py: 0.625,
              cursor: "pointer",
              bgcolor: isActive ? activeColor : "transparent",
              transition: "background-color 160ms ease",
              "&:focus-visible": {
                outline: "2px solid",
                outlineColor: activeColor,
                outlineOffset: 1,
              },
            }}
          >
            <Icon
              sx={{
                fontSize: "0.875rem",
                color: isActive ? activeContrast : "text.secondary",
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.75rem",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? activeContrast : "text.secondary",
                whiteSpace: "nowrap",
              }}
            >
              {option.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default DashboardIndexViewToggle;
