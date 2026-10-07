import React, { useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useMediaQuery, useTheme } from '@mui/material'
import { CategoryRounded, 
         AccountTree as AccountTreeIcon, 
         Folder as FolderIcon, 
         Home as HomeIcon,
         DeleteRounded,
         StarRounded,
         CloudUpload
} from '@mui/icons-material';
import { Breadcrumb, useBreadcrumbControls } from '@creangel/ifindit-ui';

function BreadcrumbsNav({ isTrashView = false, isFavoritesView = false, isImportView = false }) {
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    // Leer DIRECTAMENTE del sessionStorage en cada render
    // Esto asegura que siempre tenga los valores más actuales
    const projectId = typeof window !== 'undefined' ? sessionStorage.getItem('projectId') : null;
    const projectName = typeof window !== 'undefined' ? sessionStorage.getItem('projectName') : null;
    const folderId = typeof window !== 'undefined' ? sessionStorage.getItem('folderId') : null;
    const folderName = typeof window !== 'undefined' ? sessionStorage.getItem('folderName') : null;

    // Función para manejar la navegación y limpiar sessionStorage
    const handleNavigation = useCallback((item) => {
        if (!item || !item.path) return;
        
        try {
            // Limpiar sessionStorage según el nivel de navegación
            if (item.id === 'home') {
                // Volver a Proyectos - limpiar todo
                sessionStorage.removeItem('projectId');
                sessionStorage.removeItem('projectName');
                sessionStorage.removeItem('folderId');
                sessionStorage.removeItem('folderName');
                sessionStorage.removeItem('resourceId');
                sessionStorage.removeItem('resourceName');
                sessionStorage.removeItem('resourceType');
                sessionStorage.removeItem('productId');
                sessionStorage.removeItem('productName');
                sessionStorage.removeItem('productType');
                sessionStorage.removeItem('groupId');
            } else if (item.id === 'project') {
                // Volver al proyecto (lista de carpetas) - limpiar carpetas y productos
                sessionStorage.removeItem('folderId');
                sessionStorage.removeItem('folderName');
                sessionStorage.removeItem('resourceId');
                sessionStorage.removeItem('resourceName');
                sessionStorage.removeItem('resourceType');
                sessionStorage.removeItem('productId');
                sessionStorage.removeItem('productName');
                sessionStorage.removeItem('productType');
            } else if (item.id === 'folder') {
                // Volver a la carpeta (lista de productos) - limpiar solo productos
                sessionStorage.removeItem('resourceId');
                sessionStorage.removeItem('resourceName');
                sessionStorage.removeItem('resourceType');
                sessionStorage.removeItem('productId');
                sessionStorage.removeItem('productName');
                sessionStorage.removeItem('productType');
            }
            
            // Navegar - el loader se mostrará en el contenedor de cada vista
            router.push(item.path);
        } catch (error) {
            console.error('Error en navegación:', error);
        }
    }, [router]);

    // Construir items del breadcrumb dinámicamente (estilo Google Drive)
    const breadcrumbItems = useMemo(() => {
        const items = [];

        // Siempre mostrar "Proyectos" que lleva a la lista de proyectos
        items.push({
            id: 'home', 
            label: 'Proyectos',
            path: '/projects',
            icon: <AccountTreeIcon sx={{ fontSize: '18px' }} />
        });

        // Si estamos en la vista de papelera, agregar el item de papelera
        if (isTrashView) {
            // Agregar Proyecto específico si estamos dentro de un proyecto
            if (projectId && projectName) {
                items.push({
                    id: 'project',
                    label: projectName,
                    icon: <AccountTreeIcon sx={{ fontSize: '18px' }} />,
                    path: '/projects/folders' // Al hacer clic, ir a carpetas del proyecto
                });
            }

            // Agregar Carpeta específica si hay folderId (con o sin folderName)
            if (projectId && folderId) {
                items.push({
                    id: 'folder',
                    label: folderName || 'Carpeta',
                    icon: <FolderIcon sx={{ fontSize: '18px' }} />,
                    path: '/projects/folders/resources' // Al hacer clic, ir a recursos de la carpeta
                });
            }

            // Agregar Papelera como último item
            items.push({
                id: 'trash',
                label: 'Papelera',
                icon: <DeleteRounded sx={{ fontSize: '18px' }} />,
                path: null // No navegable, es la vista actual
            });
        } else if (isImportView) {
            items.push({
                id: 'import',
                label: 'Importar',
                icon: <CloudUpload sx={{ fontSize: '18px' }} />,
                path: null
            });
        } else if (isFavoritesView) {
            // Si estamos en la vista de favoritos, solo mostrar Inicio > Favoritos
            // items.push({
            //     id: 'favorites',
            //     label: 'Favoritos',
            //     icon: <StarRounded sx={{ fontSize: '18px' }} />,
            //     path: null // No navegable, es la vista actual
            // });
        } else {
            // Vista normal (no papelera)
            // Agregar Proyecto específico si estamos dentro de un proyecto
            if (projectId && projectName) {
                items.push({
                    id: 'project',
                    label: projectName,
                    icon: <AccountTreeIcon sx={{ fontSize: '18px' }} />,
                    path: '/projects/folders' // Al hacer clic, ir a carpetas del proyecto
                });
            }

            // Agregar Carpeta específica si hay folderId (con o sin folderName)
            if (projectId && folderId) {
                items.push({
                    id: 'folder',
                    label: folderName || 'Carpeta',
                    icon: <FolderIcon sx={{ fontSize: '18px' }} />,
                    path: '/projects/folders/resources' // Al hacer clic, ir a recursos de la carpeta
                });
            }
        }

        return items;
    }, [projectId, projectName, folderId, folderName, isTrashView, isFavoritesView, isImportView]);

    // Determinar el item activo basado en la ruta actual y el contexto
    const activeItemId = useMemo(() => {
        const pathname = router.pathname;
        
        // Si estamos en la vista de papelera, el item activo es 'trash'
        if (isTrashView) {
            return 'trash';
        }
        
        // Si estamos en la vista de favoritos, el item activo es 'favorites'
        if (isFavoritesView) {
            return 'favorites';
        }

        if (isImportView) {
            return 'import';
        }
        
        // Si estamos en editores (panelsWorkspace o dashboardsWorkspace)
        if (pathname.includes('/panelsWorkspace') || pathname.includes('/dashboardsWorkspace')) {
            // Estamos en un editor, el último nivel navegable es la carpeta
            if (folderId) return 'folder';
            if (projectId) return 'project';
            return 'home';
        }
        
        // Si estamos en recursos (dentro de una carpeta)
        if (pathname.includes('/projects/folders/resources')) {
            if (folderId) return 'folder';
            if (projectId) return 'project';
        }
        
        // Si estamos en la lista de carpetas (dentro de un proyecto)
        if (pathname.includes('/projects/folders')) {
            if (projectId && projectName) return 'project';
        }
        
        // Si estamos en la lista de proyectos
        if (pathname.includes('/projects')) {
            return 'home';
        }
        
        return 'home';
    }, [router.pathname, projectId, projectName, folderId, folderName, isTrashView, isFavoritesView, isImportView]);

    const breadcrumbState = useBreadcrumbControls({
        state: {
            items: breadcrumbItems,
            activeItem: activeItemId,
            showHomeIcon: true,
            maxItems: isMobile ? 2 : 5, // Responsive: menos items en móvil
        },
        show: {
            breadcrumb: true,
        },
        handlers: {
            onItemClick: handleNavigation,
        },
    });

    return (
        <Breadcrumb state={breadcrumbState} />
    );
}

export default BreadcrumbsNav