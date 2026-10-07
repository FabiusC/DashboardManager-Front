import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { pushNotification } from '@redux/actions';
import {
  handleListDashboardCategories,
  handleListDashboardsByCategory,
  handleCreateDashboardCategory,
  handleUpdateDashboardCategories,
  handleUpdateDashboardCategory,
  handleDeleteDashboardCategory,
} from '../../../../Dashboard/shared/utils/dashboardActions';
import {
  canDeleteCategory,
  CATEGORY_DELETE_BLOCKED_MSG,
} from '../utils/categoryDeleteRules';

const TAGS_QUERY_KEY = ['dashboardCategories'];
const categoryDashboardsQueryKey = (categoryId) => ['categoryDashboards', categoryId];

const getCategoryId = (item) => item?.id ?? item?.category_id;

const toSignature = (items = []) =>
  [...items]
    .map((item) => getCategoryId(item) || `name:${String(item.name).toLowerCase()}`)
    .sort()
    .join('|');

const normalizeCategories = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.categories)) return data.categories;
  return [];
};

const isLinked = (linked, category) =>
  linked.some((item) => {
    const categoryId = getCategoryId(category);
    const itemId = getCategoryId(item);
    if (categoryId) return itemId === categoryId;
    return String(item.name).toLowerCase() === String(category.name).toLowerCase();
  });

const buildSavePayload = (linked) => ({
  category_ids: linked.map((item) => getCategoryId(item)).filter(Boolean),
  category_names: linked.filter((item) => !getCategoryId(item)).map((item) => item.name),
});

