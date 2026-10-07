import React from "react";
import { Box, Button, Chip, Tooltip, Typography, alpha, useTheme } from "@mui/material";
import { FilterAltOutlined, InfoOutlined, SpaceDashboardRounded } from "@mui/icons-material";
import { DeleteSweep } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { resetFilters } from "@redux/actions";

const HEADER_BADGE_HEIGHT = 24;

const truncateStyles = {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
};

const OPERATOR_SYMBOL = {
    EQUALS: "=",
};

const getOperatorSymbol = (rawOperator) => {
    const key = String(rawOperator || "").trim();
    return OPERATOR_SYMBOL[key] || key || "=";
};

const FilterChip = ({ filter }) => {
    const theme = useTheme();

    const panelName = filter?.panelName ?? "";
    const fieldAlias = filter?.fieldAlias ?? "";
    const condition = filter?.operator ?? "";
    const value = filter?.value ?? "";

    const accentColor = theme.palette.primary.main;

    const label = [panelName, fieldAlias, getOperatorSymbol(condition), value].filter(Boolean).join(" ");

    return (
        <Tooltip title={label} arrow placement="top" enterDelay={500}>
        <Box
            sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0,
            borderRadius: 2,
            border: "1px solid",
            borderColor: alpha(accentColor, 0.35),
            backgroundColor: theme.palette.common.white,
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            maxWidth: 420,
            borderLeft: `6px solid ${accentColor}`,
            height: 34,
            boxSizing: "border-box",
            overflow: "hidden",
            }}
        >
            <Box
                sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1,
                    height: "100%",
                    backgroundColor: alpha(accentColor, 0.12),
                    borderRight: `1px solid ${alpha(accentColor, 0.18)}`,
                    flex: "0 0 auto",
                    minWidth: 0,
                }}
            >
                <Box
                    sx={{
                        width: 22,
                        height: 22,
                        borderRadius: 1.1,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: alpha(accentColor, 0.16),
                        color: accentColor,
                        flex: "0 0 auto",
                    }}
                >
                    <SpaceDashboardRounded sx={{ fontSize: 16 }} />
                </Box>

                <Typography
                    sx={{
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        color: alpha(accentColor, 0.92),
                        ...truncateStyles,
                        maxWidth: 140,
                        textTransform: "uppercase",
                        letterSpacing: "0.18px",
                        lineHeight: 1,
                    }}
                >
                    {panelName}
                </Typography>
            </Box>

            <Box
                sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1,
                    height: "100%",
                    backgroundColor: theme.palette.common.white,
                    minWidth: 0,
                    flex: "1 1 auto",
                }}
            >
                <Typography
                    sx={{
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        color: alpha(theme.palette.text.primary, 0.80),
                        ...truncateStyles,
                        maxWidth: 170,
                        textTransform: "uppercase",
                        letterSpacing: "0.15px",
                        lineHeight: 1,
                    }}
                >
                    {fieldAlias}
                </Typography>

                <Box
                    sx={{
                        px: 0.75,
                        height: 20,
                        borderRadius: 1,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: alpha(theme.palette.text.primary, 0.05),
                        border: `1px solid ${alpha(theme.palette.text.primary, 0.10)}`,
                        color: alpha(theme.palette.text.primary, 0.7),
                        flex: "0 0 auto",
                    }}
                >
                    <Typography sx={{ fontSize: "10px", fontWeight: 500, lineHeight: 1 }}>
                        {getOperatorSymbol(condition)}
                    </Typography>
                </Box>

                <Typography
                    sx={{
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        color: accentColor,
                        ...truncateStyles,
                        maxWidth: 140,
                        textTransform: "uppercase",
                        letterSpacing: "0.15px",
                        lineHeight: 1,
                    }}
                >
                    {String(value)}
                </Typography>
            </Box>
        </Box>
        </Tooltip>
    );
};

export default FilterChip;

const OperatorBadge = ({ operator }) => {
    const theme = useTheme();
    const isOr = operator === "OR";
    const color = isOr ? theme.palette.warning.main : theme.palette.success.main;
    const bg = alpha(color, 0.08);
    const label = isOr ? "O" : "Y";

    return (
        <Box
            component="span"
            sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                px: 0.75,
                height: 20,
                borderRadius: 1,
                fontSize: "10px",
                fontWeight: 900,
                color,
                backgroundColor: bg,
                border: `1px solid ${alpha(color, 0.25)}`,
                flex: "0 0 auto",
                boxSizing: "border-box",
                minWidth: 20,
                lineHeight: 1,
            }}
        >
            {label}
        </Box>
    );
};

