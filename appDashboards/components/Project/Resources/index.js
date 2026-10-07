"use client"
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { connect, useDispatch } from 'react-redux';
import { Backdrop, Typography, Chip, IconButton, useTheme, useMediaQuery, CircularProgress, Tooltip } from '@mui/material';
import { Edit as EditIcon, Visibility, DeleteOutlineRounded, DeleteRounded, StarRounded, StarBorderRounded, Add, Dashboard as DashboardIcon, BarChart as BarChartIcon, CategoryRounded, Close as CloseIcon, CalendarToday, Person, Group, Folder, Public, Lock, EditOff as EditOffIcon, Info as InfoIcon, MenuOpen, Security as SecurityIcon, LockRounded, GridViewRounded, ChevronRight, ChevronLeft, DownloadRounded, ContentCopy, ContentPaste } from '@mui/icons-material';
import { Box } from '@mui/material';
import ExplorerView from '@components/Base/ExplorerView';
import { useExplorerConfig } from '@components/Base/ExplorerView/useExplorerConfig';
import { ensureItemsHaveColors, ensureItemsHaveTags } from '@components/Base/ExplorerView/explorerUtils';
import DetailsSidebar from '@components/Base/DetailsSidebar';
import { LoadingAssembly } from '@creangel/ifindit-ui';
import { clearSessionStorage } from '../../../utilities/sessionStorageUtils';
import { getACLList, userValidateCreation } from '@services/creangelAuthAPI';
import CreateResource from './CreateResource';
import DeleteModal from '@components/Recursive/DeleteModal';
import AssociatedDashboardsModal from './components/AssociatedDashboardsModal';
import { handleResourceTrash, getResourceDetailedData } from './services/Resource';
import { pushNotification } from '@redux/actions';
import { CustomSelect, useCustomSelectControls } from '@creangel/ifindit-ui';
import BreadcrumbsNav from '@components/Project/Breadcrumbs';
import useDebounce from 'hooks/useDebounce';
import { getPreviewUrl } from '@services/imageServerAPI';
import ResourcePreviewIcon, { ResourceTypeChip } from './components/ResourcePreviewIcon';
import moment from 'moment';
import 'moment/locale/es';
import TrashModal from '@components/Project/Components/TrashModal';
import NotAllowedModal from '@components/Project/Components/NotAllowedModal';
import { useAppId } from 'hooks/useAppId';
import { useDataSourcesList } from '@components/DashboardsWorkspace/hooks/useDataSources';
import { dataSourceManagerGeneralRequest } from '@services/dataSourceManagerAPI';
import { handleExportDashboard as exportDashboard } from '@components/DashboardsWorkspace/features/Dashboard/shared/utils/dashboardActions';
import {
    buildDashboardExportFileName,
    downloadDashboardExportZip,
    getMissingDashboardExportDatasourceIds,
    prepareDashboardExportData
} from '@components/DashboardsWorkspace/features/Dashboard/shared/utils/dashboardExport';
import ImportWizardLoadingAnimation from '@components/Project/importDashboard/components/ImportWizardLoadingAnimation';
import {
    dashboardExportingLoadingProps,
    dashboardDuplicatingLoadingProps
} from '@components/Project/importDashboard/constants/importWizardLoadingPresets';
import {
    setDashboardClipboard,
    getDashboardClipboard,
    canPasteInFolder
} from './utils/dashboardClipboard';
import { duplicateDashboardInFolder } from './services/duplicateDashboard';
moment.locale('es')

const getResourceType = (item) => {
    const type = item?.acl_object_type || item?.type;
    return type === "panel" || type === "dashboard" ? type : null;
};

const getResourceDateLabel = (item) => {
    const date = item?.edited_at || item?.created_at;
    return date ? moment(date).fromNow() : "";
};

const ResourceTableName = ({ resource, previewUrl, type }) => {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                width: "100%",
                minWidth: 0,
                overflow: "hidden",
            }}
        >
            <ResourcePreviewIcon
                previewUrl={previewUrl}
                type={type}
                color={resource?.color || "#FFD745"}
                name={resource?.name}
                sx={{ fontSize: "40px", flexShrink: 0 }}
            />
            <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
                <Typography
                    component="span"
                    noWrap
                    title={resource?.name || ""}
                    sx={{
                        display: "block",
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        lineHeight: 1.3,
                        textTransform: "capitalize",
                    }}
                >
                    {resource?.name || "Sin nombre"}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0, mt: 0.25 }}>
                    <ResourceTypeChip type={type} />
                    <Typography
                        variant="caption"
                        noWrap
                        sx={{
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            color: "text.secondary",
                            lineHeight: 1.3,
                        }}
                    >
                        {getResourceDateLabel(resource)}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

const ResourceTableActions = ({ resource, onView, onEdit, onTrash }) => {
    const canEdit = resource?.can_edit !== false;

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 0.25,
                width: "100%",
            }}
        >
            <Tooltip title="Ver detalles" placement="top">
                <IconButton
                    size="small"
                    aria-label={`Ver detalles de ${resource?.name || "recurso"}`}
                    onClick={(event) => {
                        event.stopPropagation();
                        onView(resource);
                    }}
                    sx={{ p: 0.5, color: "text.secondary" }}
                >
                    <Visibility sx={{ fontSize: 18 }} />
                </IconButton>
            </Tooltip>
            {canEdit && (
                <>
                    <Tooltip title="Editar" placement="top">
                        <IconButton
                            size="small"
                            aria-label={`Editar ${resource?.name || "recurso"}`}
                            onClick={(event) => {
                                event.stopPropagation();
                                onEdit(resource);
                            }}
                            sx={{ p: 0.5, color: "text.secondary" }}
                        >
                            <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Mover a papelera" placement="top">
                        <IconButton
                            size="small"
                            aria-label={`Mover ${resource?.name || "recurso"} a la papelera`}
                            onClick={(event) => {
                                event.stopPropagation();
                                onTrash(resource);
                            }}
                            sx={{ p: 0.5, color: "error.main" }}
                        >
                            <DeleteOutlineRounded sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                </>
            )}
        </Box>
    );
};

