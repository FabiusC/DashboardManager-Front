import { useQuery } from "@tanstack/react-query";
import { getACLList } from "@services/creangelAuthAPI";

export const useDashboardsMetadata = (userToken, { onlyPublished = true } = {}) => {
  return useQuery({
    queryKey: ['aclDashboardsMetadata', userToken, onlyPublished],
    queryFn: async () => {
      const filters = [{ field: "in_trash", value: false }];
      if (onlyPublished) {
        filters.push({ field: "is_product", value: true });
      }
      const response = await getACLList(
        {
          type: ["dashboard"],
          limit: 1000,
          offset: 0,
          filter: filters,
        },
        { Authorization: `Bearer ${userToken}` }
      );
      return response?.data?.results ?? [];
    },
    enabled: Boolean(userToken),
    staleTime: 60_000,
  });
};

export default useDashboardsMetadata;