import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Breadcrumbs,
  CircularProgress,
  Divider,
  InputAdornment,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import { pushNotification } from "@redux/actions";
import useOtherDashboards from "../hooks/useOtherDashboards";
import { handleUpdateDashboardCategories } from "../../Dashboard/shared/utils/dashboardActions";

const DEFAULT_LIMIT = 8;

const isDashboardActive = (dashboard) =>
  Boolean(
    dashboard?.is_published ??
      dashboard?.published ??
      dashboard?.is_active ??
      dashboard?.active,
  );

const DashboardCard = ({ dashboard, onSelect, isAssigning }) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const active = isDashboardActive(dashboard);

  return (
    <Paper
      component="button"
      type="button"
      disabled={isAssigning}
      onClick={() => onSelect(dashboard)}
      sx={{
        width: "100%",
        display: "block",
        p: 1.25,
        textAlign: "left",
        color: "inherit",
        backgroundColor: alpha(primary, 0.04),
        border: `1px solid ${alpha(primary, 0.15)}`,
        borderRadius: 2,
        cursor: isAssigning ? "wait" : "pointer",
        opacity: isAssigning ? 0.7 : 1,
        transition:
          "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
        "&:hover": {
          borderColor: primary,
          backgroundColor: alpha(primary, 0.08),
          boxShadow: 1,
        },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: primary,
          outlineOffset: 2,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, overflow: "hidden" }}>
          <DashboardRounded sx={{ fontSize: 16, color: primary, flexShrink: 0 }} />
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              fontSize: 12,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {dashboard.name || "Tablero sin nombre"}
          </Typography>
        </Box>

        {isAssigning ? (
          <CircularProgress size={14} sx={{ color: primary }} />
        ) : (
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              flexShrink: 0,
              bgcolor: active ? "success.main" : "text.disabled",
            }}
          />
        )}
      </Box>
    </Paper>
  );
};

const DashboardSidebarPanel = ({
  currentDashboard,
  userToken,
  onSelectDashboard,
  limit = DEFAULT_LIMIT,
}) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const storeToken = useSelector((state) => state.user?.[0]?.userID);
  const resolvedUserToken = userToken ?? storeToken;

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [assigningId, setAssigningId] = useState(null);

  const { dashboards, totalCount, isLoading, isError } = useOtherDashboards({
    userToken: resolvedUserToken,
    currentDashboard,
    searchTerm,
    page,
    limit,
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleSelectDashboard = async (dashboard) => {
    const dashboardId = dashboard?.id ?? dashboard?.dashboard_id;
    if (!dashboardId) return;

    const currentCategories = Array.isArray(currentDashboard?.categories)
      ? currentDashboard.categories
      : [];

    if (currentCategories.length === 0) {
      dispatch(
        pushNotification({
          msg: "No se pueden vincular tableros: el tablero actual no tiene etiquetas asignadas.",
          status: "warn",
        }),
      );
      return;
    }

    // Merge existing categories with current categories, avoiding duplicates
    const existingCategories = Array.isArray(dashboard?.categories)
      ? dashboard.categories
      : [];

    const combinedMap = new Map();
    [...existingCategories, ...currentCategories].forEach((cat) => {
      const key = cat?.id ?? cat?.name;
      if (key) combinedMap.set(String(key), cat);
    });

    const combinedCategories = [...combinedMap.values()];
    const category_ids = combinedCategories.map((cat) => cat.id).filter(Boolean);
    const category_names = combinedCategories.map((cat) => cat.name).filter(Boolean);

    setAssigningId(dashboardId);

    try {
      await handleUpdateDashboardCategories(
        dashboardId,
        { category_ids, category_names },
        resolvedUserToken,
      );

      dispatch(
        pushNotification({
          msg: "Etiqueta asignada y tablero vinculado correctamente.",
          status: "ok",
        }),
      );

      await queryClient.invalidateQueries();

      if (onSelectDashboard) {
        onSelectDashboard(dashboardId);
      } else {
        router.push(`/dashboard/${dashboardId}`);
      }
    } catch (error) {
      console.error("Error al asignar categoría al tablero:", error);
      dispatch(
        pushNotification({
          msg: error?.message || "No se pudo vincular el tablero.",
          status: "err",
        }),
      );
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: 2,
        bgcolor: "background.paper",
      }}
    >
      <Typography color="text.primary" sx={{ fontWeight: 600 }}>
        Tableros
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ pt: 0.5, pr: 1, fontSize:"12px" }}>
        Vincula tableros al grupo actual
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ pt: 0.5, pr: 1, fontSize:"12px" }}>
          Total Tableros
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            fontSize: 11,
            color: "text.secondary",
            bgcolor: alpha(primary, 0.1),
            px: 1,
            py: 0.25,
            borderRadius: 10,
          }}
        >
          {totalCount}
        </Typography>
      </Box>

      <TextField
        fullWidth
        size="small"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Buscar tableros..."
        autoComplete="off"
        slotProps={{
          htmlInput: {
            autoComplete: "off",
            name: "dashboard-sidebar-search",
          },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded sx={{ fontSize: 16, color: "text.secondary" }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          mb: 2,
          flexShrink: 0,
          "& .MuiOutlinedInput-root": {
            height: 32,
            borderRadius: 2,
            bgcolor: "#fff",
            fontSize: 12,
          },
          "& input": {
            fontSize: 12,
            py: 0,
          },
        }}
      />

      <Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
        {isLoading ? (
          <Stack spacing={1}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton
                key={index}
                variant="rounded"
                height={36}
                sx={{ borderRadius: 1.5 }}
              />
            ))}
          </Stack>
        ) : isError ? (
          <Typography
            variant="body2"
            color="error"
            align="center"
            sx={{ py: 4, fontSize: 12 }}
          >
            No se pudieron cargar los tableros.
          </Typography>
        ) : dashboards.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ py: 4, fontSize: 12 }}
          >
            No se encontraron otros tableros disponibles
          </Typography>
        ) : (
          <Stack spacing={1}>
            {dashboards.map((dashboard) => (
              <DashboardCard
                key={dashboard.id ?? dashboard.dashboard_id}
                dashboard={dashboard}
                onSelect={handleSelectDashboard}
                isAssigning={
                  assigningId === (dashboard.id ?? dashboard.dashboard_id)
                }
              />
            ))}
          </Stack>
        )}
      </Box>

      {totalCount > limit && (
        <Box
          sx={{
            pt: 2,
            display: "flex",
            justifyContent: "center",
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Pagination
            count={Math.ceil(totalCount / limit)}
            page={page}
            onChange={(_, nextPage) => setPage(nextPage)}
            size="small"
            aria-label="Paginación de tableros"
            sx={{
              "& .MuiPaginationItem-root": {
                fontSize: 11,
                minWidth: 24,
                height: 24,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default DashboardSidebarPanel;


