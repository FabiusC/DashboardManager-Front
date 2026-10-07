import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { BarChart, PieChart, ShowChart } from "@mui/icons-material";
import { memo } from "react";

/**
 * Shown when fields are selected but no chart type is chosen yet.
 * Displays the number of selected fields and prompts the user to configure the visualization.
 */
function SelectChartTypeGuidance({ selectedFieldsCount = 0 }) {
    const count = Math.max(0, selectedFieldsCount);

    return (
        <Box
            sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Box sx={{ textAlign: "center" }}>
                {/* Chart type icons - muted gray to denote not yet selected */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 3,
                        color: "text.secondary",
                        opacity: 0.5,
                        mb: 3,
                        "@keyframes blink": {
                            "0%, 100%": { opacity: 0.4 },
                            "50%": { opacity: 0.8 },
                        },
                        animation: "blink 2s ease-in-out infinite",
                    }}
                >
                    <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
                        <Typography component="span" variant="caption" sx={{ fontSize: "0.75rem", textAlign: "center" }}>
                            ...
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                        <BarChart sx={{ fontSize: 28 }} />
                        <Typography component="span" variant="caption" sx={{ fontSize: "0.75rem" }}>
                            Barras
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                        <PieChart sx={{ fontSize: 28 }} />
                        <Typography component="span" variant="caption" sx={{ fontSize: "0.75rem" }}>
                            Pastel
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                        <ShowChart sx={{ fontSize: 28 }} />
                        <Typography component="span" variant="caption" sx={{ fontSize: "0.75rem" }}>
                            Líneas
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
                        <Typography component="span" variant="caption" sx={{ fontSize: "0.75rem", textAlign: "center" }}>
                            ...
                        </Typography>
                    </Box>
                </Box>
                <Typography
                    variant="subtitle1"
                    sx={{
                        fontWeight: 600,
                        fontSize: "1.125rem",
                        color: "#646464",
                        mb: 1,
                    }}
                >
                    {count > 1 ? `¡${count} campos seleccionados, ahora puedes configurar tu visualización!` : `¡${count} campo seleccionado, ahora puedes configurar tu visualización!`}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                    Selecciona el tipo de gráfica que deseas visualizar desde el panel izquierdo.
                </Typography>
            </Box>
        </Box>
    );
}

export default memo(SelectChartTypeGuidance);
