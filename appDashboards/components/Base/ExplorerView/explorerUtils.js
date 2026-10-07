/**
 * Utilidades comunes para componentes de explorador
 */

/**
 * Colores predefinidos para items
 */
const ITEM_COLORS = [
    '#FF5733', '#3498DB', '#2ECC71', '#9B59B6', '#E74C3C',
    '#F39C12', '#1ABC9C', '#34495E', '#16A085', '#27AE60',
    '#2980B9', '#8E44AD', '#2C3E50', '#F1C40F', '#E67E22',
    '#E74C3C', '#95A5A6', '#D35400', '#C0392B', '#BDC3C7'
];

/**
 * Genera un color basado en un ID (consistente para el mismo ID)
 * @param {string} id - ID del item
 * @returns {string} Color en formato hex
 */
export const getColorForId = (id) => {
    if (!id) return ITEM_COLORS[0];
    
    // Convertir el ID a un número hash
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Usar el hash para seleccionar un color
    const index = Math.abs(hash) % ITEM_COLORS.length;
    return ITEM_COLORS[index];
};

/**
 * Asegura que los items tengan color
 * @param {Array} items - Items a procesar
 * @returns {Array} Items con colores
 */
export const ensureItemsHaveColors = (items = [], color = null) => {
    return items.map(item => ({
        ...item,
        color: color || item.color || getColorForId(item.id)
    }));
};

/**
 * Genera tags por defecto basadas en el tipo de entidad
 * @param {string} entityType - Tipo de entidad (project, folder, product)
 * @param {Object} item - Item individual
 * @returns {Array} Array de tags
 */
const getDefaultTags = (entityType, item) => {
    const tags = [];
    
    // Agregar tag de fecha de creación
    if (item.created_at) {
        const year = new Date(item.created_at).getFullYear();
        tags.push(`${year}`);
    }
    
    // Tags específicas por tipo
    if (entityType === 'project') {
        tags.push('Proyecto');
    } else if (entityType === 'folder') {
        tags.push('Carpeta');
    } else if (entityType === 'product') {
        tags.push(item.type === 'panel' ? 'Panel' : 'Dashboard');
    }
    
    return tags;
};

/**
 * Asegura que los items tengan tags
 * @param {Array} items - Items a procesar
 * @param {string} entityType - Tipo de entidad
 * @returns {Array} Items con tags
 */
export const ensureItemsHaveTags = (items = [], entityType = 'project') => {
    return items.map(item => ({
        ...item,
        tags: item.tags && item.tags.length > 0 ? item.tags : getDefaultTags(entityType, item)
    }));
};

/**
 * Genera acciones comunes del menú contextual
 * @param {Object} handlers - Handlers para las acciones
 * @returns {Object} Objeto con acciones del menú contextual
 */
export const createContextMenuActions = (handlers = {}) => {
    return {
        view: (item) => handlers.onView?.(item),
        edit: (item) => handlers.onEdit?.(item),
        delete: (item) => handlers.onDelete?.(item),
        trash: (item) => handlers.onTrash?.(item),
        favorite: (item) => handlers.onFavorite?.(item),
        share: (item) => handlers.onShare?.(item),
        duplicate: (item) => handlers.onDuplicate?.(item),
    };
};

/**
 * Genera items del menú contextual comunes
 * @param {Array} actions - Acciones a incluir ['view', 'edit', 'delete', etc.]
 * @param {Object} icons - Iconos personalizados para las acciones
 * @returns {Array} Array de items del menú contextual
 */
export const createContextMenuItems = (actions = [], icons = {}) => {
    const defaultIcons = {
        view: 'Visibility',
        edit: 'Edit',
        delete: 'Delete',
        trash: 'DeleteOutlineRounded',
        favorite: 'StarBorderRounded',
        share: 'Share',
        duplicate: 'ContentCopy',
    };

    const labels = {
        view: 'Ver más',
        edit: 'Editar',
        delete: 'Eliminar',
        trash: 'Mover a papelera',
        favorite: 'Marcar como favorito',
        share: 'Compartir',
        duplicate: 'Duplicar',
    };

    return actions.map(action => ({
        id: action,
        label: labels[action] || action,
        icon: icons[action] || defaultIcons[action],
    }));
};

/**
 * Formatea items para la vista de cards
 * @param {Array} items - Items originales
 * @param {Function} mapper - Función de mapeo personalizada
 * @returns {Array} Items formateados
 */
export const formatItemsForCards = (items = [], mapper = null) => {
    if (mapper) {
        return items.map(mapper);
    }
    
    return items.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type || 'default',
        url_image: item.url_image,
        url: item.url,
        color: item.color,
        ...item,
    }));
};

/**
 * Formatea items para la vista de tabla
 * @param {Array} items - Items originales
 * @param {Object} userNames - Mapa de nombres de usuarios
 * @returns {Array} Items formateados
 */