const RESOURCE_CARD_GRID_SX = {
    "&[data-view-mode='large-icons'] > .MuiBox-root > .MuiBox-root": {
        gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
        },
    },
    "&[data-view-mode='medium-icons'] > .MuiBox-root > .MuiBox-root": {
        gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(4, minmax(0, 1fr))",
            md: "repeat(7, minmax(0, 1fr))",
        },
        gap: 1.25,
    },
    "&[data-view-mode='large-icons'] .MuiCard-root": {
        aspectRatio: "auto",
        minHeight: 0,
        overflow: "hidden",
        border: "1px solid #e0e5e9",
        borderRadius: 2,
        boxShadow: "0 2px 8px rgba(24, 39, 58, 0.08)",
        backgroundColor: "#ffffff",
        "& .MuiCardActionArea-root": {
            height: "auto",
        },
        "& .MuiCardContent-root": {
            height: "auto",
            padding: 1,
        },
        "& .MuiCardContent-root > .MuiBox-root": {
            display: "block",
            height: "auto",
        },
        "& .MuiCardContent-root > .MuiBox-root > .MuiBox-root:not([data-resource-card-preview])": {
            display: "none",
        },
    },
    "&[data-view-mode='medium-icons'] .MuiCard-root": {
        aspectRatio: "1 / 1",
        minHeight: 108,
        overflow: "hidden",
        border: "1px solid #e0e5e9",
        borderRadius: 2,
        boxShadow: "0 2px 8px rgba(24, 39, 58, 0.08)",
        backgroundColor: "#ffffff",
        "& .MuiCardActionArea-root": {
            height: "100%",
        },
        "& .MuiCardContent-root": {
            height: "100%",
            padding: 1,
            boxSizing: "border-box",
        },
        "& .MuiCardContent-root > .MuiBox-root": {
            height: "100%",
            gap: 0.75,
        },
        "& .MuiCardContent-root > .MuiBox-root > .MuiBox-root > .MuiTypography-root:first-child": {
            fontSize: "12px",
            lineHeight: 1.2,
        },
    },
};

