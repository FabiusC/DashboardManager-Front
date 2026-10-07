import { useEffect, useState, useMemo, cloneElement, memo } from "react";
import {
  Box,
  Paper,
  List,
  InputAdornment,
  TextField,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Tooltip,
  IconButton,
  ListItemText,
  Collapse ,
  Badge
} from '@mui/material';

import {
  Cancel,
  Search,
} from '@mui/icons-material';
import { getContrastColor } from '../mui_styled_components';
import FilterListIcon from '@mui/icons-material/FilterList';

import ScrollableTabs from './tabs';

/**
 * Componente de sección de filtros que permite seleccionar y gestionar filtros
 * con funcionalidades de búsqueda, múltiples selecciones y colapso responsivo.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.handleActiveFilters - Función callback que se ejecuta cuando cambian los filtros activos
 * @param {Array} props.values - Array de objetos con la configuración de filtros disponibles
 * @param  props.filtersState - Estado actual de los filtros seleccionados (useState)
 * @param  props.setFiltersState - Función para actualizar el estado de los filtros (useState)
 * 
 * @example
 * <FilterSection 
 *   handleActiveFilters={updateFilters}
 *   values={[
 *     {
 *       id: 'category',
 *       name: 'Categorías',
 *       icon: <CategoryIcon />,
 *       options: [{id: '1', value: 'Electrónicos'}],
 *       allowMultiple: true
 *     }
 *   ]}
 *   filtersState={filters}
 *   setFiltersState={setFilters}
 * />
 */
