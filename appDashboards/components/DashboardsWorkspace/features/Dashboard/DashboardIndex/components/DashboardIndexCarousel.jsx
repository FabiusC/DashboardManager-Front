import { Box, IconButton, Typography } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";

const CONTROL_SIZE = 24;
const COMPACT_CONTROL_SIZE = 16;
const COMPACT_BORDER_RADIUS = 7;

const DashboardIndexCarousel = ({
  currentPage,
  totalPages,
  startItem,
  endItem,
  totalItems,
  onPageChange,
  itemLabel = "tableros",
  compact = false,
}) => {
  if (totalItems === 0) return null;

  const canGoBack = currentPage > 1;
  const canGoForward = currentPage < totalPages;
  const controlSize = compact ? COMPACT_CONTROL_SIZE : CONTROL_SIZE;
  const controlBorderRadius = compact ? `${COMPACT_BORDER_RADIUS}px` : "4px";

  const visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1,
  );

  const pagesWithEllipsis = visiblePages.reduce((acc, page, index, pages) => {
    if (index > 0 && page - pages[index - 1] > 1) {
      acc.push("ellipsis");
    }
    acc.push(page);
    return acc;
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: compact ? "flex-end" : "space-between",
        gap: compact ? 0.25 : 2,
        px: compact ? 0 : 3,
        py: compact ? 0 : 1.25,
        borderTop: compact ? "none" : "1px solid #E2E8F0",
      }}
    >
      {!compact && (
        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
          Mostrando {startItem}–{endItem} de {totalItems} {itemLabel}
        </Typography>
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.25,
          ...(compact && {
            px: 0.25,
            py: 0.125,
            borderRadius: `${COMPACT_BORDER_RADIUS + 2}px`,
            bgcolor: "#F8FAFC",
            border: "1px solid #E2E8F0",
            gap: 0.125,
          }),
        }}
      >
        <IconButton
          size="small"
          aria-label="Página anterior"
          disabled={!canGoBack}
          onClick={() => onPageChange(currentPage - 1)}
          sx={{
            width: controlSize,
            height: controlSize,
            p: compact ? 0 : undefined,
            borderRadius: controlBorderRadius,
            border: compact ? "none" : "1px solid #E2E8F0",
            bgcolor: compact ? "background.paper" : "transparent",
            color: canGoBack ? "text.primary" : "text.disabled",
          }}
        >
          <ChevronLeft sx={{ fontSize: compact ? 12 : 16 }} />
        </IconButton>

        {pagesWithEllipsis.map((page, index) =>
          page === "ellipsis" ? (
            <Typography
              key={`ellipsis-${index}`}
              variant="caption"
              sx={{ px: compact ? 0.125 : 0.25, color: "text.secondary", fontSize: compact ? "0.5625rem" : "0.7rem" }}
            >
              …
            </Typography>
          ) : (
            <Box
              key={page}
              component="button"
              type="button"
              aria-label={`Ir a la página ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
              onClick={() => onPageChange(page)}
              sx={{
                minWidth: controlSize,
                height: controlSize,
                px: compact ? 0.25 : 0.5,
                border: "none",
                borderRadius: controlBorderRadius,
                cursor: "pointer",
                bgcolor: page === currentPage ? "primary.main" : "transparent",
                color: page === currentPage ? "primary.contrastText" : "text.secondary",
                fontSize: compact ? "0.5625rem" : "0.6875rem",
                fontWeight: page === currentPage ? 600 : 400,
                lineHeight: 1,
                "&:hover": {
                  bgcolor: page === currentPage ? "primary.main" : compact ? "rgba(0,0,0,0.04)" : "action.hover",
                },
                "&:focus-visible": {
                  outline: "2px solid",
                  outlineColor: "primary.main",
                  outlineOffset: 1,
                },
              }}
            >
              {page}
            </Box>
          ),
        )}

        <IconButton
          size="small"
          aria-label="Página siguiente"
          disabled={!canGoForward}
          onClick={() => onPageChange(currentPage + 1)}
          sx={{
            width: controlSize,
            height: controlSize,
            p: compact ? 0 : undefined,
            borderRadius: controlBorderRadius,
            border: compact ? "none" : "1px solid #E2E8F0",
            bgcolor: compact ? "background.paper" : "transparent",
            color: canGoForward ? "text.primary" : "text.disabled",
          }}
        >
          <ChevronRight sx={{ fontSize: compact ? 12 : 16 }} />
        </IconButton>
      </Box>
    </Box>
  );
};

export default DashboardIndexCarousel;
