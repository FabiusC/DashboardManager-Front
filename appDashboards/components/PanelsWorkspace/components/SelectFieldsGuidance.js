import { Box, Typography } from "@mui/material";
import { ArrowBack, TouchApp } from "@mui/icons-material";
import { memo } from "react";

/*
 * Empty state shown when no chart fields are selected.
 * Guides the user to select fields from the left sidebar to build their chart.
 */
function SelectFieldsGuidance({
    showGuidance = true,
    title = "Inicia seleccionando los paneles",
    description = "Selecciona los paneles del tablero que deseas visualizar",
}) {
    return (
        <Box
            sx={{
                width: "100%",
                textAlign: "center",
                maxWidth: 448,
                transition: "all 0.5s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {/* Visual guidance: arrows pointing to sidebar + pointer icon */}
            <Box
                sx={{
                    position: "relative",
                    width: 220,
                    height: 88,
                    display: "grid",
                    placeItems: "center",
                    mb: 3,
                }}
            >
                {showGuidance && (
                    <Box
                        sx={{
                            position: "absolute",
                            left: "calc(50% - 96px)",
                            top: "50%",
                            transform: "translate(-100%, -50%)",
                            display: "flex",
                            alignItems: "center",
                            color: "primary.main",
                            "@keyframes bounceArrow": {
                                "0%, 100%": { transform: "translateX(0)" },
                                "50%": { transform: "translateX(-4px)" },
                            },
                            "& > .MuiSvgIcon-root": {
                                animation: "bounceArrow 1.5s ease-in-out infinite",
                            },
                            "& > .MuiSvgIcon-root:nth-of-type(2)": {
                                animationDelay: "0.15s",
                                ml: -1.5,
                                opacity: 0.7,
                            },
                            "& > .MuiSvgIcon-root:nth-of-type(3)": {
                                animationDelay: "0.3s",
                                ml: -1.5,
                                opacity: 0.4,
                            },
                        }}
                    >
                        <ArrowBack sx={{ fontSize: 28 }} />
                        <ArrowBack sx={{ fontSize: 28 }} />
                        <ArrowBack sx={{ fontSize: 28 }} />
                    </Box>
                )}
                <Box
                    sx={{
                        width: 88,
                        height: 88,
                        borderRadius: 2,
                        bgcolor: "action.hover",
                        border: "2px dashed",
                        borderColor: "primary.main",
                        opacity: 0.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        "@keyframes pulseHint": {
                            "0%, 100%": { transform: "scale(1)" },
                            "50%": { transform: "scale(1.04)" },
                        },
                        animation: "pulseHint 2s ease-in-out infinite",
                    }}
                >
                    <TouchApp sx={{ fontSize: 40, color: "primary.main", opacity: 0.85 }} />
                </Box>
            </Box>

            <Typography
                variant="subtitle1"
                sx={{
                    fontWeight: 600,
                    color: "#646464",
                    mb: 1,
                    fontSize: "1.125rem",
                }}
            >
                {title}
            </Typography>
            <Typography
                variant="body2"
                sx={{
                    color: "text.secondary",
                    mb: 3,
                }}
            >
                {description}
            </Typography>
        </Box>
    );
}

export default memo(SelectFieldsGuidance);
