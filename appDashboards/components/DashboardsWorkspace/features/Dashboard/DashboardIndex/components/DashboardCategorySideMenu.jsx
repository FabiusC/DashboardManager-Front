import { useEffect, useMemo, useState } from "react";
import { Add, Link as LinkIcon, LocalOfferRounded } from "@mui/icons-material";
import { Box, Button, Divider, Tooltip } from "@mui/material";
import SideMenu from "../../../DashboardTabs/components/SideMenu";

const DashboardCategorySideMenu = ({
    categories = [],
    selectedCategory,
    onSelectCategory,
    onLinkDashboards,
    onCreateDashboard,
}) => {
    const [activeCategoryId, setActiveCategoryId] = useState(selectedCategory?.id ?? null);

    useEffect(() => {
        setActiveCategoryId(selectedCategory?.id ?? null);
    }, [selectedCategory?.id]);

    const tabs = useMemo(
        () => categories.map((category) => ({
            name: String(category.id),
            label: category.name,
            description: `${category.dashboardCount ?? 0} tableros`,
            icon: <LocalOfferRounded sx={{ fontSize: 18, color: "primary.main" }} />,
            state: {
                isLoading: false,
                isDisabled: false,
                isActive: String(activeCategoryId) === String(category.id),
            },
        })),
        [categories, activeCategoryId],
    );

    const changeTabSideState = (name, key, value) => {
        if (key !== "isActive" || !value) return;
        const nextCategory = categories.find((category) => String(category.id) === String(name));
        if (!nextCategory) return;
        setActiveCategoryId(nextCategory.id);
        onSelectCategory(nextCategory);
    };

    if (categories.length === 0) return null;

    return (
        <Box
            component="aside"
            aria-label="Categorías de tableros"
            sx={{
                flex: "0 0 auto",
                minHeight: 0,
                borderRight: "1px solid #E2E8F0",
                bgcolor: "#FFFFFF",
                overflow: "hidden",
            }}
        >
            <SideMenu tabs={tabs} changeTabSideState={changeTabSideState} />
            <Divider />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, p: 0.75 }}>
                <Tooltip title="Vincular tablero existente" placement="right" arrow>
                    <span>
                        <Button
                            type="button"
                            size="small"
                            variant="outlined"
                            startIcon={<LinkIcon sx={{ fontSize: 16 }} />}
                            disabled={!selectedCategory || selectedCategory.id === "__uncategorized__"}
                            onClick={onLinkDashboards}
                            sx={{ minWidth: 0, justifyContent: "flex-start", textTransform: "none", whiteSpace: "nowrap" }}
                        >
                            Vincular tablero
                        </Button>
                    </span>
                </Tooltip>
                <Tooltip title="Crear tablero en esta categoría" placement="right" arrow>
                    <Button
                        type="button"
                        size="small"
                        variant="contained"
                        startIcon={<Add sx={{ fontSize: 16 }} />}
                        disabled={!selectedCategory || selectedCategory.id === "__uncategorized__"}
                        onClick={onCreateDashboard}
                        sx={{ minWidth: 0, justifyContent: "flex-start", textTransform: "none", whiteSpace: "nowrap" }}
                    >
                        Crear tablero
                    </Button>
                </Tooltip>
            </Box>
        </Box>
    );
};

export default DashboardCategorySideMenu;
