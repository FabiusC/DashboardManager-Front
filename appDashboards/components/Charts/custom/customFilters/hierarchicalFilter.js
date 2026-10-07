import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Checkbox,
  Typography,
  Collapse,
  IconButton,
  List,
  ListItem,
} from '@mui/material';
import {
  ExpandMore,
  ChevronRight,
  CheckBoxOutlineBlank,
  CheckBox,
} from '@mui/icons-material';


const HierarchicalFilter = ({
  data: rawData = [],
  selectedValues: propSelectedValues = [],
  onClick,
  multiple = true,
  styles,
  panel,
  ...props
}) => {
  const data = Array.isArray(rawData) ? rawData : (rawData.data || []);
  const selectedValues = propSelectedValues.length > 0 ? propSelectedValues : (rawData.selectedValues || []);

  const [expandedItems, setExpandedItems] = useState(new Set());
  const [selectedItems, setSelectedItems] = useState(new Set(selectedValues));
  const borderColor = styles?.borderColor ?? '#DFDFE8';
  const titleColor = styles?.titleColor ?? '#4a4d57';
  const simbolColor = styles?.simbolColor ?? 'primary.main';
  const habilitarBusqueda = styles?.habilitar_busqueda ?? false;
  const textAlign = styles?.textAlign ?? 'left';  
  const textStyles = {
    color: styles?.textStyles?.color ?? undefined,
    fontFamily: styles?.textStyles?.fontFamily ?? undefined,
    fontWeight: styles?.textStyles?.fontWeight ?? undefined,
    fontSize: styles?.textStyles?.fontSize ?? undefined,
  };
  const margin = styles?.marginChart ?? {}
  // Sincronizar el estado interno con los valores externos
  useEffect(() => {
    setSelectedItems(new Set(selectedValues));
  }, [selectedValues.join(',')]);

  const toggleExpand = useCallback((field) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        newSet.delete(field);
      } else {
        newSet.add(field);
      }
      return newSet;
    });
  }, []);

  const getAllChildrenFields = useCallback((item) => {
    const fields = [];
    if (item.children && item.children.length > 0) {
      item.children.forEach(child => {
        fields.push(child.field);
        fields.push(...getAllChildrenFields(child));
      });
    }
    return fields;
  }, []);

  const findItemByPath = useCallback((items, path) => {
    if (path.length === 0) return null;
    const [firstField, ...restPath] = path;
    
    for (const item of items) {
      if (item.field === firstField) {
        if (restPath.length === 0) {
          return item;
        }
        if (item.children && item.children.length > 0) {
          return findItemByPath(item.children, restPath);
        }
      }
    }
    return null;
  }, []);

  const areAllDirectChildrenSelected = useCallback((item, selectedSet) => {
    if (!item.children || item.children.length === 0) return false;
    return item.children.every(child => selectedSet.has(child.field));
  }, []);

  const areSomeDirectChildrenSelected = useCallback((item, selectedSet) => {
    if (!item.children || item.children.length === 0) return false;
    const selectedCount = item.children.filter(child => selectedSet.has(child.field)).length;
    return selectedCount > 0 && selectedCount < item.children.length;
  }, []);

  const hasAnyDescendantSelected = useCallback((item, selectedSet) => {
    if (!item.children || item.children.length === 0) return false;
    
    const hasDirectChildSelected = item.children.some(child => selectedSet.has(child.field));
    if (hasDirectChildSelected) return true;
    
    return item.children.some(child => hasAnyDescendantSelected(child, selectedSet));
  }, []);

  const areAllDescendantsSelected = useCallback((item, selectedSet) => {
    if (!item.children || item.children.length === 0) return false;
    
    const allDirectSelected = areAllDirectChildrenSelected(item, selectedSet);
    if (!allDirectSelected) return false;
    
    return item.children.every(child => {
      if (!child.children || child.children.length === 0) return true;
      return areAllDescendantsSelected(child, selectedSet);
    });
  }, [areAllDirectChildrenSelected]);

  const getCheckboxState = useCallback((item, selectedSet) => {
    if (!item.children || item.children.length === 0) {
      return {
        checked: selectedSet.has(item.field),
        indeterminate: false
      };
    }

    const allDescendantsSelected = areAllDescendantsSelected(item, selectedSet);
    const hasAnyDescendant = hasAnyDescendantSelected(item, selectedSet);

    // Si todos los descendientes están seleccionados, el padre debe estar checked
    if (allDescendantsSelected) {
      return { checked: true, indeterminate: false };
    } else if (hasAnyDescendant) {
      return { checked: false, indeterminate: true };
    } else {
      return { checked: false, indeterminate: false };
    }
  }, [hasAnyDescendantSelected, areAllDescendantsSelected]);

  const updateParentSelection = useCallback((path, newSelectedSet, wasDeselected) => {
    if (path.length <= 1) return;
    
    const parentPath = path.slice(0, -1);
    const parent = findItemByPath(data, parentPath);
    
    if (!parent) return;
    
    if (wasDeselected) {
      newSelectedSet.delete(parent.field);
    } else {
      if (areAllDirectChildrenSelected(parent, newSelectedSet)) {
        newSelectedSet.add(parent.field);
      } else if (areSomeDirectChildrenSelected(parent, newSelectedSet)) {
        newSelectedSet.delete(parent.field);
      } else {
        newSelectedSet.delete(parent.field);
      }
    }
    
    updateParentSelection(parentPath, newSelectedSet, wasDeselected);
  }, [data, findItemByPath, areAllDirectChildrenSelected, areSomeDirectChildrenSelected]);

  const handleChangeToSendData = useCallback((selectedSet) => {
    if (!onClick) return;
    
    const findItemWithParents = (items, targetField, parents = []) => {
      for (const it of items) {
        if (it.field === targetField) {
          return { item: it, parents };
        }
        if (it.children && it.children.length > 0) {
          const newParents = [...parents, {
            field: it.fieldName || it.field,
            value: it.value,
          }];
          const found = findItemWithParents(it.children, targetField, newParents);
          if (found) return found;
        }
      }
      return null;
    };
    
    const excludedFields = new Set();
    
    selectedSet.forEach((field) => {
      const result = findItemWithParents(data, field);
      if (!result) return;
      
      const { item } = result;
      

      const checkboxState = getCheckboxState(item, selectedSet);
      if (checkboxState.checked && !checkboxState.indeterminate && item.children && item.children.length > 0) {
        item.children.forEach((child) => {
          excludedFields.add(child.field);
          const childFields = getAllChildrenFields(child);
          childFields.forEach((childField) => excludedFields.add(childField));
        });
      }
    });
    
    // Filtrar: solo incluir elementos que no están excluidos
    const selections = Array.from(selectedSet)
      .filter((field) => !excludedFields.has(field))
      .map((field) => {
        const result = findItemWithParents(data, field);
        if (!result) return null;
        
        const { item, parents } = result;
        
        return {
          field: item.fieldName || item.field,
          value: item.value,
          parents: parents,
        };
      })
      .filter(Boolean);
    
    onClick(selections);
  }, [data, onClick, getCheckboxState, getAllChildrenFields]);

  const handleCheckboxChange = useCallback((item, path = []) => {
    const currentPath = [...path, item.field];
    const hasChildren = item.children && item.children.length > 0;
    const checkboxState = getCheckboxState(item, selectedItems);
    
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      
      if (checkboxState.indeterminate) {
        if (!multiple && newSet.size > 0) {
          newSet.clear();
        }
        newSet.add(item.field);
        
        if (hasChildren) {
          const childrenFields = getAllChildrenFields(item);
          childrenFields.forEach(field => newSet.add(field));
        }
        
        updateParentSelection(currentPath, newSet, false);
      } else if (checkboxState.checked) {
        newSet.delete(item.field);
        
        if (hasChildren) {
          const childrenFields = getAllChildrenFields(item);
          childrenFields.forEach(field => newSet.delete(field));
        }
        
        updateParentSelection(currentPath, newSet, true);
      } else {
        if (!multiple && newSet.size > 0) {
          newSet.clear();
        }
        newSet.add(item.field);
        
        if (hasChildren) {
          const childrenFields = getAllChildrenFields(item);
          childrenFields.forEach(field => newSet.add(field));
        }
        
        updateParentSelection(currentPath, newSet, false);
      }
      
      handleChangeToSendData(newSet);
      
      return newSet;
    });
  }, [data, multiple, selectedItems, getAllChildrenFields, findItemByPath, areAllDirectChildrenSelected, areSomeDirectChildrenSelected, updateParentSelection, getCheckboxState, handleChangeToSendData]);

  const TreeNode = ({ item, level = 0, path = [], fieldName = null, isFirstInLevel = false, isLast = false, hasSiblings = false }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.field);
    const checkboxState = getCheckboxState(item, selectedItems);
    const currentPath = [...path, item.field];
    const currentFieldName = item.fieldName || fieldName;

    return (
      <Box
        sx={{
          width: '100%',
          position: 'relative',
          overflow: 'visible',
          minHeight: '28px',
        }}
      >
        {level > 0 && !isLast && (
          <Box
            component="span"
            sx={{
              position: 'absolute',
              left: `${(level - 1) * 20 + 12}px`,
              top: isFirstInLevel && currentFieldName ? '44px' : '16px',
              bottom: '16px',
              width: '1px',
              backgroundColor: '#DFDFE8',
              zIndex: 0,
              display: 'block !important',
              boxSizing: 'border-box',
            }}
          />
        )}

        {level > 0 && (
          <Box
            sx={{
              position: 'absolute',
              left: `${(level - 1) * 20 + 12 + 1}px`,
              top: isFirstInLevel && currentFieldName ? '44px' : '16px',
              width: `${25 - 12 - 1}px`,
              height: '1px',
              backgroundColor: '#DFDFE8',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
        )}

        {isFirstInLevel && currentFieldName && (
          <Box
            sx={{
              pl: level * 2.5,
              py: 0.5,
              pt: 0.75,
              pb: 0.25,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: '11px',
                fontWeight: 600,
                color: titleColor,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {currentFieldName.replace(/_str$/, '').replace(/_/g, ' ')}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            pl: level * 2.5,
            py: 0.25,
            position: 'relative',
            zIndex: 1,
            overflow: 'visible',
            minHeight: '28px',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
            transition: 'background-color 0.2s',
          }}
        >
          {hasChildren ? (
            <IconButton
              size="small"
              onClick={() => toggleExpand(item.field)}
              sx={{
                width: 24,
                height: 24,
                p: 0.5,
                mr: 0.5,
                color: isExpanded ? 'primary.main' : 'text.secondary',
                borderRadius: '4px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'action.selected',
                  color: 'primary.main',
                  transform: 'scale(1.1)',
                },
              }}
            >
              {isExpanded ? (
                <ExpandMore 
                  sx={{ 
                    fontSize: 18,
                    transition: 'transform 0.2s ease-in-out',
                  }} 
                />
              ) : (
                <ChevronRight 
                  sx={{ 
                    fontSize: 18,
                    transition: 'transform 0.2s ease-in-out',
                  }} 
                />
              )}
            </IconButton>
          ) : (
            <Box sx={{ width: 12, mr: 0.5 }} />
          )}

          <Checkbox
            checked={checkboxState.checked}
            indeterminate={checkboxState.indeterminate}
            onChange={() => handleCheckboxChange(item, path)}
            icon={<CheckBoxOutlineBlank sx={{ fontSize: 18, color: simbolColor }} />}
            checkedIcon={<CheckBox sx={{ fontSize: 18, color: simbolColor }} />}
            indeterminateIcon={
              <Box
                sx={{
                  width: 10,  
                  height: 10,
                  border: '2px solid',
                  borderColor: simbolColor,
                  borderRadius: '2px',
                  backgroundColor: simbolColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 1.5,
                    backgroundColor: 'white',
                    borderRadius: 0.5,
                  }}
                />
              </Box>
            }
            sx={{
              p: 0,
              color: simbolColor,
              borderRadius: '2px',
              '&.Mui-checked': {
                color: simbolColor,
              },
              '&.MuiCheckbox-indeterminate': {
                color: simbolColor,
              },
            }}
          />

          <Box
             sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: textAlign === 'left' ? 'flex-start' 
                : textAlign === 'right' ? 'flex-end' 
                : 'center',  
              ml: 0.5,
              cursor: 'pointer',
              minHeight: 28,
            }}
            onClick={() => handleCheckboxChange(item, path)}
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: textStyles.fontSize,
                color: textStyles.color,
                fontWeight: textStyles.fontWeight ? 500 : 400,
                textAlign: textAlign,
                userSelect: 'none',
                lineHeight: 1.3,
              }}
            >
              <Box component="span" sx={{ fontWeight: 600, mr: 0.75 }}>
              {item.value}
              </Box>
            </Typography>
          </Box>
        </Box>

        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ pl: 0, position: 'relative', overflow: 'visible' }}>
              {isExpanded && (
                <Box
                  component="span"
                  sx={{
                    position: 'absolute',
                    left: `${level * 20 + 12}px`,
                    top: '0px',
                    height: 'calc(100% - 16px)',
                    width: '1px',
                    backgroundColor: '#DFDFE8',
                    zIndex: 0,
                    display: 'block !important',
                    boxSizing: 'border-box',
                  }}
                />
              )}
              {item.children.map((child, index) => {
                const prevChild = index > 0 ? item.children[index - 1] : null;
                const showHeader = index === 0 || (prevChild && prevChild.fieldName !== child.fieldName);
                const isLastChild = index === item.children.length - 1;
                const hasSiblings = item.children.length > 1;
                
                return (
                  <TreeNode
                    key={child.field}
                    item={child}
                    level={level + 1}
                    path={currentPath}
                    fieldName={child.fieldName}
                    isFirstInLevel={showHeader}
                    isLast={isLastChild}
                    hasSiblings={hasSiblings}
                  />
                );
              })}
            </Box>
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: 'background.paper',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'visible',
        position: 'relative',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'background.default',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'action.disabled',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: 'action.disabledBackground',
          },
        },
          marginTop: `${margin.marginTop ?? 0}px`,
          marginRight: `${margin.marginRight ?? 0}px`,
          marginBottom: `${margin.marginBottom ?? 0}px`,
          marginLeft: `${margin.marginLeft ?? 0}px`,
      }}
    >
      <List disablePadding sx={{ py: 0, overflow: 'visible' }}>
        {data.map((item, index) => {
          const prevItem = index > 0 ? data[index - 1] : null;
          const showHeader = index === 0 || (prevItem && prevItem.fieldName !== item.fieldName);
          const isLastItem = index === data.length - 1;
          const hasSiblings = data.length > 1;
          
          return (
            <ListItem key={item.field} disablePadding sx={{ overflow: 'visible', position: 'relative' }}>
              <TreeNode 
                item={item} 
                level={0} 
                fieldName={item.fieldName}
                isFirstInLevel={showHeader}
                isLast={isLastItem}
                hasSiblings={hasSiblings}
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default HierarchicalFilter;
