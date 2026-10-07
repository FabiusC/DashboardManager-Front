import React, { useState, useEffect, useMemo } from 'react';
import PivotTable from 'react-pivottable-custom-creangel-component2/PivotTable';
import TableRenderers from 'react-pivottable-custom-creangel-component2/TableRenderers';
import 'react-pivottable-custom-creangel-component2/pivottable.css';
import {
  Box,
  Typography,
  Button,
  TextField,
  Tooltip,
  IconButton,
  Snackbar,
  Alert,
  Checkbox,
  CircularProgress,
  MenuItem,
  Select
} from '@mui/material';
import {
  Search as SearchIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import ExcelJS from 'exceljs';
import { useFieldsByDataSourceId } from '@components/DashboardsWorkspace/hooks/useFields';
import { handleQuery } from '@helpers/QueryManagerAPI/queryRequest';
import { connect, useDispatch, useSelector } from 'react-redux';
import { useFilterManager } from '@components/Charts/filters/useFilterManager';
import { convertStateToApiPayload } from '@helpers/filtersConverter';

// Diccionario para mapear nombres de agregadores a tipos de agregación
const AGGREGATOR_MAPPING = {
  'Suma': 'sum',
  'Promedio': 'avg',
  'Conteo': 'count',
  'Mínimo': 'min',
  'Máximo': 'max'
};

const AGGREGATION_OPTIONS = Object.entries(AGGREGATOR_MAPPING);
const PIVOT_VALUE_LABEL_FIELD = 'Indicadores';
const PIVOT_VALUE_FIELD = '__dynamic_table_value';

// Función removida - ahora se usa el hook useFieldsByDataSourceId



function DynamicTable({ styles, dataSourceId, user, panel }) {
  const [pivotState, setPivotState] = useState({
    rows: [],
    cols: [],
    aggregatorName: 'Suma'
  });
  const aggregatorName = 'Suma';

  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectedValues, setSelectedValues] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasCalculated, setHasCalculated] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [warningMessage, setWarningMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dataTooLarge, setDataTooLarge] = useState(false);

  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  
  // Obtener campos desde la API usando el hook
  const { data: availableFields = [], isLoading: isLoadingFields } = useFieldsByDataSourceId(dataSourceId);

  // Get panel ID from panel prop or generate a unique context ID
  const idPanel = panel?.id || panel?.panel?.id || `dynamic_table_${dataSourceId}`;

  // Initialize FilterManager for this panel
  const filterManager = useFilterManager(idPanel);

  // Get filters from Redux state and convert to API format
  // Using "root" as default to get all dashboard-level filters (same as usePanelData)
  const filtersState = useSelector(state => state.filters || {});
  const filters = useMemo(() => {
    return convertStateToApiPayload(filtersState);
  }, [filtersState]);

  // Get filter conditions for reactivity (when filters change, recalculate)
  // Track changes in the panel's root group to trigger recalculation
  const filterConditions = useMemo(() => {
    const rootGroup = filterManager?.getPanelRootGroup();
    if (!rootGroup) return null;
    // Return a hash of the group structure to detect changes
    return JSON.stringify({
      id: rootGroup.id,
      children: rootGroup.children,
      operator: rootGroup.operator
    });
  }, [filterManager, filtersState]);

  // Limpiar selecciones cuando cambie la fuente de datos
  useEffect(() => {
    if (dataSourceId) {
      setSelectedRows([]);
      setSelectedColumns([]);
      setSelectedValues([]);
      setPivotState({
        rows: [],
        cols: [],
        vals: [],
        aggregatorName: 'Suma',
        rendererName: 'Table'
      });
      setHasCalculated(false);
      setWarningMessage('');
      setDataTooLarge(false);
      setData([]);
    }
  }, [dataSourceId]);

  // Detectar cambios en los parámetros de la tabla dinámica
  useEffect(() => {
    if (hasCalculated) {
      if (data.length > 0) {
        setWarningMessage("Se han modificado los parámetros de los valores, columnas y/o filas en la tabla, por favor presionar calcular para actualizar los datos");
        setHasCalculated(false);
        setData([]);
      } else {
        setWarningMessage('');
      }
    }
  }, [selectedRows, selectedColumns, selectedValues]);

  useEffect(() => {
    if (hasCalculated) {
      handleCalculate();
    }
  }, [aggregatorName, filterConditions]);


  // Filtrar campos por búsqueda
  const filteredFields = availableFields.filter(field =>
    field.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCalculate = async () => {
    setIsLoading(true);

    let vals = selectedValues.length > 0 ? [PIVOT_VALUE_FIELD] : [];
    let aggregations = selectedValues.map(val => ({
      ...val,
      metric: val.metric || 'sum'
    }));
    const fields = [...selectedRows, ...selectedColumns].map(field => ({...field, metric: field.metric ?? ''}))
    if (selectedValues.length === 0 && fields.length > 0) {
      const firstField = fields[0];
      aggregations = [{
        id: firstField.id || `count-${firstField.name}`,
        name: firstField.name,
        type: firstField.type || 'dimension',
        alias: `Conteo de ${firstField.alias}`,
        description: `Conteo de ${firstField.description || firstField.alias}`,
        metric: 'count'
      }];
      // Configurar el vals para que PivotTableUI use un campo simple
      vals = ['count'];
    }

    try {

      const bodyQuery = {
        query_type: "aggregation",
        datasource_id: dataSourceId,
        group_by: fields,
        aggregations: aggregations,
        limit: 10000,
        filters: filters
      }
      const response = await handleQuery(dispatch,
        user[0].userID,
        'query',
        'datos de la gráfica',
        bodyQuery,
        {});
      if (response[0]) {
        // Verificar si la cantidad de registros supera el límite
        const recordCount = response[1].length;
        if (recordCount > 8000) {
          setDataTooLarge(true);
          setData([]);
          setWarningMessage(`La consulta ha devuelto ${recordCount} registros, lo cual supera el límite máximo de 8,000. Por favor, aplique más filtros para reducir la cantidad de datos.`);
          return;
        }

        setDataTooLarge(false);
        setWarningMessage('');

        const mappedData = selectedValues.length > 0 ? response[1].flatMap(item => {
            const groupData = fields.reduce((result, field) => {
              result[field.name] = item[field.name];
              return result;
            }, {});

            return aggregations
              .map(value => {
                const aggregatedField = `${value.name}__${value.metric}`;

                if (!Object.prototype.hasOwnProperty.call(item, aggregatedField)) {
                  return null;
                }

                return {
                  ...groupData,
                  [PIVOT_VALUE_LABEL_FIELD]: value.alias || value.name,
                  [PIVOT_VALUE_FIELD]: item[aggregatedField]
                };
              })
              .filter(Boolean);
          })
          : response[1].map(item => {
            const mappedItem = { ...item };
            if (fields.length > 0) {
              const firstField = fields[0];
              const countField = `${firstField.name}__count`;
              if (mappedItem[countField] !== undefined) {
                mappedItem['count'] = mappedItem[countField];
                delete mappedItem[countField];
              }
            }

            return mappedItem;
          });

        const pivotColumns = selectedColumns.map(column => column.name);
        if (selectedValues.length > 0) {
          pivotColumns.push(PIVOT_VALUE_LABEL_FIELD);
        }

        setData(mappedData);
        setPivotState({
          rows: selectedRows.map(row => row.name),
          cols: pivotColumns,
          vals: vals,
          aggregatorName: selectedValues.length > 0 ? 'Suma' : aggregatorName,
          rendererName: 'Table'
        });
      }
    } catch (error) {
      console.log("Juan error", error);
    } finally {
      setIsLoading(false);
    }

    setHasCalculated(true);
  };

  const handleClear = () => {
    setSelectedRows([]);
    setSelectedColumns([]);
    setSelectedValues([]);
    setPivotState({
      rows: [],
      cols: [],
      vals: [],
      aggregatorName: 'Suma',
      rendererName: 'Table'
    });
    setHasCalculated(false);
    setWarningMessage('');
    setDataTooLarge(false);
  };

  const handleFieldDrop = (field, target) => {
    // Remover de otras categorías si ya existe
    setSelectedRows(prev => prev.filter(row => row.name !== field.name));
    setSelectedColumns(prev => prev.filter(col => col.name !== field.name));
    if (target !== 'values') {
      setSelectedValues(prev => prev.filter(val => val.name !== field.name));
    }

    switch (target) {
      case 'rows':
        if (!selectedRows.some(row => row.name === field.name)) {
          setSelectedRows(prev => [...prev, field]);
        }
        break;
      case 'columns':
        if (!selectedColumns.some(col => col.name === field.name)) {
          setSelectedColumns(prev => [...prev, field]);
        }
        break;
      case 'values':
        setSelectedValues(prev => {
          if (prev.some(value => value.name === field.name)) {
            return prev;
          }

          return [...prev, { ...field, metric: field.metric || 'sum' }];
        });
        break;
      default:
        break;
    }
  };

  const handleAggregationChange = (fieldName, metric) => {
    setSelectedValues(prev => prev.map(value =>
      value.name === fieldName ? { ...value, metric } : value
    ));
  };

  const removeField = (field, target) => {
    switch (target) {
      case 'rows':
        setSelectedRows(prev => prev.filter(row => row.name !== field.name));
        break;
      case 'columns':
        setSelectedColumns(prev => prev.filter(col => col.name !== field.name));
        break;
      case 'values':
        setSelectedValues(prev => prev.filter(val => val.name !== field.name));
        break;
      default:
        break;
    }
  };

  const exportToExcel = () => {
    try {
      const pivotTable = document.querySelector('.pvtTable');
      if (pivotTable) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Tabla Dinamica');

        const rows = Array.from(pivotTable.querySelectorAll('tr')).map((tr) =>
          Array.from(tr.querySelectorAll('th, td')).map((cell) => cell.textContent?.trim() || '')
        );
        rows.forEach((row) => worksheet.addRow(row));

        workbook.xlsx.writeBuffer().then((buffer) => {
          const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'tabla_dinamica.xlsx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        });

        setSnackbarMessage('Archivo exportado exitosamente');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
      }
    } catch (error) {
      setSnackbarMessage('Error al exportar el archivo');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const DropZone = ({
    title,
    fields,
    onRemove,
    target,
    isValueZone = false,
    onAggregationChange
  }) => {
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e) => {
      e.preventDefault();
      setIsOver(true);
    };

    const handleDragLeave = () => {
      setIsOver(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsOver(false);
      try {
        const field = JSON.parse(e.dataTransfer.getData('text/plain'));
        handleFieldDrop(field, target);
      } catch (error) {
        console.error('Error parsing dropped field:', error);
      }
    };

    return (
      <Box
        sx={{
          p: 1,
          m: 0.5,
          minHeight: 80,
          border: `1px solid ${isOver ? '#2196f3' : '#ccc'}`,
          backgroundColor: isOver ? '#f0f8ff' : '#fafafa',
          borderRadius: 1,
          transition: 'all 0.2s ease'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', fontSize: '14px' }}>
          {title}
          {isValueZone && (
            <Tooltip title="Cada valor puede tener una agregación diferente">
              <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
                <InfoIcon sx={{ fontSize: '14px' }} />
              </IconButton>
            </Tooltip>
          )}
        </Typography>



        <Box sx={{ minHeight: 40 }}>
          {fields.length === 0 ? (
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{
                textAlign: 'center',
                display: 'block',
                mt: 1,
                fontStyle: 'italic'
              }}
            >
              Arrastra campos aquí
            </Typography>
          ) : (
            fields.map((field, index) => (
              <Box
                key={index}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  p: 0.25,
                  m: 0.25,
                  backgroundColor: '#e3f2fd',
                  borderRadius: 0.5,
                  border: '1px solid #2196f3',
                  fontSize: '12px'
                }}
              >
                <Typography variant="caption" sx={{ mr: 0.5 }}>
                  {field.alias}
                </Typography>
                {isValueZone && (
                  <Select
                    size="small"
                    value={field.metric || 'sum'}
                    onChange={(event) => onAggregationChange(field.name, event.target.value)}
                    sx={{
                      minWidth: 78,
                      height: 22,
                      fontSize: '10px',
                      '& .MuiSelect-select': {
                        py: 0.25,
                        px: 0.75
                      }
                    }}
                  >
                    {AGGREGATION_OPTIONS.map(([label, metric]) => (
                      <MenuItem key={metric} value={metric} sx={{ fontSize: '12px' }}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
                <IconButton
                  size="small"
                  onClick={() => onRemove(field, target)}
                  sx={{ p: 0, minWidth: 'auto', width: '16px', height: '16px' }}
                >
                  <CloseIcon sx={{ fontSize: '12px' }} />
                </IconButton>
              </Box>
            ))
          )}
        </Box>
      </Box>
    );
  };

  const shouldHideTotals = selectedValues.length > 0 &&
    selectedValues.some(value => (value.metric || 'sum') !== 'sum');
  const pivotTableStyles = {
    ...(shouldHideTotals ? {
      '& .pvtTable .pvtTotal, & .pvtTable .pvtGrandTotal, & .pvtTable .pvtTotalLabel': {
        display: 'none'
      }
    } : {})
  };

  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      display: 'flex',
      backgroundColor: styles?.backgroundColor || '#f5f5f5',
      overflow: 'auto',
      minHeight: 0
    }}>
      {/* Panel principal de la tabla */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', mr: 2, overflow: 'hidden', minHeight: 0 }}>

        {/* Tabla dinámica */}
        <Box sx={{ flex: 1, overflow: 'auto', backgroundColor: 'white', borderRadius: 1, minHeight: 0 }}>
          {isLoading ? (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: 2
            }}>
              <CircularProgress size={40} />
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
                Cargando datos...
              </Typography>
            </Box>
          ) : dataTooLarge ? (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}>
              <Typography variant="body2" color="error.main" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                {warningMessage}
              </Typography>
            </Box>
          ) : hasCalculated && pivotState.rows.length + pivotState.cols.length + pivotState.vals.length > 0 ? (
            <Box sx={pivotTableStyles}>
              <PivotTable
                data={data}
                {...pivotState}
                renderers={{ 'Tabla': TableRenderers.Table }}
                style={{
                  fontSize: styles?.fontSize || '14px',
                  fontFamily: styles?.fontFamily || 'Arial, sans-serif'
                }}
              />
            </Box>
          ) : warningMessage ? (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}>
              <Typography variant="body2" color="warning.main" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                {warningMessage}
              </Typography>
            </Box>
          ) : (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}>
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
                Para generar un informe, elija los campos de la lista de campos de la tabla dinámica y presione calcular.
              </Typography>
            </Box>
          )}
        </Box>

      </Box>

      {/* Panel lateral de configuración */}
      <Box sx={{
        width: 280,
        backgroundColor: 'white',
        borderRadius: 1,
        border: '1px solid #ccc',
        p: 1,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        maxHeight: '100%',
        minHeight: 'fit-content'
      }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
          Campos Disponibles
        </Typography>

        <Typography variant="body2" sx={{ mb: 1, color: 'textSecondary' }}>
          Seleccionar campos para agregar al informe:
        </Typography>

        {/* Búsqueda de campos */}
        <Box sx={{ mb: 1, position: 'relative' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '12px'
              }
            }}
          />
          <SearchIcon sx={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#aaa',
            fontSize: '18px'
          }} />
        </Box>

        {/* Campos disponibles */}
        <Box sx={{ mb: 1, maxHeight: 160, minHeight: 100, overflowY: 'auto' }}>
          {availableFields.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                No hay campos disponibles para esta fuente de datos
              </Typography>
            </Box>
          ) : (
            filteredFields.map((field, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 0.25,
                  borderBottom: '1px solid #eee',
                  cursor: 'grab',
                  '&:hover': {
                    backgroundColor: '#f5f5f5'
                  }
                }}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify(field));
                }}
              >
                <Checkbox
                  size="small"
                  checked={[...selectedRows, ...selectedColumns, ...selectedValues].some(f => f.name === field.name)}
                  readOnly
                />
                <Typography variant="body2" sx={{ fontSize: '12px', flex: 1 }}>
                  {field.alias}
                </Typography>
              </Box>
            ))
          )}
        </Box>

        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
          Arrastrar campos entre las áreas siguientes:
        </Typography>

        {/* Zonas de drop */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            <DropZone
              title="Columnas"
              fields={selectedColumns}
              onRemove={removeField}
              target="columns"
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <DropZone
              title="Filas"
              fields={selectedRows}
              onRemove={removeField}
              target="rows"
            />
          </Box>
        </Box>

        <DropZone
          title="Valores"
          fields={selectedValues}
          onRemove={removeField}
          target="values"
          isValueZone={true}
          onAggregationChange={handleAggregationChange}
        />

        {/* Botones de acción */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleCalculate}
            disabled={isLoading}
            sx={{ backgroundColor: '#666', '&:hover': { backgroundColor: '#555' } }}
          >
            {isLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="inherit" />
                Calculando...
              </Box>
            ) : (
              'Calcular'
            )}
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleClear}
            sx={{ borderColor: '#666', color: '#666' }}
          >
            Limpiar
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={exportToExcel}
            disabled={!hasCalculated}
            sx={{ borderColor: '#666', color: '#666' }}
          >
            Exportar a Excel
          </Button>
          {/* <Button
            variant="outlined"
            size="small"
            onClick={handleSendEmail}
            disabled={!hasCalculated}
            sx={{ borderColor: '#666', color: '#666' }}
          >
            Enviar por correo
          </Button> */}
        </Box>
      </Box>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

const mapStateToProps = (state) => ({
  user: state.user,
});

export default connect(mapStateToProps)(DynamicTable);
