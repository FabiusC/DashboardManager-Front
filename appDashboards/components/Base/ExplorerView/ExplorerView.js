"use client";
import React, { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Box } from "@mui/system";
import {
  IconButton,
  Tooltip,
  Fade,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Header,
  MenuSecondary,
  NotData,
  Card,
  Table,
  LoadingAssembly,
  LoadingData,
  Title,
} from "@creangel/ifindit-ui";
import {
  useHeaderControls,
  useTableControls,
  useCardsControls,
  useMenuControls,
} from "@creangel/ifindit-ui/hooks";
import {
  StarBorderRounded,
  StarRounded,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import moment from "moment";
import "moment/locale/es";
moment.locale("es");

const EXPLORER_ITEM_TARGET_SELECTOR = [
  ".MuiCard-root",
  ".MuiDataGrid-root",
  ".MuiDataGrid-cell",
  ".MuiDataGrid-columnHeader",
  ".MuiDataGrid-row",
].join(",");

function isExplorerItemContextTarget(target) {
  if (!target || typeof target.closest !== "function") {
    return false;
  }
  return target.closest(EXPLORER_ITEM_TARGET_SELECTOR) != null;
}

/**+
 * ExplorerView - Componente reutilizable para vistas de explorador
 * Maneja la lógica común de header, menú lateral, tabla y cards
 *
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.config - Configuración del explorador
 * @param {Array} props.items - Items a mostrar en la vista
 * @param {boolean} props.isLoading - Estado de carga
 * @param {Function} props.onItemClick - Callback cuando se hace single click en un item (card)
 * @param {Function} props.onItemDoubleClick - Callback cuando se hace doble click en un item (card)
 * @param {Function} props.onRowClick - Callback cuando se hace single click en una fila (tabla)
 * @param {Function} props.onRowDoubleClick - Callback cuando se hace doble click en una fila (tabla)
 * @param {Function} props.onCreateClick - Callback cuando se hace click en crear
 * @param {Object} props.columns - Configuración de columnas para la tabla
 * @param {Function} props.getRows - Función para obtener las filas de la tabla
 * @param {Object} props.contextMenuActions - Acciones del menú contextual
 * @param {Object} props.backgroundContextMenuActions - Acciones del menú en área vacía (sin item)
 * @param {ReactNode} props.children - Modales y componentes adicionales
 * @param {Object} props.headerSlots - Slots adicionales para el header
 * @param {Function} props.onFavoriteClick - Callback para marcar como favorito
 * @param {Function} props.onMoreOptionsClick - Callback para más opciones
 * @param {Function} props.onSearch - Callback cuando cambia el valor del search. Recibe el valor como parámetro (string)
 * @param {Function} props.onSortChange - Callback cuando cambia el ordenamiento. Recibe {field, direction} como parámetro
 * @param {Function} props.onLoadMore - Callback para lazy loading
 * @param {boolean} props.hasMore - Indica si hay más elementos para cargar
 * @param {boolean} props.isLoadingMore - Estado de carga incremental
 * @param {number} props.totalCount - Total de elementos disponibles
 * @param {boolean} props.showDeleteAction - Si se muestra el botón de eliminar en la tabla (default: true)
 * @param {boolean} props.showEditAction - Si se muestra el botón de editar en la tabla (default: true)
 * @param {Object} props.cardsGridSx - Estilos opcionales para la cuadrícula de cards
 * @param {Object} props.config.table - Configuración específica de la tabla
 * @param {boolean} props.config.table.showInlineActions - Mostrar acciones dentro de la celda de nombre
 */
const ExplorerView = ({
  config = {},
  items = [],
  isLoading = false,
  onItemClick,
  onItemDoubleClick,
  onRowClick,
  onRowDoubleClick,
  onCreateClick,
  columns = [],
  getRows,
  contextMenuActions = {},
  backgroundContextMenuActions = {},
  children,
  headerSlots = {},
  onFavoriteClick,
  onMoreOptionsClick,
  userNames = {},
  onLoadMore,
  hasMore,
  isLoadingMore,
  totalCount,
  sidebarContent,
  isSidebarOpen,
  onCloseSidebar,
  onSearch,
  onSortChange,
  showDeleteAction = true,
  showEditAction = true,
  badgeConfig = {},
  showMenu = true,
  cardsGridSx = {},
}) => {
  const router = useRouter();
  const theme = useTheme();
  const [backgroundMenu, setBackgroundMenu] = useState({
    open: false,
    x: 0,
    y: 0,
    items: [],
  });

  const resolveBackgroundContextMenuItems = useCallback(() => {
    if (!(config.cards?.showBackgroundContextMenu ?? false)) {
      return [];
    }
    const raw = config.cards?.backgroundContextMenuItems;
    if (typeof raw === "function") {
      const resolved = raw();
      return Array.isArray(resolved) ? resolved : [];
    }
    return Array.isArray(raw) ? raw : [];
  }, [
    config.cards?.showBackgroundContextMenu,
    config.cards?.backgroundContextMenuItems,
  ]);

  const handleExplorerAreaContextMenu = useCallback(
    (event) => {
      const menuItems = resolveBackgroundContextMenuItems();
      if (!menuItems.length) {
        return;
      }
      if (isExplorerItemContextTarget(event.target)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setBackgroundMenu({
        open: true,
        x: event.clientX,
        y: event.clientY,
        items: menuItems,
      });
    },
    [resolveBackgroundContextMenuItems]
  );

  const handleCloseBackgroundMenu = useCallback(() => {
    setBackgroundMenu((prev) => ({ ...prev, open: false }));
  }, []);

  const handleBackgroundMenuAction = useCallback(
    (actionId) => {
      handleCloseBackgroundMenu();
      backgroundContextMenuActions?.[actionId]?.();
    },
    [backgroundContextMenuActions, handleCloseBackgroundMenu]
  );
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Función compartida de ordenamiento para evitar duplicación
  const sortItems = useCallback(
    (itemsToSort, field, direction, itemTypes = {}) => {
      return [...itemsToSort].sort((a, b) => {
        const aValue = a[field];
        const bValue = b[field];

        // Manejar valores nulos o undefined
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return direction === "asc" ? 1 : -1;
        if (bValue == null) return direction === "asc" ? -1 : 1;

        // Comparar fechas
        if (itemTypes[field] === "date" || field.includes("_at")) {
          const dateA = new Date(aValue);
          const dateB = new Date(bValue);
          return direction === "asc" ? dateA - dateB : dateB - dateA;
        }

        // Comparar números
        if (typeof aValue === "number" && typeof bValue === "number") {
          return direction === "asc" ? aValue - bValue : bValue - aValue;
        }

        // Comparar strings
        const strA = String(aValue).toLowerCase();
        const strB = String(bValue).toLowerCase();

        if (strA < strB) return direction === "asc" ? -1 : 1;
        if (strA > strB) return direction === "asc" ? 1 : -1;
        return 0;
      });
    },
    [],
  );

  // Extraer campos de ordenamiento de las columnas de la tabla
  const sortableFields = useMemo(() => {
    // Si hay campos personalizados en la configuración, usarlos
    const customFields = config.sort?.fields;
    if (customFields && customFields.length > 0) {
      return customFields;
    }

    // Si no, extraer de las columnas de la tabla
    const fieldsFromColumns = columns
      .filter((col) => col.field && col.headerName && col.field !== "actions")
      .map((col) => ({
        label: col.headerName,
        value: col.field,
      }));

    return fieldsFromColumns.length > 0
      ? fieldsFromColumns
      : [{ label: "Nombre", value: "name" }];
  }, [columns]);

  // Configuración del header
  const headerInitialConfig = useMemo(
    () => ({
      state: {
        viewMode: {
          value: config.viewMode?.defaultValue || "grid",
        },
        sort: {
          field: config.sort?.defaultField || "name",
          fields: sortableFields,
          direction: config.sort?.defaultDirection || "asc",
        },
        search: {
          value: "",
          placeholder: config.search?.placeholder || "Buscar…",
        },
      },
      show: {
        search: config.show?.search ?? true,
        viewMode: config.show?.viewMode ?? true,
        sort: config.show?.sort ?? true,
      },
      handlers: {
        onSearch: onSearch || (() => {}),
        onSort: onSortChange || (() => {}),
      },
    }),
    [
      config.viewMode?.defaultValue,
      config.sort?.defaultField,
      config.sort?.defaultDirection,
      config.search?.placeholder,
      config.show?.search,
      config.show?.viewMode,
      config.show?.sort,
      sortableFields,
      onSearch,
      onSortChange,
    ],
  );

  const headerState = useHeaderControls(headerInitialConfig);
  // Configuración del menú lateral - memoizada
  const menuConfig = useMemo(
    () => ({
      state: {
        button: {
          value: config.menu?.buttonLabel || "Nuevo",
          icon: config.menu?.buttonIcon,
        },
        title: {
          value: config.menu?.title || "Mis elementos",
        },
        listOptions: {
          items: config.menu?.options || [],
          selectedOption: config.menu?.selectedOption || "default",
        },
      },
      show: {
        button: config.menu?.showButton ?? true,
        listOptions: config.menu?.showOptions ?? true,
        title: config.menu?.showTitle ?? true,
      },
      handlers: {
        onButtonClick: () => {
          onCreateClick?.();
        },
        onListOptionClick: config.menu?.onOptionClick || (() => {}),
      },
    }),
    [
      config.menu?.buttonLabel,
      config.menu?.buttonIcon,
      config.menu?.title,
      config.menu?.options,
      config.menu?.selectedOption,
      config.menu?.showButton,
      config.menu?.showOptions,
      config.menu?.showTitle,
      config.menu?.onOptionClick,
      onCreateClick,
    ],
  );

  const titleConfig = useMemo(
    () => ({
      title: config.titleConfig?.title || "",
      description: config.titleConfig?.description || "",
      icon: config.titleConfig?.icon || null,
    }),
    [config.titleConfig],
  );

  const menuSecondaryState = useMenuControls(menuConfig);
  const showInlineTableActions = config.table?.showInlineActions ?? true;

  // Memoizar los renderers de la tabla para evitar re-renders
  const cellHoverRenderers = useMemo(
    () => {
      if (!showInlineTableActions) {
        return {};
      }

      return {
        name: (params, handlers) => (
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            {/* <Tooltip title="Favorito" placement="top" enterDelay={500}>
                    <IconButton 
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            handlers?.onFavorite?.(params);
                        }}
                        sx={{ padding: '4px' }}
                    >
                        {params.row.favorite ? (
                            <StarRounded sx={{ color: "#FFD700", fontSize: '18px' }} />
                        ) : (
                            <StarBorderRounded sx={{ color: "#a5a5a5", fontSize: '18px' }} />
                        )}
                    </IconButton>
                </Tooltip> */}
            <Tooltip title="Ver detalles" placement="top" enterDelay={500}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handlers?.onView?.(params);
                }}
                sx={{ padding: "4px" }}
              >
                <VisibilityIcon sx={{ color: "#a5a5a5", fontSize: "18px" }} />
              </IconButton>
            </Tooltip>
            {/* Solo mostrar el botón de editar si está habilitado y el item es editable */}
            {showEditAction && params.row.can_edit !== false && (
              <Tooltip title="Editar" placement="top" enterDelay={500}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlers?.onEdit?.(params);
                  }}
                  sx={{ padding: "4px" }}
                >
                  <EditIcon sx={{ color: "#a5a5a5", fontSize: "18px" }} />
                </IconButton>
              </Tooltip>
            )}
            {/* Solo mostrar el botón de eliminar si está habilitado y el item puede ser eliminado */}
            {showDeleteAction && params.row.can_edit !== false && (
              <Tooltip title="Eliminar" placement="top" enterDelay={500}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlers?.onDelete?.(params);
                  }}
                  sx={{ padding: "4px" }}
                >
                  <DeleteIcon sx={{ color: "#d32f2f", fontSize: "18px" }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      };
    },
    [showInlineTableActions, showEditAction, showDeleteAction],
  );

  // Memoizar los handlers de la tabla
  const cellHoverHandlers = useMemo(
    () => ({
      name: {
        onFavorite: (params) => {
          onFavoriteClick?.(params.row);
        },
        onView: (params) => {
          contextMenuActions?.view?.(params.row);
        },
        onEdit: (params) => {
          contextMenuActions?.edit?.(params.row);
        },
        onDelete: (params) => {
          contextMenuActions?.delete?.(params.row);
        },
      },
    }),
    [onFavoriteClick, contextMenuActions],
  );

  // Memoizar los handlers de row
  const tableHandlers = useMemo(
    () => ({
      onRowClick: (params) => {
        onRowClick?.(params);
      },
      onRowDoubleClick: (params) => {
        if (onRowDoubleClick) {
          onRowDoubleClick(params);
        } else {
          onItemClick?.(params.row);
        }
      },
    }),
    [onRowClick, onRowDoubleClick, onItemClick],
  );
  const rowsRef = useRef([]);

  const computedRows = useMemo(() => {
    let processedRows = getRows ? getRows(items, userNames) : items;
    if (headerState?.state?.sort?.field) {
      const { field, direction } = headerState.state.sort;
      const itemTypes = processedRows[0]?._types || {};
      processedRows = sortItems(processedRows, field, direction, itemTypes);
    }
    return processedRows;
  }, [
    items,
    userNames,
    getRows,
    headerState?.state?.sort?.field,
    headerState?.state?.sort?.direction,
    sortItems,
  ]);

  if (
    computedRows.length !== rowsRef.current.length ||
    computedRows.some((r, i) => r.id !== rowsRef.current[i]?.id)
  ) {
    rowsRef.current = computedRows;
  }

  const rows = rowsRef.current;

  const tableConfig = useMemo(
    () => ({
      state: {
        rows,
        columns,
        processingOrder: "hover-first",
        cellHoverRenderers,
        cellHoverHandlers,
      },
      show: { table: true },
      handlers: tableHandlers,
    }),
    [rows, columns, cellHoverRenderers, cellHoverHandlers, tableHandlers],
  );

  const tableState = useTableControls(tableConfig);

  // Formatear y ordenar items con íconos personalizados para cards
  const formattedItems = useMemo(() => {
    // Asegurar que items sea un array
    if (!Array.isArray(items)) {
      console.warn("ExplorerView: items no es un array:", items);
      return [];
    }

    let processedItems = items;

    // Aplicar ordenamiento si existe usando la función compartida
    if (headerState?.state?.sort?.field) {
      const { field, direction } = headerState.state.sort;
      processedItems = sortItems(processedItems, field, direction);
    }

    // Aplicar íconos personalizados y tooltip data
    return processedItems.map((item) => {
      let processedItem = {
        ...item,
        // Agregar tooltip data a cada item
        tooltipData: {
          "Nombre Archivo": item.name,
          Etiquetas: item.tags,
          "Fecha de creación": item.created_at,
        },
        selectedItem: null,
      };

      // Si el item ya tiene su propio ícono renderizado, usarlo directamente
      if (item.icon) {
        const iconSize =
          headerState.state.viewMode.value === "large-icons" ||
          headerState.state.viewMode.value === "grid"
            ? "80px"
            : "60px";
        processedItem.icon = React.cloneElement(item.icon, {
          sx: { ...item.icon.props.sx, fontSize: iconSize },
        });
        return processedItem;
      }

      // Si hay una función para obtener ícono dinámicamente, úsala
      if (config.cards?.getIcon) {
        const IconComponent = config.cards.getIcon(item);
        processedItem.icon = (
          <IconComponent
            sx={{ color: item.color || "#FFD745", fontSize: "55px" }}
          />
        );
        return processedItem;
      }

      // Si hay un ícono estático configurado, úsalo
      if (config.cards?.icon) {
        const IconComponent = config.cards.icon;
        processedItem.icon = (
          <IconComponent
            sx={{ color: item.color || "#FFD745", fontSize: "60px" }}
          />
        );
        return processedItem;
      }

      // Si no hay ícono configurado, retornar el item con tooltip data
      return processedItem;
    });
  }, [
    items,
    config.cards?.icon,
    config.cards?.getIcon,
    headerState?.state?.sort?.field,
    headerState?.state?.sort?.direction,
    sortItems,
    headerState?.state?.viewMode?.value,
  ]);

  // Configuración de las cards con tooltip elegante
  const cardsState = useCardsControls({
    state: {
      items: formattedItems || [],
      viewMode: headerState.state.viewMode.value,
      showShadow: false,
      showBorder: false,
      tooltip: {
        enabled: true,
        dataField: "tooltipData",
        placement: "top",
        arrow: true,
        enterDelay: 300,
        leaveDelay: 100,
        sx: {
          "& .MuiTooltip-tooltip": {
            backgroundColor: "rgba(50, 50, 50, 0.95)",
            color: "#fff",
            fontSize: "0.875rem",
            fontWeight: 500,
            padding: "10px 14px",
            borderRadius: "8px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
            backdropFilter: "blur(10px)",
            maxWidth: "350px",
          },
          "& .MuiTooltip-arrow": {
            color: "rgba(50, 50, 50, 0.95)",
          },
        },
      },
      contextMenu: {
        items: config.cards?.contextMenuItems || [],
        selectedItem: null,
        position: { x: 0, y: 0 },
        open: false,
      },
      badge: {
        getBadge: (item) => {
          if (item[badgeConfig.field] == badgeConfig.value) {
            return {
              ...badgeConfig,
            };
          }
          return null;
        },
      },
    },
    show: {
      grid: true,
      tooltip: true,
      contextMenu: config.cards?.showContextMenu ?? false,
    },
    handlers: {
      onItemClick: (item) => {
        onItemClick?.(item);
        handleSelection(item);
      },
      onItemDoubleClick: (item) => {
        if (onItemDoubleClick) {
          onItemDoubleClick(item);
        } else {
          onItemClick?.(item);
        }
      },
      onContextMenuAction: (actionId, item) => {
        contextMenuActions?.[actionId]?.(item);
      },
    },
  });

  // Sincronizar items con cardsState - SIN cardsState.actions en dependencias
  useEffect(() => {
    const safeItems = Array.isArray(formattedItems) ? formattedItems : [];
    cardsState.actions.updateItems(safeItems);
  }, [formattedItems]);

  // Sincronizar viewMode - SIN cardsState.actions en dependencias
  useEffect(() => {
    cardsState.actions.setViewMode(headerState.state.viewMode.value);
  }, [headerState.state.viewMode.value]);

  // Persistir viewMode en sessionStorage
  useEffect(() => {
    if (config.viewMode?.persist) {
      sessionStorage.setItem("viewMode", headerState.state.viewMode.value);
    }
  }, [headerState.state.viewMode.value, config.viewMode?.persist]);

  // Sincronizar el valor del search con el callback onSearch
  useEffect(() => {
    if (onSearch && headerState?.state?.search?.value !== undefined) {
      onSearch(headerState.state.search.value);
    }
  }, [headerState?.state?.search?.value, onSearch]);

  // Sincronizar el ordenamiento con el callback onSortChange
  useEffect(() => {
    if (
      onSortChange &&
      headerState?.state?.sort?.field &&
      headerState?.state?.sort?.direction
    ) {
      onSortChange({
        field: headerState.state.sort.field,
        direction: headerState.state.sort.direction,
      });
    }
  }, [
    headerState?.state?.sort?.field,
    headerState?.state?.sort?.direction,
    onSortChange,
  ]);

  const handleSelection = (item) => {
    cardsState.actions.selectItem(item.id);
  };

  return (
    <Box
      display="grid"
      gridTemplateColumns={{ xs: "1fr", md: showMenu ? "200px 1fr" : "1fr" }}
      sx={{ flex: 1, minHeight: 0, width: "100%" }}
      overflow="hidden"
    >
      {" "}
      {showMenu && (
        <MenuSecondary
          state={menuSecondaryState.state}
          show={menuSecondaryState.show}
          handlers={menuSecondaryState.handlers}
        />
      )}
      {/* Contenedor principal con sidebar integrado */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Contenido principal */}
        <Box
          sx={{
            m: 2,
            display: "flex",
            flexDirection: "column",
            gap: 0,
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            opacity: isMobile && isSidebarOpen ? 0.3 : 1,
            pointerEvents: isMobile && isSidebarOpen ? "none" : "auto",
          }}
        >
          {/* Header */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            gap={1}
          >
            <Title
              title={titleConfig.title}
              description={titleConfig.description}
              icon={titleConfig.icon}
            />
            <Box display="flex" alignItems="center" gap={1}>
              {/* Header con nueva estructura - Search a la izquierda, Filtros y controles a la derecha */}
              <Header
                state={headerState.state}
                show={headerState.show}
                handlers={headerState.handlers}
                sx={{ marginBottom: "0 !important" }}
              ></Header>

              {headerSlots.additionalFilters && (
                <Box mb={2}>{headerSlots.additionalFilters}</Box>
              )}
              {/* Sidebar toggle */}
              <Box mb={2}>{headerSlots.sidebarToggle}</Box>
            </Box>
          </Box>

          {/* Breadcrumb arriba */}
          {headerSlots.breadcrumb && (
            <Box sx={{ marginBottom: "0.5rem" }}>{headerSlots.breadcrumb}</Box>
          )}

          {/* Slot para contenido después del header (ej: mensajes informativos) */}
          {headerSlots.afterHeader && <Box>{headerSlots.afterHeader}</Box>}

          {/* Contenedor ajustado al espacio disponible */}
          <Box
            sx={{
              backgroundColor: "white",
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
              display: "flex",
              flexDirection: "column",
              borderRadius: 3,
              border: "1px solid #e0e0e0",
              position: "relative",
            }}
          >
            <Fade in={isLoading} timeout={300} unmountOnExit>
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: "column",
                  backgroundColor: "white",
                  zIndex: 2,
                }}
              >
                <LoadingAssembly
                  state={{
                    message: "Cargando elementos...",
                    borderRadius: false,
                    boxShadow: false,
                    size: 60,
                  }}
                />
                {/* <LoadingData state={{message: "Cargando elementos...", borderRadius: false, boxShadow: false}} /> */}
              </Box>
            </Fade>

            <Fade in={!isLoading} timeout={300}>
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                  visibility: isLoading ? "hidden" : "visible",
                }}
              >
                {items?.length > 0 ? (
                  <Box
                    data-explorer-area="true"
                    onContextMenu={handleExplorerAreaContextMenu}
                    sx={{
                      flex: 1,
                      overflow: "auto",
                      pt: 3,
                      px: 3,
                      pb: 5,
                      minHeight: 0,
                      ...cardsGridSx,
                    }}
                    data-view-mode={headerState.state.viewMode.value}
                  >
                    {headerState.state.viewMode.value === "list" ? (
                      <Table state={tableState} />
                    ) : (
                      <Card state={cardsState} />
                    )}
                  </Box>
                ) : (
                  <Box
                    data-explorer-area="true"
                    onContextMenu={handleExplorerAreaContextMenu}
                    sx={{
                      flex: 1,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: 0,
                    }}
                  >
                    <NotData
                      state={{
                        titleValue:
                          config.emptyState?.title || "No hay elementos",
                        descriptionValue:
                          config.emptyState?.description ||
                          "Los elementos aparecerán aquí cuando se empiecen a crear.",
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Fade>
          </Box>

          {/* Modales y componentes adicionales */}
          {children}
        </Box>

        <Menu
          elevation={4}
          open={backgroundMenu.open}
          onClose={handleCloseBackgroundMenu}
          anchorReference="anchorPosition"
          anchorPosition={
            backgroundMenu.open
              ? { top: backgroundMenu.y, left: backgroundMenu.x }
              : undefined
          }
          TransitionComponent={Fade}
          transitionDuration={200}
          slotProps={{
            paper: {
              "aria-label": "Context menu",
              role: "menu",
              sx: {
                borderRadius: "10px",
                fontSize: "14px",
              },
            },
          }}
        >
          {backgroundMenu.items.map((item) => (
            <MenuItem
              key={item.id}
              disabled={Boolean(item.disabled)}
              onClick={() => handleBackgroundMenuAction(item.id)}
              aria-label={item.label}
            >
              {item.icon ? (
                <ListItemIcon>{item.icon}</ListItemIcon>
              ) : null}
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: "14px" }}
              />
            </MenuItem>
          ))}
        </Menu>

        {/* Sidebar integrado con transición */}
        <Box
          sx={{
            width: isSidebarOpen ? (isMobile ? "100%" : "380px") : "0px",
            height: "100%",
            backgroundColor: "#ffffff",
            border: isSidebarOpen ? "1px solid #e5e7eb" : "none",
            display: "flex",
            flexDirection: "column",
            transition:
              "width 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
            position: isMobile ? "fixed" : "relative",
            right: isMobile ? 0 : "auto",
            zIndex: isMobile ? 1300 : "auto",
            boxShadow:
              isSidebarOpen && isMobile
                ? "-2px 0 12px rgba(0, 0, 0, 0.08)"
                : "none",
            opacity: isSidebarOpen ? 1 : 0,
            overflow: "hidden",
            pointerEvents: isSidebarOpen ? "auto" : "none",
          }}
        >
          {sidebarContent}
        </Box>
      </Box>
    </Box>
  );
};

export default ExplorerView;
