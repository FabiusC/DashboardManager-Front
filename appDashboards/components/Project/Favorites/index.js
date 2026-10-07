"use client"
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { connect, useDispatch } from 'react-redux';
import { Dialog, Backdrop, Typography, Divider, Chip, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { Edit as EditIcon, Visibility, DeleteOutlineRounded, DeleteRounded, StarRounded, StarBorderRounded, FolderRounded, FolderCopyOutlined, FolderCopyRounded, Add, Dashboard as DashboardIcon, DashboardOutlined, BarChart as BarChartIcon, CategoryRounded, Close as CloseIcon, CalendarToday, Person, Group, Folder, FolderOutlined, Public, Lock, EditOff as EditOffIcon, RestoreFromTrash as RestoreIcon, DeleteForever as DeleteForeverIcon, AccountTreeOutlined, AccountTree as AccountTreeIcon, InfoOutlined, Star, GridViewRounded } from '@mui/icons-material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Box } from '@mui/material';
import ExplorerView from '@components/Base/ExplorerView';
import { useExplorerConfig } from '@components/Base/ExplorerView/useExplorerConfig';
import { createDateColumn, createNumberColumn, createTextColumn, ensureItemsHaveColors, ensureItemsHaveTags } from '@components/Base/ExplorerView/explorerUtils';
import { LoadingAssembly } from '@creangel/ifindit-ui';
import { getACLList } from '@services/creangelAuthAPI';
import { pushNotification } from '@redux/actions';
import BreadcrumbsNav from '@components/Project/Breadcrumbs';
import useDebounce from 'hooks/useDebounce';
import moment from 'moment';
import 'moment/locale/es';
moment.locale('es')

function Favorites(props) {
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
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [folderId, setFolderId] = useState(undefined);
    
    // Debounce para la búsqueda
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    
    // Función para cargar productos favoritos
    const getProductList = useCallback(async (showLoading = false, append = false) => {
        /*
        if (showLoading && !append) {
            setIsLoadingList(true);
        } else if (append) {
            setIsLoadingMore(true);
        }
        
        try {
            const currentOffset = append ? products.length : 0;
            const limit = 500;
            
            const requestData = {
                type: ['panel', 'dashboard'],
                filtered_groups: [],
                limit: limit,
                offset: currentOffset,
                q: debouncedSearchQuery,
                order_by: sortDirection,
                order_field: sortField,
                filter: [
                    { field: 'in_trash', value: false },
                    { field: 'favorite', value: true },
                    { field: 'folder_id', value: sessionStorage.getItem('folderId') },
                    { field: 'project_id', value: sessionStorage.getItem('projectId') },
                ]
            };

            const response = await getACLList(requestData, {
                'Authorization': `Bearer ${props.user[0].userID}`
            });

            if (response?.data) {
                const { results, count } = response.data;
                const safeResults = Array.isArray(results) ? results : [];
                
                let newProducts;
                if (append) {
                    newProducts = [...products, ...safeResults];
                } else {
                    newProducts = safeResults;
                }
                
                setProducts(newProducts);
                setTotalProducts(count || 0);
                setHasMore(safeResults.length === limit && (currentOffset + limit) < count);
            }
        } catch (error) {
            console.error('Error al cargar productos favoritos:', error);
            dispatch(pushNotification({
                message: 'Error al cargar productos favoritos',
                severity: 'error'
            }));
        } finally {
            setIsLoadingList(false);
            setIsLoadingMore(false);
        }
        */
    }, [products, debouncedSearchQuery, sortField, sortDirection, props.user, dispatch]);
    
    // Obtener el parámetro 'from' de la URL para saber de dónde viene el usuario
    const fromPage = router.query.from || 'products';

    // Obtener folderId del sessionStorage si existe
    useEffect(() => {
        const sessionFolderId = sessionStorage.getItem('folderId');
        setFolderId(sessionFolderId);
    }, []);

    // Cargar productos favoritos al montar el componente
    useEffect(() => {
        if (props.user && props.user[0]?.userID) {
            getProductList(true);
        }
    }, [props.user]);

    // Recargar productos cuando cambia la búsqueda con debounce
    useEffect(() => {
        if (props.user && props.user[0]?.userID) {
            getProductList(true);
        }
    }, [debouncedSearchQuery]);

    // Recargar productos cuando cambia el ordenamiento
    useEffect(() => {
        if (props.user && props.user[0]?.userID) {
            getProductList(true);
        }
    }, [sortField, sortDirection]);

    // Función para renderizar el ícono según el tipo de producto
    const renderProductIcon = useCallback((item) => {
        if (item.type === 'panel' || item.acl_object_type === 'panel') {
            return <BarChartIcon sx={{ color: item.color || '#9c27b0', fontSize: '60px' }} />;
        }
        return <DashboardIcon sx={{ color: item.color || '#1976d2', fontSize: '60px' }} />;
    }, []);

    // Usar el hook de configuración del explorador
    const { getExplorerConfig, getTableColumns, getTableRows } = useExplorerConfig('product', {
        icon: DashboardIcon
    });

    // Función para obtener solo el componente de ícono (para tabla)
    const getProductIconComponent = useCallback((item) => {
        return (item.type === 'panel' || item.acl_object_type === 'panel') ? BarChartIcon : DashboardIcon;
    }, []);

    // Configurar columnas de la tabla
    const columns = useMemo(() => getTableColumns([], true, getProductIconComponent), [getTableColumns, getProductIconComponent]);

    // Iconos memoizados
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
        favorites: {
            icon: <StarBorderRounded />,
            iconSelected: <StarRounded />
        },
        trash: {
            icon: <DeleteOutlineRounded />,
            iconSelected: <DeleteRounded />
        }
    }), []);

    // Labels y rutas memoizados
    const pageConfig = useMemo(() => ({
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

    // Handler para las opciones del menú
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
        } else if (optionId === 'trash') {
            router.push(`/trash?from=${fromPage}`);
        }
    }, [fromPage, router]);

    // Opciones del menú memoizadas
    const menuOptions = useMemo(() => [
        { 
            label: pageConfig[fromPage]?.label || 'Recursos', 
            value: fromPage,
            icon: icons[fromPage]?.icon || icons.resources.icon,
            iconSelected: icons[fromPage]?.iconSelected || icons.resources.iconSelected
        },
        // { 
        //     label: 'Favoritos', 
        //     value: 'favorites', 
        //     icon: icons.favorites.icon, 
        //     iconSelected: icons.favorites.iconSelected 
        // },
        { 
            label: 'Papelera', 
            value: 'trash', 
            icon: icons.trash.icon, 
            iconSelected: icons.trash.iconSelected 
        }
    ], [fromPage, pageConfig, icons]);

    // Items del menú contextual memoizados
    const contextMenuItems = useMemo(() => [
        { id: 'view', label: 'Ver detalles', icon: <Visibility /> },
        // { id: 'unfavorite', label: 'Quitar de favoritos', icon: <StarBorderRounded /> },
        { id: 'delete', label: 'Eliminar', icon: <DeleteIcon /> },
    ], []);

    // Configuración del explorador
    const explorerConfig = useMemo(() => getExplorerConfig({
        menu: {
            title: 'Favoritos',
            buttonLabel: '',
            showButton: false,
            options: menuOptions,
            selectedOption: 'favorites',
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
            title: "Favoritos no disponibles",
            description: "La funcionalidad de favoritos estará disponible próximamente."
        },
        titleConfig: {
            title: 'Favoritos',
            description: '',
            icon: <StarRounded sx={{color: 'primary.main'}} />,
        }
    }), [getExplorerConfig, menuOptions, handleOptionClick, contextMenuItems]);
    

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
        handleOpenProductDirect(product);
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

    const handleUnfavorite = useCallback(async (item) => {
        // TODO: Implementar lógica para quitar de favoritos
        dispatch(pushNotification({
            message: `${item.name} se quitó de favoritos`,
            severity: 'success'
        }));
        setTimeout(() => getProductList(true), 300);
    }, [dispatch]);

    const handleDelete = useCallback((item) => {
        // TODO: Implementar lógica para eliminar (mover a papelera)
        dispatch(pushNotification({
            message: `${item.name} se movió a la papelera`,
            severity: 'info'
        }));
        setTimeout(() => getProductList(true), 300);
    }, [dispatch]);

    const handleFavorite = useCallback((item) => {
        // En favoritos, al hacer clic en la estrella se quita de favoritos
        handleUnfavorite(item);
    }, [handleUnfavorite]);

    const handleLoadMore = useCallback(() => {
        if (hasMore && !isLoadingMore && !isLoadingList) {
            getProductList(false, true);
        }
    }, [hasMore, isLoadingMore, isLoadingList]);

    // Handlers para la tabla
    const handleRowClick = useCallback((params) => {
        setSelectedProduct(params.row);
        setIsSidebarOpen(true);
    }, []);

    const handleRowDoubleClick = useCallback((params) => {
        handleOpenProductDirect(params.row);
    }, [handleOpenProductDirect]);

    const contextMenuActions = {
        view: handleView,
        unfavorite: handleUnfavorite,
        delete: handleDelete,
    };

    // Asegurar que los productos tengan colores, tags e íconos
    const productsWithMetadata = useMemo(() => {
        if (!Array.isArray(products)) {
            console.warn("Favorites - Products no es un array:", products);
            return [];
        }

        const withColors = ensureItemsHaveColors(products);
        const withTags = ensureItemsHaveTags(withColors, 'product');
        
        const withIcons = Array.isArray(withTags) ? withTags.map(item => ({
            ...item,
            icon: renderProductIcon(item)
        })) : [];
        
        return withIcons;
    }, [products, renderProductIcon]);

    // Contenido del sidebar
    const sidebarContent = selectedProduct && (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
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
                            icon={(selectedProduct.acl_object_type === 'panel' || selectedProduct.type === 'panel') ? <BarChartIcon sx={{ fontSize: 14, color: 'white' }} /> : <DashboardIcon sx={{ fontSize: 14, color: 'white' }} />}
                            label={(selectedProduct.acl_object_type === 'panel' || selectedProduct.type === 'panel') ? 'Panel' : 'Dashboard'}
                            size="small"
                            sx={{ 
                                height: 24,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                borderRadius: 1.5,
                                backgroundColor: (selectedProduct.acl_object_type === 'panel' || selectedProduct.type === 'panel') ? '#9c27b0' : '#1976d2',
                                color: 'white',
                                '& .MuiChip-label': { px: 1.5 },
                                '& .MuiChip-icon': { color: 'white' }
                            }}
                        />
                        <Chip 
                            icon={<Star sx={{ fontSize: 14, color: 'white' }} />}
                            label="Favorito"
                            size="small"
                            sx={{ 
                                height: 24,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                borderRadius: 1.5,
                                backgroundColor: '#f57c00',
                                color: 'white',
                                '& .MuiChip-label': { px: 1.5 },
                                '& .MuiChip-icon': { color: 'white' }
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
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Footer con botones */}
            <Box sx={{ 
                px: 3,
                py: 2.75,
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.25
            }}>
                {/* Botón Ver */}
                <Box
                    onClick={handleOpenProduct}
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
                    <Visibility sx={{ fontSize: 18 }} />
                    <Typography variant="button" sx={{ fontSize: '0.875rem' }}>
                        Abrir
                    </Typography>
                </Box>

                <Divider sx={{ my: 0.5 }} />

                {/* Botón Quitar de favoritos */}
                <Box
                    onClick={() => contextMenuActions.unfavorite?.(selectedProduct)}
                    sx={{
                        py: 1,
                        px: 2,
                        borderRadius: 1.5,
                        backgroundColor: 'transparent',
                        color: 'warning.main',
                        textAlign: 'center',
                        cursor: 'pointer',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        border: '1px solid',
                        borderColor: 'warning.main',
                        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                            backgroundColor: 'warning.main',
                            color: 'white',
                            transform: 'scale(1.01)'
                        },
                        '&:active': {
                            transform: 'scale(0.99)'
                        }
                    }}
                >
                    <StarBorderRounded sx={{ fontSize: 18 }} />
                    <Typography variant="button" sx={{ fontSize: '0.8125rem' }}>
                        Quitar de Favoritos
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
    
    return (
        <>
            <ExplorerView
                config={explorerConfig}
                items={products}
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
                    breadcrumb: <BreadcrumbsNav isFavoritesView={true} />,
                }}
            />

            {/* Overlay de carga al navegar */}
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

export default connect(mapStateToProps)(Favorites);