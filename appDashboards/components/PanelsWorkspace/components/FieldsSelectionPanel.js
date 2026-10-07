import {
  Box,
  Tooltip,
  Avatar,
  IconButton,
  alpha,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  ArrowDownward,
  ArrowUpward,
  Check,
  CloseRounded,
  Functions,
  KeyboardArrowDown,
  Tag,
} from '@mui/icons-material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useState, useRef, useEffect } from "react";
import useModals from "../hooks/useModalsContext";
import { useChartContext } from "../hooks/useChartContext";
import {
  FIELD_METRIC_OPTIONS,
  getMetricOptionsForField,
} from "../services/panelsWorkspaceApi";
import { resolveFieldType } from "@components/DashboardsWorkspace/hooks/useFields";

const METRIC_ICONS = {
  count: Tag,
  count_distinct: Tag,
  sum: Functions,
  min: ArrowDownward,
  max: ArrowUpward,
};

const AverageIcon = ({ sx, ...props }) => (
  <Box
    component="span"
    {...props}
    sx={{
      fontSize: 20,
      lineHeight: 1,
      fontWeight: 400,
      ...sx,
    }}
  >
    ÷
  </Box>
);

const getFieldKey = (field) =>
  String(field?.id ?? field?.field_id ?? field?.name ?? "field");

const getFieldDomKey = (field) =>
  getFieldKey(field).replace(/[^a-zA-Z0-9_-]/g, "_");

const TypeBadge = ({ field }) => {
  const isDimension = resolveFieldType(field) === "dimension";

  return (
    <Avatar
      component="span"
      aria-hidden="true"
      sx={{
        flexShrink: 0,
        width: 22,
        height: 22,
        backgroundColor: "primary.main",
        color: "primary.contrastText",
        fontSize: "9px",
        fontWeight: 500,
      }}
    >
      {isDimension ? "abc" : "123"}
    </Avatar>
  );
};

