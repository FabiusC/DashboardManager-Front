import React, { useEffect, useState, useMemo } from "react"
import {
  MaterialReactTable,
  MRT_ToggleGlobalFilterButton,
} from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { alpha, Box, useTheme } from "@mui/material"
import { useSelector } from "react-redux"
import { HighlightedText } from "./utils/HighlightedText"

function RecordsTable({ styles = {},columns, data, onClick, panel }) {
  const margin = styles?.marginChart ?? 0
  const theme = useTheme()
  const headerSearch = useSelector((state) => state.filters?.search ?? "")
  const highlightColor = alpha(theme.palette.primary.main, 0.3)

  // We no longer need to pre-calculate 'filterField' here
  // because we will determine it dynamically based on the clicked cell.

  const highlightedColumns = useMemo(() => {
    const term = String(headerSearch ?? "").trim()
    if (!term) return columns
    return (columns ?? []).map((col) => {
      const originalCell = col.Cell
      return {
        ...col,
        Cell: (cellProps) => {
          const rendered = originalCell ? originalCell(cellProps) : cellProps.cell.getValue()
          if (React.isValidElement(rendered)) return rendered
          return <HighlightedText text={rendered} query={term} highlightColor={highlightColor} />
        },
      }
    })
  }, [columns, headerSearch, highlightColor])

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <MaterialReactTable
        columns={highlightedColumns}
        data={data}
        localization={MRT_Localization_ES}
        enablePagination={true}
        muiTablePaperProps={{
          sx: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            marginTop: `${margin.marginTop ?? 0}px`,
            marginRight: `${margin.marginRight ?? 0}px`,
            marginBottom: `${margin.marginBottom ?? 0}px`,
            marginLeft: `${margin.marginLeft ?? 0}px`,
          },
        }}
        initialState={{
          pagination: {
            pageSize: 5,
            pageIndex: 0,
          },
          showPagination: true,
          density: 'compact',
        }}
        muiTablePaginationProps={{
          rowsPerPageOptions: [5, 10, 25, 50],
          labelRowsPerPage: 'Filas por página:',
          labelDisplayedRows: ({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`,
        }}
        enableColumnOrdering={false}
        enableColumnDragging={false}
        enableSorting={false}
        enableColumnActions={false}
        enableBottomToolbar={true}
        enableTopToolbar={true}
        enableStickyHeader={true}
        muiTableContainerProps={{
          sx: {
            maxHeight: 'calc(100% - 60px)',
            overflowX: 'auto',
            overflowY: 'auto',
            width: '100%',
            flex: 1,
          },
        }}
        muiTableHeadProps={{
          sx: {
            position: 'sticky',
            top: 0,
            zIndex: 1,
            justifyContent: 'center',
          },
        }}
        muiTableHeadCellProps={{
          sx: {
            ...styles.headerStylesText,
            textTransform: 'uppercase',
            backgroundColor: styles?.backgroundColorHeader || 'white',
            borderRight: `1px solid ${styles.borderColor || 'rgba(224, 224, 224, 0.8)'}`,
            borderBottom: `1px solid ${styles.borderColor || 'rgba(224, 224, 224, 0.8)'}`,
            '& .Mui-TableHeadCell-Content, & .Mui-TableHeadCell-Content *': {
              textTransform: 'uppercase',
            },
            '&:last-child': {
              borderRight: 'none',
            },
            '& .Mui-TableHeadCell-Content': {
              justifyContent: styles.headerStylesText?.textAlign === 'left' ? 'flex-start' : styles.headerStylesText?.textAlign === 'right' ? 'flex-end' : 'center',
            },
          },
        }}
        muiSearchTextFieldProps={{
          placeholder: 'Buscar...',
        }}

        // --- UPDATED LOGIC HERE ---
        muiTableBodyCellProps={({ cell, row }) => ({
          onClick: (event) => {
            if (!onClick) return;
            const selection = window.getSelection();
            if (selection && selection.toString().length > 0) {
              return;
            }

            // Stop propagation if you don't want the Row Click to trigger as well
            event.stopPropagation();

            const field = cell.column.id; // Gets the specific column ID/accessorKey of the clicked cell
            const value = cell.getValue(); // Gets the specific value of the clicked cell
            const rowData = row.original;

            onClick({
              field: field,
              value: value,
              rawValue: value,
              rowData: rowData,
            });
          },
          sx: {
            userSelect: 'text',
            ...styles.rowStylesText,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            lineHeight: 1.4, 
            cursor: onClick ? 'pointer' : 'default', // Visual feedback that cell is clickable
            backgroundColor: styles?.backgroundColorRow || 'white',
            borderRight: `1px solid ${styles.borderColor || 'rgba(224, 224, 224, 0.8)'}`,
            borderBottom: `1px solid ${styles.borderColor || 'rgba(224, 224, 224, 0.8)'}`,
            '&:last-child': {
              borderRight: 'none',
            },
            // Add a subtle hover effect for the specific cell
            '&:hover': onClick ? {
              backgroundColor: alpha(styles?.backgroundColorRow || '#000000', 0.1),
              fontWeight: 'bold'
            } : {},
          },
        })}
        // --------------------------

        muiTableProps={{
          sx: {
            userSelect: 'text',
            width: '100%',
            '& .MuiTableBody-root .MuiTableRow-root:hover': {
              backgroundColor: styles?.backgroundColorRow
                ? alpha(styles?.backgroundColorRow, 0.3)
                : alpha('#000000', 0.08),
            },
            '& .MuiTableBody-root .MuiTableRow-root:hover .MuiTableCell-root': {
              backgroundColor: 'inherit !important',
            },
          },
        }}

        renderToolbarInternalActions={({ table }) => (
          <>
            <MRT_ToggleGlobalFilterButton table={table} />
          </>
        )}

        // Removed onClick from here to avoid conflicts, kept styling
        muiTableBodyRowProps={() => ({
          sx: {
            backgroundColor: styles.backgroundColorRow || 'white',
          },
        })}
      />
    </Box>
  )
}

export default RecordsTable