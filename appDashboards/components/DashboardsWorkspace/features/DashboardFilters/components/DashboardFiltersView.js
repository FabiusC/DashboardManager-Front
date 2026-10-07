import {
  Box,
  IconButton,
  Typography,
  Button,
  alpha,
} from '@mui/material';
import { CloseRounded, FilterList, DeleteSweep } from '@mui/icons-material';
import FilterGroup from './FilterGroup';

/**
 * Estilos del contenedor principal
 */
const containerStyles = (position) => ({
  width: '350px',
  maxWidth: position === "left" || position === "right" ? '400px' : '100%',
  height: '400px',
  backgroundColor: 'background.default',
  position: 'fixed',
  right: '20px',
  bottom: 0,
  zIndex: 1000,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.12)',
  },
});

/**
 * Estilos del header
 */
const headerStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  justifyContent: 'space-between',
  backgroundColor: 'primary.main',
  p: 2,
  flexShrink: 0,
};

/**
 * Estilos del botón de vaciar todo (fijo en la parte inferior)
 */
const clearButtonContainerStyles = {
  position: 'sticky',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: 'background.default',
  borderTop: '1px solid',
  borderColor: 'divider',
  p: 2,
  flexShrink: 0,
  zIndex: 10,
  boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)',
};

const clearButtonStyles = {
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '13px',
  borderRadius: 2,
  py: 1.25,
  px: 2,
  width: '100%',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  '&:hover': {
    backgroundColor: theme => alpha(theme.palette.error.main, 0.1),
    borderColor: 'error.main',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
  },
};

/**
 * Estilos del contenedor de scroll
 */
const scrollContainerStyles = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  px: 1.5,
  py: 1.5,
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
  },
};

/**
 * Estilos para cuando no hay filtros
 */
const emptyStateStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  py: 6,
  px: 2,
  textAlign: 'center',
  color: 'text.secondary',
};

/**
 * Componente de vista para los filtros del dashboard
 * @param {Object} props - Props del componente
 * @param {Array} props.activeGroups - Array de grupos activos
 * @param {Function} props.onDeleteGroup - Función para eliminar un grupo
 * @param {Function} props.onDeleteRule - Función para eliminar una regla
 * @param {Function} props.onClearAll - Función para limpiar todos los filtros
 * @param {Function} props.onClose - Función para cerrar el panel
 * @param {string} props.position - Posición del panel (top, left, right)
 * @param {string} props.rootOperator - Operador del grupo root (AND/OR) que determina cómo se combinan los grupos
 */
const DashboardFiltersView = ({
  activeGroups,
  onDeleteGroup,
  onDeleteRule,
  onClearAll,
  onClose,
  position = "top",
  rootOperator = "AND"
}) => {
  const hasFilters = activeGroups.length > 0;

  // Determinar el operador a mostrar entre grupos basado en el rootOperator
  const translateOperator = (op) =>{
    if(op === "AND") return "Y"
    if(op === "OR") return "O"
    return op
  }
  const groupOperator = translateOperator(rootOperator || "AND");

  return (
    <Box sx={containerStyles(position)}>
      {/* Header */}
      <Box sx={headerStyles}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FilterList sx={{ color: 'white', fontSize: 22 }} />
          <Typography
            variant="h6"
            sx={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'white',
              letterSpacing: '0.02em',
            }}
          >
            Filtros Activos
            {hasFilters && (
              <Typography
                component="span"
                sx={{
                  ml: 1,
                  fontSize: '13px',
                  fontWeight: 500,
                  opacity: 0.9,
                }}
              >
                ({activeGroups.length})
              </Typography>
            )}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <CloseRounded sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Contenedor de filtros con scroll */}
      <Box sx={scrollContainerStyles}>
        {hasFilters ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {activeGroups.map((group, index) => (
              <FilterGroup
                key={group.id}
                group={group}
                onDeleteGroup={onDeleteGroup}
                onDeleteRule={onDeleteRule}
                level={0}
                showOperatorBefore={index > 0}
                parentOperator={index > 0 ? groupOperator : null}
              />
            ))}
          </Box>
        ) : (
          <Box sx={emptyStateStyles}>
            <FilterList sx={{ fontSize: 48, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '13px' }}>
              No hay filtros activos
            </Typography>
          </Box>
        )}
      </Box>

      {/* Botón para vaciar todo - Fijo en la parte inferior */}
      {
        hasFilters && (
          <Box sx={clearButtonContainerStyles}>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<DeleteSweep />}
              onClick={onClearAll}
              sx={clearButtonStyles}
              disabled={!hasFilters}
            >
              Vaciar Todos los Filtros
            </Button>
          </Box>
        )
      }
    </Box >
  );
};

export default DashboardFiltersView;