export const useDashboardTags = ({ dashboard, setDashboard, userToken }) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [linked, setLinked] = useState([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const savedBaselineRef = useRef('');
  const dashboardIdRef = useRef(null);
  const awaitingParentSyncRef = useRef(false);

  const dashboardId = dashboard?.id;

  const { data: allCategories = [], isLoading } = useQuery({
    queryKey: TAGS_QUERY_KEY,
    queryFn: () => handleListDashboardCategories(userToken),
    enabled: !!userToken,
  });

  const commitPersistedState = useCallback((categories = []) => {
    const next = categories ?? [];
    savedBaselineRef.current = toSignature(next);
    setLinked(next);
    return next;
  }, []);

  const hasChanges = useMemo(
    () => toSignature(linked) !== savedBaselineRef.current,
    [linked]
  );

  const resetUiState = useCallback(() => {
    setSearch('');
    setEditingId(null);
    setEditName('');
  }, []);

  const syncFromServer = useCallback(
    (categories = []) => {
      commitPersistedState(categories);
      resetUiState();
      awaitingParentSyncRef.current = false;
    },
    [commitPersistedState, resetUiState]
  );

  useEffect(() => {
    if (dashboardIdRef.current === dashboardId) return;

    dashboardIdRef.current = dashboardId;
    awaitingParentSyncRef.current = false;
    syncFromServer(dashboard?.categories ?? []);
  }, [dashboardId, dashboard?.categories, syncFromServer]);

  useEffect(() => {
    if (!dashboardId || awaitingParentSyncRef.current) return;
    if (hasChanges) return;

    const serverCategories = dashboard?.categories ?? [];
    if (serverCategories.length === 0) return;
    if (savedBaselineRef.current !== '' || linked.length > 0) return;

    syncFromServer(serverCategories);
  }, [dashboard?.categories, dashboardId, hasChanges, linked.length, syncFromServer]);

  useEffect(() => {
    if (!awaitingParentSyncRef.current) return;

    const serverSignature = toSignature(dashboard?.categories ?? []);
    if (serverSignature === savedBaselineRef.current) {
      awaitingParentSyncRef.current = false;
    }
  }, [dashboard?.categories]);

  const available = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allCategories.filter((category) => {
      if (isLinked(linked, category)) return false;
      if (!term) return true;
      return category.name.toLowerCase().includes(term);
    });
  }, [allCategories, linked, search]);

  const availableCategoryIds = useMemo(
    () => [...new Set(available.map((category) => getCategoryId(category)).filter(Boolean))],
    [available]
  );

  const categoryUsageQueries = useQueries({
    queries: availableCategoryIds.map((categoryId) => ({
      queryKey: categoryDashboardsQueryKey(categoryId),
      queryFn: () => handleListDashboardsByCategory(userToken, categoryId),
      enabled: !!userToken && !!categoryId,
      staleTime: 30_000,
    })),
  });

  const getCategoryUsageState = useCallback(
    (categoryId) => {
      const index = availableCategoryIds.findIndex(
        (id) => String(id) === String(categoryId)
      );
      if (index === -1) {
        return { isLoading: false, dashboards: [] };
      }

      const query = categoryUsageQueries[index];
      return {
        isLoading: Boolean(query?.isLoading || query?.isFetching),
        dashboards: query?.data?.dashboards ?? [],
      };
    },
    [availableCategoryIds, categoryUsageQueries]
  );

  const invalidateTags = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY });
    await queryClient.invalidateQueries({ queryKey: ['categoryDashboards'] });
  }, [queryClient]);

  const fetchCategoryDashboards = useCallback(
    async (categoryId) => {
      const cached = queryClient.getQueryData(categoryDashboardsQueryKey(categoryId));
      if (cached?.dashboards) return cached.dashboards;

      const data = await handleListDashboardsByCategory(userToken, categoryId);
      queryClient.setQueryData(categoryDashboardsQueryKey(categoryId), data);
      return data.dashboards ?? [];
    },
    [queryClient, userToken]
  );

  const link = useCallback((category) => {
    setLinked((prev) => (isLinked(prev, category) ? prev : [...prev, category]));
  }, []);

  const unlink = useCallback((category) => {
    setLinked((prev) =>
      prev.filter((item) => {
        const categoryId = getCategoryId(category);
        const itemId = getCategoryId(item);
        if (categoryId) return itemId !== categoryId;
        return String(item.name).toLowerCase() !== String(category.name).toLowerCase();
      })
    );
  }, []);

  const findCategoryByName = useCallback(
    (name) =>
      allCategories.find(
        (category) => category.name.toLowerCase() === name.trim().toLowerCase()
      ),
    [allCategories]
  );

  const createFromSearch = useCallback(async () => {
    const trimmed = search.trim();
    if (!trimmed || findCategoryByName(trimmed)) {
      setSearch('');
      return;
    }

    setIsCreating(true);
    try {
      await handleCreateDashboardCategory(userToken, trimmed);
      setSearch('');
      await invalidateTags();
    } finally {
      setIsCreating(false);
    }
  }, [search, findCategoryByName, userToken, invalidateTags]);

  const createAndLinkFromSearch = useCallback(async () => {
    const trimmed = search.trim();
    if (!trimmed) return;

    const existing = findCategoryByName(trimmed);
    if (existing) {
      link(existing);
      setSearch('');
      return;
    }

    setIsCreating(true);
    try {
      const created = await handleCreateDashboardCategory(userToken, trimmed);
      link(created);
      setSearch('');
      await invalidateTags();
    } finally {
      setIsCreating(false);
    }
  }, [search, findCategoryByName, link, userToken, invalidateTags]);

  const save = useCallback(async () => {
    if (!dashboardId || toSignature(linked) === savedBaselineRef.current) return;

    setIsSaving(true);
    try {
      const data = await handleUpdateDashboardCategories(
        dashboardId,
        buildSavePayload(linked),
        userToken
      );
      const persisted = commitPersistedState(normalizeCategories(data));
      awaitingParentSyncRef.current = true;
      setDashboard((prev) => ({ ...prev, categories: persisted }));
      await invalidateTags();
    } finally {
      setIsSaving(false);
    }
  }, [dashboardId, linked, userToken, setDashboard, invalidateTags, commitPersistedState]);

  const startEdit = useCallback((category) => {
    setEditingId(getCategoryId(category));
    setEditName(category.name);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditName('');
  }, []);

  const confirmEdit = useCallback(async () => {
    const trimmed = editName.trim();
    const categoryId = editingId;
    if (!categoryId || !trimmed) return;

    const updated = await handleUpdateDashboardCategory(userToken, categoryId, trimmed);

    setLinked((prev) =>
      prev.map((item) => (getCategoryId(item) === categoryId ? updated : item))
    );
    setDashboard((prev) => ({
      ...prev,
      categories: (prev.categories ?? []).map((item) =>
        getCategoryId(item) === categoryId ? updated : item
      ),
    }));
    cancelEdit();
    await invalidateTags();
  }, [editingId, editName, userToken, setDashboard, cancelEdit, invalidateTags]);

  const canDeleteCategoryTag = useCallback(
    (category) => {
      const categoryId = getCategoryId(category);
      if (!categoryId) return false;

      const { isLoading, dashboards } = getCategoryUsageState(categoryId);
      if (isLoading) return false;

      const catalogCategory =
        allCategories.find((item) => getCategoryId(item) === categoryId) ?? category;

      return canDeleteCategory(catalogCategory, {
        linked,
        savedCategories: dashboard?.categories ?? [],
        linkedDashboards: dashboards,
      });
    },
    [allCategories, linked, dashboard?.categories, getCategoryUsageState]
  );

  const removeCategory = useCallback(
    async (category) => {
      const categoryId = getCategoryId(category);
      if (!categoryId) return;

      const catalogCategory =
        allCategories.find((item) => getCategoryId(item) === categoryId) ?? category;

      let linkedDashboards = [];
      try {
        linkedDashboards = await fetchCategoryDashboards(categoryId);
      } catch (error) {
        dispatch(
          pushNotification({
            msg: error?.message || 'No se pudo verificar el uso de la etiqueta.',
            status: 'err',
          })
        );
        return;
      }

      if (
        !canDeleteCategory(catalogCategory, {
          linked,
          savedCategories: dashboard?.categories ?? [],
          linkedDashboards,
        })
      ) {
        dispatch(pushNotification({ msg: CATEGORY_DELETE_BLOCKED_MSG, status: 'warn' }));
        return;
      }

      try {
        await handleDeleteDashboardCategory(userToken, categoryId);

        const nextLinked = linked.filter((item) => getCategoryId(item) !== categoryId);
        commitPersistedState(nextLinked);
        awaitingParentSyncRef.current = true;

        setDashboard((prev) => ({
          ...prev,
          categories: (prev.categories ?? []).filter(
            (item) => getCategoryId(item) !== categoryId
          ),
        }));

        if (editingId === categoryId) cancelEdit();
        await invalidateTags();
      } catch (error) {
        dispatch(
          pushNotification({
            msg: error?.message || 'No se pudo eliminar la etiqueta.',
            status: 'err',
          })
        );
      }
    },
    [
      userToken,
      linked,
      allCategories,
      dashboard?.categories,
      setDashboard,
      editingId,
      cancelEdit,
      invalidateTags,
      commitPersistedState,
      dispatch,
      fetchCategoryDashboards,
    ]
  );

  return {
    linked,
    search,
    setSearch,
    available,
    allCategories,
    isLoading,
    isSaving,
    isCreating,
    hasChanges,
    editingId,
    editName,
    setEditName,
    link,
    unlink,
    createFromSearch,
    createAndLinkFromSearch,
    save,
    startEdit,
    cancelEdit,
    confirmEdit,
    removeCategory,
    canDeleteCategoryTag,
    categoryDeleteBlockedMsg: CATEGORY_DELETE_BLOCKED_MSG,
  };
};
