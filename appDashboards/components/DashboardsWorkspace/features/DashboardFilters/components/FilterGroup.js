import { Box, IconButton, alpha, Paper, Typography } from '@mui/material';
import { CloseRounded } from '@mui/icons-material';
import FilterRule from './FilterRule';

/**
 * Obtiene los colores y estilos del operador (sutil, sin texto)
 */
const getOperatorStyles = (operator) => {
  const operatorColor = operator === 'OR' ? '#ff9800' : '#4caf50';
  const operatorBgColor = operator === 'OR'
    ? alpha('#ff9800', 0.08)
    : alpha('#4caf50', 0.08);

  return { operatorColor, operatorBgColor };
};

/**
 * Estilos del contenedor del grupo (compacto)
 */
const getGroupBoxStyles = (operatorColor, level = 0) => ({
  backgroundColor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderLeft: `3px solid ${operatorColor}`,
  borderRadius: 1.5,
  p: 1,
  ml: level > 0 ? 1 : 0,
  my: level > 0 ? 1 : 0,
  transition: 'all 0.15s ease-in-out',
  position: 'relative',
  background: `linear-gradient(to right, ${alpha(operatorColor, 0.03)} 0%, background.paper 3px)`,
  '&:hover': {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    borderColor: alpha(operatorColor, 0.4),
  },
});

/**
 * Componente que representa un grupo de filtros con sus reglas y grupos anidados
 * @param {Object} props - Props del componente
 * @param {Object} props.group - Objeto de grupo con operator, uiContext_id, isCoupled, rulesData, childGroups, etc.
 * @param {Function} props.onDeleteGroup - Función a ejecutar al eliminar el grupo
 * @param {Function} props.onDeleteRule - Función a ejecutar al eliminar una regla
 * @param {number} props.level - Nivel de anidamiento (0 = root level)
 * @param {boolean} props.showOperatorBefore - Si se debe mostrar el operador antes de este grupo
 * @param {string} props.parentOperator - Operador del grupo padre (para mostrar entre grupos hermanos)
 */
const FilterGroup = ({ group, onDeleteGroup, onDeleteRule, level = 0, showOperatorBefore = false, parentOperator = null }) => {
  const { operatorColor, operatorBgColor } = getOperatorStyles(group.operator);
  const hasRules = group.rulesData && group.rulesData.length > 0;
  const hasChildGroups = group.childGroups && group.childGroups.length > 0;

  // Calculate all items (rules + groups) to determine operator positions
  const allItems = [
    ...(hasRules ? group.rulesData.map(r => ({ type: 'rule', data: r })) : []),
    ...(hasChildGroups ? group.childGroups.map(g => ({ type: 'group', data: g })) : [])
  ];

  return (
    <Box>
      {/* Show operator before this group if needed (when it's a sibling of another group/rule) */}
      {showOperatorBefore && parentOperator && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 0.5 }}>
          <Typography
            sx={{
              px: 2,
              py: 0.25,
              backgroundColor: parentOperator === 'OR'
                ? alpha('#ff9800', 0.08)
                : alpha('#4caf50', 0.08),
              border: `1px solid ${parentOperator === 'OR'
                ? alpha('#ff9800', 0.3)
                : alpha('#4caf50', 0.3)}`,
              borderRadius: 1,
              fontSize: '9px',
              fontWeight: 700,
              color: parentOperator === 'OR' ? '#ff9800' : '#4caf50',
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
            }}
          >
            {parentOperator}
          </Typography>
        </Box>
      )}

      <Paper
        elevation={0}
        sx={getGroupBoxStyles(operatorColor, level)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pl: level > 0 ? 1.5 : 0 }}>
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;
            const showOperatorAfter = !isLast; // Show operator after each item except the last

            return (
              <Box key={item.type === 'rule' ? item.data.id : item.data.id}>
                {item.type === 'rule' ? (
                  <FilterRule
                    rule={item.data}
                    operator={group.operator}
                    showOperator={false} // Don't show operator on the rule itself
                    operatorColor={operatorColor}
                    operatorBgColor={operatorBgColor}
                    onDelete={() => onDeleteRule(item.data.id, group.id, group.isCoupled, group.isMainRoot ? group.id : null)}
                  />
                ) : (
                  <FilterGroup
                    group={item.data}
                    onDeleteGroup={onDeleteGroup}
                    onDeleteRule={onDeleteRule}
                    level={level + 1}
                    showOperatorBefore={false}
                    parentOperator={group.operator}
                  />
                )}

                {/* Show operator after this item if it's not the last */}
                {showOperatorAfter && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 0.5 }}>
                    <Typography
                      sx={{
                        px: 2,
                        py: 0.25,
                        backgroundColor: operatorBgColor,
                        border: `1px solid ${alpha(operatorColor, 0.3)}`,
                        borderRadius: 1,
                        fontSize: '9px',
                        fontWeight: 700,
                        color: operatorColor,
                        letterSpacing: '0.3px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {group.operator}
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
};

export default FilterGroup;

