import { Box, Typography, IconButton, alpha, Tooltip } from '@mui/material';
import { CloseRounded } from '@mui/icons-material';

/**
 * Estilos del contenedor de la regla
 */
const getRuleContainerStyles = (showOperator) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  p: 0.875,
  pl: showOperator ? 2.5 : 0.875,
  backgroundColor: 'background.default',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  transition: 'all 0.15s ease-in-out',
  position: 'relative',
  overflow: 'hidden', // Asegura que nada se salga del borde redondeado
  '&:hover': {
    borderColor: 'primary.main',
    backgroundColor: theme => alpha(theme.palette.primary.main, 0.04),
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
});

/**
 * Estilos del operador rotado
 */
const rotatedOperatorStyles = (operatorColor, operatorBgColor) => ({
  position: 'absolute',
  left: -12, // Ajustado para centrar mejor el giro
  top: '50%',
  transform: 'translateY(-50%) rotate(-90deg)',
  transformOrigin: 'center',
  px: 0.5,
  backgroundColor: operatorBgColor,
  border: `1px solid ${alpha(operatorColor, 0.3)}`,
  borderRadius: 0.5,
  fontSize: '9px',
  fontWeight: 800,
  color: operatorColor,
  letterSpacing: '0.4px',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  zIndex: 2,
  minWidth: '30px',
  textAlign: 'center',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
});

/**
 * Estilos para truncar texto (Reutilizable)
 */
const truncateStyles = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const fieldLabelStyles = {
  ...truncateStyles,
  fontSize: '10px',
  fontWeight: 600,
  color: 'text.secondary',
  textTransform: 'uppercase',
  letterSpacing: '0.2px',
  lineHeight: 1.2,
  display: 'block',
  maxWidth: '100%',
};

const valueStyles = {
  ...truncateStyles,
  fontSize: '12px',
  fontWeight: 600,
  color: 'text.primary',
  lineHeight: 1.4,
  display: 'block',
};

const deleteButtonStyles = {
  color: theme => alpha(theme.palette.error.main, 0.5),
  p: '2px',
  ml: 1,
  '&:hover': {
    color: theme => theme.palette.error.main,
    backgroundColor: theme => alpha(theme.palette.error.main, 0.1),
  },
};

const getOperatorSymbol = (operator) => {
  switch (operator) {
    case 'EQUALS': return '=';
    case 'NOT_EQUALS': return '!=';
    case 'BETWEEN': return 'entre';
    default: return operator;
  }
};

const formatRuleValue = (operator, value) => {
  if (operator === 'BETWEEN') {
    const from = Array.isArray(value) ? value[0] : value?.from;
    const to = Array.isArray(value) ? value[1] : value?.to;
    if (from != null && to != null) return `${from} y ${to}`;
  }
  return String(value ?? '');
};

const FilterRule = ({ rule, onDelete, operator, showOperator, operatorColor, operatorBgColor }) => {
  const valueLabel = formatRuleValue(rule.operator, rule.value);
  const fullFilterText = `${rule.field} ${getOperatorSymbol(rule.operator)} ${valueLabel}`;

  return (
    <Tooltip title={fullFilterText} arrow placement="top" enterDelay={500}>
      <Box sx={getRuleContainerStyles(showOperator)}>
        {/* Operador rotado */}
        {showOperator && operatorColor && operatorBgColor && (
          <Typography sx={rotatedOperatorStyles(operatorColor, operatorBgColor)}>
            {operator}
          </Typography>
        )}

        {/* Contenido de la Regla */}
        <Box sx={{ flex: 1, minWidth: 0, pl: showOperator ? 1 : 0.5 }}>
          <Typography sx={fieldLabelStyles}>
            {rule.field}
          </Typography>
          <Typography sx={valueStyles}>
            {getOperatorSymbol(rule.operator)} {valueLabel}
          </Typography>
        </Box>

        {/* Botón de eliminar */}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation(); // Evita que el tooltip interfiera si hay acciones de clic
            onDelete();
          }}
          sx={deleteButtonStyles}
        >
          <CloseRounded sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>
    </Tooltip>
  );
};

export default FilterRule;