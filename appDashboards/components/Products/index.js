import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Star,
  StarBorder,
  DashboardRounded,
  CopyAllOutlined,
} from "@mui/icons-material";
import { connect } from "react-redux";
import {
  CustomSelect,
  Header,
  useCustomSelectControls,
  Table,
  useTableControls,
} from "@creangel/ifindit-ui";
import { useHeaderControls } from "@creangel/ifindit-ui/hooks";
import ProductCardView from "./components/ProductCardView";
import FiltersProducts from "./components/FiltersProducts";
import { useRouter } from "next/router";
import { handleGroupsList, getProductsList } from "./services/productsServices";
import { getProjectList } from "@components/Project/Project/services/Project";
import useDebounce from "hooks/useDebounce";
import { clearSessionStorage } from "../../utilities/sessionStorageUtils";
import { useAppId } from "hooks/useAppId";
import Error from "@components/Base/Error";

const Products = ({ user, organization, actions }) => {
  const router = useRouter();
  const [productsList, setProductsList] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [filters, setFilters] = useState([]);
  const [elementsPerPage, setElementsPerPage] = useState(500);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [groupsList, setGroupsList] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { appId: application_id } = useAppId();

  // Header configuration
  const headerInitialConfig = useMemo(
    () => ({
      state: {
        viewMode: { value: "large-icons" },
        sort: {
          field: sortField,
          fields: [
            { label: "Nombre", value: "name" },
            { label: "Fecha de creación", value: "created_at" },
            { label: "Última edición", value: "edited_at" },
          ],
          direction: sortDirection,
        },
        search: { value: searchTerm, placeholder: "Buscar…" },
      },
      show: { viewMode: true, search: true, sort: true },
      handlers: {
        onSearchChange: (value) => setSearchTerm(value),
        onSortChange: ({ field, direction }) => {
          setSortField(field);
          setSortDirection(direction);
        },
      },
    }),
    [sortField, sortDirection, searchTerm],
  );

  const headerState = useHeaderControls(headerInitialConfig);

  // Groups select configuration
  const groupsSelectState = useCustomSelectControls({
    state: {
      value: selectedGroup,
      search: { value: "", placeholder: "Buscar grupos" },
      options: groupsList,
      isOpen: false,
    },
    show: { field: true, dropdown: true },
    label: "Grupos",
    searchable: true,
    size: "small",
    autoWidth: true,
    handlers: {
      onChange: (value) => {
        setSelectedGroup(value);
        setSelectedProject(null); // Limpiar proyecto al cambiar grupo
      },
    },
  });

  // Projects select configuration
  const projectsSelectState = useCustomSelectControls({
    state: {
      value: selectedProject,
      search: { value: "", placeholder: "Buscar proyectos" },
      options: filteredProjects,
      isOpen: false,
    },
    show: { field: true, dropdown: true },
    label: "Proyectos",
    searchable: true,
    size: "small",
    autoWidth: true,
    handlers: {
      onChange: (value) => {
        setSelectedProject(value);
      },
    },
  });

  // Server-side search for groups
  const groupSearchTerm = groupsSelectState.state.field.search.value;
  const debouncedGroupSearch = useDebounce(groupSearchTerm, 500);

  const fetchGroups = useCallback(async () => {
    if (!user?.[0]?.userID) return;
    try {
      const data = await handleGroupsList(
        user[0].userID,
        100,
        1,
        debouncedGroupSearch,
        [],
      );
      if (data && data.status === "ok" && Array.isArray(data.results)) {
        const groups = data.results.map((group) => ({
          id: group.id,
          label: group.name,
          value: group.id,
        }));
        setGroupsList(groups);
      } else {
        console.warn("Estructura de data inválida para grupos:", data);
        setGroupsList([]);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      setGroupsList([]);
    }
  }, [user, debouncedGroupSearch]);

  useEffect(() => {
    clearSessionStorage([
      "projectId",
      "projectName",
      "folderId",
      "folderName",
      "resourceId",
      "resourceName",
      "resourceType",
      "productId",
      "productName",
      "productType",
      "groupId",
    ]);
  }, []);

  /*
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);
  */

  // Server-side search for projects
  const projectSearchTerm = projectsSelectState.state.field.search.value;
  const debouncedProjectSearch = useDebounce(projectSearchTerm, 500);

  const handleGetProjectsList = useCallback(async () => {
    if (!selectedGroup || !user?.[0]?.userID) {
      setFilteredProjects([]);
      setSelectedProject(null);
      return;
    }

    try {
      const tempSetters = {
        setProjects: (projects) => {
          const formattedProjects = projects.map((project) => ({
            id: project.id,
            label: project.name,
            value: project.id,
          }));
          setFilteredProjects(formattedProjects);
        },
      };

      await getProjectList(
        {
          projectsPerPage: 100,
          offset: 0,
          searchValue: debouncedProjectSearch,
          sortField: "name",
          sortDirection: "asc",
          userToken: user[0].userID,
          groupId: selectedGroup,
          showLoading: false,
        },
        tempSetters,
      );
    } catch (error) {
      console.error("Error fetching projects:", error);
      setFilteredProjects([]);
      setSelectedProject(null);
    }
  }, [user, selectedGroup, debouncedProjectSearch]);

  /*
  useEffect(() => {
    handleGetProjectsList();
  }, [handleGetProjectsList]);
  */

  // Fetch products list
  const handleGetProductsList = useCallback(async () => {
    const params = {
      elementsPerPage,
      offset: (currentPage - 1) * elementsPerPage,
      searchTerm: debouncedSearchTerm,
      sortField,
      sortDirection,
      userToken: user?.[0]?.userID,
      filters: [
        { field: "organization_id", value: organization?.[0]?.id },
        { field: "in_trash", value: false },
        { field: "is_product", value: true },
        { field: "application_id", value: application_id },
        ...(selectedGroup ? [{ field: "group_id", value: selectedGroup }] : []),
        ...(selectedProject
          ? [{ field: "project_id", value: selectedProject }]
          : []),
      ],
      types: ["dashboard"],
      filtered_groups: [],
      showLoading: false,
    };

    const stateSetters = {
      setIsLoadingList: () => {}, // No usamos loading aquí
      setProductsList,
      setTotalProducts,
    };

    const { results, count } = await getProductsList(params, stateSetters);
  }, [
    user,
    organization,
    elementsPerPage,
    currentPage,
    debouncedSearchTerm,
    sortField,
    sortDirection,
    selectedGroup,
    selectedProject,
  ]);

  // Update filters when group or project changes
  useEffect(() => {
    setFilters([
      ...(selectedGroup ? [{ field: "group_id", value: selectedGroup }] : []),
      ...(selectedProject
        ? [{ field: "project_id", value: selectedProject }]
        : []),
    ]);
  }, [selectedGroup, selectedProject]);

  // Fetch products on mount and when user/organization changes
  useEffect(() => {
    if (user?.[0]?.userID && organization?.[0]?.id) {
      handleGetProductsList();
    }
  }, [user, organization, handleGetProductsList]);

  // Fetch products when search, sort, page changes
  useEffect(() => {
    handleGetProductsList();
  }, [
    debouncedSearchTerm,
    sortField,
    sortDirection,
    currentPage,
    handleGetProductsList,
  ]);

  const handleEnter = (product) => {
    router.push(`/${product.type}/${product.id}`);
  };

  const handleToggleFavorite = (productId) => {
    setProductsList((prev) =>
      prev.map((product) =>
        product.id === productId
          ? { ...product, favorite: !product.favorite }
          : product,
      ),
    );
  };

  const handleShare = async (product) => {
    const dashboardLink = `${window.location.origin}/${product.type}/${product.id}`;
    try {
      await navigator.clipboard.writeText(dashboardLink);
      setShowCopiedAlert(true);
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };
  const handleCreateSchedule = () => {};
  const handleCloseScheduleModal = () => {};
  const getDataGridColumns = useCallback(
    () => [
      {
        field: "name",
        headerName: "Nombre",
        flex: 1,
        minWidth: 200,
        contentType: "iconWithDescription",
        contentProps: {
          icon: (params) => (
            <DashboardRounded
              sx={{ color: params?.row?.color || "#000000", fontSize: "40px" }}
            />
          ),
          valueField: "name",
          descriptionField: "project",
          iconColorField: "color",
          iconSize: 40,
        },
      },
      { field: "type", headerName: "Tipo", width: 120, contentType: "text" },
      {
        field: "created_at",
        headerName: "Fecha de creación",
        width: 180,
        contentType: "date",
      },
      {
        field: "edited_at",
        headerName: "Última edición",
        width: 180,
        contentType: "date",
      },
    ],
    [],
  );

  const getDataGridRows = useCallback(
    () =>
      productsList.map((product) => ({
        id: product.id,
        name: product.name,
        color: product.color,
        project: product.project,
        type: product.type,
        created_at: product.created_at,
        edited_at: product.edited_at,
        favorite: product.favorite,
        _types: { created_at: "date", edited_at: "date" },
      })),
    [productsList],
  );

  const columns = useMemo(() => getDataGridColumns(), [getDataGridColumns]);
  const rows = useMemo(() => getDataGridRows(), [getDataGridRows]);

  const tableState = useTableControls({
    state: {
      rows,
      columns,
      cellHoverRenderers: {
        name: (params, handlers) => (
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handlers?.onShare?.(params);
              }}
            >
              <CopyAllOutlined sx={{ color: "#a5a5a5", fontSize: "20px" }} />
            </IconButton>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handlers?.onFavorite?.(params);
              }}
            >
              {params.row.favorite ? (
                <Star sx={{ color: "#FFD700", fontSize: "20px" }} />
              ) : (
                <StarBorder sx={{ color: "#a5a5a5", fontSize: "20px" }} />
              )}
            </IconButton>
          </Box>
        ),
      },
      cellHoverHandlers: {
        name: {
          onShare: (params) => handleShare(params.row),
          onFavorite: (params) => handleToggleFavorite(params.row.id),
        },
      },
    },
    show: { table: true },
    handlers: {
      onRowClick: (params) => {
        const product = productsList.find((p) => p.id === params.row.id);
        handleEnter(product);
      },
    },
  });
  if (actions !== undefined && "__general__products" in actions) {
    return (
      <Box sx={{ overflowY: "hidden", my: 2, px: 2 }}>
        <Box
          sx={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            mb: 1,
          }}
        >
          <Header
            state={headerState.state}
            show={headerState.show}
            sx={{ width: "100%", mb: 0 }}
          >
            <Header.ControlsGroup
              sx={{
                alignItems: "center",
                flexDirection: { xs: "column", md: "row" },
                justifyContent: { xs: "center", md: "flex-end" },
                "& > :first-child": {
                  width: { xs: "90%", md: "70%" },
                  alignSelf: "center",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderRadius: "12px !important",
                  },
                },
              }}
            >
              <Header.Search />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  width: { xs: "100%", md: "auto" },
                  "& > *": {
                    width: "auto",
                    flex: "0 0 auto",
                  },
                }}
              >
                <Header.ViewMode />
                <Header.Sort />
              </Box>
            </Header.ControlsGroup>
          </Header>
        </Box>
        <Box
          sx={{
            backgroundColor: "white",
            borderRadius: 2,
            p: 2,
            height: "calc(100vh - 200px)",
            overflowY: "auto",
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Tableros de {organization?.[0]?.name || "Organización"}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Explora todos los tableros de{" "}
              {organization?.[0]?.name || "Organización"} disponibles (
              {productsList.length} encontrados)
            </Typography>
          </Box>
          {productsList.length > 0 ? (
            headerState.state.viewMode.value === "large-icons" ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 3,
                  width: "100%",
                }}
              >
                {productsList.map((product) => (
                  <ProductCardView
                    key={product.id}
                    product={product}
                    onEnter={() => handleEnter(product)}
                    onToggleFavorite={handleToggleFavorite}
                    onShare={handleShare}
                    setShowCopiedAlert={setShowCopiedAlert}
                  />
                ))}
              </Box>
            ) : (
              <Table state={tableState} />
            )
          ) : (
            <Card
              sx={{
                p: 6,
                textAlign: "center",
                backgroundColor: "white",
                borderRadius: 2,
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  No se encontraron tableros de{" "}
                  {organization?.[0]?.name || "Organización"}
                </Typography>
                <Typography color="text.secondary">
                  Intenta con otros términos de búsqueda o revisa los filtros
                  aplicados
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
        <Snackbar
          open={showCopiedAlert}
          autoHideDuration={3000}
          onClose={() => setShowCopiedAlert(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "flex-start" }}
        >
          <Alert
            onClose={() => setShowCopiedAlert(false)}
            severity="success"
            sx={{ width: "100%" }}
          >
            ¡Enlace del tablero copiado al portapapeles!
          </Alert>
        </Snackbar>
      </Box>
    );
  } else {
    return (
      <Box className="pad_40" style={{ minHeight: "50vh" }}>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ textAlign: "center", fontWeight: "500", marginBottom: "10px" }}
        >
          <Error message="Credenciales no válidas para acceder a la página de Marketplace." />
        </Typography>
      </Box>
    );
  }
};

const mapStateToProps = (state) => ({
  user: state.user,
  organization: state.organization,
  actions: state.actions,
});

export default connect(mapStateToProps)(Products);
