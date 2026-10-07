/**
 * Tipos y estructuras de datos para ExplorerView
 * Este archivo documenta las interfaces y tipos esperados
 */

/**
 * @typedef {Object} ExplorerConfig
 * Configuración principal del explorador
 * 
 * @property {MenuConfig} menu - Configuración del menú lateral
 * @property {ViewModeConfig} viewMode - Configuración de modos de vista
 * @property {SortConfig} sort - Configuración de ordenamiento
 * @property {SearchConfig} search - Configuración de búsqueda
 * @property {ShowConfig} show - Configuración de visibilidad de elementos
 * @property {CardsConfig} cards - Configuración de vista de cards
 * @property {TableConfig} table - Configuración de vista de tabla
 * @property {EmptyStateConfig} emptyState - Configuración de estado vacío
 */

/**
 * @typedef {Object} MenuConfig
 * Configuración del menú lateral
 * 
 * @property {string} title - Título del menú
 * @property {string} buttonLabel - Texto del botón de crear
 * @property {ReactElement} buttonIcon - Icono del botón de crear
 * @property {MenuOption[]} options - Opciones del menú
 * @property {string} selectedOption - Opción seleccionada por defecto
 * @property {boolean} showButton - Mostrar botón de crear
 * @property {boolean} showOptions - Mostrar lista de opciones
 * @property {boolean} showTitle - Mostrar título
 * @property {Function} onOptionClick - Callback al hacer click en opción
 */

/**
 * @typedef {Object} MenuOption
 * Opción del menú lateral
 * 
 * @property {string} label - Etiqueta de la opción
 * @property {string} value - Valor de la opción
 * @property {ReactElement} [icon] - Icono normal
 * @property {ReactElement} [iconSelected] - Icono cuando está seleccionada
 */

/**
 * @typedef {Object} ViewModeConfig
 * Configuración de modos de vista
 * 
 * @property {('grid'|'list'|'large-icons')} defaultValue - Modo por defecto
 * @property {boolean} persist - Persistir en sessionStorage
 */

/**
 * @typedef {Object} SortConfig
 * Configuración de ordenamiento
 * 
 * @property {string} defaultField - Campo por defecto
 * @property {SortField[]} fields - Campos disponibles para ordenar
 * @property {('asc'|'desc')} defaultDirection - Dirección por defecto
 */

/**
 * @typedef {Object} SortField
 * Campo de ordenamiento
 * 
 * @property {string} label - Etiqueta del campo
 * @property {string} value - Valor del campo
 */

/**
 * @typedef {Object} SearchConfig
 * Configuración de búsqueda
 * 
 * @property {string} placeholder - Placeholder del campo de búsqueda
 */

/**
 * @typedef {Object} ShowConfig
 * Configuración de visibilidad
 * 
 * @property {boolean} search - Mostrar búsqueda
 * @property {boolean} viewMode - Mostrar selector de modo de vista
 * @property {boolean} sort - Mostrar selector de ordenamiento
 */

/**
 * @typedef {Object} CardsConfig
 * Configuración de vista de cards
 * 
 * @property {boolean} tooltipEnabled - Habilitar tooltips
 * @property {boolean} showTooltip - Mostrar tooltips
 * @property {boolean} showContextMenu - Mostrar menú contextual
 * @property {ContextMenuItem[]} contextMenuItems - Items del menú contextual
 * @property {boolean} showBackgroundContextMenu - Menú contextual en área vacía del grid
 * @property {ContextMenuItem[]|Function} backgroundContextMenuItems - Items del menú de fondo (array o función sin argumentos)
 */

/**
 * @typedef {Object} ContextMenuItem
 * Item del menú contextual
 * 
 * @property {string} id - ID del item
 * @property {string} label - Etiqueta del item
 * @property {ReactElement} icon - Icono del item
 */

/**
 * @typedef {Object} TableConfig
 * Configuración de vista de tabla
 *
 * @property {boolean} showInlineActions - Mostrar acciones dentro de la celda de nombre
 */

