import { useCallback } from 'react';
import { Box, IconButton, Tooltip, Chip } from '@mui/material';
import { FolderRounded, FolderCopyRounded, MoreHorizRounded, FavoriteBorder, StarRounded } from '@mui/icons-material';

/**
 * Hook para generar configuraciones comunes del explorador
 * @param {string} entityType - Tipo de entidad (project, folder, product)
 * @param {Object} options - Opciones adicionales de configuración
 */
export const useExplorerConfig = (entityType, options = {}) => {
    
    /**
     * Genera las columnas para la tabla según el tipo de entidad
     * Orden: Nombre, Creador, Fecha de Modificación, Columnas personalizadas, Acciones rápidas
     */
    const getTableColumns = useCallback((customColumns = [], includeActions = true, getIconFn = null) => {
        const nameColumn = {
            field: 'name',
            disableColumnMenu: true,
            headerName: 'Nombre',
            flex: 1,
            minWidth: 200,
            sortable: true, // Habilitar ordenamiento
            contentType: 'iconWithDescription',
            contentProps: {
                icon: (params) => {
                    // Si hay función personalizada para obtener ícono, úsala
                    if (getIconFn) {
                        const IconComponent = getIconFn(params.row);
                        return <IconComponent sx={{ color: params?.row?.color || '#FFD745', fontSize: '40px' }} />;
                    }
                    // Si no, usa el ícono por defecto
                    const IconComponent = options.icon || FolderRounded;
                    return <IconComponent sx={{ color: params?.row?.color || '#FFD745', fontSize: '40px' }} />;
                },
                valueField: 'name',
                descriptionField: 'edited_at',
                descriptionFormat: 'fromNow',
                iconColorField: 'color',
                iconSize: 40,
            }
        };

        const tagsColumn = {
            field: 'tags',
            disableColumnMenu: true,
            headerName: 'Tags',
            width: 250,
            maxWidth: 350,
            sortable: false, // Tags no son ordenables
            contentType: 'custom',
            renderCell: (params) => {
                const tags = params.row.tags || [];
                return (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        {tags.map((tag, index) => (
                            <Chip
                                key={index}
                                label={tag}
                                size="small"
                                variant="outlined"
                                color="primary"
                                sx={{ fontSize: '0.75rem' }}
                            />
                        ))}
                    </Box>
                );
            }
        };

        const createdAtColumn = {
            field: 'created_at',
            disableColumnMenu: true,
            headerName: 'Fecha de creación',
            width: 240,
            maxWidth: 280,
            sortable: true, // Habilitar ordenamiento
            contentType: 'date',
            contentProps: {
                format: 'DD/MM/YYYY HH:mm', // Formato: 01/10/2025 14:30
                showTooltip: true,
                tooltipFormat: 'LLLL' // Tooltip completo: "miércoles, 1 de octubre de 2025 14:30"
            }
        };

        const editedAtColumn = {
            field: 'edited_at',
            disableColumnMenu: true,
            headerName: 'Fecha de modificación',
            width: 240,
            maxWidth: 280,
            sortable: true, // Habilitar ordenamiento
            contentType: 'date',
            contentProps: {
                format: 'DD/MM/YYYY HH:mm', // Formato: 01/10/2025 14:30
                showTooltip: true,
                tooltipFormat: 'LLLL' // Tooltip completo: "miércoles, 1 de octubre de 2025 14:30"
            }
        };

        // Orden: Nombre, Tags, Fecha de Creación, Fecha de Modificación, Columnas personalizadas
        // Las acciones ahora se muestran en hover sobre el nombre
        return [nameColumn, tagsColumn, createdAtColumn, editedAtColumn, ...customColumns];
    }, [options.icon]);

    /**
     * Genera los campos de ordenamiento basados en las columnas de la tabla
     * Solo incluye columnas que son ordenables (sortable !== false)
     */
    const getSortFields = useCallback((columns) => {
        // Filtrar solo las columnas que son ordenables
        const sortableColumns = columns.filter(col => col.sortable !== false && col.field);
        
        // Mapear a formato de campos de ordenamiento
        return sortableColumns.map(col => ({
            label: col.headerName || col.field,
            value: col.field
        }));
    }, []);

    /**
     * Genera las filas para la tabla
     */
    const getTableRows = useCallback((items, userNames = {}) => {
        return items?.map((item) => ({
            id: item.id,
            name: item.name,
            color: item.color,
            tags: item.tags || [], // Tags como array de strings
            created_at: item.created_at,
            edited_at: item.edited_at || item.created_at,
            favorite: item.favorite,
            ...item, // Incluir todas las propiedades adicionales
            _types: {
                created_at: 'date',
                edited_at: 'date',
            }
        }));
    }, []);

    /**
     * Formatea items para las cards con el ícono personalizado
     */
    const formatItemsForCards = useCallback((items) => {
        const IconComponent = options.icon || FolderRounded;
        return items?.map((item) => ({
            ...item,
            icon: <IconComponent sx={{ color: item.color || '#FFD745', fontSize: '60px' }} />
        }));
    }, [options.icon]);

    /**
     * Genera la configuración del menú lateral
     */
    const getMenuConfig = useCallback((customConfig = {}) => {
        return {
            buttonLabel: customConfig.buttonLabel || 'Nuevo',
            buttonIcon: customConfig.buttonIcon,
            title: customConfig.title || 'Mis elementos',
            options: customConfig.options || [],
            selectedOption: customConfig.selectedOption || entityType,
            showButton: customConfig.showButton ?? true,
            showOptions: customConfig.showOptions ?? true,
            showTitle: customConfig.showTitle ?? true,
            onOptionClick: customConfig.onOptionClick || (() => {}),
        };
    }, [entityType]);

    /**
     * Genera la configuración del header
     * @param {Object} customConfig - Configuración personalizada
     * @param {Array} columns - Columnas de la tabla para extraer campos de ordenamiento
     */
    const getHeaderConfig = useCallback((customConfig = {}, columns = []) => {
        // Si no se proporcionan campos personalizados, generarlos automáticamente de las columnas
        const sortFields = customConfig.sort?.fields || 
            (columns.length > 0 ? getSortFields(columns) : [
                { label: 'Nombre', value: 'name' },
                { label: 'Fecha de creación', value: 'created_at' },
                { label: 'Fecha de modificación', value: 'edited_at' }
            ]);

        return {
            viewMode: {
                defaultValue: customConfig.viewMode?.defaultValue || 'grid',
                persist: customConfig.viewMode?.persist ?? true,
            },
            sort: {
                defaultField: customConfig.sort?.defaultField || 'name',
                fields: sortFields,
                defaultDirection: customConfig.sort?.defaultDirection || 'asc',
            },
            search: {
                placeholder: customConfig.search?.placeholder || 'Buscar…',
            },
            show: {
                search: customConfig.show?.search ?? true,
                viewMode: customConfig.show?.viewMode ?? true,
                sort: customConfig.show?.sort ?? true,
            },
        };
    }, [getSortFields]);

    /**
     * Genera la configuración de las cards
     */
    const getCardsConfig = useCallback((customConfig = {}) => {
        return {
            icon: customConfig.icon || options.icon || FolderRounded,
            tooltipEnabled: customConfig.tooltipEnabled ?? false,
            showTooltip: customConfig.showTooltip ?? false,
            showContextMenu: customConfig.showContextMenu ?? false,
            contextMenuItems: customConfig.contextMenuItems || [],
            showBackgroundContextMenu: customConfig.showBackgroundContextMenu ?? false,
            backgroundContextMenuItems: customConfig.backgroundContextMenuItems || [],
        };
    }, [options.icon]);

    /**
     * Genera la configuración del estado vacío
     */
    const getEmptyStateConfig = useCallback((customConfig = {}) => {
        const defaultMessages = {
            project: {
                title: "No existen proyectos creados",
                description: "Los proyectos aparecerán aquí cuando se empiecen a crear."
            },
            folder: {
                title: "No existen carpetas asociadas al proyecto",
                description: "Las carpetas aparecerán aquí cuando se empiecen a asociar."
            },
            product: {
                title: "No existen productos asociados",
                description: "Los productos aparecerán aquí cuando se empiecen a crear."
            },
        };

        return {
            title: customConfig.title || defaultMessages[entityType]?.title || "No hay elementos",
            description: customConfig.description || defaultMessages[entityType]?.description || "Los elementos aparecerán aquí cuando se empiecen a crear."
        };
    }, [entityType]);

    /**
     * Genera la configuración del título
     */
    const getTitleConfig = useCallback((customConfig = {}) => {
        return customConfig || null;
    }, []);

    /**
     * Genera la configuración completa del explorador
     * @param {Object} customConfig - Configuración personalizada
     * @param {Array} columns - Columnas de la tabla (opcional, para generar campos de ordenamiento)
     */
    const getExplorerConfig = useCallback((customConfig = {}, columns = []) => {
        const headerConfig = getHeaderConfig(customConfig, columns);
        
        return {
            menu: getMenuConfig(customConfig.menu),
            viewMode: headerConfig.viewMode,
            sort: headerConfig.sort,
            search: headerConfig.search,
            show: headerConfig.show,
            cards: getCardsConfig(customConfig.cards),
            table: {
                showInlineActions: customConfig.table?.showInlineActions ?? true,
            },
            emptyState: getEmptyStateConfig(customConfig.emptyState),
            titleConfig: getTitleConfig(customConfig.titleConfig),
        };
    }, [getMenuConfig, getHeaderConfig, getCardsConfig, getEmptyStateConfig, getTitleConfig]);

    return {
        getTableColumns,
        getTableRows,
        getSortFields,
        getMenuConfig,
        getHeaderConfig,
        getCardsConfig,
        getEmptyStateConfig,
        getExplorerConfig,
        formatItemsForCards,
        getTitleConfig,
    };
};

export default useExplorerConfig;
