import { getACLList } from "@services/creangelAuthAPI";
import { handleListAuthorizedDashboardsGroupedByCategory } from "../../shared/utils/dashboardActions";

export const DASHBOARD_INDEX_PAGE_SIZE = 14;
export const DASHBOARD_INDEX_MAX_TOTAL = 1000;
export const DASHBOARD_INDEX_CATEGORY_PAGE_SIZE = 6;
export const DASHBOARD_INDEX_CATEGORY_DASHBOARDS_PAGE_SIZE = 6;
export const DASHBOARD_INDEX_GRID_COLUMNS = 3;

export const DASHBOARD_INDEX_VIEW = {
  ALL: "all",
  GROUPED: "grouped",
};

export const DASHBOARD_INDEX_UNCATEGORIZED_ID = "__uncategorized__";
export const DASHBOARD_INDEX_UNCATEGORIZED_LABEL = "Sin Etiqueta";

export async function fetchDashboardIndex({ userToken, page, search }) {
  const offset = (page - 1) * DASHBOARD_INDEX_PAGE_SIZE;

  if (offset >= DASHBOARD_INDEX_MAX_TOTAL) {
    return { results: [], count: 0 };
  }

  const limit = Math.min(
    DASHBOARD_INDEX_PAGE_SIZE,
    DASHBOARD_INDEX_MAX_TOTAL - offset,
  );

  const response = await getACLList(
    {
      type: ["dashboard"],
      filtered_groups: [],
      limit,
      offset,
      q: search.trim(),
      order_by: "asc",
      order_field: "name",
      filter: [{ field: "in_trash", value: false }],
    },
    { Authorization: `Bearer ${userToken}` },
  );

  const results = Array.isArray(response?.data?.results) ? response.data.results : [];
  const count = Math.min(response?.data?.count ?? 0, DASHBOARD_INDEX_MAX_TOTAL);

  return { results, count };
}

export async function fetchDashboardIndexGrouped(userToken) {
  return handleListAuthorizedDashboardsGroupedByCategory(userToken);
}