const buildPanelLookup = (panels = []) => {
    const map = new Map();
    (panels || []).forEach((p) => {
        const id = String(p?.id ?? "");
        if (!id) return;
        const panelName = p?.title;

        const selectedFields = p?.queryParameters?.selected_fields || [];
        const fieldAliasMap = new Map();
        if (Array.isArray(selectedFields)) {
            selectedFields.forEach((f) => {
                if (!f) return;
                const fieldName = f?.name;
                if (!fieldName) return;
                const alias = f?.alias;
                fieldAliasMap.set(String(fieldName), String(alias));
            });
        }
        map.set(id, { panelName,fieldAliasMap });
    });
    return map;
};

const collectPanelRuleChips = (filtersState, panelsLookup) => {
    const groups = filtersState?.groups || {};
    const rules = filtersState?.rules || {};
    const root = groups?.root;
    const rootChildren = Array.isArray(root?.children) ? root.children : [];

    const result = [];
    rootChildren.forEach((ptr) => {
        if (ptr?.type !== "group") return;
        const group = groups[ptr.id];
        if (!group) return;

        const panelId = String(group.uiContext_id || group.id || "");
        const panelMeta = panelsLookup?.get(panelId) || panelsLookup?.get(String(group.id)) || null;

        const children = Array.isArray(group.children) ? group.children : [];
        const groupOperator = group.operator || "AND";

        const leafRules = [];
        const walk = (groupId) => {
            const g = groups[groupId];
            if (!g) return;
            const ch = Array.isArray(g.children) ? g.children : [];
            ch.forEach((c) => {
                if (c?.type === "rule") {
                    const r = rules[c.id];
                    if (r) leafRules.push(r);
                } else if (c?.type === "group") {
                    walk(c.id);
                }
            });
        };
        walk(group.id);

        if (leafRules.length === 0) {
            result.push({
                panelId,
                panelName: panelMeta?.panelName ,
                operator: groupOperator,
                rules: [],
            });
            return;
        }

        result.push({
            panelId,
            panelName: panelMeta?.panelName ,
            
            operator: groupOperator,
            rules: leafRules.map((r) => {
                const alias = panelMeta?.fieldAliasMap?.get(String(r.field)) || r.field;
                return {
                    panelName: panelMeta?.panelName,
                    field: r.field,
                    fieldAlias: alias,
                    operator: r.operator,
                    value: r.value,
                };
            }),
        });
    });

    return result;
};

