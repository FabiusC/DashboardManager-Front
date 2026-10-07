import React, { useEffect, useState } from "react";
import { Box, Chip, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    BarChart as BarChartIcon,
    Dashboard as DashboardIcon,
} from "@mui/icons-material";

const DEFAULT_ICON_SIZE = "60px";
const PREVIEW_ASPECT_RATIO = "5 / 3";
const LARGE_CARD_ICON_SIZE = 80;
const COMPACT_CARD_MEDIA_HEIGHT = 44;

export const ResourceTypeChip = ({ type }) => {
    const theme = useTheme();
    const organizationColor = theme.palette.primary.main;
    const organizationTint = alpha(organizationColor, 0.08);
    const typeLabel =
        type === "panel" ? "PANEL" : type === "dashboard" ? "TABLERO" : "RECURSO";

    return (
        <Chip
            label={typeLabel}
            size="small"
            sx={{
                flexShrink: 0,
                height: 20,
                borderRadius: 10,
                backgroundColor: organizationTint,
                color: organizationColor,
                fontSize: "0.625rem",
                fontWeight: 500,
                textTransform: "uppercase",
                "& .MuiChip-label": {
                    px: 1,
                },
            }}
        />
    );
};

const ResourcePreviewIcon = ({
    previewUrl,
    type,
    color = "#FFD745",
    sx = {},
    cardPreview = false,
    name = "",
    dateLabel = "",
}) => {
    const [imageError, setImageError] = useState(false);
    const theme = useTheme();
    const { fontSize, ...iconSx } = sx || {};
    const size = fontSize || DEFAULT_ICON_SIZE;
    const IconComponent = type === "panel" ? BarChartIcon : DashboardIcon;
    const organizationColor = theme.palette.primary.main;
    const numericSize = Number.parseFloat(size);
    const isLargeCardPreview =
        cardPreview &&
        (Number.isNaN(numericSize) || numericSize >= LARGE_CARD_ICON_SIZE);
    const isCompactCardPreview = cardPreview && !isLargeCardPreview;

    useEffect(() => {
        setImageError(false);
    }, [previewUrl]);

    const renderMedia = (iconSize = size) => {
        if (previewUrl && !imageError) {
            return (
                <Box
                    component="img"
                    src={previewUrl}
                    alt={name ? `Preview de ${name}` : "Preview"}
                    onError={() => setImageError(true)}
                    sx={{
                        width: "100%",
                        height: "100%",
                        display: "block",
                        objectFit: "contain",
                        objectPosition: "center",
                    }}
                />
            );
        }

        return (
            <IconComponent
                sx={{
                    color,
                    fontSize: iconSize,
                }}
            />
        );
    };

    if (cardPreview) {
        return (
            <Box
                data-resource-card-preview
                data-resource-card-preview-compact={isCompactCardPreview || undefined}
                sx={{
                    ...iconSx,
                    width: "100%",
                    minWidth: 0,
                    ...(isCompactCardPreview && {
                        height: COMPACT_CARD_MEDIA_HEIGHT,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                    }),
                }}
            >
                <Box
                    sx={{
                        width: "100%",
                        ...(isLargeCardPreview
                            ? { aspectRatio: PREVIEW_ASPECT_RATIO }
                            : {
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                              }),
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `0.5px solid ${alpha(organizationColor, 0.14)}`,
                        borderRadius: 1.5,
                        backgroundColor: "#f8fafc",
                    }}
                >
                    {renderMedia(
                        isCompactCardPreview
                            ? `${Math.min(numericSize || 40, 40)}px`
                            : size,
                    )}
                </Box>

                {isLargeCardPreview && (
                    <Box
                        sx={{
                            mt: 1,
                            pt: 1.25,
                            px: 0.5,
                            borderTop: "1px solid #edf0f2",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 1,
                                minWidth: 0,
                            }}
                        >
                            <Typography
                                noWrap
                                sx={{
                                    minWidth: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    color: "#20252b",
                                    fontSize: "0.875rem",
                                    fontWeight: 500,
                                }}
                            >
                                {name}
                            </Typography>
                            <ResourceTypeChip type={type} />
                        </Box>

                        {dateLabel && (
                            <Typography
                                sx={{
                                    mt: 0.25,
                                    color: "#808894",
                                    fontSize: "0.75rem",
                                    lineHeight: 1.4,
                                }}
                            >
                                {dateLabel}
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>
        );
    }

    if (previewUrl && !imageError) {
        return (
            <Box
                component="img"
                src={previewUrl}
                alt={name ? `Preview de ${name}` : "Preview"}
                onError={() => setImageError(true)}
                sx={{
                    ...iconSx,
                    width: size,
                    height: size,
                    display: "block",
                    objectFit: "contain",
                }}
            />
        );
    }

    return (
        <IconComponent
            sx={{
                ...iconSx,
                color,
                fontSize: size,
            }}
        />
    );
};

export default ResourcePreviewIcon;
