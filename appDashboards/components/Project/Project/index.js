"use client";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Dialog,
  CircularProgress,
  Typography,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Visibility,
  DeleteRounded,
  DeleteOutlineRounded,
  FolderCopyOutlined,
  Add,
  AccountTree as AccountTreeIcon,
  AccountTreeOutlined,
  LockRounded,
  Person as PersonIcon,
  Group as GroupIcon,
  Security as SecurityIcon,
  ChevronRight,
  ChevronLeft,
  CloudUpload,
} from "@mui/icons-material";
import { connect } from "react-redux";
import { useRouter } from "next/router";
import ExplorerView from "@components/Base/ExplorerView";
import { useExplorerConfig } from "@components/Base/ExplorerView/useExplorerConfig";
import {
  ensureItemsHaveColors,
  ensureItemsHaveTags,
} from "@components/Base/ExplorerView/explorerUtils";
import DetailsSidebar from "@components/Base/DetailsSidebar";
import EditProject from "./EditProject";
import DeleteProject from "./DeleteProject";
import CreateProject from "./CreateProject";
import { clearSessionStorage } from "@utils/sessionStorageUtils";
import {
  getProjectList,
  handleTrashProject,
  getProjectDetailedData,
} from "./services/Project";
import BreadcrumbsNav from "@components/Project/Breadcrumbs";
import { pushNotification } from "@redux/actions";
import { useDispatch } from "react-redux";
import useDebounce from "hooks/useDebounce";
import moment from "moment";
import "moment/locale/es";
import { userValidateCreation } from "@services/creangelAuthAPI";
import TrashModal from "@components/Project/Components/TrashModal";
import NotAllowedModal from "@components/Project/Components/NotAllowedModal";
import Error from "@components/Base/Error";
moment.locale("es");