export const FieldsSelectionPanel = ({
  setFieldToDelete,
  onOperationChange,
}) => {
  const chart = useChartContext();
  const queryParameters = chart.state?.queryParameters?.selected_fields ?? [];

  const containerRef = useRef(null);
  const labelRef = useRef(null);
  const containerChips = useRef(null);
  const [chipsWidth, setChipsWidth] = useState('100%');
  const [isVisibleBottons, setIsvisibleBottons] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [operationMenu, setOperationMenu] = useState({
    fieldKey: null,
    anchorEl: null,
  });
  const [updatingFieldKey, setUpdatingFieldKey] = useState(null);

  const modals = useModals();

  const updateScrollButtons = () => {
    if (containerChips.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerChips.current;
      const isAtStart = scrollLeft <= 0;
      const isAtEnd = scrollLeft >= scrollWidth - clientWidth;

      setCanScrollLeft(!isAtStart);
      setCanScrollRight(!isAtEnd);
    }
  };

  useEffect(() => {
    if (containerChips.current) {
      const hasScroll =
        containerChips.current.scrollWidth > containerChips.current.clientWidth;
      setIsvisibleBottons(hasScroll);

      // Actualizar los botones después de un pequeño delay para asegurar que el DOM se haya actualizado
      setTimeout(() => {
        updateScrollButtons();
      }, 100);
    }

    function updateWidth() {
      if (containerRef.current && labelRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const labelWidth = labelRef.current.offsetWidth;
        // 16px de gap entre label y chips
        const width = Math.max(containerWidth - labelWidth - 16 - 45 * 2, 80);
        setChipsWidth(width + 'px');
      }
    }
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [queryParameters.length]);

  useEffect(() => {
    const container = containerChips.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, []);

  if (queryParameters.length === 0) {
    return null;
  }

  const handleChangeScroll = (side) => {
    if (side == "right") {
      containerChips.current.scrollBy({ left: 100, behavior: 'smooth' })
    }
    if (side == "left") {
      containerChips.current.scrollBy({ left: -100, behavior: 'smooth' })
    }

    // Actualizar los botones después del scroll suave
    setTimeout(() => {
      updateScrollButtons();
    }, 300);
  }

  const handleDeleteField = (queryParameter) => {
    if (chart.state.hasChartType) {
      // abrir modal de confirmación
      modals.openDeleteFieldModal();
      setFieldToDelete(queryParameter);

    } else {

      chart.actions.handleRemoveField(queryParameter);
    }
  }

  const handleOpenOperationMenu = (event, fieldKey) => {
    event.stopPropagation();
    setOperationMenu({
      fieldKey,
      anchorEl: event.currentTarget,
    });
  };

  const handleCloseOperationMenu = () => {
    const trigger = operationMenu.anchorEl;
    setOperationMenu({ fieldKey: null, anchorEl: null });
    requestAnimationFrame(() => trigger?.focus());
  };

  const handleOperationChange = async (field, metric) => {
    const fieldKey = getFieldKey(field);
    handleCloseOperationMenu();

    if (typeof onOperationChange !== "function") return;

    setUpdatingFieldKey(fieldKey);
    try {
      await onOperationChange(field, metric);
    } finally {
      setUpdatingFieldKey(null);
    }
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        mx: '8px',
        width: '100%',
        minWidth: 0,
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <Typography
        ref={labelRef}
        sx={{
          flexShrink: 0,
          fontSize: { lg: "14px", md: "14px", sm: "13px", xs: "13px" },
          textAlign: 'center',
          color: theme => alpha(theme.palette.primary.main, 0.9),
          fontWeight: 'bold'
        }}
      >
        Campos seleccionados:
      </Typography>
      <Box
        sx={{
          display: 'flex',
          gap: 1,
        }}>
        {isVisibleBottons && (
          <IconButton
            disabled={!canScrollLeft}
            aria-label="Desplazar campos seleccionados a la izquierda"
            sx={{

              opacity: canScrollLeft ? 1 : 0.5,
            }}
            onClick={() => handleChangeScroll('left')}>
            <ArrowBackIosIcon fontSize="small" />
          </IconButton>
        )}
        <Box
          ref={containerChips}
          sx={{
            display: 'flex',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            minWidth: 0,
            gap: 1,
            width: chipsWidth,
            maxWidth: '100%',
            alignItems: 'center'


          }}
        >
          {queryParameters.map((queryParameter) => {
            const fieldKey = getFieldKey(queryParameter);
            const fieldDomKey = getFieldDomKey(queryParameter);
            const metricOptions = getMetricOptionsForField(queryParameter);
            const metric = queryParameter.metric || "count";
            const metricLabel =
              metricOptions.find((option) => option.value === metric)?.label ||
              FIELD_METRIC_OPTIONS.find((option) => option.value === metric)
                ?.label || "CONT";
            const fieldLabel =
              queryParameter.alias || queryParameter.name || "Campo";
            const chipLabel = `${metricLabel} (${fieldLabel})`;
            const menuOpen =
              operationMenu.fieldKey === fieldKey &&
              Boolean(operationMenu.anchorEl);
            const isUpdating = updatingFieldKey === fieldKey;
            const operationButtonId = `field-operation-button-${fieldDomKey}`;

            return (
              <Box
                key={fieldKey}
                sx={{
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "stretch",
                  overflow: "hidden",
                  minWidth: 0,
                  maxWidth: { xs: 260, sm: 320 },
                  height: 28,
                  borderRadius: "16px",
                  backgroundColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.1),
                  color: (theme) => alpha(theme.palette.primary.main, 0.9),
                  transition: "background-color 0.2s",
                  "&:hover": {
                    backgroundColor: (theme) =>
                      alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    minWidth: 0,
                    px: 0.5,
                  }}
                >
                  <TypeBadge field={queryParameter} />
                </Box>

                <Tooltip
                  title={chipLabel}
                  placement="bottom"
                  arrow
                >
                  <Box
                    component="span"
                    aria-label={`${metricLabel} de ${fieldLabel}, cambiar operación`}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      minWidth: 0,
                      px: 0.5,
                      gap: 0.5,
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        flexShrink: 0,
                        color: (theme) =>
                          alpha(theme.palette.primary.main, 0.9),
                        fontSize: "11px",
                        fontWeight: 500,
                        lineHeight: 1,
                      }}
                    >
                      {metricLabel}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        minWidth: 0,
                        maxWidth: { xs: 120, sm: 190 },
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: (theme) =>
                          alpha(theme.palette.primary.main, 0.9),
                        fontSize: "11px",
                        fontWeight: 500,
                        lineHeight: 1,
                      }}
                    >
                      {`(${fieldLabel})`}
                    </Typography>
                  </Box>
                </Tooltip>

                <IconButton
                  id={operationButtonId}
                  size="small"
                  aria-label="Cambiar operación del campo"
                  aria-controls={
                    menuOpen
                      ? `field-operation-menu-${fieldDomKey}`
                      : undefined
                  }
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  disabled={isUpdating}
                  onClick={(event) =>
                    handleOpenOperationMenu(event, fieldKey)
                  }
                  sx={{
                    flexShrink: 0,
                    width: 28,
                    minWidth: 28,
                    minHeight: 24,
                    p: 0,
                    borderLeft: 1,
                    borderColor: "divider",
                    borderRadius: 0,
                    color: "text.secondary",
                    "&:hover": {
                      backgroundColor: (theme) =>
                        alpha(theme.palette.primary.main, 0.1),
                      color: "primary.main",
                    },
                    "&:focus-visible": {
                      outline: "2px solid",
                      outlineColor: "primary.main",
                      outlineOffset: "-2px",
                    },
                  }}
                >
                  {isUpdating ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <KeyboardArrowDown fontSize="small" />
                  )}
                </IconButton>

                <Menu
                  id={`field-operation-menu-${fieldDomKey}`}
                  anchorEl={menuOpen ? operationMenu.anchorEl : null}
                  open={menuOpen}
                  onClose={handleCloseOperationMenu}
                  MenuListProps={{
                    "aria-labelledby": operationButtonId,
                  }}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                  }}
                  PaperProps={{
                    sx: {
                      minWidth: 256,
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 2,
                      overflow: "hidden",
                    },
                  }}
                >
                  <Box
                    component="li"
                    role="presentation"
                    sx={{
                      px: 2,
                      py: 1.25,
                      borderBottom: 1,
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      component="div"
                      sx={{
                        color: "primary.main",
                        fontSize: 12,
                        fontWeight: 500,
                        lineHeight: 1.2,
                        letterSpacing: 1
                      }}
                    >
                      TIPO DE CÁLCULO
                    </Typography>
                  </Box>
                  {metricOptions.map(({ value, label, menuLabel }) => {
                    const MetricIcon = value === "avg" ? AverageIcon : METRIC_ICONS[value] || Functions;
                    const isActive = metric === value;

                    return (
                      <MenuItem
                        key={value}
                        role="menuitemradio"
                        aria-checked={isActive}
                        selected={isActive}
                        disabled={isUpdating}
                        onClick={() =>
                          handleOperationChange(queryParameter, value)
                        }
                        sx={{
                          minHeight: 36,
                          gap: 0.5,
                          "&.Mui-selected": {
                            backgroundColor: (theme) =>
                              alpha(theme.palette.primary.main, 0.08),
                          },
                          "&.Mui-selected:hover": {
                            backgroundColor: (theme) =>
                              alpha(theme.palette.primary.main, 0.12),
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 32,
                            color: "text.secondary",
                          }}
                        >
                          <MetricIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={menuLabel || label}
                          primaryTypographyProps={{
                            fontSize: 14,
                            fontWeight: isActive ? 500 : 400,
                          }}
                        />
                        {isActive && (
                          <Check
                            fontSize="small"
                            sx={{ color: "primary.main" }}
                          />
                        )}
                      </MenuItem>
                    );
                  })}
                </Menu>

                <IconButton
                  size="small"
                  aria-label={`Quitar ${fieldLabel}`}
                  onClick={() => handleDeleteField(queryParameter)}
                  sx={{
                    flexShrink: 0,
                    width: 28,
                    minWidth: 28,
                    minHeight: 24,
                    p: 0,
                    color: "text.secondary",
                    "&:hover": {
                      backgroundColor: (theme) =>
                        alpha(theme.palette.primary.main, 0.1),
                      color: "primary.main",
                    },
                    "&:focus-visible": {
                      outline: "2px solid",
                      outlineColor: "primary.main",
                      outlineOffset: "-2px",
                    },
                  }}
                >
                  <CloseRounded sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            );
          })}
        </Box>
        {isVisibleBottons && (
          <IconButton
            disabled={!canScrollRight}
            aria-label="Desplazar campos seleccionados a la derecha"
            sx={{

              opacity: canScrollRight ? 1 : 0.5,
            }}
            onClick={() => handleChangeScroll('right')}>
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        )
        }

      </Box>

    </Box>
  );
}

export default FieldsSelectionPanel;