/**
 * @typedef {Object} EmptyStateConfig
 * Configuración de estado vacío
 * 
 * @property {string} title - Título del estado vacío
 * @property {string} description - Descripción del estado vacío
 */

/**
 * @typedef {Object} ColumnConfig
 * Configuración de columna de tabla
 * 
 * @property {string} field - Campo de datos
 * @property {string} headerName - Nombre del encabezado
 * @property {boolean} disableColumnMenu - Deshabilitar menú de columna
 * @property {number} [width] - Ancho fijo
 * @property {number} [minWidth] - Ancho mínimo
 * @property {number} [maxWidth] - Ancho máximo
 * @property {number} [flex] - Factor de flex
 * @property {('text'|'date'|'number'|'iconWithDescription')} contentType - Tipo de contenido
 * @property {Object} [contentProps] - Props adicionales del contenido
 * @property {('left'|'center'|'right')} [align] - Alineación del contenido
 * @property {('left'|'center'|'right')} [headerAlign] - Alineación del header
 */

/**
 * @typedef {Object} TableRow
 * Fila de la tabla
 * 
 * @property {(string|number)} id - ID único de la fila
 * @property {string} name - Nombre
 * @property {string} [color] - Color
 * @property {string} [creator] - Creador
 * @property {string} [created_at] - Fecha de creación
 * @property {string} [edited_at] - Fecha de edición
 * @property {boolean} [favorite] - Es favorito
 * @property {Object} [_types] - Tipos de datos para procesamiento
 */

/**
 * @typedef {Object} ExplorerViewProps
 * Props del componente ExplorerView
 * 
 * @property {ExplorerConfig} config - Configuración del explorador
 * @property {Array} items - Items a mostrar
 * @property {boolean} isLoading - Estado de carga
 * @property {ColumnConfig[]} columns - Columnas de la tabla
 * @property {Function} getRows - Función para obtener filas
 * @property {Function} onItemClick - Callback al hacer click en item
 * @property {Function} onCreateClick - Callback al crear
 * @property {Function} [onFavoriteClick] - Callback al marcar favorito
 * @property {Function} [onMoreOptionsClick] - Callback para más opciones
 * @property {Object} contextMenuActions - Acciones del menú contextual
 * @property {Object} [backgroundContextMenuActions] - Acciones del menú contextual del área vacía (id → handler sin item)
 * @property {ReactNode} [children] - Componentes hijos
 * @property {Object} [headerSlots] - Slots del header
 * @property {Object} [userNames] - Mapa de nombres de usuarios
 */

/**
 * @typedef {Object} ContextMenuActions
 * Acciones del menú contextual
 * 
 * @property {Function} [view] - Ver item
 * @property {Function} [edit] - Editar item
 * @property {Function} [delete] - Eliminar item
 * @property {Function} [trash] - Mover a papelera
 * @property {Function} [favorite] - Marcar como favorito
 * @property {Function} [share] - Compartir item
 * @property {Function} [duplicate] - Duplicar item
 * @property {Function} [exportDashboard] - Exportar tablero
 * @property {Function} [pasteDashboard] - Pegar tablero copiado (área vacía)
 */

// Exportar constantes útiles
export const VIEW_MODES = {
    GRID: 'grid',
    LIST: 'list',
    LARGE_ICONS: 'large-icons',
};

export const SORT_DIRECTIONS = {
    ASC: 'asc',
    DESC: 'desc',
};

export const CONTENT_TYPES = {
    TEXT: 'text',
    DATE: 'date',
    NUMBER: 'number',
    ICON_WITH_DESCRIPTION: 'iconWithDescription',
};

export const ENTITY_TYPES = {
    PROJECT: 'project',
    FOLDER: 'folder',
    PRODUCT: 'product',
};

export default {
    VIEW_MODES,
    SORT_DIRECTIONS,
    CONTENT_TYPES,
    ENTITY_TYPES,
};