const Project = (props) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [projects, setProjects] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isCreateModal, setIsCreateModal] = useState(false);
  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [isTrashModal, setIsTrashModal] = useState(false);
  const [isLoadingTrash, setIsLoadingTrash] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDetailedData, setProjectDetailedData] = useState(null);
  const [isLoadingProjectDetails, setIsLoadingProjectDetails] = useState(false);
  const [projectDelete, setProjectDelete] = useState(null);
  const [projectDetailsCache, setProjectDetailsCache] = useState({});
  const [userNames, setUserNames] = useState({});
  const [projectsPerPage, setProjectsPerPage] = useState(500);
  const [offset, setOffset] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [showCreateButton, setShowCreateButton] = useState(true);
  // Debounce del search para evitar múltiples llamadas (500ms)
  const debouncedSearchValue = useDebounce(searchValue, 500);
  const [selectedTrashProject, setSelectedTrashProject] = useState(null);
  const [isNotAllowedModal, setIsNotAllowedModal] = useState(false);
  const [notAllowedProject, setNotAllowedProject] = useState(null);
  const [trashResult, setTrashResult] = useState({});

  const handleValidateCreation = useCallback(async () => {
    const res = await userValidateCreation(
      {
        type: "project",
      },
      {
        Authorization: `Bearer ${props.user[0].userID}`,
      },
    );
    setShowCreateButton(res.data.can_create);
  }, [props.user]);

  useEffect(() => {
    handleValidateCreation();
    clearSessionStorage([
      "projectId",
      "projectName",
      "folderId",
      "folderName",
      "resourceId",
      "resourceName",
      "panelId",
      "groupId",
    ]);
  }, []);

  // Usar el hook de configuración del explorador
  const { getExplorerConfig, getTableColumns, getTableRows } =
    useExplorerConfig("project", {
      icon: AccountTreeIcon,
    });

  // Configurar columnas de la tabla - Solo columnas adicionales
  // El orden base es: Nombre, Creador, Fecha de Modificación, Acciones (manejado por getTableColumns)
  const columns = getTableColumns([]);

  // Función para obtener items del context menu según permisos
  const getContextMenuItems = useCallback((item) => {
    if (!item) return [];

    const menuItems = [{ id: "view", label: "Ver más", icon: <Visibility /> }];

    // Solo mostrar editar y mover a papelera si el usuario puede editar
    if (item.can_edit !== false) {
      menuItems.push(
        { id: "edit", label: "Editar", icon: <EditIcon /> },
        {
          id: "trash",
          label: "Mover a Papelera",
          icon: <DeleteOutlineRounded />,
        },
      );
    }

    return menuItems;
  }, []);

  // Configuración del explorador
  const explorerConfig = getExplorerConfig({
    menu: {
      title: "Mis proyectos",
      buttonLabel: "Nuevo",
      buttonIcon: <Add />,
      showButton: showCreateButton,
      options: [
        {
          label: "Proyectos",
          value: "projects",
          icon: <AccountTreeOutlined />,
          iconSelected: <AccountTreeIcon />,
        },
        {
          label: "Importar",
          value: "import",
          icon: <CloudUpload />,
          iconSelected: <CloudUpload />,
        },
        // { label: 'Favoritos', value: 'favorites', icon: <StarBorderRounded />, iconSelected: <StarRounded /> },
        {
          label: "Papelera",
          value: "trash",
          icon: <DeleteOutlineRounded />,
          iconSelected: <DeleteRounded />,
        },
      ],
      selectedOption: "projects",
      onOptionClick: (optionId) => {
        if (optionId === "trash") {
          router.push("/trash?from=projects");
        } else if (optionId === "import") {
          router.push("/projects/importDashboard");
        } else if (optionId === "favorites") {
          router.push("/favorites?from=projects");
        }
      },
    },
    viewMode: {
      defaultValue: sessionStorage.getItem("viewMode") || "large-icons",
      persist: true,
    },
    sort: {
      defaultField: "created_at",
      // Los campos se sincronizarán automáticamente con las columnas de la tabla
      defaultDirection: "asc",
    },
    show: {
      search: true,
      viewMode: true,
      sort: true,
    },
    cards: {
      showContextMenu: true,
      contextMenuItems: getContextMenuItems,
    },
    emptyState: {
      title: "No existen proyectos creados",
      description: "Los proyectos aparecerán aquí cuando se empiecen a crear.",
    },
    titleConfig: {
      title: "Proyectos",
      description: "",
      icon: <AccountTreeIcon sx={{ color: "primary.main" }} />,
    },
  });

  // Función para invalidar caché de un proyecto específico
  const invalidateProjectCache = useCallback((projectId) => {
    if (projectId) {
      setProjectDetailsCache((prev) => {
        const newCache = { ...prev };
        delete newCache[projectId];
        return newCache;
      });
    }
  }, []);

  // Función para limpiar todo el caché
  const clearProjectCache = useCallback(() => {
    setProjectDetailsCache({});
  }, []);

  const handleGetProjectList = useCallback(
    async (showLoading = false) => {
      const stateSetters = {
        setIsLoadingList,
        setProjects,
        setTotalProjects,
        setCurrentPage,
      };
      const data = {
        projectsPerPage,
        offset,
        searchValue: debouncedSearchValue,
        sortField: sortField,
        sortDirection: sortDirection,
        userToken: props.user[0].userID,
        showLoading,
      };

      await getProjectList(data, stateSetters);
    },
    [
      projectsPerPage,
      offset,
      debouncedSearchValue,
      sortField,
      sortDirection,
      props.user,
    ],
  );

  const handleSearch = useCallback((value) => {
    setSearchValue(value);
  }, []);

  const handleSortChange = useCallback((sort) => {
    setSortField(sort.field);
    setSortDirection(sort.direction);
  }, []);

  // Ref para controlar la carga inicial
  const isInitialLoadProject = useRef(true);

  useEffect(() => {
    // Solo cargar en el mount inicial
    if (isInitialLoadProject.current) {
      handleGetProjectList(true);
      isInitialLoadProject.current = false;
    }
  }, []);

  // Recargar proyectos cuando cambia la búsqueda con debounce
  useEffect(() => {
    if (!isInitialLoadProject.current && props.user && props.user[0]?.userID) {
      handleGetProjectList(true);
    }
  }, [debouncedSearchValue, handleGetProjectList]);

  // Recargar proyectos cuando cambia el ordenamiento
  useEffect(() => {
    if (!isInitialLoadProject.current && props.user && props.user[0]?.userID) {
      handleGetProjectList(true);
    }
  }, [sortField, sortDirection, handleGetProjectList]);

  // Limpiar datos detallados cuando se deselecciona un proyecto
  useEffect(() => {
    if (!selectedProject) {
      setProjectDetailedData(null);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (isTrashModal == false) {
      setIsLoadingTrash(false);
      setTrashResult({});
    }
  }, [isTrashModal]);

  // Asegurar que los proyectos tengan colores, tags e íconos renderizados
  const projectsWithColors = useMemo(() => {
    const withColors = ensureItemsHaveColors(projects);
    const withTags = ensureItemsHaveTags(withColors, "project");

    // Agregar íconos renderizados
    return withTags.map((item) => ({
      ...item,
      icon: <AccountTreeIcon sx={{ color: item.color || "#FFD745" }} />,
    }));
  }, [projects]);

  // Función para obtener los detalles completos del proyecto usando el servicio con caché
  // IMPORTANTE: Debe estar definida antes de los handlers que la usan
  const fetchProjectDetails = useCallback(
    async (projectId) => {
      if (!projectId) return;

      // Verificar si ya está en caché
      if (projectDetailsCache[projectId]) {
        setProjectDetailedData(projectDetailsCache[projectId]);
        setIsLoadingProjectDetails(false);
        return;
      }

      const params = {
        projectId,
        userToken: props.user[0].userID,
      };

      const stateSetters = {
        setIsLoadingProjectDetails,
        setProjectDetailedData: (data) => {
          setProjectDetailedData(data);
          // Guardar en caché
          if (data) {
            setProjectDetailsCache((prev) => ({
              ...prev,
              [projectId]: data,
            }));
          }
        },
      };

      await getProjectDetailedData(params, stateSetters);
    },
    [props.user, projectDetailsCache],
  );

  // Handlers
  const handleProjectCardClick = useCallback(
    (project) => {
      // Click simple: solo selecciona el elemento
      setSelectedProject(project);
      // Fetch de detalles completos del proyecto
      fetchProjectDetails(project.id);
    },
    [fetchProjectDetails],
  );

  const handleProjectCardDoubleClick = useCallback(
    (project) => {
      // Doble click: abre directamente el proyecto
      sessionStorage.setItem("projectId", project.id);
      sessionStorage.setItem("projectName", project.name);
      sessionStorage.setItem("groupId", project.group_id);
      router.push(`/projects/folders`);
    },
    [router],
  );

  const handleRowClick = useCallback(
    (params) => {
      // Click simple en tabla: solo selecciona el elemento
      setSelectedProject(params.row);
      // Fetch de detalles completos del proyecto
      fetchProjectDetails(params.row.id);
    },
    [fetchProjectDetails],
  );

  const handleRowDoubleClick = useCallback(
    (params) => {
      // Doble click en tabla: abre directamente el proyecto
      const project = params.row;
      sessionStorage.setItem("projectId", project.id);
      sessionStorage.setItem("projectName", project.name);
      sessionStorage.setItem("groupId", project.group_id);
      router.push(`/projects/folders`);
    },
    [router],
  );

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
    // Limpiar los datos detallados al cerrar el sidebar
    setProjectDetailedData(null);
  }, []);

  const handleOpenProject = useCallback(() => {
    if (!selectedProject) return;
    sessionStorage.setItem("projectId", selectedProject.id);
    sessionStorage.setItem("projectName", selectedProject.name);
    sessionStorage.setItem("groupId", selectedProject.group_id);
    router.push(`/projects/folders`);
  }, [selectedProject, router]);

  const handleEdit = useCallback(
    (item) => {
      if (item.can_edit === false) {
        setIsNotAllowedModal(true);
        setNotAllowedProject(item);
      } else {
        setSelectedProject(item);
        setEditingId(item?.id);
      }
    },
    [dispatch],
  );

  const handleDelete = useCallback((item) => {
    setProjectDelete(item);
    setIsDeleteModal(true);
  }, []);

  const handleView = useCallback(
    (item) => {
      setSelectedProject(item);
      if (!isSidebarOpen) {
        setIsSidebarOpen(true);
      }
      // Fetch de detalles completos del proyecto
      fetchProjectDetails(item.id);
    },
    [isSidebarOpen, fetchProjectDetails],
  );

  const handleTrashProjectAction = useCallback(async (item) => {
    const stateSetters = {
      setIsLoadingTrash,
    };
    const callbacks = {
      pushNotification,
      getProjectList: () => {
        // Invalidar caché del proyecto eliminado
        invalidateProjectCache(item.id);
        handleGetProjectList(true);
      },
    };
    const params = {
      projectId: item.id,
      userToken: props.user[0].userID,
    };

    let result = await handleTrashProject(params, stateSetters, callbacks);
    setTrashResult(result);
  }, []);

  const handleTrash = useCallback(
    async (item) => {
      if (item.can_edit === false) {
        setIsNotAllowedModal(true);
        setNotAllowedProject(item);
      } else {
        setSelectedTrashProject(item);
        setIsTrashModal(true);
      }
    },
    [props.user, dispatch, handleGetProjectList, invalidateProjectCache],
  );

  const handleFavorite = useCallback((item) => {
    console.log("Marcar como favorito:", item);
  }, []);

  const contextMenuActions = {
    view: handleView,
    edit: handleEdit,
    trash: handleTrash,
    delete: handleDelete,
  };

  // Campos personalizados para el sidebar de detalles
  const projectCustomFields = useMemo(() => {
    if (!selectedProject) return [];

    // Usar projectDetailedData si está disponible, de lo contrario usar selectedProject
    const projectData = projectDetailedData || selectedProject;

    // Mostrar loading si se están cargando los detalles
    if (isLoadingProjectDetails) {
      return [
        {
          label: "Cargando detalles...",
          content: (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                Obteniendo información desde ACL...
              </Typography>
            </Box>
          ),
        },
      ];
    }

    const fields = [];

    fields.push(
      {
        label: "Usuario Propietario",
        content: (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <PersonIcon sx={{ fontSize: 18, color: "primary.main" }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {projectData.creator_user_name || "N/A"}
            </Typography>
          </Box>
        ),
      },
      {
        label: "Usuario Editor",
        content: (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <PersonIcon sx={{ fontSize: 18, color: "accent.main" }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {projectData.editor_user_name || "N/A"}
            </Typography>
          </Box>
        ),
      },
      {
        label: "Grupo",
        content: (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <GroupIcon sx={{ fontSize: 18, color: "info.main" }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {projectDetailedData?.group_name ||
                projectData.group_name ||
                "N/A"}
            </Typography>
          </Box>
        ),
      },
    );

    // Si tenemos datos detallados, agregar información de permisos
    if (projectDetailedData) {
      fields.push(
        {
          label: "Permiso de Visualización",
          content: (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                <SecurityIcon sx={{ fontSize: 18, color: "success.main" }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {projectDetailedData.view_role?.type || "N/A"}
                </Typography>
              </Box>
            </Box>
          ),
        },
        {
          label: "Permiso de Edición",
          content: (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                <SecurityIcon sx={{ fontSize: 18, color: "warning.main" }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {projectDetailedData.edit_role?.type || "N/A"}
                </Typography>
              </Box>
            </Box>
          ),
        },
        {
          label: "Estadísticas",
          content: (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <FolderCopyOutlined sx={{ fontSize: 18, color: "info.main" }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {projectDetailedData.folder_count || 0} carpeta
                {projectDetailedData.folder_count !== 1 ? "s" : ""}
              </Typography>
            </Box>
          ),
        },
      );
    }

    return fields;
  }, [selectedProject, projectDetailedData, isLoadingProjectDetails]);

  // Contenido del sidebar
  const sidebarContent = (
    <DetailsSidebar
      item={selectedProject}
      chipConfig={
        selectedProject
          ? {
              label: "Proyecto",
              color: selectedProject.color || "#1976d2",
              icon: <AccountTreeIcon sx={{ fontSize: 14, color: "white" }} />,
            }
          : undefined
      }
      onClose={handleCloseSidebar}
      itemCount={projects.length}
      onCreateClick={() => setIsCreateModal(true)}
      enableCreateButton={showCreateButton}
      entityName="Proyecto"
      customFields={projectCustomFields}
      showVisibility={false}
      actions={
        selectedProject
          ? [
              {
                label: "Abrir Proyecto",
                icon: <Visibility sx={{ fontSize: 18 }} />,
                onClick: handleOpenProject,
                style: "primary",
              },
              {
                label: "Editar",
                icon: <EditIcon sx={{ fontSize: 18 }} />,
                onClick: () => contextMenuActions.edit?.(selectedProject),
                style: "secondary",
                hidden: selectedProject.can_edit === false,
              },
              {
                type: "divider",
                hidden: selectedProject.can_edit === false,
              },
              {
                label: "Mover a Papelera",
                icon: <DeleteOutlineRounded sx={{ fontSize: 18 }} />,
                onClick: () => contextMenuActions.trash?.(selectedProject),
                style: "secondary",
                hidden: selectedProject.can_edit === false,
              },
            ]
          : []
      }
    />
  );
  if (props.user !== undefined && "__general__projects" in props.actions) {
    return (
      <>
        <ExplorerView
          config={explorerConfig}
          items={projectsWithColors}
          isLoading={isLoadingList}
          columns={columns}
          getRows={getTableRows}
          onItemClick={handleProjectCardClick}
          onItemDoubleClick={handleProjectCardDoubleClick}
          onRowClick={handleRowClick}
          onRowDoubleClick={handleRowDoubleClick}
          onCreateClick={() => setIsCreateModal(true)}
          onFavoriteClick={handleFavorite}
          onMoreOptionsClick={(item) => setSelectedProject(item)}
          contextMenuActions={contextMenuActions}
          userNames={userNames}
          showDeleteAction={false}
          sidebarContent={sidebarContent}
          isSidebarOpen={isSidebarOpen}
          onCloseSidebar={handleCloseSidebar}
          onSearch={handleSearch}
          onSortChange={handleSortChange}
          headerSlots={{
            breadcrumb: <BreadcrumbsNav />,
            sidebarToggle: (
              <Tooltip
                title={
                  isSidebarOpen
                    ? "Ocultar panel de información"
                    : "Mostrar panel de información"
                }
              >
                <IconButton
                  onClick={handleToggleSidebar}
                  size="small"
                  sx={{
                    color: isSidebarOpen ? "primary.main" : "text.secondary",
                    backgroundColor: isSidebarOpen
                      ? "rgb(236, 236, 236)"
                      : "transparent",
                    borderRadius: 1.5,
                    border: "1px solid rgb(207, 205, 205)",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                    height: "38px",
                  }}
                >
                  {isSidebarOpen ? (
                    <ChevronRight fontSize="small" />
                  ) : (
                    <ChevronLeft fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            ),
          }}
          badgeConfig={{
            field: "can_edit",
            value: false,
            icon: <LockRounded sx={{ fontSize: 18, color: "#a3a3a3" }} />,
            position: "top-right",
            backgroundColor: "#FFFFFF",
            showShadow: true,
          }}
        >
          {/* Modales */}
          <Dialog
            open={isCreateModal}
            onClose={() => setIsCreateModal(false)}
            className="box_shadow_aws"
            maxWidth={false}
            sx={{ "& .MuiDialog-paper": { maxWidth: "700px", width: "100%" } }}
          >
            <CreateProject
              handleProject={() => {
                handleGetProjectList();
              }}
              user={props.user[0]}
              organization={props.organization[0]}
              setIsCreateModal={setIsCreateModal}
            />
          </Dialog>

          <Dialog open={isDeleteModal} onClose={() => setIsDeleteModal(false)}>
            <DeleteProject
              setIsDeleteModal={setIsDeleteModal}
              user={props.user[0]}
              projectDelete={projectDelete}
              handleProject={handleGetProjectList}
            />
          </Dialog>

          <Dialog
            open={editingId !== null}
            onClose={() => setEditingId(null)}
            sx={{ "& .MuiDialog-paper": { maxWidth: "700px", width: "100%" } }}
          >
            <EditProject
              setEditingId={setEditingId}
              user={props.user[0]}
              editProject={selectedProject}
              handleProject={() => {
                // Invalidar caché del proyecto editado
                if (selectedProject?.id) {
                  invalidateProjectCache(selectedProject.id);
                }
                handleGetProjectList();
              }}
            />
          </Dialog>

          <TrashModal
            open={isTrashModal}
            onClose={() => setIsTrashModal(false)}
            selectedItem={selectedTrashProject}
            onTrash={handleTrashProjectAction}
            isLoadingTrash={isLoadingTrash}
            entityName="Proyecto"
            context={{
              icon: (
                <AccountTreeIcon
                  sx={{
                    fontSize: 20,
                    color: "white",
                    backgroundColor: selectedTrashProject?.color
                      ? selectedTrashProject.color
                      : "#1976d2",
                  }}
                />
              ),
              label: "Proyecto",
            }}
            trashResult={trashResult}
          />

          <NotAllowedModal
            open={isNotAllowedModal}
            onClose={() => setIsNotAllowedModal(false)}
            selectedItem={notAllowedProject}
            context={{
              icon: (
                <AccountTreeIcon
                  sx={{
                    fontSize: 20,
                    color: "white",
                    backgroundColor: notAllowedProject?.color
                      ? notAllowedProject.color
                      : "#1976d2",
                  }}
                />
              ),
              label: "proyecto",
            }}
          />
        </ExplorerView>
      </>
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
          <Error message="Credenciales no válidas para acceder a la página de proyectos." />
        </Typography>
      </Box>
    );
  }
};

const mapStateToProps = (headerState) => {
  return {
    user: headerState.user,
    organization: headerState.organization,
    actions: headerState.actions,
    permissions: headerState.permissions,
  };
};

export default connect(mapStateToProps)(Project);
