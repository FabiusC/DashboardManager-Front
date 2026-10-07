import {
  Card,
  CardActionArea,
  CardContent,
  Paper,
  Typography,
  Avatar,
  Chip,
  useTheme,
} from "@mui/material";
import { alpha, Box, Container } from "@mui/system";
import { connect, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { clearSessionStorage } from "../../utilities/sessionStorageUtils";
import Error from "../Base/Error";
import BeatLoader from "react-spinners/BeatLoader";
import Inventory2Icon from "@mui/icons-material/Inventory2";
//======Icons======
import {
  FolderCopyRounded,
  DashboardRounded,
  FolderRounded,
  PieChartRounded,
  StarBorder,
  EventRounded,
  CalendarMonth,
  Dashboard,
  BarChart,
} from "@mui/icons-material";

const Home = (props) => {
  const theme = useTheme();
  const primaryMain = theme.palette.primary.main;
  const [windowSize, setWindowSize] = useState(props?.dimensions?.width);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [entityData, setEntityData] = useState({
    projects: 0,
    marketplace: 0,
  });
  const [listData, setListData] = useState([]);
  const [favoriteData, setFavoriteData] = useState({
    projects: [],
    marketplace: [],
  });
  const [favoriteActive, setFavoriteActive] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const verbose = false;
  const sectionColors = {
    barColor: primaryMain,
    iconBgColor: alpha(primaryMain, 0.12),
    iconColor: primaryMain,
  };
  const handleRedirection = (path) => {
    router.push(path);
  };

  useEffect(() => {
    clearSessionStorage([
      "projectId",
      "projectName",
      "folderId",
      "folderName",
      "resourceId",
      "resourceName",
      "panelId",
    ]);
  }, []);

  useEffect(() => {
    if (
      props.user !== undefined &&
      props.user.length > 0 &&
      props.actions !== undefined &&
      Object.keys(props.actions).length > 0
    ) {
      setIsLoadingData(false);
    }
  }, [props.user, props.actions]);

  /*
    ==============================================================
    ===============ESTRUCTURAS DE DATOS===========================
    ==============================================================
    */
  const entity_icons = {
    projects: <FolderCopyRounded sx={{ fontSize: "1.5rem" }} />,
    products: <Inventory2Icon sx={{ fontSize: "1.5rem" }} />,
    reports: <CalendarMonth sx={{ fontSize: "1.5rem" }} />,
  };

  const categoryNames = {
    en: {
      projects: "projects",
      products: "Marketplace",
      reports: "Reports",
    },
    es: {
      projects: "Proyectos",
      products: "Marketplace",
      reports: "Reportes",
    },
  };
  const categoryDescriptions = {
    en: {
      projects: "Manage and track all your active projects",
      products: "Explore your available applications",
      reports: "Manage your scheduled reports",
    },
    es: {
      projects: "Gestiona y supervisa todos tus proyectos activos",
      products: "Explora tus aplicativos disponibles",
      reports: "Gestiona tus reportes programados",
    },
  };
  const actions = {
    projects: "__general__projects",
    products: "__general__products",
    reports: "__general__reports",
  };
  const dateStr = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  if (
    props.user !== undefined &&
    windowSize !== undefined &&
    "__general__home" in props.actions
  ) {
    return (
      <Container
        maxWidth={false}
        sx={{
          p: { xs: 2, sm: 6 },
          marginTop: { xs: 0, sm: 4 },
          maxWidth: "1400px",
          height: { xs: "100vh", sm: "80vh" },
          backgroundColor: "white",
          borderRadius: 3,
          overflowY: "auto",
          "&.MuiContainer-root": {
            px: { xs: 2, sm: 6 },
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Header */}
          <Box
            sx={{
              borderRadius: "8px",
              p: 1.8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
              backgroundColor: "primary.main",
              color: "primary.contrastText",
              mb: 1,
            }}
          >
            <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>
              <Typography
                component="h1"
                sx={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  lineHeight: 1.3,
                }}
              >
                Bienvenido,{" "}
                <Box component="span" sx={{ fontWeight: 700, opacity: 1 }}>
                  {props.user?.[0]?.userData?.username || "Usuario"}
                </Box>
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                  color: "primary.contrastText",
                  mt: 0.5,
                }}
              >
                Estás en la organización{" "}
                <Box
                  component="span"
                  sx={{ fontWeight: 600, color: "primary.contrastText" }}
                >
                  {props.organization?.[0]?.name || "Tu organización"}
                </Box>
                {" · "}
                Hoy es {dateStr}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box
              sx={{
                width: 4,
                borderRadius: 1,
                flexShrink: 0,
                alignSelf: "stretch",
                minHeight: 48,
                backgroundColor: "primary.main",
              }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "text.primary" }}
              >
                Funcionalidades disponibles
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Configura fácilmente las diferentes funcionalidades de tu
                producto
              </Typography>
            </Box>
          </Box>
          {/* Grid de Cards */}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 3.5,
            }}
          >
            {Object.entries(actions).map(
              ([key]) =>
                actions[key] in props.actions && (
                  <Card
                    key={key}
                    sx={{
                      position: "relative",
                      width: "100%",
                      borderRadius: 3,
                      boxShadow:
                        "0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
                      backgroundColor: "background.paper",
                      overflow: "hidden",
                      transition: "all 0.35s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() => handleRedirection(`/${key}`)}
                    >
                      <CardContent
                        sx={{
                          display: "flex",
                          position: "relative",
                          alignItems: "flex-start",
                          p: 3,
                          pb: 2,
                          gap: 2,
                        }}
                      >
                        {/* Avatar cuadrado redondeado */}
                        <Avatar
                          variant="rounded"
                          sx={{
                            backgroundColor: sectionColors.iconBgColor,
                            color: sectionColors.iconColor,
                            width: 52,
                            height: 52,
                            borderRadius: 2.5,
                            fontSize: "1.6rem",
                            flexShrink: 0,
                            transition: "transform 0.3s ease",
                            ".MuiCardActionArea-root:hover &": {
                              transform: "scale(1.08)",
                            },
                          }}
                        >
                          {entity_icons[key]}
                        </Avatar>

                        {/* Texto */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              position: "relative",
                              fontWeight: 700,
                              fontSize: "1.05rem",
                              color: "text.primary",
                              lineHeight: 1.3,
                              transition: "color 0.3s ease",
                              ".MuiCardActionArea-root:hover &": {
                                color: "primary.main",
                              },
                            }}
                          >
                            {categoryNames["es"][key]}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              position: "relative",
                              mt: 0.5,
                              fontSize: "0.82rem",
                              lineHeight: 1.5,
                            }}
                          >
                            {categoryDescriptions?.["es"]?.[key] ||
                              "Accede y gestiona este módulo"}
                          </Typography>
                        </Box>
                      </CardContent>

                      {/* Footer fecha */}
                      <Box
                        sx={{
                          position: "relative",
                          mx: 3,
                          mb: 2,
                          pt: 1.5,
                          borderTop: "1px solid",
                          borderColor: "divider",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                        }}
                      >
                        <EventRounded
                          sx={{ fontSize: "0.8rem", color: "text.secondary" }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Actualizado:{" "}
                          {new Date().toLocaleDateString("es-CO", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </Typography>
                      </Box>
                    </CardActionArea>
                  </Card>
                ),
            )}
          </Box>
        </Box>
      </Container>
    );
  } else if (!isLoadingData && !("__general__home" in props.actions)) {
    return (
      <Box className="pad_40" style={{ minHeight: "50vh" }}>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ textAlign: "center", fontWeight: "500", marginBottom: "10px" }}
        >
          <Error message="Credenciales no válidas para acceder a la página de inicio." />
        </Typography>
      </Box>
    );
  } else {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          height: "80vh",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          backgroundColor="F3F3F3"
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={staticPrefix + "/img/logocreangel.png"}
              height="60"
              alt="logo creangel"
            />
            <BeatLoader size={20} color="#0C419A" />
            <Typography
              variant="h4"
              color="textPrimary"
              align="center"
              style={{ marginTop: "20px" }}
            >
              Cargando...
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }
};

const mapStateToProps = (state) => {
  return {
    organization: state.organization,
    user: state.user,
    dimensions: state.dimensions,
    actions: state.actions,
  };
};

export default connect(mapStateToProps)(Home);
