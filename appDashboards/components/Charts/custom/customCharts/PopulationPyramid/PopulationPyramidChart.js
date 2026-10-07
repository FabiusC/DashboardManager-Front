import { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { nivoNumberFormat } from "@components/Charts/dataTransformers/utils/numberFormatter";
import {
  resolveLegendConfig,
  truncateLegendItems,
} from "@components/Charts/dataTransformers/utils/legendUtils";

const formatAxisValue = nivoNumberFormat();

const getMargin = (styles) => {
  const margin = styles?.marginChart;
  if (!margin || typeof margin !== "object") {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  return {
    top: Number(margin.marginTop ?? margin.top) || 0,
    right: Number(margin.marginRight ?? margin.right) || 0,
    bottom: Number(margin.marginBottom ?? margin.bottom) || 0,
    left: Number(margin.marginLeft ?? margin.left) || 0,
  };
};

export default function PopulationPyramidChart({
  data = [],
  colors,
  styles,
  onClick,
  leftSeries,
  rightSeries,
}) {
  const [tooltip, setTooltip] = useState(null);
  const showTooltips = styles?.showTooltips !== false;
  const barGap = Number(styles?.barGap) || 0;
  const margin = getMargin(styles);
  const legendConfig = resolveLegendConfig({ styles, liveChartProps: {} });

  const leftColor = colors?.[0];
  const rightColor = colors?.[1];
  const leftLabel = leftSeries?.label;
  const rightLabel = rightSeries?.label;
  const hasRight = Boolean(rightSeries);

  const legendItems = useMemo(() => {
    const items = [];
    if (leftSeries) {
      items.push({ id: "left", label: leftLabel, color: leftColor });
    }
    if (rightSeries) {
      items.push({ id: "right", label: rightLabel, color: rightColor });
    }
    return truncateLegendItems(items, legendConfig?.limitChartLegend);
  }, [
    leftColor,
    leftLabel,
    leftSeries,
    legendConfig?.limitChartLegend,
    rightColor,
    rightLabel,
    rightSeries,
  ]);

  const maxValue = useMemo(() => {
    const values = (Array.isArray(data) ? data : []).flatMap((row) => [
      Number(row?.left) || 0,
      Number(row?.right) || 0,
    ]);
    return Math.max(1, ...values);
  }, [data]);

  const handleBarEnter = (event, row, side, value) => {
    if (!showTooltips) return;
    setTooltip({
      x: event.clientX,
      y: event.clientY,
      label: row.label,
      seriesLabel: side === "left" ? leftLabel : rightLabel,
      value,
    });
  };

  const handleBarLeave = () => setTooltip(null);

  const handleBarClick = (row, side) => {
    if (!onClick) return;
    onClick({
      id: side,
      indexValue: row.label,
      data: row,
    });
  };

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const anchor = String(legendConfig?.anchor ?? "");
  const symbolSize = Number(legendConfig?.symbolSize) || 0;
  const itemsSpacing = Number(legendConfig?.itemsSpacing) || 0;
  const translateX = Number(legendConfig?.translateX) || 0;
  const translateY = Number(legendConfig?.translateY) || 0;
  const symbolType = legendConfig?.symbolType;
  const midValue = maxValue / 2;

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        minHeight: 0,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        pt: `${margin.top}px`,
        pr: `${margin.right}px`,
        pb: `${margin.bottom}px`,
        pl: `${margin.left}px`,
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {legendConfig && legendItems.length > 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection:
              legendConfig.direction === "column" ? "column" : "row",
            alignItems: "center",
            justifyContent: anchor.includes("left")
              ? "flex-start"
              : anchor.includes("right")
                ? "flex-end"
                : "center",
            gap: `${itemsSpacing}px`,
            transform: `translate(${translateX}px, ${translateY}px)`,
            order: anchor.includes("bottom") ? 2 : 0,
            flexShrink: 0,
          }}
        >
          {legendItems.map((item) => (
            <Box
              key={item.id}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: legendConfig.justify
                  ? "space-between"
                  : "flex-start",
                gap: 0.75,
                width: legendConfig.itemWidth
                  ? `${legendConfig.itemWidth}px`
                  : "auto",
                height: legendConfig.itemHeight
                  ? `${legendConfig.itemHeight}px`
                  : "auto",
              }}
            >
              <Box
                sx={{
                  width: symbolSize,
                  height: symbolSize,
                  flexShrink: 0,
                  bgcolor: item.color,
                  borderRadius:
                    symbolType === "circle"
                      ? "50%"
                      : symbolType === "square"
                        ? 0
                        : "2px",
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: legendConfig.itemTextColor,
                  lineHeight: 1.2,
                }}
              >
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null}

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: `${barGap}px`,
          overflow: "hidden",
          order: 1,
        }}
      >
        {data.map((row) => {
          const leftValue = Math.abs(Number(row?.left) || 0);
          const rightValue = Math.abs(Number(row?.right) || 0);
          const leftPct = (leftValue / maxValue) * 100;
          const rightPct = (rightValue / maxValue) * 100;

          return (
            <Box
              key={row.label}
              sx={{
                flex: 1,
                minHeight: 8,
                display: "grid",
                gridTemplateColumns: hasRight ? "1fr auto 1fr" : "1fr auto",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  height: "100%",
                  minWidth: 0,
                }}
              >
                <Box
                  onMouseEnter={(event) =>
                    handleBarEnter(event, row, "left", leftValue)
                  }
                  onMouseLeave={handleBarLeave}
                  onMouseMove={(event) =>
                    handleBarEnter(event, row, "left", leftValue)
                  }
                  onClick={() => handleBarClick(row, "left")}
                  sx={{
                    width: `${leftPct}%`,
                    height: "70%",
                    minHeight: 4,
                    maxHeight: 22,
                    bgcolor: leftColor,
                    borderRadius: "3px 0 0 3px",
                    cursor: onClick ? "pointer" : "default",
                    transition: "opacity 0.15s ease",
                    "&:hover": { opacity: 0.85 },
                  }}
                />
              </Box>

              <Typography
                variant="caption"
                sx={{
                  textAlign: "center",
                  color: "text.secondary",
                  fontSize: 10,
                  lineHeight: 1.1,
                  px: 0.5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={String(row.label)}
              >
                {row.label}
              </Typography>

              {hasRight ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    height: "100%",
                    minWidth: 0,
                  }}
                >
                  <Box
                    onMouseEnter={(event) =>
                      handleBarEnter(event, row, "right", rightValue)
                    }
                    onMouseLeave={handleBarLeave}
                    onMouseMove={(event) =>
                      handleBarEnter(event, row, "right", rightValue)
                    }
                    onClick={() => handleBarClick(row, "right")}
                    sx={{
                      width: `${rightPct}%`,
                      height: "70%",
                      minHeight: 4,
                      maxHeight: 22,
                      bgcolor: rightColor,
                      borderRadius: "0 3px 3px 0",
                      cursor: onClick ? "pointer" : "default",
                      transition: "opacity 0.15s ease",
                      "&:hover": { opacity: 0.85 },
                    }}
                  />
                </Box>
              ) : null}
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          mt: 0.75,
          display: "grid",
          gridTemplateColumns: hasRight ? "1fr auto 1fr" : "1fr auto",
          gap: 0.5,
          flexShrink: 0,
          order: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            px: 0.25,
          }}
        >
          <Typography variant="caption" color="text.secondary" fontSize={10}>
            {formatAxisValue(maxValue)}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontSize={10}>
            {formatAxisValue(midValue)}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontSize={10}>
            {formatAxisValue(0)}
          </Typography>
        </Box>
        <Box sx={{ px: 0.5 }} />
        {hasRight ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              px: 0.25,
            }}
          >
            <Typography variant="caption" color="text.secondary" fontSize={10}>
              {formatAxisValue(0)}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontSize={10}>
              {formatAxisValue(midValue)}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontSize={10}>
              {formatAxisValue(maxValue)}
            </Typography>
          </Box>
        ) : null}
      </Box>

      {tooltip ? (
        <Box
          sx={{
            position: "fixed",
            top: tooltip.y + 12,
            left: tooltip.x + 12,
            zIndex: 20,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            px: 1.25,
            py: 0.75,
            boxShadow: 2,
            pointerEvents: "none",
          }}
        >
          <Typography variant="caption" fontWeight={600} display="block">
            {tooltip.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {tooltip.seriesLabel}: {formatAxisValue(tooltip.value)}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}
