import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DASHBOARD_INDEX_CATEGORY_DASHBOARDS_PAGE_SIZE,
  DASHBOARD_INDEX_CATEGORY_PAGE_SIZE,
  DASHBOARD_INDEX_UNCATEGORIZED_ID,
  DASHBOARD_INDEX_UNCATEGORIZED_LABEL,
  fetchDashboardIndexGrouped,
} from "../services/dashboardIndexService";

const toCategories = (data, selectedTag, selectedCategory) => {
  const items = [...(data?.categories ?? [])];

  if ((data?.uncategorized ?? []).length > 0) {
    items.push({
      id: DASHBOARD_INDEX_UNCATEGORIZED_ID,
      name: DASHBOARD_INDEX_UNCATEGORIZED_LABEL,
      dashboards: data.uncategorized,
    });
  }

  if (selectedCategory) {
    return items.filter((category) => String(category.id) === String(selectedCategory.id));
  }

  if (!selectedTag) return items;

  return items.filter((category) => String(category.id) === String(selectedTag.id));
};

export function useDashboardIndexGrouped(userToken, open, selectedTag = null, selectedCategory = null) {
  const [currentPage, setCurrentPage] = useState(1);
  const [dashboardPages, setDashboardPages] = useState({});

  useEffect(() => {
    if (!open) {
      setCurrentPage(1);
      setDashboardPages({});
    }
  }, [open]);

  useEffect(() => {
    setCurrentPage(1);
    setDashboardPages({});
  }, [selectedTag?.id, selectedCategory?.id]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboardIndexGrouped", userToken],
    queryFn: () => fetchDashboardIndexGrouped(userToken),
    enabled: open && !!userToken,
    staleTime: 60_000,
  });

  const categories = useMemo(
    () => toCategories(data, selectedTag, selectedCategory),
    [data, selectedTag, selectedCategory],
  );

  const categoryOptions = useMemo(
    () =>
      toCategories(data, null)
        .map((category) => ({
          id: category.id,
          name: category.name,
          dashboardCount: category.dashboards?.length ?? 0,
        }))
        .sort((a, b) => {
          if (a.id === DASHBOARD_INDEX_UNCATEGORIZED_ID) return 1;
          if (b.id === DASHBOARD_INDEX_UNCATEGORIZED_ID) return -1;
          return a.name.localeCompare(b.name);
        }),
    [data],
  );

  const totalDashboards = useMemo(
    () => categories.reduce((sum, category) => sum + (category.dashboards?.length ?? 0), 0),
    [categories],
  );

  const totalItems = categories.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / DASHBOARD_INDEX_CATEGORY_PAGE_SIZE));

  const setCategoryDashboardPage = useCallback((categoryId, page) => {
    setDashboardPages((prev) => ({ ...prev, [categoryId]: page }));
  }, []);

  const handleCategoryPageChange = useCallback((page) => {
    setCurrentPage(page);
    setDashboardPages({});
  }, []);

  const visibleCategories = useMemo(() => {
    const start = (currentPage - 1) * DASHBOARD_INDEX_CATEGORY_PAGE_SIZE;

    return categories.slice(start, start + DASHBOARD_INDEX_CATEGORY_PAGE_SIZE).map((category) => {
      const allDashboards = category.dashboards ?? [];
      const dashboardPage = dashboardPages[category.id] ?? 1;
      const totalDashboardPages = Math.max(
        1,
        Math.ceil(allDashboards.length / DASHBOARD_INDEX_CATEGORY_DASHBOARDS_PAGE_SIZE),
      );
      const safeDashboardPage = Math.min(dashboardPage, totalDashboardPages);
      const dashboardStart =
        (safeDashboardPage - 1) * DASHBOARD_INDEX_CATEGORY_DASHBOARDS_PAGE_SIZE;

      return {
        ...category,
        dashboardCount: allDashboards.length,
        dashboards: allDashboards.slice(
          dashboardStart,
          dashboardStart + DASHBOARD_INDEX_CATEGORY_DASHBOARDS_PAGE_SIZE,
        ),
        dashboardPagination: {
          currentPage: safeDashboardPage,
          totalPages: totalDashboardPages,
          show: allDashboards.length > DASHBOARD_INDEX_CATEGORY_DASHBOARDS_PAGE_SIZE,
        },
      };
    });
  }, [categories, currentPage, dashboardPages]);

  const pagination = useMemo(() => {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * DASHBOARD_INDEX_CATEGORY_PAGE_SIZE + 1;
    const endItem = Math.min(currentPage * DASHBOARD_INDEX_CATEGORY_PAGE_SIZE, totalItems);

    return { currentPage, totalPages, startItem, endItem, totalItems };
  }, [currentPage, totalPages, totalItems]);

  return {
    categories: visibleCategories,
    categoryOptions,
    totalDashboards,
    totalCategories: totalItems,
    pagination,
    setCurrentPage: handleCategoryPageChange,
    setCategoryDashboardPage,
    isLoading,
    isError,
  };
}