const FilterSection = ({ handleActiveFilters, values = [], isShowFilters , ...props }) => {
  const [option, setOption] = useState(values[0]?.id || '');
  const { filtersState, setFiltersState } = props;
  const [searchText, setSearchText] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [containerWidth, setContainerWidth] = useState(300);

  const icons = useMemo(() => (
    values.reduce((acc, option) => {
      acc[option.id] = option.icon;
      return acc;
    }, {})
  ), [values]);

  const tabsProps = useMemo(() => {
    return values.map(option => ({
      id: option.id,
      label: option.name,
      name: option.label,
      icon: option.icon,
    }));
  }, [values]);

  const filtersOptions = useMemo(() => {
    return values.reduce((acc, option) => {
      acc[option.id] = {
        name: option.name,
        icon: option.icon,
        options: option.options,
        allowMultiple: option.allowMultiple || false,
        defaultValue: option.defaultValue || false,
        canRemove: option.canRemove,
      };
      return acc;
    }, {});
  }, [values]);

  const getSectionState = (sectionId) =>
    filtersState.find(f => f.id === sectionId) || { selectedIds: [], options: [] };

  const filterOption = filtersOptions[option];

  const iconFilers = (key, isActive) => {
    const color = isActive ? 'primary' : 'action';
    const icon = icons[key];
    return icon ? cloneElement(icon, { color }) : null;
  };

  // useEffect(() => {
  //   const exists = filtersState.some(f => f.id === option);
  //   if (!exists) {
  //     setFiltersState(prev => [...prev, { id: option, selectedIds: [], options: [] }]);
  //   }
  //   setSearchText(''); // limpiar búsqueda al cambiar de tab
  // }, [option]);

  useEffect(() => {
    values.forEach(section => {
      if (!section.defaultValue) return;

      const firstOption = section.options?.[0];
      if (!firstOption) return;

      const alreadySelected = filtersState.find(f => f.id === section.id)?.selectedIds?.length > 0;
      if (!alreadySelected) {
        handleFilter(firstOption.id, section.id);
      }
    });
  }, [values]);


  const handleFilter = (idFilter, section) => {
    const allowMultiple = filterOption.allowMultiple;
    const optionData = filterOption.options.find(opt => opt.id === idFilter);
    setFiltersState(prev => {
      const existing = prev.find(f => f.id === section) || { id: section, selectedIds: [], options: [] };
      const others = prev.filter(f => f.id !== section);

      let newSelectedIds = [];
      let newOptions = [];

      if (!allowMultiple) {
        newSelectedIds = [idFilter];
        newOptions = [optionData];
      } else {
        const isSelected = existing.selectedIds.includes(idFilter);
        if (isSelected) {
          newSelectedIds = existing.selectedIds.filter(id => id !== idFilter);
          newOptions = existing.options.filter(opt => opt.id !== idFilter);
        } else {
          newSelectedIds = [...existing.selectedIds, idFilter];
          newOptions = [...existing.options, optionData];
        }
      }

      const updated = [...others, { id: section, selectedIds: newSelectedIds, options: newOptions, fixed: filterOption.canRemove, icon: filterOption.icon }];
      handleActiveFilters(updated);
      return updated;
    });
  };

  const filteredOptions = useMemo(() => {
    if (!searchText.trim()) return filterOption.options;
    return filterOption.options.filter(({ value }) =>
      value.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [filterOption.options, searchText]);

  const activeCount = filtersState.reduce(
    (acc, filter) => acc + (filter.options?.length || 0),
    0
  );

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 900) { // md breakpoint
        setIsCollapsed(false);
        setContainerWidth(300);
      } else {
        setIsCollapsed(true);
        setContainerWidth(window.innerWidth - 32); // 100% menos padding
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);


  return (
    <Collapse
      in={isShowFilters}
      orientation={"horizontal"}
      timeout={300}
      unmountOnExit
      sx={{
        display: 'flex',
        width: containerWidth,
      }}
    >
      <Box
        sx={{
          width: containerWidth,
          height: '100%',
          flexShrink: { xs: 1, md: 0 },
          transition: 'width 0.5s ease',
        }}
      >
        <Paper sx={{ height: '100%', p: { xs: '10px', md: '30px', lg: '30px' }, pr: { xs: '10px', md: '20px', lg: '20px' } }}>
          <Box sx={{ display: 'flex', flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: { xs: 'flex', md: 'flex' }, alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', mr: 2 }}>
                Filtros
                <Badge
                  badgeContent={activeCount}
                  color="primary"
                  sx={{
                    ml: 3,
                    '& .MuiBadge-badge': {
                      borderRadius: '8px',
                      padding: '0 6px',
                      minWidth: '20px',
                      height: '20px',
                    },
                  }}
                />

              </Typography>

              <Box sx={{ display: { xs: 'flex', md: 'none', lg: 'none' }, alignItems: 'center', gap: 4, cursor: 'pointer', borderRadius: '50%', p: 1, backgroundColor: 'action.hover', '&:hover': { backgroundColor: theme => theme.palette.primary.main, color: theme => getContrastColor(theme.palette.primary.main) } }}>
                <FilterListIcon sx={{ color: theme => theme.palette.primary.main, '&:hover': { color: theme => getContrastColor(theme.palette.primary.main) } }} onClick={handleCollapse} />
              </Box>

              <Box sx={{ display: { xs: 'none', md: 'flex', lg: 'flex' }, alignItems: 'center', gap: 4 }}>
                <FilterListIcon color="primary" />
              </Box>

            </Box>
            {!isCollapsed &&
              <>
                <ScrollableTabs option={option} setOption={setOption} tabs={tabsProps} />

                {filterOption.options.length > 0 ? (
                  <>
                    <TextField
                      variant="outlined"
                      placeholder={`Buscar ${filterOption.name}...`}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      inputProps={{
                        autoComplete: 'off',
                      }}
                      sx={{
                        width: '100%',
                        '& .MuiInputBase-input': {
                          height: 10,
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          bgcolor: 'background.paper',
                          transition: 'none',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setSearchText('')}
                              disabled={!searchText}
                              sx={{ mr: -0.5 }}
                            >
                              <Cancel fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}

                      fullWidth
                    />

                    <Box sx={{ maxHeight: { xs: '25vh', sm: '40vh', md: '60vh', lg: '60vh' }, overflowY: 'auto' }}>
                      <List sx={{ minHeight: { xs: '25vh', sm: '33vh', md: '33vh', lg: '33vh' } }}>
                        {filteredOptions.length > 0 ? (
                          filteredOptions.map(({ id, value }, i) => {
                            const current = getSectionState(option);
                            return (
                              <ListItem key={i} disablePadding>
                                <ListItemButton
                                  selected={current.selectedIds.includes(id)}
                                  onClick={() => handleFilter(id, option)}
                                >
                                  <ListItemIcon>
                                    {iconFilers(option, current.selectedIds.includes(id))}
                                  </ListItemIcon>
                                  <Tooltip title={value} arrow placement="right">
                                    <ListItemText
                                      primary={
                                        <Typography
                                          noWrap
                                          sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            maxWidth: '180px',
                                          }}
                                        >
                                          {value}
                                        </Typography>
                                      }
                                    />
                                  </Tooltip>
                                </ListItemButton>
                              </ListItem>
                            );
                          })

                        ) : (
                          <ListItem>
                            <ListItemText primary="No se encontraron resultados" />
                          </ListItem>
                        )}
                      </List>
                    </Box>
                  </>
                ) : (
                  <Typography>No hay filtros asociados</Typography>
                )}
              </>
            }
          </Box>
        </Paper>
      </Box>
    </Collapse>
  );
};

export default memo(FilterSection);
