import { useMemo, useEffect, useState, useRef, useCallback, useId } from "react"
import { AgGridReact } from "ag-grid-react"
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community"
import { alpha } from "@mui/material/styles"
import { Box, TextField, InputAdornment, IconButton, useTheme } from "@mui/material"
import { Search, Clear, WrapText } from "@mui/icons-material"
import { useSelector } from "react-redux"
import { HighlightedText } from "./utils/HighlightedText"
import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-alpine.css"

ModuleRegistry.registerModules([AllCommunityModule])

function FacetTable({ styles, columns, data: rawData, pageSize = 10, onClick, panel, selectedValues = [] }) {
  const [searchText, setSearchText] = useState("")
  const theme = useTheme()
  const headerSearch = useSelector((state) => state.filters?.search ?? "")
  const highlightColor = alpha(theme.palette.primary.main, 0.3)
  const gridRef = useRef(null)
  const isSyncingSelectionRef = useRef(false)
  const rawInstanceId = useId()
  const instanceClass = useMemo(
    () => `facet-table-${rawInstanceId.replace(/[^a-zA-Z0-9_-]/g, "-")}`,
    [rawInstanceId]
  )
  
  const data = rawData?.data || rawData || [];
  const syncSelectedValues = rawData?.selectedValues || selectedValues || [];
  const showSearchBar = styles?.filters
  const enableMultipleFilters = styles?.multiple_filters
  const margin = styles?.marginChart ?? 0
  const enablePercentage = panel?.queryParameters?.enablePercentage === true || styles?.enablePercentage === true;
  const totalCount = panel?.queryParameters?.queryMeta?.totalCount;

  const filterField = useMemo(() => {
    const groupByFields = panel?.queryParameters?.query_fields_distribution?.group_by_fields;
    if (groupByFields && groupByFields.length > 0) {
      return groupByFields[0].name;
    }
    return columns.length > 0 ? columns[0].accessorKey : null;
  }, [panel, columns]);

  const tableData = useMemo(() => {
    return data || []
  }, [data])

  const syncSelection = useCallback(() => {
    if (!enableMultipleFilters || !filterField || !gridRef.current?.api || !tableData || tableData.length === 0) {
      return;
    }

    isSyncingSelectionRef.current = true;

    try {
      gridRef.current.api.deselectAll();
      
      if (syncSelectedValues.length > 0) {
        gridRef.current.api.forEachNode((node) => {
          if (node.data && node.data[filterField] !== undefined) {
            const rowValue = String(node.data[filterField]);
            if (syncSelectedValues.includes(rowValue)) {
              node.setSelected(true, false);
            }
          }
        });
      }
    } catch (error) {
      console.warn('Error sincronizando selección:', error);
    } finally {
      setTimeout(() => {
        isSyncingSelectionRef.current = false;
      }, 0);
    }
  }, [enableMultipleFilters, filterField, tableData, syncSelectedValues]);

  const gridReadyRef = useRef(false);

  const handleGridReady = useCallback(() => {
    gridReadyRef.current = true;
    syncSelection();
  }, [syncSelection]);

  useEffect(() => {
    if (!enableMultipleFilters || !filterField || !tableData || tableData.length === 0) {
      return;
    }

    if (gridReadyRef.current && gridRef.current?.api) {
      requestAnimationFrame(() => {
        syncSelection();
      });
    }
  }, [syncSelectedValues.join(','), filterField, enableMultipleFilters, tableData.length, syncSelection])
  
  const highlightTerm = String(headerSearch ?? "").trim()

  const agGridColumns = useMemo(() => {
    const baseColumns = columns.map((col) => ({
      field: col.accessorKey,
      headerName: col.header,
      valueFormatter: (params) => {
        const baseText = col.valueFormatter? col.valueFormatter(params.value): (params.value ?? "—");
        const isOperationCol =
          typeof col.accessorKey === "string" && col.accessorKey.includes("__");
        if (!enablePercentage || !isOperationCol) return baseText;
        if (typeof totalCount !== "number" || totalCount <= 0) return baseText;
        const n = typeof params.value === "number" ? params.value : Number(params.value);
        if (!Number.isFinite(n)) return baseText;
        const pct = (n / totalCount) * 100;
        return `${baseText} (${pct.toLocaleString('en-IN',{maximumSignificantDigits: 2})}%)`;
      },
      ...(highlightTerm
        ? {
            cellRenderer: (params) => {
              const display = params.valueFormatted ?? (params.value ?? "—");
              return (
                <HighlightedText
                  text={display}
                  query={highlightTerm}
                  highlightColor={highlightColor}
                />
              );
            },
          }
        : {}),
      sortable: true,
      resizable: false,
      flex: 1,
      minWidth: 120,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      WrapText:true,
      autoHeight:true,
      cellStyle: {
        textAlign: styles.rowStylesText?.textAlign || "center",
        fontSize: styles.rowStylesText?.fontSize || "14px",
        color: styles.rowStylesText?.color || "#333",
        fontWeight: styles.rowStylesText?.fontWeight || "400",
        padding: "10px 16px",
      },
      headerClass: "custom-header-cell",
      whiteSpace: "normal",
      lineHeight: "1.4", 

    }))
    
    if (enableMultipleFilters) {
      return [
        {
          headerName: "",
          field: "checkbox",
          checkboxSelection: true,
          headerCheckboxSelection: true,
          width: 50,
          minWidth: 50,
          maxWidth: 50,
          resizable: false,
          sortable: false,
          suppressMovable: true,
          cellStyle: {
            padding: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
          headerClass: "custom-header-cell",
        },
        ...baseColumns,
      ]
    }
    
    return baseColumns
  }, [columns, styles, enableMultipleFilters, enablePercentage, totalCount, highlightTerm, highlightColor])

  const localeText = useMemo(
    () => ({
      page: "Página",
      to: "a",
      of: "de",
      next: "Siguiente",
      last: "Última",
      first: "Primera",
      previous: "Anterior",
      noRowsToShow: "No hay datos para mostrar",
      pageSizeSelectorLabel: "Filas por página:",
    }),
    []
  )

  const borderColor = styles.borderColor || "#e0e0e0"
  const headerBgColor = styles.backgroundColorHeader || "#f8f9fa"
  const rowBgColor = styles.backgroundColorRow || "#ffffff"
  const hoverColor = alpha("#000000", 0.05)

  const rowHeight = styles.density === "compact" ? 40 : styles.density === "spacious" ? 56 : 48

  const handleRowClick = (event) => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return;
    }

    if (enableMultipleFilters && gridRef.current?.api) {
      const node = event.node;
      
      const target = event.event?.target;
      if (target) {
        const isCheckboxClick = target.closest('.ag-checkbox') || 
                                target.closest('.ag-selection-checkbox') ||
                                target.type === 'checkbox';
        
        if (isCheckboxClick) {
          return;
        }
      }
      
      const isSelected = node.isSelected();
      node.setSelected(!isSelected);
    } else {
      if (onClick && filterField) {
        const rowData = event.data;
        const value = rowData[filterField];
        
        onClick({
          field: filterField,
          value: value,
          rawValue: value,
          rowData: rowData, 
        });
      }
    }
  }

  const handleSelectionChanged = () => {
    if (!enableMultipleFilters || !onClick || !filterField || !gridRef.current?.api || isSyncingSelectionRef.current) {
      return;
    }

    const selectedRows = gridRef.current.api.getSelectedRows();
    const selectedRowValues = selectedRows.map(rowData => ({
      field: filterField,
      value: String(rowData[filterField]),
      rawValue: rowData[filterField],
      rowData: rowData,
    }));

    // Enviar todas las selecciones actuales (estrategia: limpiar y recrear)
    onClick({
      isMultiple: true,
      values: selectedRowValues,
      field: filterField,
    });
  }

  const handleSearchChange = (event) => {
    const value = event.target.value
    setSearchText(value)
    if (gridRef.current && gridRef.current.api) {
      gridRef.current.api.setGridOption('quickFilterText', value)
    }
  }

  const handleClearSearch = () => {
    setSearchText("")
    if (gridRef.current && gridRef.current.api) {
      gridRef.current.api.setGridOption('quickFilterText', '')
    }
  }

  useEffect(() => {
    const styleId = `${instanceClass}-styles`
    let styleElement = document.getElementById(styleId)

    if (!styleElement) {
      styleElement = document.createElement("style")
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    const css = `
      .facet-table-container .ag-theme-alpine {
        --ag-border-color: ${borderColor};
        --ag-header-background-color: ${headerBgColor};
        --ag-row-background-color: ${rowBgColor};
        border: none;
        height: 100%;
        width: 100%;
      }

      .facet-table-container .ag-theme-alpine .ag-header {
        background-color: ${headerBgColor};
        border-bottom: 1px solid ${borderColor};
      }

      .facet-table-container .ag-theme-alpine .ag-header-cell {
        border-right: 1px solid ${borderColor};
        font-weight: ${styles.headerStylesText?.fontWeight || "600"};
        font-size: ${styles.headerStylesText?.fontSize || "14px"};
        color: ${styles.headerStylesText?.color || "#333"};
        text-align: ${styles.headerStylesText?.textAlign || "center"};
        padding: 12px 16px;
        background-color: ${headerBgColor};
      }

      .facet-table-container .ag-theme-alpine .ag-header-cell:last-child {
        border-right: none;
      }

      .facet-table-container .ag-theme-alpine .ag-icon-asc,
      .facet-table-container .ag-theme-alpine .ag-icon-desc {
        color: #666;
        opacity: 1;
      }

      .facet-table-container .ag-theme-alpine .ag-row {
        background-color: ${rowBgColor};
        border-bottom: 1px solid ${borderColor};
        cursor: ${onClick ? 'pointer' : 'default'};
      }

      .facet-table-container .ag-theme-alpine .ag-row:hover {
        background-color: ${hoverColor};
        ${onClick ? 'transition: background-color 0.2s ease;' : ''}
      }

      .facet-table-container .ag-theme-alpine .ag-cell {
        border-right: 1px solid ${borderColor};
        padding: 10px 16px;
        font-size: ${styles.rowStylesText?.fontSize || "14px"};
        color: ${styles.rowStylesText?.color || "#333"};
        font-weight: ${styles.rowStylesText?.fontWeight || "400"};
        text-align: ${styles.rowStylesText?.textAlign || "center"};
        white-space: normal;  
        line-height: 1.4;
      }

      .facet-table-container .ag-theme-alpine .ag-cell:last-child {
        border-right: none;
      }

      .facet-table-container .ag-theme-alpine .ag-paging-panel {
        border-top: 1px solid ${borderColor};
        padding: 12px 16px;
        background-color: #fafafa;
      }

      .facet-table-container .ag-theme-alpine .ag-paging-button {
        border: 1px solid ${borderColor};
        border-radius: 4px;
        padding: 6px 10px;
        margin: 0 4px;
        background-color: #ffffff;
        color: #333;
      }

      .facet-table-container .ag-theme-alpine .ag-paging-button:hover:not(:disabled) {
        background-color: #f0f0f0;
      }

      .facet-table-container .ag-theme-alpine .ag-paging-button:disabled {
        opacity: 0.5;
      }

      .facet-table-container .ag-theme-alpine .ag-paging-button .ag-icon {
        color: #333;
        opacity: 1;
      }

      .facet-table-container .ag-theme-alpine .ag-paging-panel select {
        display: none !important;
      }

      .facet-table-container .ag-theme-alpine .ag-paging-panel .ag-paging-row-summary-panel {
        margin-left: 0 !important;
      }

      .facet-table-container .ag-theme-alpine .ag-header-cell-resize {
        display: none;
      }

      .facet-table-container .ag-theme-alpine .ag-root-wrapper {
        border: none;
      }

      .facet-table-container .ag-theme-alpine .ag-checkbox {
        cursor: pointer;
      }

      .facet-table-container .ag-theme-alpine .ag-row-selected {
        background-color: ${alpha("#1976d2", 0.08)} !important;
      }

      .facet-table-container .ag-theme-alpine .ag-row-selected:hover {
        background-color: ${alpha("#1976d2", 0.12)} !important;
      }
    `
    styleElement.textContent = css.replaceAll(".facet-table-container", `.${instanceClass}`)

    return () => {
      const element = document.getElementById(styleId)
      if (element) {
        element.remove()
      }
    }
  }, [instanceClass, styles, borderColor, headerBgColor, rowBgColor, hoverColor, onClick])

  return (
    <Box
      className={`facet-table-container ${instanceClass}`}
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        marginTop: `${margin.marginTop ?? 0}px`,
        marginRight: `${margin.marginRight ?? 0}px`,
        marginBottom: `${margin.marginBottom ?? 0}px`,
        marginLeft: `${margin.marginLeft ?? 0}px`,
      }}
    >
      {showSearchBar && (
        <Box
          sx={{
            borderBottom: `1px solid ${borderColor}`,
            // backgroundColor: "#fafafa",
            py: 2,
          }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar en la tabla..."
            value={searchText}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "#666", fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: searchText && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleClearSearch}
                    sx={{ padding: 0.5 }}
                  >
                    <Clear sx={{ fontSize: 18 }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'white',
                '&:hover': {
                  backgroundColor: 'white',
                },
              },
            }}
          />
        </Box>
      )}

      <Box
        className="ag-theme-alpine"
        sx={{
          width: "100%",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <AgGridReact
          ref={gridRef}
          theme="legacy"
          rowData={tableData}
          columnDefs={agGridColumns}
          enableCellTextSelection={true}
          animateRows={true}
          domLayout="normal"
          suppressMovableColumns={true}
          suppressColumnMoveAnimation={true}
          suppressRowDrag={true}
          suppressDragLeaveHidesColumns={true}
          defaultColDef={{
            sortable: true,
            resizable: false,
            suppressMovable: true,
          }}
          pagination={true}
          paginationPageSize={pageSize}
          paginationPageSizeSelector={false}
          localeText={localeText}
          rowHeight={rowHeight}
          autoHeaderHeight={true}
          onGridReady={handleGridReady}
          onRowClicked={handleRowClick}
          onSelectionChanged={enableMultipleFilters ? handleSelectionChanged : undefined}
          quickFilterText={searchText}
          rowSelection={enableMultipleFilters ? "multiple" : undefined}
          suppressRowClickSelection={enableMultipleFilters ? true : false}
        />
      </Box>
    </Box>
  )
}

export default FacetTable