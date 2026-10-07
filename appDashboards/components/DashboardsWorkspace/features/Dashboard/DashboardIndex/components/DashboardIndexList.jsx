import { Box, Typography } from "@mui/material";
import DashboardIndexItem from "./DashboardIndexItem";

const DashboardIndexList = ({ dashboards, currentDashboardId, onSelectDashboard }) => {
  if (!dashboards.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
        No se encontraron tableros.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.25,
        mx: -0.5,
        px: 0.5,
      }}
    >
      {dashboards.map((dashboard) => (
        <DashboardIndexItem
          key={dashboard.id}
          dashboard={dashboard}
          isActive={dashboard.id === currentDashboardId}
          onSelect={onSelectDashboard}
        />
      ))}
    </Box>
  );
};

export default DashboardIndexList;
