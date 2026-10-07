// hook: useEmailsList.js
import { creangelAuthGeneralRequest } from "@services/creangelAuthAPI";
import { useCallback, useRef, useState } from "react";

// helper
const isValidEmail = (value) =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const useEmailsList = () => {
  const [emails, setEmails] = useState([]);
  const [totalEmails, setTotalEmails] = useState(0);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const resourcesRef = useRef([]);

  const handleGetEmailsList = useCallback(
    async ({
      showLoading = false,
      append = false,
      sortDirection = "asc",
      sortField = "name",
      searchValue = "",
      userId = null,
      limit = 50,
      offset = 0,
    } = {}) => {
      if (showLoading && !append) setIsLoadingList(true);
      else if (append) setIsLoadingMore(true);
      const response = await creangelAuthGeneralRequest({
        nameUrl: "emailsUsersList",
        typeRequest: "POST",
        version: "v1",
        body: {
          limit,
          offset,
          order_by: sortDirection,
          order_field: sortField,
          q: searchValue || "",
        },
      });

      const raw = response?.data;
      if (!raw) {
        if (!append) {
          setEmails([]);
          resourcesRef.current = [];
          setTotalEmails(0);
        }
        setHasMore(false);
        setIsLoadingList(false);
        setIsLoadingMore(false);
        return;
      }

      const results = (raw.results ?? [])
        .map((user) => {
          const email = isValidEmail(user.email)
            ? user.email
            : isValidEmail(user.username)
            ? user.username
            : null;
          return email ? { email } : null;
        })
        .filter(Boolean);

      const count = raw.count || 0;

      const newEmails = append
        ? [...resourcesRef.current, ...results]
        : results;

      resourcesRef.current = newEmails;
      setEmails(newEmails);
      setTotalEmails(count);
      setHasMore(results.length === limit && offset + limit < count);
      setIsLoadingList(false);
      setIsLoadingMore(false);
    },
    [],
  );

  return {
    emails,
    totalEmails,
    isLoadingList,
    isLoadingMore,
    hasMore,
    resourcesRef,
    handleGetEmailsList,
  };
};