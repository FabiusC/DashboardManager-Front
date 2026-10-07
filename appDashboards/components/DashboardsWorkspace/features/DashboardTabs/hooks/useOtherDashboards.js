import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { handleListAuthorizedDashboardsGroupedByCategory } from "../../Dashboard/shared/utils/dashboardActions";
import useDashboardsMetadata from "./useDashboardsMetadata";

const getCategoryKey = (category) => {
  const key = category?.id ?? category?.category_id ?? category?.name;
  if (key == null) return null;
  return typeof key === "string" ? key.trim().toLowerCase() : String(key);
};

const getDashboardId = (dashboard) => dashboard?.id ?? dashboard?.dashboard_id;

const normalizeDashboardGroups = (data) => {
  const groups = Array.isArray(data) ? data : data?.categories ?? [];
  const dashboardsById = new Map();

  groups.forEach((category) => {
    const categoryKey = getCategoryKey(category);
    const dashboards =
      category?.dashboards ??
      category?.items ??
      category?.resources ??
      category?.results ??
      [];

    if (!Array.isArray(dashboards)) return;

    dashboards.forEach((dashboard) => {
      const dashboardId = getDashboardId(dashboard);
      if (dashboardId == null) return;

      const existing = dashboardsById.get(String(dashboardId));
      const categories = new Map(existing?.categories ?? []);

      if (categoryKey != null) {
        categories.set(categoryKey, category);
      }

      dashboardsById.set(String(dashboardId), {
        ...(existing ?? {}),
        ...dashboard,
        categories: [...categories.values()],
      });
    });
  });

  const uncategorized = data?.uncategorized ?? [];
  if (Array.isArray(uncategorized)) {
    uncategorized.forEach((dashboard) => {
      const dashboardId = getDashboardId(dashboard);
      if (dashboardId == null || dashboardsById.has(String(dashboardId))) return;

      dashboardsById.set(String(dashboardId), { ...dashboard, categories: [] });
    });
  }

  return [...dashboardsById.values()];
};

export const useOtherDashboards = ({
  userToken,
  currentDashboard,
  searchTerm = "",
  page = 1,
  limit = 10,
}) => {
  const currentCategoryKeys = useMemo(
    () =>
      new Set(
        (currentDashboard?.categories ?? [])
          .map(getCategoryKey)
          .filter((key) => key != null),
      ),
    [currentDashboard?.categories],
  );

  const normalizedSearchTerm = typeof searchTerm === "string" ? searchTerm.trim() : "";

  // 1. Obtener datos agrupados por categorías
  const { data: groupedData, isLoading: isGroupedLoading, isError: isGroupedError, refetch } = useQuery({
    queryKey: ["otherDashboards", userToken, normalizedSearchTerm],
    queryFn: () => handleListAuthorizedDashboardsGroupedByCategory(userToken, normalizedSearchTerm),
    enabled: Boolean(userToken),
    staleTime: 30_000,
  });
  // 2. Obtener metadatos de tableros permitiendo todos en modo editor (onlyPublished: false)
  const { data: aclData, isLoading: isAclLoading } = useDashboardsMetadata(userToken, {
    onlyPublished: false,
  });

  const dashboardMetaMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(aclData)) {
      aclData.forEach((item) => {
        if (item?.id) {
          map.set(String(item.id), item);
        }
      });
    }
    return map;
  }, [aclData]);

  const { dashboards, totalCount } = useMemo(() => {
    const currentDashboardId = getDashboardId(currentDashboard);
    const search = normalizedSearchTerm.toLowerCase();

    const filtered = normalizeDashboardGroups(groupedData).filter((dashboard) => {
      const dashboardId = getDashboardId(dashboard);
      if (!dashboardId) return false;

      const meta = dashboardMetaMap.get(String(dashboardId));
      if (!meta) return false;

      if (
        currentDashboardId != null &&
        String(dashboardId) === String(currentDashboardId)
      ) {
        return false;
      }

      const sharesCategory = (meta.categories ?? dashboard.categories ?? []).some((category) =>
        currentCategoryKeys.has(getCategoryKey(category)),
      );

      if (sharesCategory) return false;

      const name = meta?.name ?? dashboard?.name ?? "";
      return !search || String(name).toLowerCase().includes(search);
    });

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Number(limit) || 1);
    const start = (safePage - 1) * safeLimit;

    return {
      dashboards: filtered.slice(start, start + safeLimit),
      totalCount: filtered.length,
    };
  }, [currentCategoryKeys, currentDashboard, groupedData, dashboardMetaMap, limit, normalizedSearchTerm, page]);

  return {
    dashboards,
    totalCount,
    isLoading: isGroupedLoading || isAclLoading,
    isError: isGroupedError,
    refetch,
  };
};

export default useOtherDashboards;