import { useMemo, useCallback, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import {
  ArrowBack,
  Menu as MenuIcon,
  Download as DownloadIcon,
  PictureAsPdf,
  TableView,
  GridOn,
  DataObject,
  Image as ImageIcon,
  CalendarMonth,
  AutoAwesome,
  Apps,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  alpha,
  useTheme,
  Tooltip,
  IconButton,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  CircularProgress,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
} from "@mui/material";
import ActionsToolbar from "@components/DashboardsWorkspace/components/Toolbar/ActionsToolbar";
// import { DashboardSearch } from "@components/DashboardsWorkspace/features/Dashboard/shared/components/DashboardSearch";
import DatasourceInformation from "@components/DashboardsWorkspace/components/DatasourceInformation/DatasourceInformation";
import { useFilterCleanup } from "@raiz/hooks/useFilterCleanup";
import { exportElementToPDF } from "../utils/pdfExport";
import DashboardIndex from "@components/DashboardsWorkspace/features/Dashboard/DashboardIndex/DashboardIndex";
const DownloadMenu = ({ isDownloading, onDownload, compact = false }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleActionClick = (format) => {
    handleMenuClose();
    if (onDownload) {
      onDownload(format);
    }
  };

  return (
    <>
      <Tooltip title="Descargar Tablero" arrow>
        <IconButton
          id="download-dashboard-button"
          onClick={handleMenuOpen}
          disabled={isDownloading}
          aria-controls={menuOpen ? "download-menu-desktop" : undefined}
          aria-haspopup="true"
          aria-expanded={menuOpen ? "true" : undefined}
          sx={{
            bgcolor: "transparent",
            color: theme.palette.primary.main,
            border: compact
              ? "none"
              : `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            width: 36,
            height: 36,
            borderRadius: 999,
            boxShadow: compact
              ? "none"
              : `0 6px 16px ${alpha(theme.palette.primary.main, 0.1)}`,
            transition: "background-color 180ms ease, transform 180ms ease",
            "&:hover": {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              border: compact
                ? "none"
                : `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            },
          }}
        >
          {isDownloading ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <DownloadIcon
              sx={{ fontSize: 20, transition: "transform 180ms ease" }}
            />
          )}
        </IconButton>
      </Tooltip>
      <Menu
        id="download-menu-desktop"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        MenuListProps={{ sx: { py: 0 } }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            minWidth: 260,
            borderRadius: 2,
            border: "1px solid #e6e8ec",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.08)",
            overflow: "hidden",
            mt: 1,
          },
        }}
      >
        <MenuItem
          disabled
          sx={{
            opacity: 1,
            pointerEvents: "none",
            bgcolor: "white",
            borderBottom: "1px solid #f0f0f0",
            pt: 2,
            pb: 1.5,
          }}
        >
          <ListItemText
            primary="Descargar Tablero"
            secondary="Selecciona el formato de salida"
            primaryTypographyProps={{
              fontWeight: 600,
              fontSize: 13,
              color: "text.secondary",
            }}
            secondaryTypographyProps={{
              fontSize: 11,
              color: "text.disabled",
              mt: 0.5,
            }}
          />
        </MenuItem>

        <MenuItem
          id="download-dashboard-format-pdf"
          onClick={() => handleActionClick("pdf")}
          sx={{
            py: 1.5,
            px: 2,
            "&:hover": { bgcolor: "rgba(25, 118, 210, 0.04)" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <PictureAsPdf
              sx={{ fontSize: 20, color: theme.palette.primary.main }}
            />
          </ListItemIcon>
          <ListItemText
            primary="PDF"
            secondary="Documento en formato portátil (.pdf)"
            primaryTypographyProps={{
              fontWeight: 600,
              fontSize: 13,
              color: "text.primary",
            }}
            secondaryTypographyProps={{
              fontSize: 11,
              color: "text.secondary",
              mt: 0.2,
            }}
          />
        </MenuItem>
      </Menu>
    </>
  );
};
const MobileDrawer = ({
  open,
  onClose,
  actions,
  isDownloading,
  onDownload,
  showDashboardDownload = true,
  showDashboardIndex = false,
  currentDashboardId,
}) => {
  const theme = useTheme();

  const handleDownloadClick = (format) => {
    onClose();
    if (onDownload) onDownload(format);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: "100%", maxWidth: 320 } }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "flex-start",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <IconButton onClick={onClose}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" sx={{ ml: 2, alignSelf: "center" }}>
          Acciones
        </Typography>
      </Box>
      <List sx={{ px: 1, pt: 2 }}>
        {showDashboardIndex && (
          <>
            <ListItem disablePadding sx={{ mb: 1 }}>
              <DashboardIndex
                currentDashboardId={currentDashboardId}
                renderTrigger={({ open, onToggle }) => (
                  <ListItemButton
                    onClick={onToggle}
                    selected={open}
                    sx={{ borderRadius: 2 }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: theme.palette.primary.main,
                          color: "white",
                          width: 40,
                          height: 40,
                        }}
                      >
                        <Apps />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Índice de tableros"
                      secondary="Ver todos los tableros disponibles"
                      primaryTypographyProps={{
                        color: "text.primary",
                        variant: "body1",
                        fontWeight: 500,
                      }}
                    />
                  </ListItemButton>
                )}
              />
            </ListItem>
            <Divider sx={{ my: 1, opacity: 0.5 }} />
          </>
        )}

        {showDashboardDownload && (
          <>
            <ListItem disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                disabled={isDownloading}
                onClick={() => handleDownloadClick("pdf")}
                sx={{ borderRadius: 2 }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      color: "white",
                      width: 40,
                      height: 40,
                    }}
                  >
                    {isDownloading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <PictureAsPdf />
                    )}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Descargar PDF"
                  secondary="Documento en formato portátil"
                  primaryTypographyProps={{
                    color: "text.primary",
                    variant: "body1",
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            </ListItem>

            <Divider sx={{ my: 1, opacity: 0.5 }} />
          </>
        )}

        {Object.values(actions).map((actionObj, index) => (
          <ListItem disablePadding key={index} sx={{ mb: 1 }}>
            <ListItemButton
              disabled={actionObj.state?.isDisabled}
              onClick={() => {
                if (actionObj.action) actionObj.action();
                onClose();
              }}
              sx={{ borderRadius: 2 }}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: "white",
                    width: 40,
                    height: 40,
                  }}
                >
                  {actionObj.icon}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={actionObj.label}
                primaryTypographyProps={{
                  color: "text.primary",
                  variant: "body1",
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

const Header = ({
  dashboard,
  isReadOnly,
  actions,
  id,
  handleOpenScheduleModal,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const isAuthenticatedViewer = useSelector(
    (state) =>
      Array.isArray(state.user) &&
      state.user.length > 0 &&
      !!state.user[0]?.userID,
  );
  const organization = useSelector((state) => state.organization?.[0]);
  const organizationAlias = organization?.alias ?? organization?.name ?? "";
  const organizationLogo = organization?.logo1;
  const { clearFiltersSafely } = useFilterCleanup();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const nowDate = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  const hasDashboard = Object.keys(dashboard || {}).length > 0;
  const dashboardName =
    dashboard?.settingsChanged?.name || dashboard?.name || "";
  const showViewerTitle = isReadOnly;
  const isPublicViewer = isReadOnly && !isAuthenticatedViewer;
  const useIndex = dashboard?.settingsChanged?.use_index ?? dashboard?.use_index ?? false;
  const showDashboardIndex = useIndex && isAuthenticatedViewer && !isPublicViewer;

  const handleDownloadLogic = useCallback(
    async (format) => {
      setIsDownloading(true);
      try {
        if (format === "pdf") {
          const fileName = dashboardName || "Dashboard";
          await exportElementToPDF("dashboard-container", fileName);
        }
      } finally {
        setIsDownloading(false);
      }
    },
    [dashboardName],
  );

  const handleReturnIndex = useCallback(() => {
    clearFiltersSafely();
    sessionStorage.removeItem("resourceId");
    sessionStorage.removeItem("resourceType");
    sessionStorage.removeItem("resourceName");
    if (id) {
      if (
        sessionStorage.getItem("projectId") &&
        sessionStorage.getItem("folderId")
      ) {
        router.push("/projects/folders/resources");
      } else {
        router.push("/products");
      }
    } else {
      router.push("/projects/folders/resources");
    }
  }, [id, router, clearFiltersSafely]);

  const viewerActions = useMemo(
    () => ({
      scheduleReport: {
        name: "scheduleReport",
        label: "Programar",
        description: "Programar envío de reportes",
        icon: <CalendarMonth />,
        state: { isLoading: false, isDisabled: false, isActive: true },
        action: handleOpenScheduleModal,
      },
      return: {
        name: "returnIndex",
        label: "Volver",
        icon: <ArrowBack />,
        state: { isLoading: false, isDisabled: false, isActive: true },
        action: handleReturnIndex,
      },
    }),
    [handleReturnIndex],
  );

  const finalActions = useMemo(() => {
    if (isReadOnly) {
      if (!isAuthenticatedViewer) return {};
      return viewerActions;
    }
    return actions || {};
  }, [isReadOnly, isAuthenticatedViewer, actions, viewerActions]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        boxShadow: `0px -4px 8px 8px ${alpha(theme.palette.common.black, 0.05)}`,
        p: { xs: 1.5, lg: 2 },
        minHeight: "64px",
        width: "100%",
        bgcolor: "background.paper",
        boxSizing: "border-box",
        zIndex: 10,
        position: "relative",
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          alignItems: { xs: "stretch", lg: "center" },
          justifyContent: "space-between",
          gap: { xs: 2, lg: 2 },
          width: "100%",
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            alignItems: { xs: "flex-start", lg: "center" },
            minWidth: 0,
            flex: "1 1 auto",
            gap: { xs: 1, lg: 2 },
          }}
        >
          {isReadOnly && showViewerTitle && (
            <>
              {organizationLogo ? (
                <Box
                  component="img"
                  src={organizationLogo}
                  alt={organizationAlias}
                  sx={{
                    height: { xs: 45, lg: 64 },
                    width: "auto",
                    objectFit: "contain",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <Tooltip
                  title={organizationAlias}
                  placement="bottom-start"
                  arrow
                  enterDelay={700}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      lineHeight: 1.2,
                      fontWeight: 400,
                      color: "text.secondary",
                      fontSize: { xs: "1.2rem", lg: "1.4rem" },
                      textTransform: "uppercase",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                    }}
                  >
                    {organizationAlias}
                  </Typography>
                </Tooltip>
              )}

              {dashboardName && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.25,
                    flexGrow: 1,
                    minWidth: 0,
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      lineHeight: 1.2,
                      fontWeight: 500,
                      color: "text.primary",
                      fontSize: { xs: "1.25rem", lg: "1.5rem" },
                      textTransform: "uppercase",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                    }}
                  >
                    {dashboardName}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      opacity: 0.9,
                      mt: { xs: 0.25, lg: 0 },
                    }}
                  >
                    Última actualización: {nowDate}
                  </Typography>
                </Box>
              )}
            </>
          )}
          {!isReadOnly && dashboardName && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                borderLeft: `4px solid ${theme.palette.primary.main}`,
                borderRadius: "4px",
                py: 0.5,
                pl: 1,
                minWidth: 0,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  lineHeight: 1.2,
                  fontWeight: 700,
                  color: "text.primary",
                  fontSize: { xs: "1.25rem", lg: "1.5rem" },
                  textTransform: "uppercase",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                }}
              >
                {dashboardName}
              </Typography>
            </Box>
          )}
        </Box>

        <Box
          data-html2canvas-ignore="true"
          sx={{
            display: "flex",
            alignItems: { xs: "stretch", lg: "center" },
            flexDirection: { xs: "column", lg: "row" },
            flexShrink: 0,
            width: { xs: "100%", lg: "auto" },
            justifyContent: { xs: "flex-start", lg: "flex-end" },
            gap: { xs: 1, lg: 1.5 },
            minWidth: 0,
          }}
        >
          {/* Barra de búsqueda del tablero oculta temporalmente
          {isReadOnly && (
            <Box
              sx={{
                flexGrow: 1,
                minWidth: 0,
                width: { xs: "100%", lg: "280px" },
                transition: "all 0.3s",
              }}
            >
              <DashboardSearch />
            </Box>
          )}
          */}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "nowrap",
              justifyContent: "flex-end",
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                display: { xs: "none", lg: "flex" },
                alignItems: "center",
                gap: 0.5,
              }}
            >
              {isReadOnly ? (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      borderRadius: 999,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      overflow: "hidden",
                      bgcolor: theme.palette.background.paper,
                      height: 36,
                    }}
                  >
                    {showDashboardIndex && (
                      <>
                        <Box
                          sx={{
                            pl: 1,
                            pr: 0.25,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <DashboardIndex
                            embedded
                            currentDashboardId={id || dashboard?.id}
                          />
                        </Box>
                        <Box
                          sx={{
                            width: "1px",
                            height: 20,
                            bgcolor: alpha(theme.palette.text.primary, 0.12),
                            flexShrink: 0,
                            mx: 0.75,
                          }}
                        />
                      </>
                    )}
                    <Box
                      sx={{ px: 0.25, display: "flex", alignItems: "center" }}
                    >
                      <DownloadMenu
                        compact
                        isDownloading={isDownloading}
                        onDownload={handleDownloadLogic}
                      />
                    </Box>
                    {isAuthenticatedViewer && (
                      <>
                        <Box
                          sx={{
                            width: "1px",
                            height: 20,
                            bgcolor: alpha(theme.palette.text.primary, 0.12),
                            flexShrink: 0,
                            mx: 0.75,
                          }}
                        />

                        <Button
                          onClick={() =>
                            viewerActions.scheduleReport.action?.()
                          }
                          startIcon={viewerActions.scheduleReport.icon}
                          sx={{
                            position: "relative",
                            overflow: "hidden",
                            borderRadius: 999,
                            px: 2,
                            py: 0,
                            minHeight: 36,
                            minWidth: 0,
                            textTransform: "none",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            lineHeight: 1,
                            color: theme.palette.primary.contrastText,
                            backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(
                              theme.palette.primary.main,
                              0.85,
                            )})`,
                            boxShadow: `0 10px 18px ${alpha(theme.palette.primary.main, 0.22)}`,
                            "&:hover": { filter: "brightness(1.05)" },
                            "&:active": { transform: "scale(0.98)" },
                            "& .MuiButton-startIcon": {
                              marginLeft: 0,
                              marginRight: 0.75,
                            },
                            "& .MuiSvgIcon-root": {
                              fontSize: 18,
                            },
                          }}
                        >
                          {viewerActions.scheduleReport.label}
                        </Button>
                      </>
                    )}
                  </Box>
                  {isAuthenticatedViewer && (
                    <Button
                      onClick={() => viewerActions.return.action?.()}
                      startIcon={
                        <ArrowBack
                          sx={{
                            fontSize: 20,
                            transition: "transform 180ms ease",
                          }}
                        />
                      }
                      sx={{
                        bgcolor: "transparent",
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        borderRadius: 999,
                        textTransform: "none",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: theme.palette.primary.main,
                        px: 1.5,
                        py: 0,
                        minHeight: 36,
                        transition:
                          "background-color 180ms ease, transform 180ms ease",
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.06),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          "& .MuiSvgIcon-root": {
                            transform: "translateX(-2px)",
                          },
                        },
                      }}
                    >
                      {viewerActions.return.label}
                    </Button>
                  )}
                </>
              ) : (
                <ActionsToolbar actions={finalActions} />
              )}
            </Box>

            <Box
              sx={{display: { xs: "flex", lg: "none" }, alignItems: "center", gap: 1}}
            >
              <IconButton
                disableRipple
                onClick={() => setMobileMenuOpen(true)}
                sx={{ color: theme.palette.primary.main }}
              >
                <MenuIcon sx={{ fontSize: 30 }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>

      {!isReadOnly && hasDashboard && (
        <Box
          sx={{
            mt: 0.5,
            pt: 0.5,
            display: "flex",
            alignItems: "center",
            opacity: 0.9,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          <DatasourceInformation dashboard={dashboard} />
        </Box>
      )}

      <MobileDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        actions={finalActions}
        isDownloading={isDownloading}
        onDownload={handleDownloadLogic}
        showDashboardDownload={isReadOnly}
        showDashboardIndex={showDashboardIndex}
        currentDashboardId={id || dashboard?.id}
      />
    </Box>
  );
};

export default Header;
