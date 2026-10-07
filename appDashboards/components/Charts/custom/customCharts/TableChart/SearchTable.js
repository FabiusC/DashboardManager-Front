import React, { useEffect, useMemo, useState } from "react";
import { MaterialReactTable } from "material-react-table";
import { MRT_Localization_ES } from "material-react-table/locales/es";
import { alpha, Box, IconButton, InputAdornment, TextField, Typography, useTheme } from "@mui/material";
import { Close as CloseIcon, Search as SearchIcon } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { HighlightedText } from "./utils/HighlightedText";

function SearchTable({ styles = {}, columns, data, onClick, searchField, searchValue = "", onSearchCommit, updateLiveChartProps }) {
  const margin = styles?.marginChart ?? 0;
  const theme = useTheme();
  const [inputValue, setInputValue] = useState(searchValue ?? "");
  useEffect(() => {
    setInputValue(searchValue ?? "");
  }, [searchValue]);
  const headerSearch = useSelector((state) => state.filters?.search ?? "");
  const highlightColor = alpha(theme.palette.primary.main, 0.3);

  const highlightedColumns = useMemo(() => {
    const term = String(headerSearch ?? "").trim();
    if (!term) return columns;
    return (columns ?? []).map((col) => {
      const originalCell = col.Cell;
      return {
        ...col,
        Cell: (cellProps) => {
          const rendered = originalCell ? originalCell(cellProps) : cellProps.cell.getValue();
          if (React.isValidElement(rendered)) return rendered;
          return <HighlightedText text={rendered} query={term} highlightColor={highlightColor} />;
        },
      };
    });
  }, [columns, headerSearch, highlightColor]);

  const commitSearch = (value) => {
    const nextValue = String(value ?? "").trim();
    onSearchCommit?.(nextValue);
    updateLiveChartProps?.updateLiveProps?.({ searchValue: nextValue });
  };

  const clearSearch = () => {
    setInputValue("");
    commitSearch("");
  };

  const searchPlaceholder = searchField?.alias ? `Ingrese ${searchField.alias}` : "Ingrese";
  const hasCommittedSearch = String(searchValue ?? "").trim() !== "";
  const emptyMessage = MRT_Localization_ES.noRecordsToDisplay ?? "No hay registros para mostrar";
  const marginSx = {
    marginTop: `${margin.marginTop ?? 0}px`,
    marginRight: `${margin.marginRight ?? 0}px`,
    marginBottom: `${margin.marginBottom ?? 0}px`,
    marginLeft: `${margin.marginLeft ?? 0}px`,
  };

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 1, ...marginSx }}>
      <TextField
        size="small"
        value={inputValue}
        placeholder={searchPlaceholder}
        variant="standard"
        sx={{
          px: 1,
          border: "1px solid",
          borderColor: styles.borderColor,
          borderRadius: 2,
          "& .MuiInputBase-root": {
            px: 1,
          },
          "& .MuiInputBase-root:before": {
            borderBottom: "none",
          },
          "& .MuiInputBase-root:hover:not(.Mui-disabled):before": {
            borderBottom: "none",
          },
          "& .MuiInputBase-root:after": {
            borderBottom: "none",
          },
        }}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            commitSearch(inputValue);
          }
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {inputValue ? (
                <IconButton size="small" onClick={clearSearch} aria-label="Limpiar búsqueda">
                  <CloseIcon fontSize="small" />
                </IconButton>
              ) : null}
              <IconButton size="small" onClick={() => commitSearch(inputValue)} aria-label="Buscar">
                <SearchIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      {hasCommittedSearch ? (
        <MaterialReactTable
          columns={highlightedColumns}
          data={data}
          localization={MRT_Localization_ES}
          enablePagination={true}
          muiTablePaperProps={{
            elevation: 0,
            sx: {
              height: "100%",
              display: "flex",
              flexDirection: "column",
              borderRadius: 2,
              overflow: "hidden",
              boxShadow: "none",
            },
          }}
          initialState={{
            pagination: {
              pageSize: 5,
              pageIndex: 0,
            },
            showPagination: true,
            density: "compact",
          }}
          muiTablePaginationProps={{
            rowsPerPageOptions: [5, 10, 25, 50],
            labelRowsPerPage: "Filas por página:",
            labelDisplayedRows: ({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`,
          }}
          enableColumnOrdering={false}
          enableColumnDragging={false}
          enableSorting={false}
          enableColumnActions={false}
          enableBottomToolbar={true}
          muiBottomToolbarProps={{
            sx: {
              boxShadow: "none",
            },
          }}
          enableTopToolbar={false}
          enableGlobalFilter={false}
          enableStickyHeader={true}
          muiTableContainerProps={{
            sx: {
              maxHeight: "calc(100% - 60px)",
              overflowX: "auto",
              overflowY: "auto",
              width: "100%",
              flex: 1,
            },
          }}
          muiTableHeadRowProps={{
            sx: {
              boxShadow: "none",
            },
          }}
          muiTableHeadProps={{
            sx: {
              position: "sticky",
              top: 0,
              zIndex: 1,
              justifyContent: "center",
            },
          }}
          muiTableHeadCellProps={{
            sx: {
              ...styles.headerStylesText,
              backgroundColor: styles?.backgroundColorHeader || "white",
              borderRight: `1px solid ${styles.borderColor || "rgba(224, 224, 224, 0.8)"}`,
              borderBottom: `1px solid ${styles.borderColor || "rgba(224, 224, 224, 0.8)"}`,
              "&:last-child": {
                borderRight: "none",
              },
              "& .Mui-TableHeadCell-Content": {
                justifyContent: styles.headerStylesText?.textAlign === "left" ? "flex-start" : styles.headerStylesText?.textAlign === "right" ? "flex-end" : "center",
              },
            },
          }}
          muiTableBodyCellProps={({ cell, row }) => ({
            onClick: (event) => {
              if (!onClick) return;
              const selection = window.getSelection();
              if (selection && selection.toString().length > 0) {
                return;
              }
              event.stopPropagation();

              const field = cell.column.id;
              const value = cell.getValue();

              onClick({
                field,
                value,
                rawValue: value,
                rowData: row.original,
              });
            },
            sx: {
              userSelect: "text",
              ...styles.rowStylesText,
              whiteSpace: "normal",
              wordBreak: "break-word",
              lineHeight: 1.4,
              cursor: onClick ? "pointer" : "default",
              backgroundColor: styles?.backgroundColorRow || "white",
              borderRight: `1px solid ${styles.borderColor || "rgba(224, 224, 224, 0.8)"}`,
              borderBottom: `1px solid ${styles.borderColor || "rgba(224, 224, 224, 0.8)"}`,
              "&:last-child": {
                borderRight: "none",
              },
              "&:hover": onClick ? {
                backgroundColor: alpha(styles?.backgroundColorRow || "#000000", 0.1),
                fontWeight: "bold",
              } : {},
            },
          })}
          muiTableProps={{
            sx: {
              userSelect: "text",
              width: "100%",
              "& .MuiTableBody-root .MuiTableRow-root:hover": {
                backgroundColor: styles?.backgroundColorRow
                  ? alpha(styles?.backgroundColorRow, 0.3)
                  : alpha("#000000", 0.08),
              },
              "& .MuiTableBody-root .MuiTableRow-root:hover .MuiTableCell-root": {
                backgroundColor: "inherit !important",
              },
            },
          }}
          muiTableBodyRowProps={() => ({
            sx: {
              backgroundColor: styles.backgroundColorRow || "white",
            },
          })}
        />
      ) : (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontStyle: "italic" }}
          >
            {emptyMessage}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default SearchTable;
