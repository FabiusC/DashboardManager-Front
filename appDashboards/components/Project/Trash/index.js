"use client"
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { connect, useDispatch } from 'react-redux';
import { Dialog, Backdrop, Typography, Divider, Chip, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { Edit as EditIcon, Visibility, DeleteOutlineRounded, DeleteRounded, StarRounded, StarBorderRounded, FolderRounded, FolderCopyOutlined, FolderCopyRounded, Add, Dashboard as DashboardIcon, DashboardOutlined, BarChart as BarChartIcon, CategoryRounded, Close as CloseIcon, CalendarToday, Person, Group, Folder, FolderOutlined, Public, Lock, EditOff as EditOffIcon, RestoreFromTrash as RestoreIcon, DeleteForever as DeleteForeverIcon, AccountTreeOutlined, AccountTree as AccountTreeIcon, InfoOutlined, GridViewRounded, CloudUpload } from '@mui/icons-material';
import { Delete as DeleteIcon, Folder as FolderIcon } from '@mui/icons-material';
import { Box } from '@mui/material';
import ExplorerView from '@components/Base/ExplorerView';
import { useExplorerConfig } from '@components/Base/ExplorerView/useExplorerConfig';
import { createDateColumn, createNumberColumn, createTextColumn, ensureItemsHaveColors, ensureItemsHaveTags } from '@components/Base/ExplorerView/explorerUtils';
import { LoadingAssembly, useCustomSelectControls } from '@creangel/ifindit-ui';
import { getACLList } from '@services/creangelAuthAPI';
import RestoreModal from './components/RestoreModal';
import { restoreProductFromTrash, deleteProductPermanently } from './services/Trash';
import { pushNotification } from '@redux/actions';
import BreadcrumbsNav from '@components/Project/Breadcrumbs';
import useDebounce from 'hooks/useDebounce';
import moment from 'moment';
import 'moment/locale/es';
import FiltersTrash from './components/FiltersTrash';
moment.locale('es')

function Trash(props) {
    const router = useRouter();
    const dispatch = useDispatch();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [products, setProducts] = useState([]);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [userNames, setUserNames] = useState({});
    const [totalProducts, setTotalProducts] = useState(0);
    const [isRestoreModal, setIsRestoreModal] = useState(false);
    const [isDeleteModal, setIsDeleteModal] = useState(false);
    const [isLoadingRestore, setIsLoadingRestore] = useState(false);
    const [isLoadingDelete, setIsLoadingDelete] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [folderId, setFolderId] = useState(undefined); // undefined = no inicializado, null = no existe
    const [selectedProductType, setSelectedProductType] = useState(null);

    // Search Debounce to avoid multiple calls (500ms)
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    
    // Get 'from' parameter from the URL
    const fromPage = router.query.from || 'resources';

    // IF exists gets the folderId from sessionStorage
    useEffect(() => {
        const sessionFolderId = sessionStorage.getItem('folderId');
        setFolderId(sessionFolderId); // Puede ser null si no existe
    }, []);

    // Función para renderizar el ícono según el tipo de producto
    const renderProductIcon = useCallback((item) => {
        if (item.type === 'panel' || item.acl_object_type === 'panel') {
            return <BarChartIcon sx={{ color: item.color || '#9c27b0'}} />;
        }
        if (item.type === 'project' || item.acl_object_type === 'project') {
            return <AccountTreeIcon sx={{ color: item.color || '#1976d2' }} />;
        }
        if (item.type === 'folder' || item.acl_object_type === 'folder') {
            return <FolderIcon sx={{ color: item.color || '#1976d2'}} />;
        }
        return <DashboardIcon sx={{ color: item.color || '#1976d2'}} />;
    }, []);

    // Usar el hook de configuración del explorador
    const { getExplorerConfig, getTableColumns, getTableRows } = useExplorerConfig('product', {
        icon: DashboardIcon // Ícono por defecto
    });

    // Función para obtener solo el componente de ícono (para tabla)
    const getProductIconComponent = useCallback((item) => {
        return (item.type === 'panel' || item.acl_object_type === 'panel') ? BarChartIcon : DashboardIcon;
    }, []);

    // Configurar columnas de la tabla - MEMOIZADO para evitar re-renders
    const columns = useMemo(() => getTableColumns([], true, getProductIconComponent), [getTableColumns, getProductIconComponent]);

    // Iconos memoizados para evitar recreación
    const icons = useMemo(() => ({
        resources: {
            icon: <GridViewRounded />,
            iconSelected: <GridViewRounded />
        },
        folders: {
            icon: <FolderOutlined />,
            iconSelected: <Folder />
        },
        projects: {
            icon: <AccountTreeOutlined />,
            iconSelected: <AccountTreeIcon />
        },
        import: {
            icon: <CloudUpload />,
            iconSelected: <CloudUpload />
        },
        favorites: {
            icon: <StarBorderRounded />,
            iconSelected: <StarRounded />
        },
        trash: {
            icon: <DeleteOutlineRounded />,
            iconSelected: <DeleteRounded />
        }
    }), []);

    const icons_details = useMemo(() => ({
        panel: {
            icon: <BarChartIcon />,
            label: 'Panel'
        },
        dashboard: {
            icon: <DashboardIcon />,
            label: 'Dashboard'
        },
        folder: {
            icon: <FolderIcon />,
            label: 'Carpeta'
        },
        project: {
            icon: <AccountTreeIcon />,
            label: 'Proyecto'
        }
    }), []);

    // Labels y rutas memoizados
    const pageConfig = useMemo(() => ({
        products: { 
            label: 'Productos', 
            route: '/projects/folders/resources'
        },
        resources: { 
            label: 'Recursos', 
            route: '/projects/folders/resources'
        },
        folders: { 
            label: 'Carpetas', 
            route: '/projects/folders'
        },
        projects: { 
            label: 'Proyectos', 
            route: '/projects'
        }
    }), []);

    // Handler para las opciones del menú - memoizado
    const handleOptionClick = useCallback((optionId) => {
        if (optionId === fromPage) {
            // Verificar que existan los datos necesarios en sessionStorage antes de navegar
            const projectId = sessionStorage.getItem('projectId');
            const folderId = sessionStorage.getItem('folderId');
            
            // Decidir a dónde navegar basado en qué datos existen
            if ((fromPage === 'products' || fromPage === 'resources') && projectId && folderId) {
                router.push('/projects/folders/resources');
            } else if (fromPage === 'folders' && projectId) {
                router.push('/projects/folders');
            } else {
                // Si no hay datos suficientes, ir a la lista de proyectos
                router.push('/projects');
            }
        } else if (optionId === 'favorites') {
            router.push(`/favorites?from=${fromPage}`);
        } else if (optionId === 'import') {
            router.push('/projects/importDashboard');
        }
    }, [fromPage, router]);

    // Opciones del menú memoizadas
    const menuOptions = useMemo(() => {
        const options = [
            {
                label: pageConfig[fromPage]?.label || 'Recursos',
                value: fromPage,
                icon: icons[fromPage]?.icon || icons.resources.icon,
                iconSelected: icons[fromPage]?.iconSelected || icons.resources.iconSelected
            },
        ];

        if (fromPage === 'projects') {
            options.push({
                label: 'Importar',
                value: 'import',
                icon: icons.import.icon,
                iconSelected: icons.import.iconSelected
            });
        }

        options.push({
            label: 'Papelera',
            value: 'trash',
            icon: icons.trash.icon,
            iconSelected: icons.trash.iconSelected
        });

        return options;
    }, [fromPage, pageConfig, icons]);

    // Items del menú contextual memoizados
    const contextMenuItems = useMemo(() => [
        { id: 'view', label: 'Ver detalles', icon: <Visibility /> },
        { id: 'restore', label: 'Restaurar', icon: <RestoreIcon /> },
        { id: 'delete', label: 'Eliminar permanentemente', icon: <DeleteForeverIcon /> },
    ], []);

    // Configuración del explorador
    const explorerConfig = useMemo(() => getExplorerConfig({
        menu: {
            title: 'Papelera',
            buttonLabel: '',
            showButton: false,
            options: menuOptions,
            selectedOption: 'trash',
            onOptionClick: handleOptionClick
        },
        viewMode: {
            defaultValue: sessionStorage.getItem('viewMode') || 'large-icons',
            persist: true
        },
        sort: {
            defaultField: 'created_at',
            defaultDirection: 'desc'
        },
        show: {
            search: true,
            viewMode: true,
            sort: true,
        },
        cards: {
            showContextMenu: true,
            contextMenuItems: contextMenuItems,
        },
        emptyState: {
            title: "La papelera está vacía",
            description: "Los productos eliminados aparecerán aquí hasta que sean restaurados o eliminados permanentemente."
        },
        titleConfig: {
            title: 'Papelera',
            description: '',
            icon: <DeleteRounded sx={{color: 'primary.main'}} />,
        }
    }), [getExplorerConfig, menuOptions, handleOptionClick, contextMenuItems]);
    
    // Ref para rastrear si ya se hizo la primera carga
    const initialLoadDone = useRef(false);
    const productsRef = useRef([]);

    const getProductList = async (showLoading = false, append = false) => {
        if (showLoading && !append) {
            setIsLoadingList(true);
        } else if (append) {
            setIsLoadingMore(true);
        }
        
        try {
            const currentOffset = append ? productsRef.current.length : 0;
            const limit = 1000;
            
            // Construir filtros
            const filters = [
                { field: 'in_trash', value: true }  // ✅ Filtro para papelera
            ];

            let types = ['project', 'folder', 'panel', 'dashboard'];
            if (selectedProductType === 'project') {
                types = ['project'];
            } else if (selectedProductType === 'folder') {
                types = ['folder'];
            } else if (selectedProductType === 'panel') {
                types = ['panel'];
            } else if (selectedProductType === 'dashboard') {
                types = ['dashboard'];
            } else {
                types = ['project', 'folder', 'panel', 'dashboard'];
            }
            
            const requestData = {
                type: types,
                filtered_groups: [],
                limit: limit,
                offset: currentOffset,
                q: debouncedSearchQuery,
                order_by: sortDirection,
                order_field: sortField,
                filter: filters
            };

            const response = await getACLList(requestData, {
                'Authorization': `Bearer ${props.user[0].userID}`
            });

            if (response?.data) {
                const { results, count } = response.data;
                
                const safeResults = Array.isArray(results) ? results : [];
                
                let newProducts;
                if (append) {
                    newProducts = [...productsRef.current, ...safeResults];
                    } else {
                    newProducts = safeResults;
                }
                
                productsRef.current = newProducts;
                setProducts(newProducts);
                
                setTotalProducts(count || 0);
                setHasMore(safeResults.length === limit && (currentOffset + limit) < count);
            } else {
                if (!append) {
                    setProducts([]);
                    productsRef.current = [];
                    setTotalProducts(0);
                }
                setHasMore(false);
            }
        } catch (error) {
            console.error('Trash - Error al obtener productos:', error);
            if (!append) {
                setProducts([]);
                productsRef.current = [];
                setTotalProducts(0);
            }
            setHasMore(false);
        } finally {
            setIsLoadingList(false);
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        // Solo cargar cuando folderId esté inicializado (puede ser null o tener valor)
        if (!initialLoadDone.current && props.user && props.user[0]?.userID && folderId !== undefined) {
            initialLoadDone.current = true;
            getProductList(true);
        }
    }, [folderId, props.user]);

    // Recargar cuando cambia la búsqueda con debounce (pero no en la carga inicial)
    useEffect(() => {
        if (initialLoadDone.current && props.user && props.user[0]?.userID) {
            productsRef.current = [];
            getProductList(true);
        }
    }, [debouncedSearchQuery]);

    // Recargar cuando cambia el ordenamiento (pero no en la carga inicial)
    useEffect(() => {
        if (initialLoadDone.current && props.user && props.user[0]?.userID) {
            productsRef.current = [];
            getProductList(true);
        }
    }, [sortField, sortDirection]);

    // Función para abrir producto directamente
    const handleOpenProductDirect = useCallback(async (product) => {
        setIsSidebarOpen(false);
        setIsRedirecting(true);
        
        sessionStorage.setItem('productId', product.id);
        sessionStorage.setItem('productName', product.name);
        sessionStorage.setItem('productType', product.acl_object_type || product.type);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (product.acl_object_type === 'panel' || product.type === 'panel') {
           router.push(`/panelsWorkspace`);
        } else {
            router.push(`/dashboardsWorkspace`);
        }
    }, [router]);

    const handleProductCardClick = useCallback((product, event) => {
        setSelectedProduct(product);
        setIsSidebarOpen(true);
    }, []);

    const handleProductCardDoubleClick = useCallback((product, event) => {
        contextMenuActions.restore?.(product)
    }, [handleOpenProductDirect]);

    const handleCloseSidebar = useCallback(() => {
        setIsSidebarOpen(false);
        setSelectedProduct(null);
    }, []);

    const handleOpenProduct = useCallback(async () => {
        if (!selectedProduct) return;
        handleOpenProductDirect(selectedProduct);
    }, [selectedProduct, handleOpenProductDirect]);

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
    }, []);

    const handleSortChange = useCallback((sort) => {
        setSortField(sort.field);
        setSortDirection(sort.direction);
    }, []);

    const handleView = useCallback((item) => {
        setSelectedProduct(item);
        setIsSidebarOpen(true);
    }, []);

    const handleRestore = useCallback((item) => {
        setSelectedProduct(item);
        setIsRestoreModal(true);
    }, []);

    const handleDelete = useCallback((item) => {
        setSelectedProduct(item);
        setIsDeleteModal(true);
    }, []);

    const handleFavorite = useCallback((item) => {
    }, []);

    const handleLoadMore = useCallback(() => {
        if (hasMore && !isLoadingMore && !isLoadingList) {
            getProductList(false, true);
        }
    }, [hasMore, isLoadingMore, isLoadingList]);

    // Handlers para la tabla (lista)
    const handleRowClick = useCallback((params) => {
        setSelectedProduct(params.row);
        setIsSidebarOpen(true);
    }, []);

    const handleRowDoubleClick = useCallback((params) => {
        handleOpenProductDirect(params.row);
    }, [handleOpenProductDirect]);

    const contextMenuActions = {
        view: handleView,
        restore: handleRestore,
        delete: handleDelete,
    };

    // Asegurar que los productos tengan colores, tags e íconos renderizados
    const productsWithMetadata = useMemo(() => {
        if (!Array.isArray(products)) {
            console.warn("Trash - Products no es un array:", products);
            return [];
        }

        const withColors = ensureItemsHaveColors(products, '#bdbdbd');
        const withTags = ensureItemsHaveTags(withColors, 'product');
        const withIcons = Array.isArray(withTags) ? withTags.map(item => ({
            ...item,
            icon: renderProductIcon(item)
        })) : [];
        
        return withIcons;
    }, [products, renderProductIcon]);

    // Handler para restaurar producto
    const handleRestoreProduct = useCallback(async () => {
        if (!selectedProduct || !props.user?.[0]?.userID) return;

        const params = {
            product: selectedProduct,
            userID: props.user[0].userID
        };
        const stateSetters = {
            setIsLoadingRestore,
            dispatch,
        };
        const callbacks = {
            pushNotification,
        };
        
        const result = await restoreProductFromTrash(params, stateSetters, callbacks);
        
        if (result) {
            setIsRestoreModal(false);
            setSelectedProduct(null);
            setTimeout(() => getProductList(true), 300);
        }
    }, [selectedProduct, props.user, dispatch]);

    // Handler para eliminar permanentemente
    const handleDeleteProduct = useCallback(async () => {
        if (!selectedProduct || !props.user?.[0]?.userID) return;

        const params = {
            product: selectedProduct,
            userID: props.user[0].userID
        };
        const stateSetters = {
            setIsLoadingDelete,
            dispatch,
        };
        const callbacks = {
            pushNotification,
        };
        
        const result = await deleteProductPermanently(params, stateSetters, callbacks);
        
        if (result) {
            setIsDeleteModal(false);
            setSelectedProduct(null);
            setTimeout(() => getProductList(true), 300);
        }
    }, [selectedProduct, props.user, dispatch]);

    // Contenido del sidebar
    const sidebarContent = selectedProduct && (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header minimalista */}
                    <Box sx={{
                px: 3,
                py: 3, 
                        display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" sx={{ 
                        fontWeight: 500, 
                        fontSize: '1.125rem', 
                        lineHeight: 1.3,
                        mb: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {selectedProduct.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                            icon={icons_details[selectedProduct.acl_object_type || selectedProduct.type]?.icon}
                            label={icons_details[selectedProduct.acl_object_type || selectedProduct.type]?.label}
                            size="small"
                            sx={{ 
                                height: 24,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                borderRadius: 1.5,
                                backgroundColor: 'primary.main',
                                color: 'primary.contrastText',
                                '& .MuiChip-label': {
                                    px: 1.5
                                },
                                '& .MuiChip-icon': {
                                    color: 'primary.contrastText'
                                }
                            }}
                        />
                    </Box>
                </Box>
                <IconButton onClick={handleCloseSidebar} size="small" sx={{ ml: 1 }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 3.5 }}>
                {/* Descripción */}
                {selectedProduct.description && (
                    <Box sx={{ mb: 3.5 }}>
                        <Typography variant="body2" sx={{ 
                            color: 'text.secondary',
                            lineHeight: 1.65,
                            fontSize: '0.9375rem'
                        }}>
                            {selectedProduct.description}
                        </Typography>
                    </Box>
                )}

                <Divider sx={{ my: 3.5 }} />

                {/* Detalles */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Visibilidad */}
                    <Box>
                        <Typography variant="overline" sx={{ 
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            letterSpacing: '0.5px',
                            color: 'text.secondary',
                            display: 'block',
                            mb: 1.25
                        }}>
                            Visibilidad
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            {selectedProduct.is_public ? (
                                <Public sx={{ fontSize: 18, color: 'success.main' }} />
                            ) : (
                                <Lock sx={{ fontSize: 18, color: 'text.secondary' }} />
                            )}
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {selectedProduct.is_public ? 'Público' : 'Privado'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Fechas */}
                    <Box>
                        <Typography variant="overline" sx={{ 
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            letterSpacing: '0.5px',
                            color: 'text.secondary',
                            display: 'block',
                            mb: 1.25
                        }}>
                            Fechas
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                                    Creado: {selectedProduct.created_at ? moment(selectedProduct.created_at).format('DD/MM/YY') : 'N/A'}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                                    Modificado: {selectedProduct.updated_at || selectedProduct.edited_at ? moment(selectedProduct.updated_at || selectedProduct.edited_at).format('DD/MM/YY') : 'N/A'}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                                    Eliminado: {selectedProduct.deleted_at ? moment(selectedProduct.deleted_at).format('DD/MM/YY') : 'N/A'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Footer con botones de acción */}
            <Box sx={{ 
                px: 3,
                py: 2.75, 
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.25
            }}>
                {/* Botón Restaurar */}
                <Box
                    onClick={() => contextMenuActions.restore?.(selectedProduct)}
                    sx={{
                        py: 1.25,
                        px: 2.5,
                        borderRadius: 1.5,
                        backgroundColor: 'primary.main',
                        color: 'white',
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                            backgroundColor: 'primary.dark',
                            transform: 'scale(1.01)',
                            boxShadow: 2
                        },
                        '&:active': {
                            transform: 'scale(0.99)'
                        }
                    }}
                >
                    <RestoreIcon sx={{ fontSize: 18 }} />
                    <Typography variant="button" sx={{ fontSize: '0.875rem' }}>
                        Restaurar
                    </Typography>
                </Box>

                <Divider sx={{ my: 0.5 }} />

                {/* Botón Eliminar Permanentemente */}
                <Box
                    onClick={() => contextMenuActions.delete?.(selectedProduct)}
                    sx={{
                        py: 1,
                        px: 2,
                        borderRadius: 1.5,
                        backgroundColor: 'transparent',
                        color: 'error.main',
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        border: '1px solid',
                        borderColor: 'error.main',
                        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                            backgroundColor: 'error.main',
                            color: 'white',
                            transform: 'scale(1.01)'
                        },
                        '&:active': {
                            transform: 'scale(0.99)'
                        }
                    }}
                >
                    <DeleteForeverIcon sx={{ fontSize: 18 }} />
                    <Typography variant="button" sx={{ fontSize: '0.8125rem' }}>
                        Eliminar Permanentemente
                    </Typography>
                </Box>
            </Box>
        </Box>
    );

    const productTypeSelectState = useCustomSelectControls({
        state: {
          value: selectedProductType,
          search: { value: '', placeholder: 'Buscar tipos de productos' },
          options: [{
            id: 'project',
            label: 'Proyecto',
            value: 'project',
          }, {
            id: 'folder',
            label: 'Carpeta',
            value: 'folder',
          },
          {
            id: 'panel',
            label: 'Panel',
            value: 'panel',
          }, {
            id: 'dashboard',
            label: 'Tablero',
            value: 'dashboard',
          }],
          isOpen: false,
        },
        show: { field: true, dropdown: true },
        label: 'Tipos de productos',
        searchable: true,
        size: 'small',
        autoWidth: true,
        handlers: {
          onChange: (value) => {
            setSelectedProductType(value);
          },
        },
      });
    
    return (
        <>
            <ExplorerView
                config={explorerConfig}
                items={productsWithMetadata}
                isLoading={isLoadingList}
                columns={columns}
                getRows={getTableRows}
                onItemClick={handleProductCardClick}
                onItemDoubleClick={handleProductCardDoubleClick}
                onRowClick={handleRowClick}
                onRowDoubleClick={handleRowDoubleClick}
                onFavoriteClick={handleFavorite}
                onMoreOptionsClick={(item) => setSelectedProduct(item)}
                contextMenuActions={contextMenuActions}
                userNames={userNames}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                totalCount={totalProducts}
                sidebarContent={sidebarContent}
                isSidebarOpen={isSidebarOpen}
                onCloseSidebar={handleCloseSidebar}
                onSearch={handleSearch}
                onSortChange={handleSortChange}
                headerSlots={{
                    breadcrumb: <BreadcrumbsNav isTrashView={true} />,
                    //additionalFilters: <FiltersTrash productTypeSelectState={productTypeSelectState}/>,
                    afterHeader: (
                        <Box>
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1,
                                px: 2,
                                py: 1,
                                mb: 0,
                                backgroundColor: 'rgba(33, 150, 243, 0.05)',
                                borderRadius: 1,
                                border: '1px solid rgba(33, 150, 243, 0.15)',
                            }}>
                                <InfoOutlined sx={{ 
                                    fontSize: 18, 
                                    color: 'info.main' 
                                }} />
                                <Typography variant="body2" sx={{ 
                                    color: 'text.secondary',
                                    fontSize: '0.875rem'
                                }}>
                                    Los elementos de la papelera se eliminarán definitivamente después de 3 meses
                                </Typography>
                            </Box>
                        </Box>
                    ),
                }}
            >
                {/* Modales */}
                <RestoreModal
                    open={isRestoreModal}
                    onClose={() => setIsRestoreModal(false)}
                    selectedProduct={selectedProduct}
                    onRestore={handleRestoreProduct}
                    isLoadingRestore={isLoadingRestore}
                    context="products"
                />

                <RestoreModal
                    open={isDeleteModal}
                    onClose={() => setIsDeleteModal(false)}
                    selectedProduct={selectedProduct}
                    onRestore={handleDeleteProduct}
                    isLoadingRestore={isLoadingDelete}
                    context="products"
                    isDelete={true}
                />
            </ExplorerView>

            {/* Overlay de carga al navegar a un producto */}
            <Backdrop
                sx={{
                    color: '#fff',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                }}
                open={isRedirecting}
            >
                <LoadingAssembly state={{message: "Abriendo producto...", borderRadius: false, boxShadow: false, size: 60}} />
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

export default connect(mapStateToProps)(Trash);