export const DashboardFiltersSection = ({
    filtersState,
    panels = [],
    onClear,
    variant,
}) => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const panelsLookup = React.useMemo(() => buildPanelLookup(panels), [panels]);
    const rootOperator = filtersState?.groups?.root?.operator || "AND";
    const panelGroups = React.useMemo(
        () => collectPanelRuleChips(filtersState, panelsLookup),
        [filtersState, panelsLookup],
    );

    const totalRules = panelGroups.reduce((acc, g) => acc + (g.rules?.length || 0), 0);
    const activePanelsCount = panelGroups.filter((g) => (g.rules?.length || 0) > 0).length;
    const isReportVariant = variant === "report";
    if (isReportVariant) {
        return (
            <Box
                sx={{
                    border: "0.5px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    p: 2,
                    backgroundColor: "background.paper",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        mb: 2,
                        gap: 2,
                    }}
                >
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", minWidth: 0 }}>
                        <FilterAltOutlined sx={{ fontSize: 18, color: "#7F77DD" }} />
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={500} sx={truncateStyles}>
                                Filtros del Tablero
                            </Typography>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontWeight: 500, fontSize: "12px", ...truncateStyles }}
                            >
                                Criterios heredados del tablero. Definen los datos del reporte.
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: "0 0 auto" }}>
                        <Chip
                            size="small"
                            variant="outlined"
                            label={`${activePanelsCount} panel${activePanelsCount === 1 ? "" : "es"}`}
                            sx={{
                                fontWeight: 700,
                                height: `${HEADER_BADGE_HEIGHT}px`,
                                "& .MuiChip-label": { fontSize: "0.75rem", lineHeight: 1.2 },
                            }}
                        />
                        <Chip
                            size="small"
                            color={totalRules > 0 ? "primary" : "default"}
                            variant={totalRules > 0 ? "filled" : "outlined"}
                            label={`${totalRules} filtro${totalRules === 1 ? "" : "s"} activo${totalRules === 1 ? "" : "s"}`}
                            sx={{
                                fontWeight: 700,
                                height: `${HEADER_BADGE_HEIGHT}px`,
                                "& .MuiChip-label": { fontSize: "0.75rem", lineHeight: 1.2 },
                            }}
                        />
                        {totalRules > 0 && (
                            <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteSweep />}
                                onClick={() =>
                                    typeof onClear === "function" ? onClear() : dispatch(resetFilters())
                                }
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    borderRadius: 2,
                                    height: `${HEADER_BADGE_HEIGHT}px`,
                                    minHeight: `${HEADER_BADGE_HEIGHT}px`,
                                    px: 1.25,
                                    py: 0,
                                    fontSize: "0.75rem",
                                    lineHeight: 1.2,
                                    "&:hover": {
                                        backgroundColor: alpha(theme.palette.error.main, 0.06),
                                    },
                                }}
                            >
                                Vaciar
                            </Button>
                        )}
                    </Box>
                </Box>

                {/* Body (reutiliza exactamente la misma lógica de contenido) */}
                {totalRules === 0 ? (
                    <Box
                        sx={{
                            border: "1px dashed",
                            borderColor: "divider",
                            borderRadius: 2,
                            px: 2,
                            py: 2,
                            backgroundColor: alpha(theme.palette.info.main, 0.03),
                        }}
                    >
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Sin filtros activos
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            El reporte incluirá todos los datos del tablero. Aplica filtros desde el dashboard para
                            refinar el contenido.
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <Box
                            sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                alignItems: "center",
                                gap: 1,
                            }}
                        >
                            {panelGroups
                                .filter((g) => (g.rules?.length || 0) > 0)
                                .map((group, groupIdx) => (
                                    <React.Fragment key={group.panelId || groupIdx}>
                                        {groupIdx > 0 && <OperatorBadge operator={rootOperator} />}

                                        {group.rules.map((ruleFilter, ruleIdx) => (
                                            <React.Fragment key={`${group.panelId}-${ruleFilter.field}-${ruleIdx}`}>
                                                {ruleIdx > 0 && <OperatorBadge operator={group.operator || "AND"} />}
                                                <FilterChip filter={ruleFilter} />
                                            </React.Fragment>
                                        ))}
                                    </React.Fragment>
                                ))}
                        </Box>

                        <Box
                            sx={{
                                mt: 2,
                                px: 2,
                                py: 1.25,
                                mx: -2,
                                mb: -2,
                                borderTop: "1px solid",
                                borderTopColor: "divider",
                                backgroundColor: alpha(theme.palette.text.primary, 0.02),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 2,
                            }}
                        >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                                <InfoOutlined
                                    sx={{
                                        fontSize: 18,
                                        color: alpha(theme.palette.primary.main, 0.55),
                                        flex: "0 0 auto",
                                    }}
                                />
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    fontSize="12px"
                                    sx={truncateStyles}
                                >
                                    Para modificar los filtros, ajústalos directamente en el tablero.
                                </Typography>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: "0 0 auto" }}>
                                <OperatorBadge operator="AND" />
                                <Typography variant="body2" color="text.secondary">
                                    = AND
                                </Typography>
                                <OperatorBadge operator="OR" />
                                <Typography variant="body2" color="text.secondary">
                                    = OR
                                </Typography>
                            </Box>
                        </Box>
                    </>
                )}
            </Box>
        );
    }

    return (
        <Box sx={{ mb: 4 }}>
            <Typography
                variant="overline"
                fontWeight="700"
                color="text.secondary"
                gutterBottom
            >
                Filtros del Tablero
            </Typography>

            <Box
                sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    overflow: "hidden",
                    backgroundColor: "background.paper",
                }}
            >
                <Box
                    sx={{
                        px: 2,
                        py: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                        <FilterAltOutlined sx={{ fontSize: 18, color: "#7F77DD" }} />
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontWeight: 500, ...truncateStyles }}
                        >
                            Criterios heredados del tablero. Definen los datos del reporte.
                        </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: "0 0 auto" }}>
                        <Chip
                            size="small"
                            variant="outlined"
                            label={`${activePanelsCount} panel${activePanelsCount === 1 ? "" : "es"}`}
                            sx={{
                                fontWeight: 700,
                                height: `${HEADER_BADGE_HEIGHT}px`,
                                "& .MuiChip-label": { fontSize: "0.75rem", lineHeight: 1.2 },
                            }}
                        />
                        <Chip
                            size="small"
                            color={totalRules > 0 ? "primary" : "default"}
                            variant={totalRules > 0 ? "filled" : "outlined"}
                            label={`${totalRules} filtro${totalRules === 1 ? "" : "s"} activo${totalRules === 1 ? "" : "s"}`}
                            sx={{
                                fontWeight: 700,
                                height: `${HEADER_BADGE_HEIGHT}px`,
                                "& .MuiChip-label": { fontSize: "0.75rem", lineHeight: 1.2 },
                            }}
                        />
                        {totalRules > 0 && (
                            <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteSweep />}
                                onClick={() => (typeof onClear === "function" ? onClear() : dispatch(resetFilters()))}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    borderRadius: 2,
                                    height: `${HEADER_BADGE_HEIGHT}px`,
                                    minHeight: `${HEADER_BADGE_HEIGHT}px`,
                                    px: 1.25,
                                    py: 0,
                                    fontSize: "0.75rem",
                                    lineHeight: 1.2,
                                    "&:hover": {
                                        backgroundColor: alpha(theme.palette.error.main, 0.06),
                                    },
                                }}
                            >
                                Vaciar
                            </Button>
                        )}
                    </Box>
                </Box>

                <Box sx={{ px: 2, py: 2 }}>
                    {totalRules === 0 ? (
                        <Box
                            sx={{
                                border: "1px dashed",
                                borderColor: "divider",
                                borderRadius: 2,
                                px: 2,
                                py: 2,
                                backgroundColor: alpha(theme.palette.info.main, 0.03),
                            }}
                        >
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Sin filtros activos
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                El reporte incluirá todos los datos del tablero. Aplica filtros desde el dashboard para refinar el contenido.
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                {panelGroups
                                    .filter((g) => (g.rules?.length || 0) > 0)
                                    .map((group, groupIdx) => (
                                        <React.Fragment key={group.panelId || groupIdx}>
                                            {groupIdx > 0 && <OperatorBadge operator={rootOperator} />}

                                            {group.rules.map((ruleFilter, ruleIdx) => (
                                                <React.Fragment key={`${group.panelId}-${ruleFilter.field}-${ruleIdx}`}>
                                                    {ruleIdx > 0 && <OperatorBadge operator={group.operator || "AND"} />}
                                                    <FilterChip filter={ruleFilter} />
                                                </React.Fragment>
                                            ))}
                                        </React.Fragment>
                                    ))}
                            </Box>

                            <Box
                                sx={{
                                    mt: 2,
                                    px: 2,
                                    py: 1.25,
                                    mx: -2,
                                    mb: -2,
                                    borderTop: "1px solid",
                                    borderTopColor: "divider",
                                    backgroundColor: alpha(theme.palette.text.primary, 0.02),
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 2,
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                                    <InfoOutlined
                                        sx={{
                                            fontSize: 18,
                                            color: alpha(theme.palette.primary.main, 0.55), 
                                            flex: "0 0 auto",
                                        }}
                                    />
                                    <Typography variant="body2" color="text.secondary" fontSize="12px" sx={truncateStyles}>
                                        Para modificar los filtros, ajústalos directamente en el tablero.
                                    </Typography>
                                </Box>

                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: "0 0 auto" }}>
                                    <OperatorBadge operator="AND" />
                                    <Typography variant="body2" color="text.secondary">= AND</Typography>
                                    <OperatorBadge operator="OR" />
                                    <Typography variant="body2" color="text.secondary">= OR</Typography>
                                </Box>
                            </Box>
                        </>
                    )}
                </Box>
            </Box>
        </Box>
    );
};