export const formatItemsForTable = (items = [], userNames = {}) => {
    return items.map(item => ({
        id: item.id,
        name: item.name,
        color: item.color,
        creator: userNames[item.creator_user_id]?.username || userNames[item.id]?.username || 'Cargando...',
        created_at: item.created_at,
        edited_at: item.edited_at || item.created_at,
        favorite: item.favorite,
        ...item,
        _types: {
            created_at: 'date',
            edited_at: 'date',
        }
    }));
};

/**
 * Genera opciones del menú lateral comunes
 * @param {string} entityType - Tipo de entidad ('projects', 'folders', 'products')
 * @param {Object} customOptions - Opciones personalizadas adicionales
 * @returns {Array} Array de opciones del menú
 */
export const createMenuOptions = (entityType, customOptions = {}) => {
    const defaultOptions = {
        projects: [
            { label: 'Proyectos', value: 'projects' },
            // { label: 'Favoritos', value: 'favorites' },
            { label: 'Papelera', value: 'trash' }
        ],
        folders: [
            { label: 'Carpetas', value: 'folders' },
            // { label: 'Favoritos', value: 'favorites' },
            { label: 'Papelera', value: 'trash' }
        ],
        products: [
            { label: 'Productos', value: 'products' },
            // { label: 'Favoritos', value: 'favorites' },
            { label: 'Papelera', value: 'trash' }
        ],
    };

    const options = defaultOptions[entityType] || [];
    
    if (customOptions.additional) {
        return [...options, ...customOptions.additional];
    }

    return options;
};

/**
 * Maneja la navegación común del menú lateral
 * @param {string} optionId - ID de la opción seleccionada
 * @param {Object} router - Router de Next.js
 * @param {string} entityType - Tipo de entidad
 */
export const handleMenuNavigation = (optionId, router, entityType) => {
    const routes = {
        trash: `/trash?from=${entityType}`,
        favorites: `/${entityType}/favorites`,
    };

    const route = routes[optionId];
    if (route) {
        router.push(route);
    }
};

/**
 * Persiste el estado de navegación en sessionStorage
 * @param {Object} data - Datos a persistir
 */
export const persistNavigationState = (data = {}) => {
    Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            sessionStorage.setItem(key, value);
        }
    });
};

/**
 * Limpia el estado de navegación del sessionStorage
 * @param {Array} keys - Claves a limpiar
 */
export const clearNavigationState = (keys = []) => {
    keys.forEach(key => {
        sessionStorage.removeItem(key);
    });
};

/**
 * Obtiene parámetros de búsqueda y filtrado
 * @param {Object} headerState - Estado del header
 * @param {Object} additionalParams - Parámetros adicionales
 * @returns {Object} Parámetros formateados
 */
export const getSearchParams = (headerState, additionalParams = {}) => {
    return {
        searchValue: headerState?.objSearch?.searchTerm || '',
        sortField: headerState?.objSort?.field || 'name',
        sortDirection: headerState?.objSort?.direction || 'asc',
        ...additionalParams,
    };
};

/**
 * Valida URL de imagen
 * @param {string} url - URL a validar
 * @returns {boolean} true si es válida
 */
export const validateImageURL = (url) => {
    if (!url) return false;
    const imageExtensions = ['.jpg', '.png', '.jpeg', '.gif', '.webp', '.svg'];
    return url.startsWith('http') && imageExtensions.some(ext => url.includes(ext));
};

/**
 * Genera configuración de columnas por defecto para fechas
 * @param {string} field - Nombre del campo
 * @param {string} headerName - Nombre del header
 * @param {Object} customProps - Props personalizadas
 * @returns {Object} Configuración de columna
 */
export const createDateColumn = (field, headerName, customProps = {}) => {
    return {
        field,
        disableColumnMenu: true,
        headerName,
        width: 240,
        maxWidth: 280,
        contentType: 'date',
        contentProps: {
            format: 'DD/MM/YYYY HH:mm', // Formato: 01/10/2025 14:30
            showTooltip: true,
            tooltipFormat: 'LLLL', // Tooltip: "miércoles, 1 de octubre de 2025 14:30"
            ...customProps
        }
    };
};

/**
 * Genera configuración de columna por defecto para números
 * @param {string} field - Nombre del campo
 * @param {string} headerName - Nombre del header
 * @param {Object} customProps - Props personalizadas
 * @returns {Object} Configuración de columna
 */
export const createNumberColumn = (field, headerName, customProps = {}) => {
    return {
        field,
        disableColumnMenu: true,
        headerName,
        width: 120,
        maxWidth: 150,
        type: 'number',
        align: 'center',
        headerAlign: 'center',
        contentType: 'number',
        ...customProps
    };
};

/**
 * Genera configuración de columna por defecto para texto
 * @param {string} field - Nombre del campo
 * @param {string} headerName - Nombre del header
 * @param {Object} customProps - Props personalizadas
 * @returns {Object} Configuración de columna
 */
export const createTextColumn = (field, headerName, customProps = {}) => {
    return {
        field,
        disableColumnMenu: true,
        headerName,
        width: 200,
        maxWidth: 250,
        contentType: 'text',
        ...customProps
    };
};
