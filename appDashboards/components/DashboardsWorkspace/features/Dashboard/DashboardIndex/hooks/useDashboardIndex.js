import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useDebounce from "hooks/useDebounce";
import {
  DASHBOARD_INDEX_PAGE_SIZE,
  fetchDashboardIndex,
} from "../services/dashboardIndexService";

export function useDashboardIndex(userToken, open, searchQuery = "") {
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (!open) {
      setCurrentPage(1);
    }
  }, [open]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboardIndex", userToken, currentPage, debouncedSearch],
    queryFn: () =>
      fetchDashboardIndex({
        userToken,
        page: currentPage,
        search: debouncedSearch,
      }),
    enabled: open && !!userToken,
    staleTime: 60_000,
  });

  const dashboards = data?.results ?? [];
  const totalItems = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / DASHBOARD_INDEX_PAGE_SIZE));

  const pagination = useMemo(() => {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * DASHBOARD_INDEX_PAGE_SIZE + 1;
    const endItem = Math.min(currentPage * DASHBOARD_INDEX_PAGE_SIZE, totalItems);

    return { currentPage, totalPages, startItem, endItem, totalItems };
  }, [currentPage, totalPages, totalItems]);

  return {
    currentPage,
    setCurrentPage,
    dashboards,
    pagination,
    isLoading,
    isError,
  };
}
