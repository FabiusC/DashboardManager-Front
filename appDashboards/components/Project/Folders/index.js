"use client"
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { connect, useDispatch } from 'react-redux';
import { Dialog, Backdrop, CircularProgress, Typography, Box, Chip, IconButton, Divider, Tooltip } from '@mui/material';
import { Edit as EditIcon, Visibility, DeleteOutlineRounded, DeleteRounded, StarRounded, StarBorderRounded, Add, Folder as FolderIcon, FolderOutlined, Person, LockRounded, MenuOpen, Group as GroupIcon, Security as SecurityIcon, ChevronRight, ChevronLeft } from '@mui/icons-material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import ExplorerView from '@components/Base/ExplorerView';
import { useExplorerConfig } from '@components/Base/ExplorerView/useExplorerConfig';
import { createDateColumn, createNumberColumn, ensureItemsHaveColors, ensureItemsHaveTags } from '@components/Base/ExplorerView/explorerUtils';
import DetailsSidebar from '@components/Base/DetailsSidebar';
import EditFolder from './EditFolder';
import CreateFolder from './CreateFolder';
import DeleteFolder from './DeleteFolder';
import { clearSessionStorage } from '../../../utilities/sessionStorageUtils';
import { getFolderList, handleCardClick, handleTrashFolder, getFolderDetailedData } from './services/Folder';
import BreadcrumbsNav from '@components/Project/Breadcrumbs';
import { pushNotification } from '@redux/actions';
import moment from 'moment';
import 'moment/locale/es';
import useDebounce from 'hooks/useDebounce';
import { userValidateCreation } from '@services/creangelAuthAPI';
import TrashModal from '@components/Project/Components/TrashModal';
import NotAllowedModal from '@components/Project/Components/NotAllowedModal';
moment.locale('es')