function Resources(props) {
    const router = useRouter();
    const dispatch = useDispatch();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [resources, setResources] = useState([]);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [isCreateModal, setIsCreateModal] = useState(false);
    const [isDeleteModal, setIsDeleteModal] = useState(false);
    const [resourceDelete, setResourceDelete] = useState(null);
    const [selectedResource, setSelectedResource] = useState(null);
    const [resourceDetailedData, setResourceDetailedData] = useState(null);
    const [isLoadingResourceDetails, setIsLoadingResourceDetails] = useState(false);
    const [resourceDetailsCache, setResourceDetailsCache] = useState({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [userNames, setUserNames] = useState({});
    const [projectId, setProjectId] = useState(null);
    const [groupId, setGroupId] = useState(null);
    const [folderId, setFolderId] = useState(null);
    const [totalResources, setTotalResources] = useState(0);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [exampleItems, setExampleItems] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [isLoadingTrash, setIsLoadingTrash] = useState(false);
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [isAssociatedModal, setIsAssociatedModal] = useState(false);
    const [associatedDashboards, setAssociatedDashboards] = useState([]);
    const [showCreateButton, setShowCreateButton] = useState(false);
    const [selectedTrashResource, setSelectedTrashResource] = useState(null);
    const [isNotAllowedModal, setIsNotAllowedModal] = useState(false);
    const [notAllowedResource, setNotAllowedResource] = useState(null);
    const [trashResult, setTrashResult] = useState({});
    const [isTrashModal, setIsTrashModal] = useState(false);
    const [exportingDashboardId, setExportingDashboardId] = useState(null);
    const [isPastingDashboard, setIsPastingDashboard] = useState(false);
    const [clipboardRevision, setClipboardRevision] = useState(0);
    const exportCancelledRef = useRef(false);
    const pasteCancelledRef = useRef(false);
    const { appId: application_id } = useAppId();
    const { data: dataSources = [] } = useDataSourcesList();
    
    // Debounce del search para evitar múltiples llamadas (500ms)
    const debouncedSearchValue = useDebounce(searchValue, 500);

    const handleValidateCreation = useCallback(async () => {
        try {
          const types = ["dashboard", "panel"];
          
          const results = await Promise.all(
            types.map(type =>
              userValidateCreation(
                {
                  type,
                  parent_type: 'folder',
                  parent_id: sessionStorage.getItem('folderId'),
                },
                {
                  'Authorization': `Bearer ${props.user[0].userID}`,
                }
              ).then(res => !!res.data.can_create)
            )
          );
      
          setShowCreateButton(results.every(canCreate => canCreate));
        } catch (error) {
          setShowCreateButton(false);
        }
      }, [props.user]);

    // Configurar el selector de tipo de recurso con íconos
    const typeSelectState = useCustomSelectControls({
        state: {
            value: null,
            search: { value: "", placeholder: "Buscar tipo" },
            options: [
                { 
                    id: 'dashboard', 
                    label: 'Dashboards', 
                    value: 'dashboard',
                    icon: <DashboardIcon sx={{ fontSize: '18px' }} />
                },
                { 
                    id: 'panel', 
                    label: 'Paneles', 
                    value: 'panel',
                    icon: <BarChartIcon sx={{ fontSize: '18px' }} />
                }
            ],
            isOpen: false,
        },
        show: {
            field: true,
            dropdown: true,
        },
        label: "Tipo de recursos",
        searchable: false,
        size: "small",
        autoWidth: true,
    });

    useEffect(() => {
        // Solo limpiar resourceId (NO limpiar folderName para mantener breadcrumb)
        clearSessionStorage(['resourceId', 'panelId']);
        
        // Restaurar TODOS los datos necesarios para el breadcrumb
        const sessionProjectId = sessionStorage.getItem('projectId');
        const sessionProjectName = sessionStorage.getItem('projectName');
        const sessionGroupId = sessionStorage.getItem('groupId');
        const sessionFolderId = sessionStorage.getItem('folderId');
        const sessionFolderName = sessionStorage.getItem('folderName');

        if (sessionProjectId && sessionProjectName && sessionGroupId && sessionFolderId) {
            setProjectId(sessionProjectId);
            setGroupId(sessionGroupId);
            setFolderId(sessionFolderId);
            
            // Si no hay folderName guardado, usar un placeholder
            if (!sessionFolderName) {
                sessionStorage.setItem('folderName', 'Carpeta sin nombre');
            }
        } else {
            router.push('/projects');
        }
        handleValidateCreation();
    }, [router]);


    

    const getResourcePreviewUrl = useCallback((item) => {
        const type = getResourceType(item);
        if (!type || !item?.id) {
            return null;
        }
        try {
            return getPreviewUrl({
                entityType: type,
                entityId: item.id,
            });
        } catch (_) {
            return null;
        }
    }, []);

    const renderResourceIcon = useCallback((item) => (
        <ResourcePreviewIcon
            previewUrl={getResourcePreviewUrl(item)}
            type={getResourceType(item)}
            color={item.color || '#FFD745'}
            cardPreview
            name={item?.name}
            dateLabel={getResourceDateLabel(item)}
        />
    ), [getResourcePreviewUrl]);

    // Usar el hook de configuración del explorador
    const { getExplorerConfig, getTableColumns, getTableRows } = useExplorerConfig('resource', {
        icon: DashboardIcon // Ícono por defecto
    });

    const isDashboardResource = useCallback((item) => (
        getResourceType(item) === 'dashboard'
    ), []);

    const getCurrentFolderId = useCallback(() => {
        return folderId || sessionStorage.getItem('folderId');
    }, [folderId]);

    const handleCopyDashboard = useCallback((item) => {
        if (!isDashboardResource(item) || item?.can_edit === false) {
            return;
        }
        const currentFolderId = getCurrentFolderId();
        if (!currentFolderId || !item?.id) {
            dispatch(pushNotification({
                msg: 'No se pudo copiar el tablero: faltan datos de la carpeta',
                status: 'err'
            }));
            return;
        }
        setDashboardClipboard({
            dashboardId: item.id,
            dashboardName: item.name,
            folderId: currentFolderId
        });
        setClipboardRevision((prev) => prev + 1);
        dispatch(pushNotification({
            msg: 'Tablero copiado. Usa Ctrl+V o clic derecho en un espacio vacío para pegar.',
            status: 'ok'
        }));
    }, [dispatch, getCurrentFolderId, isDashboardResource]);

    const getBackgroundContextMenuItems = useCallback(() => {
        void clipboardRevision;
        if (isPastingDashboard) {
            return [];
        }
        const currentFolderId = getCurrentFolderId();
        if (!canPasteInFolder(currentFolderId)) {
            return [];
        }
        return [
            {
                id: 'pasteDashboard',
                label: 'Pegar Tablero',
                icon: <ContentPaste />
            }
        ];
    }, [clipboardRevision, getCurrentFolderId, isPastingDashboard]);

    // Función para obtener items del context menu según permisos
    const getContextMenuItems = useCallback((item) => {
        if (!item) return [];
        
        const menuItems = [
            { id: 'view', label: 'Ver detalles', icon: <Visibility /> }
        ];

        if (isDashboardResource(item)) {
            menuItems.push({
                id: 'exportDashboard',
                label: exportingDashboardId === item.id ? 'Exportando tablero...' : 'Exportar tablero',
                icon: <DownloadRounded />
            });
        }

        if (isDashboardResource(item) && item.can_edit !== false) {
            menuItems.push({
                id: 'copyDashboard',
                label: 'Copiar',
                icon: <ContentCopy />
            });
        }
        
        // Solo mostrar editar y mover a papelera si el usuario puede editar
        if (item.can_edit !== false) {
            menuItems.push(
                { id: 'edit', label: 'Editar', icon: <EditIcon /> },
                { id: 'trash', label: 'Mover a papelera', icon: <DeleteOutlineRounded /> }
            );
        }
        
        return menuItems;
    }, [exportingDashboardId, isDashboardResource]);

    // Configuración del explorador
    const explorerConfig = getExplorerConfig({
        menu: {
            title: 'Mis recursos',
            buttonLabel: 'Nuevo',
            buttonIcon: <Add />,
            showButton: showCreateButton,
            options: [
                { label: 'Recursos', value: 'resources', icon: <GridViewRounded />, iconSelected: <GridViewRounded /> },
                // { label: 'Favoritos', value: 'favorites', icon: <StarBorderRounded />, iconSelected: <StarRounded /> },
                { label: 'Papelera', value: 'trash', icon: <DeleteOutlineRounded />, iconSelected: <DeleteRounded /> }
            ],
            selectedOption: 'resources',
            onOptionClick: (optionId) => {
                if (optionId === 'trash') {
                    router.push('/trash?from=resources');
                } else if (optionId === 'favorites') {
                    router.push('/favorites?from=resources');
                }
            }
        },
        viewMode: {
            defaultValue: sessionStorage.getItem('viewMode') || 'large-icons',
            persist: true
        },
        sort: {
            defaultField: 'name',
            // Los campos se sincronizarán automáticamente con las columnas de la tabla
            defaultDirection: 'asc'
        },
        show: {
            search: true, // Mostrar SearchBox
            viewMode: true,
            sort: true,
        },
        cards: {
            showContextMenu: true,
            contextMenuItems: getContextMenuItems,
            showBackgroundContextMenu: true,
            backgroundContextMenuItems: getBackgroundContextMenuItems,
        },
        table: {
            showInlineActions: false,
        },
        emptyState: {
            title: "No existen recursos asociados",
            description: "Los recursos aparecerán aquí cuando se empiecen a crear."
        },
        titleConfig: {
            title: 'Recursos',
            description: '',
            icon: <GridViewRounded sx={{color: 'primary.main'}} />,
        }
    });
    
    // Ref para rastrear si ya se hizo la primera carga
    const initialLoadDone = useRef(false);
    const resourcesRef = useRef([]);

    const getResourceList = async (showLoading = false, append = false) => {
        if (showLoading && !append) {
            setIsLoadingList(true);
        } else if (append) {
            setIsLoadingMore(true);
        }
        
        try {
            const currentOffset = append ? resourcesRef.current.length : 0;
            const limit = 500; // Cargar de 100 en 100
            
            const requestData = {
                type: ['panel', 'dashboard'],
                filtered_groups: [],
                limit: limit,
                offset: currentOffset,
                q: debouncedSearchValue,
                order_by: sortDirection,
                order_field: sortField,
                filter: [
                    { field: 'in_trash', value: false },
                    { field: 'folder_id', value: sessionStorage.getItem('folderId') },
                    { field: 'project_id', value: sessionStorage.getItem('projectId') },
                    { field: 'application_id', value: application_id },
                ]
            };

            const response = await getACLList(requestData, {
                'Authorization': `Bearer ${props.user[0].userID}`
            });

            if (response?.data) {
                const { results, count } = response.data;
                
                // Asegurar que results sea un array
                const safeResults = Array.isArray(results) ? results : [];
                
                let newResources;
                if (append) {
                    newResources = [...resourcesRef.current, ...safeResults];
                } else {
                    newResources = safeResults;
                }
                
                resourcesRef.current = newResources;
                setResources(newResources);
                
                setTotalResources(count || 0);
                setHasMore(safeResults.length === limit && (currentOffset + limit) < count);
                
                const mappedResources = safeResults.map((resource) => ({
                    id: resource.id,
                    name: resource.name,
                    type: resource.acl_object_type || "dashboard",
                    url_image: resource.url_image,
                    url: resource.url
                }));
                
                if (append) {
                    setExampleItems(prev => [...prev, ...mappedResources]);
                } else {
                    setExampleItems(mappedResources);
                }
            } else {
                console.warn("Respuesta sin data válida:", response);
                if (!append) {
                    setResources([]);
                    resourcesRef.current = [];
                    setTotalResources(0);
                }
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error al obtener recursos:', error);
            if (!append) {
                setResources([]);
                resourcesRef.current = [];
                setTotalResources(0);
            }
            setHasMore(false);
        } finally {
            setIsLoadingList(false);
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        // Cargar recursos solo una vez al montar
        if (!initialLoadDone.current && props.user && props.user[0]?.userID) {
            initialLoadDone.current = true;
            getResourceList(true);
        }
    }, []);

    // Recargar recursos cuando cambia el valor de búsqueda con debounce
    useEffect(() => {
        if (initialLoadDone.current && props.user && props.user[0]?.userID) {
            getResourceList(true);
        }
    }, [debouncedSearchValue]);

    // Recargar recursos cuando cambia el ordenamiento
    useEffect(() => {
        if (initialLoadDone.current && props.user && props.user[0]?.userID) {
            getResourceList(true);
        }
    }, [sortField, sortDirection]);

    // Handlers - Definir primero las funciones más básicas
    
    // Función para editar recurso (usada por otros handlers)
    const handleOpenResourceDirect = useCallback(async (resource) => {
        // Cerrar sidebar si está abierto
        setIsSidebarOpen(false);
        
        // Mostrar loader de navegación
        setIsRedirecting(true);
        
        // Guardar el recurso seleccionado
        sessionStorage.setItem('resourceId', resource.id);
        sessionStorage.setItem('resourceName', resource.name);
        sessionStorage.setItem('resourceType', resource.acl_object_type || resource.type);
        
        // Pequeño delay para mostrar el feedback visual
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Navegar al workspace correspondiente según el tipo
        if (resource.acl_object_type === 'panel' || resource.type === 'panel') {
            router.push(`/panelsWorkspace`);
        } else {
            router.push(`/dashboardsWorkspace`);
        }
    }, [router]);

    // Función para ver recurso (usada por otros handlers)
    const handleViewResourceDirect = useCallback(async (resource) => {
        // Cerrar sidebar si está abierto
        setIsSidebarOpen(false);
        
        // Mostrar loader de navegación
        setIsRedirecting(true);

        // Pequeño delay para mostrar el feedback visual
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Navegar al workspace correspondiente según el tipo
        router.push(`/${resource.type}/${resource.id}`);
    }, [router]);

    // Función para invalidar caché de un recurso específico
    const invalidateResourceCache = useCallback((resourceId) => {
        if (resourceId) {
            setResourceDetailsCache(prev => {
                const newCache = { ...prev };
                delete newCache[resourceId];
                return newCache;
            });
        }
    }, []);

    // Función para limpiar todo el caché
    const clearResourceCache = useCallback(() => {
        setResourceDetailsCache({});
    }, []);

    // Función para obtener los detalles completos del recurso usando el servicio
    const fetchResourceDetails = useCallback(async (resourceId) => {
        if (!resourceId) return;

        // Verificar si ya está en caché
        if (resourceDetailsCache[resourceId]) {
            setResourceDetailedData(resourceDetailsCache[resourceId]);
            setIsLoadingResourceDetails(false);
            return;
        }

        const params = {
            resourceId,
            userToken: props.user[0].userID
        };

        const stateSetters = {
            setIsLoadingResourceDetails,
            setResourceDetailedData: (data) => {
                setResourceDetailedData(data);
                // Guardar en caché
                if (data) {
                    setResourceDetailsCache(prev => ({
                        ...prev,
                        [resourceId]: data
                    }));
                }
            }
        };

        await getResourceDetailedData(params, stateSetters);
    }, [props.user, resourceDetailsCache]);

    const handleResourceCardClick = useCallback((resource, event) => {
        // Click simple: solo selecciona el elemento
        setSelectedResource(resource);
        // Fetch de detalles completos del recurso
        fetchResourceDetails(resource.id);
    }, [fetchResourceDetails]);

    const handleResourceCardDoubleClick = useCallback((resource, event) => {
        // Doble click: siempre abre el recurso (editar o ver según permisos)
        if (resource.can_edit === false) {
            // No editable - mostrar notificación y vibración
            dispatch(pushNotification({ 
                msg: `No tienes permisos para editar "${resource.name}"`, 
                status: 'err' 
            }));
            
            // Vibración leve si está disponible
            if (navigator.vibrate) {
                navigator.vibrate([50, 30, 50]); // Patrón: vibra-pausa-vibra
            }
        } else {
            // Editable - abrir editor directamente
            handleEdit(resource);
        }
    }, [handleOpenResourceDirect, dispatch]);

    const handleToggleSidebar = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, []);

    const handleCloseSidebar = useCallback(() => {
        setIsSidebarOpen(false);
        // Limpiar los datos detallados al cerrar el sidebar
        setResourceDetailedData(null);
    }, []);

    const handleOpenResource = useCallback(async () => {
        if (!selectedResource) return;
        handleViewResourceDirect(selectedResource);
    }, [selectedResource, handleViewResourceDirect]);

    const handleCreateOptionSelect = useCallback(async (option) => {
        if (option === 'dashboard') {
            setIsRedirecting(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            router.push('/dashboardsWorkspace');
        } else if (option === 'panel') {
            setIsRedirecting(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            router.push('/panelsWorkspace');
        }
    }, [router]);

    const handleEdit = useCallback((item) => {
        if (item.can_edit === false) {
            setIsNotAllowedModal(true);
            setNotAllowedResource(item);
        } else {
            // Invalidar caché cuando se va a editar
            invalidateResourceCache(item?.id);

            // Si es editable, abrir el editor
            handleOpenResourceDirect(item);
        }
        
    }, [handleOpenResourceDirect, dispatch, invalidateResourceCache]);

    const handleDelete = useCallback((item) => {
        setResourceDelete(item);
        setIsDeleteModal(true);
    }, []);

    const handleView = useCallback((item) => {
        setSelectedResource(item);
        if (!isSidebarOpen) {
            setIsSidebarOpen(true);
        }
        // Fetch de detalles completos del recurso
        fetchResourceDetails(item.id);
    }, [isSidebarOpen, fetchResourceDetails]);

    const handleTrash = useCallback(async (item) => {
        if (item.can_edit === false) {
            setIsNotAllowedModal(true);
            setNotAllowedResource(item);
        } else {
            setSelectedTrashResource(item);
            setIsTrashModal(true);
        }
    }, [props.user, dispatch, invalidateResourceCache]);

    const columns = useMemo(() => {
        const baseColumns = getTableColumns([], true);
        const [nameColumn, ...otherColumns] = baseColumns;

        const resourceNameColumn = {
            ...nameColumn,
            contentType: undefined,
            contentProps: undefined,
            renderCell: (params) => (
                <ResourceTableName
                    resource={params.row}
                    previewUrl={getResourcePreviewUrl(params.row)}
                    type={getResourceType(params.row)}
                />
            ),
        };

        const actionsColumn = {
            field: "actions",
            headerName: "Acciones",
            width: 112,
            minWidth: 112,
            maxWidth: 112,
            sortable: false,
            disableColumnMenu: true,
            align: "left",
            headerAlign: "left",
            renderCell: (params) => (
                <ResourceTableActions
                    resource={params.row}
                    onView={handleView}
                    onEdit={handleEdit}
                    onTrash={handleTrash}
                />
            ),
        };

        const tagsColumn = otherColumns.find((column) => column.field === "tags");
        const dateColumns = otherColumns.filter((column) => column.field !== "tags");
        const resourceTagsColumn = tagsColumn
            ? {
                  ...tagsColumn,
                  width: 130,
                  minWidth: 120,
                  maxWidth: 140,
              }
            : null;

        return [resourceNameColumn, resourceTagsColumn, actionsColumn, ...dateColumns].filter(Boolean);
    }, [
        getTableColumns,
        getResourcePreviewUrl,
        handleView,
        handleEdit,
        handleTrash,
    ]);

    const handleFavorite = useCallback((item) => {
        console.log("Marcar como favorito:", item);
    }, []);

    const getDataSourcesForExport = useCallback(async (dashboardExport) => {
        const missingDataSourceIds = getMissingDashboardExportDatasourceIds({
            dashboardExport,
            dataSources
        });

        if (missingDataSourceIds.length === 0) {
            return dataSources;
        }

        const missingDataSources = await Promise.all(
            missingDataSourceIds.map(async (id) => {
                try {
                    const response = await dataSourceManagerGeneralRequest({
                        version: 'v1',
                        typeRequest: 'GET',
                        nameUrl: 'dataSourceById',
                        dynamicParams: { id }
                    });

                    return response?.status === 'success' || response?.status === 'ok'? response?.data : null;
                } catch (error) {
                    console.error('Error al obtener fuente de datos para exportación:', error);
                    return null;
                }
            })
        );

        return [
            ...dataSources,
            ...missingDataSources.filter(Boolean)
        ];
    }, [dataSources]);

    const handleCancelExport = useCallback(() => {
        exportCancelledRef.current = true;
        setExportingDashboardId(null);
    }, []);

    const handleCancelPaste = useCallback(() => {
        pasteCancelledRef.current = true;
        setIsPastingDashboard(false);
    }, []);

    useEffect(() => {
        if (!exportingDashboardId) return undefined;

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                handleCancelExport();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [exportingDashboardId, handleCancelExport]);

    useEffect(() => {
        if (!isPastingDashboard) return undefined;

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                handleCancelPaste();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isPastingDashboard, handleCancelPaste]);

    const handleExportDashboardAction = useCallback(async (item) => {
        if (!isDashboardResource(item) || exportingDashboardId === item?.id) {
            return;
        }

        const userToken = props.user?.[0]?.userID;
        if (!item?.id || !userToken) {
            dispatch(pushNotification({
                msg: 'No se pudo exportar el tablero: faltan datos requeridos',
                status: 'err'
            }));
            return;
        }

        exportCancelledRef.current = false;
        setExportingDashboardId(item.id);

        try {
            const dashboardExport = await exportDashboard(item.id, userToken);
            if (exportCancelledRef.current) return;

            const exportDataSources = await getDataSourcesForExport(dashboardExport);
            if (exportCancelledRef.current) return;

            const preparedExport = prepareDashboardExportData({
                dashboardExport,
                dataSources: exportDataSources
            });
            if (exportCancelledRef.current) return;

            const downloaded = await downloadDashboardExportZip({
                data: preparedExport,
                fileName: buildDashboardExportFileName(item.name),
                dashboardName: item.name
            });
            if (exportCancelledRef.current) return;

            if (!downloaded) {
                throw new Error('No se pudo generar el Zip.');
            }

            dispatch(pushNotification({
                msg: 'Your dashboard has been successfully exported. Please check your downloads folder.',
                status: 'ok'
            }));
        } catch (error) {
            if (exportCancelledRef.current) return;
            console.error('Error al exportar tablero:', error);
            dispatch(pushNotification({
                msg: error?.message || 'No se pudo exportar el tablero',
                status: 'err'
            }));
        } finally {
            if (!exportCancelledRef.current) {
                setExportingDashboardId(null);
            }
        }
    }, [dispatch, exportingDashboardId, getDataSourcesForExport, isDashboardResource, props.user]);

    const handlePasteDashboard = useCallback(async () => {
        const clipboard = getDashboardClipboard();
        const currentFolderId = getCurrentFolderId();
        const userToken = props.user?.[0]?.userID;

        if (!clipboard?.dashboardId || !canPasteInFolder(currentFolderId)) {
            dispatch(pushNotification({
                msg: 'No hay ningún tablero copiado para pegar en esta carpeta.',
                status: 'err'
            }));
            return;
        }
        if (!userToken || !application_id || !currentFolderId) {
            dispatch(pushNotification({
                msg: 'No se pudo pegar el tablero: faltan datos requeridos',
                status: 'err'
            }));
            return;
        }

        pasteCancelledRef.current = false;
        setIsPastingDashboard(true);
        try {
            await duplicateDashboardInFolder({
                dashboardId: clipboard.dashboardId,
                applicationId: application_id,
                folderId: currentFolderId,
                userToken
            });
            if (pasteCancelledRef.current) return;

            await getResourceList(true);
            if (pasteCancelledRef.current) return;

            dispatch(pushNotification({
                msg: 'Tablero duplicado correctamente en esta carpeta.',
                status: 'ok'
            }));
        } catch (error) {
            if (pasteCancelledRef.current) return;
            console.error('Error al duplicar tablero:', error);
            dispatch(pushNotification({
                msg: error?.message || 'No se pudo duplicar el tablero',
                status: 'err'
            }));
        } finally {
            if (!pasteCancelledRef.current) {
                setIsPastingDashboard(false);
            }
        }
    }, [
        application_id,
        dispatch,
        getCurrentFolderId,
        props.user
    ]);

    useEffect(() => {
        const isTypingTarget = (target) => {
            if (!target || typeof target !== 'object') return false;
            const tag = target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
            return Boolean(target.isContentEditable);
        };

        const hasClipboardModifier = (event) =>
            (event.ctrlKey || event.metaKey) && !event.altKey;

        const isBlockingOverlay =
            isCreateModal ||
            isDeleteModal ||
            isAssociatedModal ||
            isNotAllowedModal ||
            isTrashModal ||
            isRedirecting ||
            isPastingDashboard ||
            Boolean(exportingDashboardId);

        const onKeyDown = (event) => {
            if (!hasClipboardModifier(event) || event.shiftKey) return;
            if (isBlockingOverlay) return;
            if (isTypingTarget(event.target)) return;

            if (event.code === 'KeyC') {
                if (
                    !selectedResource ||
                    !isDashboardResource(selectedResource) ||
                    selectedResource.can_edit === false
                ) {
                    return;
                }
                event.preventDefault();
                handleCopyDashboard(selectedResource);
                return;
            }

            if (event.code === 'KeyV') {
                const currentFolderId = getCurrentFolderId();
                if (!canPasteInFolder(currentFolderId)) return;
                event.preventDefault();
                void handlePasteDashboard();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [
        exportingDashboardId,
        getCurrentFolderId,
        handleCopyDashboard,
        handlePasteDashboard,
        isAssociatedModal,
        isCreateModal,
        isDeleteModal,
        isDashboardResource,
        isNotAllowedModal,
        isPastingDashboard,
        isRedirecting,
        isTrashModal,
        selectedResource
    ]);

    const handleTrashResourceAction = useCallback(async (item) => {
        const stateSetters = {
            setIsLoadingTrash: setIsLoadingTrash
        };
        const callbacks = {
            pushNotification,
            getResourceList: () => {
                // Invalidar caché del recurso eliminado
                invalidateResourceCache(item.id);
                getResourceList(true);
            }
        };
        const params = {
            userID: props.user[0].userID,
            resource: item
        };
        
        const result = await handleResourceTrash(params, stateSetters, callbacks);
        
        // Si hay error de asociación, mostrar modal con dashboards asociados
        if (result?.isAssociated && result?.associatedDashboards) {
            setSelectedResource(item);
            setAssociatedDashboards(result.associatedDashboards);
            setIsAssociatedModal(true);
            setIsTrashModal(false);
        } else {
            setTrashResult({
                success: result.success,
                error: result.message
            });     
        }
    }, []);

    const handleLoadMore = useCallback(() => {
        if (hasMore && !isLoadingMore && !isLoadingList) {
            getResourceList(false, true);
        }
    }, [hasMore, isLoadingMore, isLoadingList]);

    const handleSearch = useCallback((value) => {
        setSearchValue(value);
    }, []);

    const handleSortChange = useCallback((sort) => {
        setSortField(sort.field);
        setSortDirection(sort.direction);
    }, []);

    // Handlers para la tabla (lista)
    const handleRowClick = useCallback((params) => {
        // Click simple en tabla: solo selecciona el elemento
        setSelectedResource(params.row);
        // Fetch de detalles completos del recurso
        fetchResourceDetails(params.row.id);
    }, [fetchResourceDetails]);

    const handleRowDoubleClick = useCallback((params) => {
        const resource = params.row;
        
        // Doble click en tabla: abre directamente el recurso
        if (resource.can_edit === false) {
            // No editable - mostrar notificación y vibración
            dispatch(pushNotification({ 
                msg: `No tienes permisos para editar "${resource.name}"`, 
                status: 'err' 
            }));
            
            // Vibración leve si está disponible
            if (navigator.vibrate) {
                navigator.vibrate([50, 30, 50]);
            }
        } else {
            // Editable - abrir editor directamente
            handleEdit(resource);
        }
    }, [handleEdit, dispatch]);

    const contextMenuActions = {
        view: handleView,
        edit: handleEdit,
        exportDashboard: handleExportDashboardAction,
        copyDashboard: handleCopyDashboard,
        trash: handleTrash,
    };

    const backgroundContextMenuActions = {
        pasteDashboard: handlePasteDashboard,
    };

    // Limpiar datos detallados cuando se deselecciona un recurso
    useEffect(() => {
        if (!selectedResource) {
            setResourceDetailedData(null);
        }
    }, [selectedResource]);

    useEffect(() => {
        if (isTrashModal == false) {
            setIsLoadingTrash(false);
            setTrashResult({});
        }
    }, [isTrashModal]);

    // Campos personalizados para el sidebar de detalles
    const resourceCustomFields = useMemo(() => {
        if (!selectedResource) return [];

        // Usar resourceDetailedData si está disponible, de lo contrario usar selectedResource
        const resourceData = resourceDetailedData || selectedResource;
        
        // Mostrar loading si se están cargando los detalles
        if (isLoadingResourceDetails) {
            return [
                {
                    label: 'Cargando detalles...',
                    content: (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <CircularProgress size={18} />
                            <Typography variant="body2" color="text.secondary">
                                Obteniendo información completa...
                            </Typography>
                        </Box>
                    )
                }
            ];
        }

        return [
            {
                label: 'Usuario Propietario',
                content: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Person sx={{ fontSize: 18, color: 'primary.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {resourceData.creator_user_name || 'N/A'}
                        </Typography>
                    </Box>
                )
            },
            {
                label: 'Usuario Editor',
                content: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Person sx={{ fontSize: 18, color: 'accent.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {resourceData.editor_user_name || 'N/A'}
                        </Typography>
                    </Box>
                )
            },
            {
                label: 'Grupo',
                content: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Group sx={{ fontSize: 18, color: 'info.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {resourceData.group_name || 'N/A'}
                        </Typography>
                    </Box>
                )
            },
            {
                label: 'Rol de Visualización',
                content: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <SecurityIcon sx={{ fontSize: 18, color: 'success.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {resourceData.view_role?.type || 'N/A'}
                        </Typography>
                    </Box>
                )
            },
            {
                label: 'Rol de Edición',
                content: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <SecurityIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {resourceData.edit_role?.type || 'N/A'}
                        </Typography>
                    </Box>
                )
            }
        ];
    }, [selectedResource, resourceDetailedData, isLoadingResourceDetails]);

    // Asegurar que los recursos tengan colores, tags e íconos renderizados
    const resourcesWithMetadata = useMemo(() => {
        // Asegurar que resources sea un array
        if (!Array.isArray(resources)) {
            console.warn("Resources no es un array:", resources);
            return [];
        }

        const withColors = ensureItemsHaveColors(resources);
        const withTags = ensureItemsHaveTags(withColors, 'resource');
        
        const withIcons = Array.isArray(withTags) ? withTags.map(item => ({
            ...item,
            previewUrl: getResourcePreviewUrl(item),
            icon: renderResourceIcon(item)
        })) : [];
        
        // Aplicar filtro por tipo si está seleccionado
        const selectedType = typeSelectState.state.field.value;
        if (selectedType) {
            return withIcons.filter(item => item.type === selectedType || item.acl_object_type === selectedType);
        }
        
        return withIcons;
    }, [
        resources,
        getResourcePreviewUrl,
        renderResourceIcon,
        typeSelectState.state.field.value
    ]);

    // Contenido del sidebar
    const sidebarContent = (
        <DetailsSidebar
            item={selectedResource}
            chipConfig={selectedResource ? {
                label: (selectedResource.acl_object_type === 'panel' || selectedResource.type === 'panel') ? 'Panel' : 'Dashboard',
                color: (selectedResource.acl_object_type === 'panel' || selectedResource.type === 'panel') ? '#9c27b0' : '#1976d2',
                icon: (selectedResource.acl_object_type === 'panel' || selectedResource.type === 'panel') 
                    ? <BarChartIcon sx={{ fontSize: 14, color: 'white' }} /> 
                    : <DashboardIcon sx={{ fontSize: 14, color: 'white' }} />,
                secondaryChip: selectedResource.can_edit === false && (
                    <Chip 
                        icon={<EditOffIcon sx={{ fontSize: 12, color: 'white' }} />}
                        label="Solo Lectura"
                        size="small"
                        sx={{ 
                            height: 24, 
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            borderRadius: 1.5,
                            backgroundColor: '#d32f2f',
                            color: 'white',
                            '& .MuiChip-icon': {
                                color: 'white'
                            }
                        }}
                    />
                )
            } : undefined}
            onClose={handleCloseSidebar}
            itemCount={resources.length}
            onCreateClick={() => setIsCreateModal(true)}
            entityName="Recurso"
            customFields={resourceCustomFields}
            showVisibility={false}
            actions={selectedResource ? [
                {
                    label: 'Ver',
                    icon: <Visibility sx={{ fontSize: 18 }} />,
                    onClick: handleOpenResource,
                    style: 'secondary'
                },
                {
                    label: 'Editar',
                    icon: <EditIcon sx={{ fontSize: 18 }} />,
                    onClick: () => contextMenuActions.edit?.(selectedResource),
                    style: 'primary',
                    hidden: selectedResource.can_edit === false
                },
                {
                    type: 'divider',
                    hidden: selectedResource.can_edit === false
                },
                {
                    label: 'Mover a Papelera',
                    icon: <DeleteOutlineRounded sx={{ fontSize: 18 }} />,
                    onClick: () => contextMenuActions.trash?.(selectedResource),
                    style: 'danger',
                    hidden: selectedResource.can_edit === false
                }
            ] : []}
        />
    );
    
    return (
        <>
            <ExplorerView
                config={explorerConfig}
                items={resourcesWithMetadata}
                isLoading={isLoadingList}
                columns={columns}
                getRows={getTableRows}
                onItemClick={handleResourceCardClick}
                onItemDoubleClick={handleResourceCardDoubleClick}
                onRowClick={handleRowClick}
                onRowDoubleClick={handleRowDoubleClick}
                onCreateClick={() => setIsCreateModal(true)}
                onFavoriteClick={handleFavorite}
                onMoreOptionsClick={(item) => setSelectedResource(item)}
                contextMenuActions={contextMenuActions}
                backgroundContextMenuActions={backgroundContextMenuActions}
                userNames={userNames}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                totalCount={totalResources}
                sidebarContent={sidebarContent}
                isSidebarOpen={isSidebarOpen}
                onCloseSidebar={handleCloseSidebar}
                cardsGridSx={RESOURCE_CARD_GRID_SX}
                onSearch={handleSearch}
                onSortChange={handleSortChange}
                headerSlots={{
                    breadcrumb: <BreadcrumbsNav />,
                    filters: (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                            <CustomSelect state={typeSelectState.state} />
                        </Box>
                    ),
                    sidebarToggle: (
                        <Tooltip title={isSidebarOpen ? 'Ocultar panel de información' : 'Mostrar panel de información'}>
                            <IconButton
                                onClick={handleToggleSidebar}
                                size="small"
                                sx={{
                                    color: isSidebarOpen ? 'primary.main' : 'text.secondary',
                                    backgroundColor: isSidebarOpen ? 'rgb(236, 236, 236)' : 'transparent',
                                    borderRadius: 1.5,
                                    border: '1px solid rgb(207, 205, 205)',
                                    '&:hover': {
                                        backgroundColor: 'action.hover',
                                    },
                                    height: '38px'
                                }}
                                
                            >
                                {isSidebarOpen ? (
                                    <ChevronRight fontSize='small' />
                                ) : (
                                    <ChevronLeft fontSize='small' />
                                )}
                            </IconButton>
                        </Tooltip>
                    )
                }}
                badgeConfig={{
                    field: 'can_edit',
                    value: false,
                    icon: <LockRounded sx={{ fontSize: 18, color: '#a3a3a3' }} />,
                    position: 'top-right',
                    backgroundColor: '#FFFFFF',
                    showShadow: true
                }}
            >
                {/* Modales */}
                <CreateResource
                    open={isCreateModal}
                    onClose={() => setIsCreateModal(false)}
                    onSelectOption={handleCreateOptionSelect}
                    isRedirecting={isRedirecting}
                />

                <DeleteModal
                    open={isDeleteModal}
                    onClose={() => setIsDeleteModal(false)}
                    user={props.user[0]}
                    titleToDelete={resourceDelete?.name}
                    idToDelete={resourceDelete?.id}
                    entityType={getResourceType(resourceDelete) || 'dashboard'}
                    entityName="recurso"
                    entityIdField={getResourceType(resourceDelete) === 'panel' ? 'panel_id' : 'dashboard_id'}
                    onSuccess={()=> getResourceList(true)}
                    onError={() => setIsDeleteModal(false)}
                />

                <AssociatedDashboardsModal
                    open={isAssociatedModal}
                    onClose={() => {
                        setIsAssociatedModal(false);
                        setAssociatedDashboards([]);
                    }}
                    selectedProduct={selectedResource}
                    associatedDashboards={associatedDashboards}
                />

                <TrashModal
                    open={isTrashModal}
                    onClose={() => setIsTrashModal(false)}
                    selectedItem={selectedTrashResource}
                    onTrash={handleTrashResourceAction}
                    isLoadingTrash={isLoadingTrash}
                    entityName="Recurso"
                    context={{ icon: <DashboardIcon sx={{ fontSize: 20, color: 'white', backgroundColor: selectedTrashResource?.color ? selectedTrashResource.color : '#1976d2' }} />, label: 'Recurso'}}
                    trashResult={trashResult}
                />

                <NotAllowedModal
                    open={isNotAllowedModal}
                    onClose={() => setIsNotAllowedModal(false)}
                    selectedItem={notAllowedResource}
                    context={{ icon: <DashboardIcon sx={{ fontSize: 20, color: 'white', backgroundColor: notAllowedResource?.color ? notAllowedResource.color : '#1976d2' }} />, label: 'Recurso'}}
                />

            </ExplorerView>

            {/* Overlay de carga al navegar a un recurso */}
            <Backdrop
                sx={{
                    color: '#fff',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    px: 2
                }}
                open={isRedirecting || Boolean(exportingDashboardId) || isPastingDashboard}
            >
                {isPastingDashboard ? (
                    <Box sx={{ width: '100%', maxWidth: 420 }}>
                        <ImportWizardLoadingAnimation
                            {...dashboardDuplicatingLoadingProps}
                            onCancel={handleCancelPaste}
                            cancelLabel="Cancelar duplicación"
                        />
                    </Box>
                ) : exportingDashboardId ? (
                    <Box sx={{ width: '100%', maxWidth: 420 }}>
                        <ImportWizardLoadingAnimation
                            {...dashboardExportingLoadingProps}
                            onCancel={handleCancelExport}
                        />
                    </Box>
                ) : (
                    <LoadingAssembly state={{ message: 'Abriendo recurso...', borderRadius: false, boxShadow: false }} />
                )}
            </Backdrop>
        </>
    )
}

const mapStateToProps = state => {
    return {
        user: state.user,
        organization: state.organization,
        actions: state.actions,
        permissions: state.permissions,
    };
};

export default connect(mapStateToProps)(Resources);
