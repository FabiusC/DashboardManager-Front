import { Box, Chip, Typography, Tooltip } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import { cloneElement } from 'react';

const FilterChips = ({ activeFilters = [], onDeleteFilter }) => {
  const deleteFilter = (sectionId, optionId) => {
    if (typeof onDeleteFilter === 'function') {
      onDeleteFilter(sectionId, optionId);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        mb: 2,
        alignItems: 'center',
        maxHeight: '80px',
        overflowY: 'auto',
      }}
    >
      <Typography color="primary">
        Filtros Activos: 
      </Typography>

      {activeFilters.map((filter) =>
        (filter.options || []).map((option) => {
          const isRemovable = filter.fixed;
          const label = option?.value || '';

          return (
            <Tooltip key={`${filter.id}-${option.id}`} title={label} arrow placement="top">
              <Chip
                label={
                  <Box
                    sx={{
                      maxWidth: 120,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </Box>
                }
                icon={
                  filter.icon
                    ? cloneElement(filter.icon, { sx: { fontSize: 16 } })
                    : undefined
                }
                onDelete={
                  isRemovable
                    ? () => deleteFilter( option.id , filter.id)
                    : undefined
                }
                deleteIcon={isRemovable ? <CancelIcon /> : undefined}
                color={option.fixed ? 'default' : 'primary'}
                variant="outlined"
              />
            </Tooltip>
          );
        })
      )}
    </Box>
  );
};

export default FilterChips;