function Folders(props) {
    const router = useRouter();
    const dispatch = useDispatch();
    const [folders, setFolders] = useState([]);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [isCreateModal, setIsCreateModal] = useState(false);
    const [isDeleteModal, setIsDeleteModal] = useState(false);
    const [isLoadingTrash, setIsLoadingTrash] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [folderDetailedData, setFolderDetailedData] = useState(null);
    const [isLoadingFolderDetails, setIsLoadingFolderDetails] = useState(false);
    const [folderDelete, setFolderDelete] = useState(null);
    const [folderDetailsCache, setFolderDetailsCache] = useState({});
    const [userNames, setUserNames] = useState({});
    const [foldersPerPage, setFoldersPerPage] = useState(500);
    const [offset, setOffset] = useState(0);
    const [projectId, setProjectId] = useState(null);
    const [groupId, setGroupId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchValue, setSearchValue] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [showCreateButton, setShowCreateButton] = useState(true);
    const [selectedTrashFolder, setSelectedTrashFolder] = useState(null);
    const [isNotAllowedModal, setIsNotAllowedModal] = useState(false);
    const [notAllowedFolder, setNotAllowedFolder] = useState(null);
    const [trashResult, setTrashResult] = useState({});
    const [isTrashModal, setIsTrashModal] = useState(false);


    const handleValidateCreation = useCallback(async () => {
        const res = await userValidateCreation({
            type: 'folder',
            parent_type: 'project',
            parent_id: sessionStorage.getItem('projectId')
        }, {
            'Authorization': `Bearer ${props.user[0].userID}`
        });
        setShowCreateButton(res.data.can_create);
    }, [props.user]);

    // Debounce del search para evitar múltiples llamadas (500ms)
    const debouncedSearchValue = useDebounce(searchValue, 500);

    useEffect(() => {
        clearSessionStorage(['folderId', 'folderName', 'resourceId', 'resourceName', 'panelId']);
        const sessionProjectId = sessionStorage.getItem('projectId');
        const sessionProjectName = sessionStorage.getItem('projectName');
        const sessionGroupId = sessionStorage.getItem('groupId');
        if (sessionProjectId && sessionProjectName && sessionGroupId) {
            setProjectId(sessionProjectId);
            setGroupId(sessionGroupId);
        } else {
            router.push('/projects');
        }

        handleValidateCreation();
    }, []);
    
    // Usar el hook de configuración del explorador
    const { getExplorerConfig, getTableColumns, getTableRows } = useExplorerConfig('folder', {
        icon: FolderIcon
    });

    // Configurar columnas de la tabla - Solo columnas adicionales
    // El orden base es: Nombre, Tags, Fecha de Creación, Fecha de Modificación (manejado por getTableColumns)
    const columns = getTableColumns([]);

    // Función para obtener items del context menu según permisos
    const getContextMenuItems = useCallback((item) => {
        if (!item) return [];
        
        const menuItems = [
            { id: 'view', label: 'Ver más', icon: <Visibility /> }
        ];
        
        // Solo mostrar editar y mover a papelera si el usuario puede editar
        if (item.can_edit !== false) {
            menuItems.push(
                { id: 'edit', label: 'Editar', icon: <EditIcon /> },
                { id: 'trash', label: 'Mover a Papelera', icon: <DeleteOutlineRounded /> }
            );
        }
        
        return menuItems;
    }, []);

    // Configuración del explorador - Pasar las columnas para generar campos de ordenamiento automáticamente
    const explorerConfig = getExplorerConfig({
        menu: {
            title: 'Mis carpetas',
            buttonLabel: 'Nuevo',
            buttonIcon: <Add />,
            showButton: showCreateButton,
            options: [
                { label: 'Carpetas', value: 'folders', icon: <FolderOutlined />, iconSelected: <FolderIcon /> },
                // { label: 'Favoritos', value: 'favorites', icon: <StarBorderRounded />, iconSelected: <StarRounded /> },
                { label: 'Papelera', value: 'trash', icon: <DeleteOutlineRounded />, iconSelected: <DeleteRounded /> }
            ],
            selectedOption: 'folders',
            onOptionClick: (optionId) => {
                if (optionId === 'trash') {
                    router.push('/trash?from=folders');
                } else if (optionId === 'favorites') {
                    router.push('/favorites?from=folders');
                }
            }
        },
        viewMode: {
            defaultValue: sessionStorage.getItem('viewMode') || 'large-icons',
            persist: true
        },
        sort: {
            defaultField: 'name',
            // Los campos se generan automáticamente de las columnas de la tabla
            defaultDirection: 'asc'
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
            title: "No existen carpetas asociadas al proyecto",
            description: "Las carpetas aparecerán aquí cuando se empiecen a asociar."
        },
        titleConfig: {
            title: 'Carpetas',
            description: '',
            icon: <FolderIcon sx={{color: 'primary.main'}} />,
        }
    }, columns); // Pasar las columnas para generar campos de ordenamiento
    
    const handleGetFolderList = useCallback(async (showLoading = false, projectIdParam = null) => {
        const params = {
            foldersPerPage,
            offset,
            searchValue: debouncedSearchValue,
            sortField: sortField,
            sortDirection: sortDirection,
            userToken: props.user[0].userID,
            projectId: projectId || projectIdParam,
            showLoading
        };

        const stateSetters = {
            setIsLoadingList,
            setFolders
        };

        const result = await getFolderList(params, stateSetters);
        
        if (result.error) {
            console.error('Error al obtener carpetas:', result.error);
        }
        
        return result;
    }, [foldersPerPage, offset, debouncedSearchValue, sortField, sortDirection, projectId, props.user]);

    const handleSearch = useCallback((value) => {
        setSearchValue(value);
    }, []);

    const handleSortChange = useCallback((sort) => {
        setSortField(sort.field);
        setSortDirection(sort.direction);
    }, []);

    // Ref para controlar la carga inicial
    const isInitialLoad = useRef(true);

    useEffect(() => {
        if (!projectId) return;
        
        // Solo cargar en el mount inicial
        if (isInitialLoad.current) {
            handleGetFolderList(true);
            isInitialLoad.current = false;
        }
    }, [projectId]);

    // Recargar carpetas cuando cambia la búsqueda con debounce
    useEffect(() => {
        if (!isInitialLoad.current && projectId && props.user && props.user[0]?.userID) {
            handleGetFolderList(true);
        }
    }, [debouncedSearchValue, projectId, handleGetFolderList]);

    // Recargar carpetas cuando cambia el ordenamiento
    useEffect(() => {
        if (!isInitialLoad.current && projectId && props.user && props.user[0]?.userID) {
            handleGetFolderList(true);
        }
    }, [sortField, sortDirection, projectId, handleGetFolderList]);

    // Función para invalidar caché de una carpeta específica
    const invalidateFolderCache = useCallback((folderId) => {
        if (folderId) {
            setFolderDetailsCache(prev => {
                const newCache = { ...prev };
                delete newCache[folderId];
                return newCache;
            });
        }
    }, []);

    // Función para limpiar todo el caché
    const clearFolderCache = useCallback(() => {
        setFolderDetailsCache({});
    }, []);

    // Asegurar que las carpetas tengan colores, tags e íconos renderizados
    const foldersWithColors = useMemo(() => {
        const withColors = ensureItemsHaveColors(folders);
        const withTags = ensureItemsHaveTags(withColors, 'folder');
        // Agregar íconos renderizados
        return withTags.map(item => ({
            ...item,
            icon: <FolderIcon sx={{ color: item.color || '#FFD745'}} />
        }));
    }, [folders]);

    // Función para obtener los detalles completos de la carpeta usando el servicio
    const fetchFolderDetails = useCallback(async (folderId) => {
        if (!folderId) return;

        // Verificar si ya está en caché
        if (folderDetailsCache[folderId]) {
            setFolderDetailedData(folderDetailsCache[folderId]);
            setIsLoadingFolderDetails(false);
            return;
        }

        const params = {
            folderId,
            userToken: props.user[0].userID
        };

        const stateSetters = {
            setIsLoadingFolderDetails,
            setFolderDetailedData: (data) => {
                setFolderDetailedData(data);
                // Guardar en caché
                if (data) {
                    setFolderDetailsCache(prev => ({
                        ...prev,
                        [folderId]: data
                    }));
                }
            }
        };

        await getFolderDetailedData(params, stateSetters);
    }, [props.user, folderDetailsCache]);

    // Handlers
    const handleFolderCardClick = useCallback((folder) => {
        // Click simple: solo selecciona el elemento
        setSelectedFolder(folder);
        // Fetch de detalles completos de la carpeta
        fetchFolderDetails(folder.id);
    }, [fetchFolderDetails]);

    const handleFolderCardDoubleClick = useCallback((folder) => {
        // Doble click: abre directamente la carpeta
        const result = handleCardClick(folder.id, folder.name, router);
        if (!result.success) {
            console.error('Error al navegar:', result.error);
        }
    }, [router]);

    const handleRowClick = useCallback((params) => {
        // Click simple en tabla: solo selecciona el elemento
        setSelectedFolder(params.row);
        // Fetch de detalles completos de la carpeta
        fetchFolderDetails(params.row.id);
    }, [fetchFolderDetails]);

    const handleRowDoubleClick = useCallback((params) => {
        // Doble click en tabla: abre directamente la carpeta
        const folder = params.row;
        const result = handleCardClick(folder.id, folder.name, router);
        if (!result.success) {
            console.error('Error al navegar:', result.error);
        }
    }, [router]);

    const handleToggleSidebar = useCallback(() => {
        setIsSidebarOpen(prev => !prev);
    }, []);

    const handleCloseSidebar = useCallback(() => {
        setIsSidebarOpen(false);
        // Limpiar los datos detallados al cerrar el sidebar
        setFolderDetailedData(null);
    }, []);

    const handleOpenFolder = useCallback(() => {
        if (!selectedFolder) return;
        const result = handleCardClick(selectedFolder.id, selectedFolder.name, router);
        if (!result.success) {
            console.error('Error al navegar:', result.error);
        }
    }, [selectedFolder, router]);

    const handleEdit = useCallback((item) => {
        if (item.can_edit === false) {
            setIsNotAllowedModal(true);
            setNotAllowedFolder(item);
        } else {
            setSelectedFolder(item);
            setEditingId(item?.id);
        }
    }, [dispatch, invalidateFolderCache]);

    const handleDelete = useCallback((item) => {
        setFolderDelete(item);
        setIsDeleteModal(true);
    }, []);

    const handleView = useCallback((item) => {
        setSelectedFolder(item);
        if (!isSidebarOpen) {
            setIsSidebarOpen(true);
        }
        // Fetch de detalles completos de la carpeta
        fetchFolderDetails(item.id);
    }, [isSidebarOpen, fetchFolderDetails]);

    const handleTrash = useCallback(async (item) => {
        if (item.can_edit === false) {
            setIsNotAllowedModal(true);
            setNotAllowedFolder(item);
        } else {
            setSelectedTrashFolder(item);
            setIsTrashModal(true);
        }
    }, [props.user, dispatch, handleGetFolderList, invalidateFolderCache]);

    const handleFavorite = useCallback((item) => {
        console.log("Marcar como favorito:", item);
    }, []);


    const handleTrashFolderAction = useCallback(async (item) => {
        const stateSetters = {
            setIsLoadingTrash
        };
        const callbacks = {
            pushNotification,
            getFolderList: () => {
                // Invalidar caché del proyecto eliminado
                invalidateFolderCache(item.id);
                handleGetFolderList(true, sessionStorage.getItem('projectId'));
            }
        };
        const params = {
            folderId: item.id,
            userToken: props.user[0].userID
        };
        let result = await handleTrashFolder(params, stateSetters, callbacks);
        setTrashResult(result);
    }, []);


    const contextMenuActions = {
        view: handleView,
        edit: handleEdit,
        trash: handleTrash,
        delete: handleDelete,
    };

    // Limpiar datos detallados cuando se deselecciona una carpeta
    useEffect(() => {
        if (!selectedFolder) {
            setFolderDetailedData(null);
        }
    }, [selectedFolder]);


    useEffect(() => {
        if (isTrashModal == false) {
            setIsLoadingTrash(false);
            setTrashResult({});
        }
    }, [isTrashModal]);

    // Campos personalizados para el sidebar de detalles
    const folderCustomFields = useMemo(() => {
        if (!selectedFolder) return [];

        // Usar folderDetailedData si está disponible, de lo contrario usar selectedFolder
        const folderData = folderDetailedData || selectedFolder;
        
        // Mostrar loading si se están cargando los detalles
        if (isLoadingFolderDetails) {
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
                            {folderData.creator_user_name || 'N/A'}
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
                            {folderData.editor_user_name || 'N/A'}
                        </Typography>
                    </Box>
                )
            },
            {
                label: 'Grupo',
                content: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <GroupIcon sx={{ fontSize: 18, color: 'info.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {folderData.group_name || 'N/A'}
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
                            {folderData.view_role?.type || 'N/A'}
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
                            {folderData.edit_role?.type || 'N/A'}
                        </Typography>
                    </Box>
                )
            }
        ];
    }, [selectedFolder, folderDetailedData, isLoadingFolderDetails]);

    // Contenido del sidebar
    const sidebarContent = (
        <DetailsSidebar
            item={selectedFolder}
            chipConfig={selectedFolder ? {
                label: 'Carpeta',
                color: selectedFolder.color || '#FF9800',
                icon: <FolderIcon sx={{ fontSize: 14, color: 'white' }} />
            } : undefined}
            onClose={handleCloseSidebar}
            itemCount={folders.length}
            onCreateClick={() => setIsCreateModal(true)}
            entityName="Carpeta"
            customFields={folderCustomFields}
            showVisibility={false}
            actions={selectedFolder ? [
                {
                    label: 'Abrir Carpeta',
                    icon: <Visibility sx={{ fontSize: 18 }} />,
                    onClick: handleOpenFolder,
                    style: 'primary'
                },
                {
                    label: 'Editar',
                    icon: <EditIcon sx={{ fontSize: 18 }} />,
                    onClick: () => contextMenuActions.edit?.(selectedFolder),
                    style: 'secondary',
                    hidden: selectedFolder.can_edit === false
                },
                {
                    type: 'divider',
                    hidden: selectedFolder.can_edit === false
                },
                {
                    label: 'Mover a Papelera',
                    icon: <DeleteOutlineRounded sx={{ fontSize: 18 }} />,
                    onClick: () => contextMenuActions.trash?.(selectedFolder),
                    style: 'secondary',
                    hidden: selectedFolder.can_edit === false
                }
            ] : []}
        />
    );

    return (
        <>
            <ExplorerView
                config={explorerConfig}
                items={foldersWithColors}
                isLoading={isLoadingList}
                columns={columns}
                getRows={getTableRows}
                onItemClick={handleFolderCardClick}
                onItemDoubleClick={handleFolderCardDoubleClick}
                onRowClick={handleRowClick}
                onRowDoubleClick={handleRowDoubleClick}
                onCreateClick={() => setIsCreateModal(true)}
                onFavoriteClick={handleFavorite}
                onMoreOptionsClick={(item) => setSelectedFolder(item)}
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
            <Dialog 
                open={isCreateModal} 
                onClose={() => setIsCreateModal(false)} 
                className='box_shadow_aws' 
                maxWidth={false}
                sx={{ '& .MuiDialog-paper': { maxWidth: '700px', width: '100%' } }}
            >
                <CreateFolder
                    handleFolder={handleGetFolderList}
                    user={props.user[0]}
                    organization={props.organization[0]}
                    setIsCreateModal={setIsCreateModal}
                    projectId={projectId}
                    groupId={groupId}
                />
            </Dialog>

            <Dialog open={isDeleteModal} onClose={() => setIsDeleteModal(false)}>
                <DeleteFolder
                    setIsDeleteModal={setIsDeleteModal}
                    user={props.user[0]}
                    folderDelete={folderDelete}
                    handleFolder={handleGetFolderList}
                />
            </Dialog>

            <Dialog 
                open={editingId !== null} 
                onClose={() => setEditingId(null)}
                sx={{ '& .MuiDialog-paper': { maxWidth: '700px', width: '100%' } }}
            >
                <EditFolder
                    setEditingId={setEditingId}
                    user={props.user[0]}
                    editFolder={selectedFolder}
                    handleFolder={handleGetFolderList}
                />
            </Dialog>

            <TrashModal
                open={isTrashModal}
                onClose={() => setIsTrashModal(false)}
                selectedItem={selectedTrashFolder}
                onTrash={handleTrashFolderAction}
                isLoadingTrash={isLoadingTrash}
                entityName="Carpeta"
                context={{ icon: <FolderIcon sx={{ fontSize: 20, color: 'white', backgroundColor: selectedTrashFolder?.color ? selectedTrashFolder.color : '#1976d2' }} />, label: 'Carpeta'}}
                trashResult={trashResult}
            />

            <NotAllowedModal
                open={isNotAllowedModal}
                onClose={() => setIsNotAllowedModal(false)}
                selectedItem={notAllowedFolder}
                context={{ icon: <FolderIcon sx={{ fontSize: 20, color: 'white', backgroundColor: notAllowedFolder?.color ? notAllowedFolder.color : '#1976d2' }} />, label: 'Carpeta'}}
            />

        </ExplorerView>

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

export default connect(mapStateToProps)(Folders); 