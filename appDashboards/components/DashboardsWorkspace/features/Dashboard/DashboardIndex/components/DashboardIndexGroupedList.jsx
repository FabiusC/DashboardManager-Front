import { Box, Typography } from "@mui/material";
import { DASHBOARD_INDEX_GRID_COLUMNS } from "../services/dashboardIndexService";
import DashboardIndexCarousel from "./DashboardIndexCarousel";
import DashboardIndexItem from "./DashboardIndexItem";

const ITEM_ROW_HEIGHT = 34;
const CATEGORY_HEADER_HEIGHT = 22;
const CATEGORY_PAGINATION_HEIGHT = 22;

const chunkRows = (items, columns) => {
  const rows = [];

  for (let index = 0; index < items.length; index += columns) {
    rows.push(items.slice(index, index + columns));
  }

  return rows;
};

const getRowSlotCount = (rowCategories) =>
  Math.max(0, ...rowCategories.map((category) => category.dashboards.length));

const CategoryBlock = ({
  category,
  slotCount,
  rowHasPagination,
  currentDashboardId,
  onSelectDashboard,
  onDashboardPageChange,
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 0.75,
        mb: 0.5,
        minHeight: CATEGORY_HEADER_HEIGHT,
      }}
    >
      <Typography
        variant="caption"
        noWrap
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: "0.625rem",
          fontWeight: 600,
          letterSpacing: "0.05em",
          color: "text.secondary",
          textTransform: "uppercase",
        }}
      >
        {category.name}
      </Typography>

      <Box
        sx={{
          minWidth: 18,
          height: 18,
          borderRadius: "50%",
          bgcolor: "#F1F5F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.625rem",
          fontWeight: 500,
          color: "text.secondary",
          flexShrink: 0,
        }}
      >
        {category.dashboardCount}
      </Box>
    </Box>

    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.125, flex: 1 }}>
      {Array.from({ length: slotCount }).map((_, index) => {
        const dashboard = category.dashboards[index];

        if (!dashboard) {
          return (
            <Box
              key={`${category.id}-slot-${index}`}
              aria-hidden
              sx={{ height: ITEM_ROW_HEIGHT, flexShrink: 0 }}
            />
          );
        }

        return (
          <DashboardIndexItem
            key={dashboard.id}
            dashboard={dashboard}
            dense
            isActive={String(dashboard.id) === String(currentDashboardId)}
            onSelect={onSelectDashboard}
          />
        );
      })}
    </Box>

    {rowHasPagination && (
      <Box sx={{ minHeight: CATEGORY_PAGINATION_HEIGHT, mt: 0.25 }}>
        {category.dashboardPagination?.show && (
          <DashboardIndexCarousel
            compact
            currentPage={category.dashboardPagination.currentPage}
            totalPages={category.dashboardPagination.totalPages}
            totalItems={category.dashboardCount}
            onPageChange={(page) => onDashboardPageChange(category.id, page)}
          />
        )}
      </Box>
    )}
  </Box>
);

const DashboardIndexGroupedList = ({
  categories,
  currentDashboardId,
  onSelectDashboard,
  onDashboardPageChange,
}) => {
  if (!categories.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center", fontSize: "0.8125rem" }}>
        No se encontraron etiquetas.
      </Typography>
    );
  }

  const rows = chunkRows(categories, DASHBOARD_INDEX_GRID_COLUMNS);

  return (
    <Box sx={{ mx: -0.5 }}>
      {rows.map((rowCategories, rowIndex) => {
        const slotCount = getRowSlotCount(rowCategories);
        const rowHasPagination = rowCategories.some((category) => category.dashboardPagination?.show);

        return (
          <Box
            key={`row-${rowIndex}`}
            sx={{
              display: "grid",
              gridTemplateColumns: `repeat(${DASHBOARD_INDEX_GRID_COLUMNS}, minmax(0, 1fr))`,
              alignItems: "stretch",
              borderBottom: rowIndex < rows.length - 1 ? "1px solid #E2E8F0" : "none",
            }}
          >
            {rowCategories.map((category, columnIndex) => (
              <Box
                key={category.id}
                sx={{
                  px: 1.25,
                  py: 0.875,
                  borderRight:
                    columnIndex < DASHBOARD_INDEX_GRID_COLUMNS - 1 ? "1px solid #E2E8F0" : "none",
                }}
              >
                <CategoryBlock
                  category={category}
                  slotCount={slotCount}
                  rowHasPagination={rowHasPagination}
                  currentDashboardId={currentDashboardId}
                  onSelectDashboard={onSelectDashboard}
                  onDashboardPageChange={onDashboardPageChange}
                />
              </Box>
            ))}

            {Array.from({ length: DASHBOARD_INDEX_GRID_COLUMNS - rowCategories.length }).map(
              (_, emptyIndex) => {
                const columnIndex = rowCategories.length + emptyIndex;

                return (
                  <Box
                    key={`empty-${rowIndex}-${columnIndex}`}
                    aria-hidden
                    sx={{
                      px: 1.25,
                      py: 0.875,
                      borderRight:
                        columnIndex < DASHBOARD_INDEX_GRID_COLUMNS - 1
                          ? "1px solid #E2E8F0"
                          : "none",
                    }}
                  />
                );
              },
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default DashboardIndexGroupedList;
