import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box, Select, MenuItem, FormControl,
  Chip, Typography, Autocomplete, TextField, CircularProgress,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const EMPTY_ARRAY = [];

const isTruthyFlag = (value) =>
  value === true || value === 'true';
const SelectedChips = ({ selectedItems, onDelete, textStyles }) => {
  if (!selectedItems || selectedItems.length === 0) return null;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
      {selectedItems.map((item) => (
        <Chip
          key={item}
          onDelete={onDelete(item)}
          size="small"
          sx={{
            fontFamily: textStyles.fontFamily,
            fontSize: textStyles.fontSize ? `${textStyles.fontSize}px` : 13,
            fontWeight: textStyles.fontWeight,
            color: textStyles.color,
            backgroundColor: 'rgba(25,118,210,0.08)',
            borderRadius: 1.5,
            '& .MuiChip-deleteIcon': {
              color: 'rgba(0,0,0,0.4)',
              fontSize: 18,
              '&:hover': { color: 'rgba(0,0,0,0.7)' },
            },
          }}
        />
      ))}
    </Box>
  );
};

const SelectMode = ({
  data, selectedItems, placeholder, multiple,
  onChange, textStyles, borderWidth, borderColor, loading,
}) => {
  const hasSelection = selectedItems.length > 0;

  const renderValue = (selected) => {
    if (!selected || (Array.isArray(selected) && selected.length === 0)) {
      return (
        <Typography
          variant="body2"
          sx={{
            color: 'text.disabled',
            fontFamily: textStyles.fontFamily,
            fontSize: textStyles.fontSize ? `${textStyles.fontSize}px` : 14,
          }}
        >
          {loading && !hasSelection ? 'Cargando…' : placeholder}
        </Typography>
      );
    }
    return multiple ? selected.join(', ') : selected;
  };

  const currentValue = multiple ? selectedItems : (selectedItems[0] || '');

  return (
    <FormControl fullWidth>
      <Select
        multiple={multiple}
        value={currentValue}
        onChange={onChange}
        renderValue={renderValue}
        displayEmpty
        disabled={loading && data.length === 0 && !hasSelection}
        startAdornment={
          <InputAdornment position="start" sx={{ ml: 0.5, mr: 0 }}>
            <SearchIcon
              sx={{
                fontSize: 18,
                color: 'action.active',
                opacity: 0.55,
              }}
            />
          </InputAdornment>
        }
        endAdornment={
          loading && !hasSelection
            ? <CircularProgress size={16} sx={{ mr: 3, color: 'text.disabled' }} />
            : null
        }
        sx={{
          borderRadius: 2,
          fontFamily: textStyles.fontFamily,
          fontSize: textStyles.fontSize ? `${textStyles.fontSize}px` : 14,
          fontWeight: textStyles.fontWeight,
          color: textStyles.color,
          '& .MuiSelect-select': {
            paddingLeft: '40px',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: borderColor ?? '#e0e7ff',
            borderWidth: `${borderWidth ?? 1}px`,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' },
        }}
        MenuProps={{
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left',
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
          },
          PaperProps: {
            sx: {
              borderRadius: 2,
              mt: 0.5,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              maxHeight: 320,
            },
          },
        }}
      >
        {!multiple && hasSelection && (
          <MenuItem
            value=""
            sx={{
              fontSize: textStyles.fontSize ? `${textStyles.fontSize}px` : 13,
              fontFamily: textStyles.fontFamily,
              color: '#d32f2f',
              py: 1.25, px: 2,
              borderRadius: 1, mx: 0.5, my: 0.25,
              fontStyle: 'italic',
              borderBottom: '1px solid #e0e0e0',
              '&:hover': { backgroundColor: 'rgba(211,47,47,0.07)' },
            }}
          >
            ✕ Limpiar selección
          </MenuItem>
        )}
        {!multiple && hasSelection && !data.includes(selectedItems[0]) && (
          <MenuItem value={selectedItems[0]} sx={{ display: 'none' }}>
            {selectedItems[0]}
          </MenuItem>
        )}
        {data.map((item) => (
          <MenuItem
            key={item}
            value={item}
            sx={{
              fontSize: textStyles.fontSize ? `${textStyles.fontSize}px` : 13,
              fontFamily: textStyles.fontFamily,
              color: textStyles.color,
              py: 1.25, px: 2,
              borderRadius: 1, mx: 0.5, my: 0.25,
              '&:hover': { backgroundColor: 'rgba(25,118,210,0.07)' },
              '&.Mui-selected': {
                backgroundColor: 'rgba(25,118,210,0.1) !important',
                fontWeight: 600,
                color: '#1976d2',
                '&:hover': { backgroundColor: 'rgba(25,118,210,0.15) !important' },
              },
            }}
          >
            {item}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

const SearchMode = ({
  data, selectedItems, placeholder, multiple,
  onChange, textStyles, borderWidth, borderColor, loading,
  inputValue, onInputChange,
}) => {
  const hasSelection = selectedItems.length > 0;
  const showLoading = loading && !hasSelection && data.length === 0;

  const handleInputChange = (_, newInputValue, reason) => {
    if (reason === 'reset' && !multiple) return;
    onInputChange(newInputValue);
  };

  return (
    <Autocomplete
      multiple={multiple}
      options={data}
      value={multiple ? selectedItems : (selectedItems[0] || null)}
      onChange={(_, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      disableCloseOnSelect={multiple}
      loading={showLoading}
      loadingText="Cargando opciones…"
      slotProps={{
        popper: {
          placement: 'bottom-start',
          modifiers: [{ name: 'flip', enabled: false }],
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          slotProps={{
            input: {
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start" sx={{ ml: 0.5, mr: 0 }}>
                    <SearchIcon
                      sx={{
                        fontSize: 18,
                        color: 'action.active',
                        opacity: 0.55,
                      }}
                    />
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
              endAdornment: (
                <>
                  {showLoading ? <CircularProgress size={16} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
          sx={{
            '& .MuiInputLabel-root': {
              left: '36px',
              '&.MuiInputLabel-shrink': {
                left: '0px',
                transform: 'translate(14px, -9px) scale(0.75)',
              },
            },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontFamily: textStyles.fontFamily,
              fontSize: textStyles.fontSize ? `${textStyles.fontSize}px` : undefined,
              fontWeight: textStyles.fontWeight,
              color: textStyles.color,
              '& fieldset': {
                borderColor: borderColor ?? '#e0e7ff',
                borderWidth: `${borderWidth ?? 1}px`,
              },
              '&:hover fieldset': { borderColor: '#1976d2' },
              '&.Mui-focused fieldset': { borderColor: '#1976d2' },
            },
          }}
        />
      )}
      renderOption={(props, option) => {
        const { key, ...restProps } = props;
        const query = inputValue.toLowerCase().trim();
        const idx = option.toLowerCase().indexOf(query);
        return (
          <Box
            key={key}
            component="li"
            {...restProps}
            sx={{
              fontSize: textStyles.fontSize ? `${textStyles.fontSize}px` : 13,
              fontFamily: textStyles.fontFamily,
              color: textStyles.color,
              py: '10px !important',
              px: '16px !important',
              borderRadius: 1,
              mx: 0.5, my: 0.25,
              cursor: 'pointer',
              '&.Mui-focused, &:hover': { backgroundColor: 'rgba(25,118,210,0.07) !important' },
              '&[aria-selected="true"]': {
                backgroundColor: 'rgba(25,118,210,0.1) !important',
                fontWeight: 600,
                color: '#1976d2',
              },
            }}
          >
            {query && idx !== -1 ? (
              <>
                {option.slice(0, idx)}
                <Box component="span" sx={{ fontWeight: 700, color: '#1976d2' }}>
                  {option.slice(idx, idx + query.length)}
                </Box>
                {option.slice(idx + query.length)}
              </>
            ) : option}
          </Box>
        );
      }}
      noOptionsText={
        <Box sx={{ py: 1, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
            {inputValue
              ? `Sin resultados para "${inputValue}"`
              : 'Sin opciones disponibles'}
          </Typography>
        </Box>
      }
      sx={{ width: '100%' }}
    />
  );
};

const filterSelect = ({
  panel,
  styles,
  selectedValues: propSelectedValues,
  selectedValuesToFilters: propSelectedValuesToFilters,
  onClick,
  multiple = false,
  onPreFilterApplied,
  onPreFilterCleared,
}) => {
  const placeholder = styles?.placeholder?? 'Buscar o seleccionar…';
  const typeSearch = styles?.filterType?? false;
  const margin= styles?.margin?? { top: 0, right: 0, bottom: 0, left: 0 };
  const borderWidth = styles?.borderWidth?? 1;
  const borderColor = styles?.borderColor?? '#e0e7ff';
  const isPreFilter = isTruthyFlag(styles?.isPreFilter);
  const textStyles = {
    color:styles?.color?? undefined,
    fontFamily:styles?.fontFamily?? undefined,
    fontWeight:styles?.fontWeight?? undefined,
    fontSize:styles?.fontSize ?? undefined,
  };
  const rawData= panel?.queryParameters?.rawData?? EMPTY_ARRAY;
  const selectedFields = panel?.queryParameters?.selected_fields  ?? EMPTY_ARRAY;
  const fieldKey= selectedFields?.[0]?.name?? null;
  const filterFieldKey = selectedFields?.[1]?.name ?? null;
  const isDictionary = isTruthyFlag(styles?.isAdiccionary);

  const codesFromStore = Array.isArray(propSelectedValuesToFilters) && propSelectedValuesToFilters.length > 0 ? propSelectedValuesToFilters : EMPTY_ARRAY;

  const selectedValues = (() => {
    if (isDictionary && codesFromStore.length > 0 && fieldKey && filterFieldKey) {
      return codesFromStore.map((code) => {
        const row = rawData.find(
          (item) => String(item[filterFieldKey]) === String(code)
        );
        return row ? String(row[fieldKey]) : String(code);
      });
    }
    if (Array.isArray(propSelectedValues)) return propSelectedValues;
    return EMPTY_ARRAY;
  })();

  const toFilterValues = (displayLabels) => {
    if (!isDictionary || !filterFieldKey) return displayLabels;
    return displayLabels
      .map((label) => {
        const row = rawData.find((item) => String(item[fieldKey]) === String(label));
        return row?.[filterFieldKey] != null ? String(row[filterFieldKey]) : String(label);
      })
      .filter((v) => v !== null && v !== undefined && v !== '');
  };

  const currentData = useMemo(() => {
    if (!fieldKey || !Array.isArray(rawData) || rawData.length === 0) return EMPTY_ARRAY;
    return rawData
      .map(item => item?.[fieldKey])
      .filter(val => val !== undefined && val !== null)
      .map(String);
  }, [rawData, fieldKey]);

  const [persistedData, setPersistedData] = useState(EMPTY_ARRAY);
  useEffect(() => {
    if (currentData.length > 0) setPersistedData(currentData);
  }, [currentData]);

  const loading = currentData.length === 0 && persistedData.length === 0;
  const data    = currentData.length > 0 ? currentData : persistedData;

  const [selectedItems, setSelectedItems] = useState(() =>
    Array.isArray(selectedValues) && selectedValues.length > 0
      ? selectedValues
      : EMPTY_ARRAY
  );

  const mustSelectBeforeDashboard = isPreFilter && selectedItems.length === 0;

  const [inputValue, setInputValue] = useState(
    !multiple && Array.isArray(selectedValues) && selectedValues.length > 0
      ? selectedValues[0]
      : ''
  );

  const isInternalUpdate   = useRef(false);
  const prevSelectedValues = useRef(
    Array.isArray(selectedValues) ? selectedValues : EMPTY_ARRAY
  );

  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    const next = Array.isArray(selectedValues) ? selectedValues : EMPTY_ARRAY;
    const prev = Array.isArray(prevSelectedValues.current)
      ? prevSelectedValues.current
      : EMPTY_ARRAY;

    const changed =
      prev.length !== next.length ||
      prev.some((v, i) => v !== next[i]);

    if (!changed) return;

    prevSelectedValues.current = next;
    setSelectedItems(next);

    if (!multiple) {
      setInputValue(next.length > 0 ? next[0] : '');
    }

    if (isPreFilter) {
      if (next.length > 0) {
        onPreFilterApplied?.();
      } else {
        onPreFilterCleared?.();
      }
    }
  }, [selectedValues, multiple, isPreFilter, onPreFilterApplied, onPreFilterCleared]);

  const dispatchFilter = (newSelection) => {
    const normalized = Array.isArray(newSelection)
      ? newSelection: newSelection !== null && newSelection !== undefined && newSelection !== ''? [newSelection]  : EMPTY_ARRAY;

    isInternalUpdate.current   = true;
    prevSelectedValues.current = normalized;

    setSelectedItems(normalized);

    if (!multiple) {
      setInputValue(normalized.length > 0 ? normalized[0] : '');
    }

    const filterPayload = toFilterValues(normalized);

    if (filterPayload.length === 0) {
      onClick?.(null, null);
      if (isPreFilter) {
        onPreFilterCleared?.();
      }
    } else if (multiple) {
      onClick?.(filterPayload, null);
      if (isPreFilter) {
        onPreFilterApplied?.();
      }
    } else {
      onClick?.(filterPayload[0], null);
      if (isPreFilter) {
        onPreFilterApplied?.();
      }
    }
  };

  useEffect(() => {
    if (loading || selectedItems.length === 0) return;
    const hasActiveStoreFilter =
      (isDictionary && codesFromStore.length > 0) ||
      (!isDictionary && Array.isArray(selectedValues) && selectedValues.length > 0);
    if (hasActiveStoreFilter) return;
    if (data.length === 0) return;
    const stillValid = selectedItems.every((item) =>
      data.some((opt) => String(opt) === String(item))
    );
    if (!stillValid) {
      dispatchFilter(EMPTY_ARRAY);
    }
  }, [data, loading, selectedItems, selectedValues, codesFromStore, isDictionary]);

  const handleSelectChange = (event) => {
    const { target: { value } } = event;
    if (multiple) {
      dispatchFilter(typeof value === 'string' ? value.split(',') : value);
    } else {
      dispatchFilter(
        value === '' || value === null || value === undefined ? EMPTY_ARRAY : [value]
      );
    }
  };

  const handleDelete = (itemToDelete) => (event) => {
    event.stopPropagation();
    dispatchFilter(selectedItems.filter(item => item !== itemToDelete));
  };

  const sharedModeProps = {
    data, selectedItems, placeholder,
    multiple, textStyles, borderWidth, borderColor, loading,
  };

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: 'background.paper',
        p: 2.5,
        pt: 3,           
        mt: `${margin.top?? 0}px`,
        mr: `${margin.right?? 0}px`,
        mb: `${margin.bottom ?? 0}px`,
        ml: `${margin.left?? 0}px`,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {multiple && (
        <SelectedChips
          selectedItems={selectedItems}
          onDelete={handleDelete}
          textStyles={textStyles}
        />
      )}

      {mustSelectBeforeDashboard && (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
          Seleccione un valor para cargar el tablero
        </Typography>
      )}

      {typeSearch ? (
        <SearchMode
          {...sharedModeProps}
          onChange={dispatchFilter}
          inputValue={inputValue}
          onInputChange={setInputValue}
        />
      ) : (
        <SelectMode {...sharedModeProps} onChange={handleSelectChange} />
      )}
    </Box>
  );
};

export default filterSelect;