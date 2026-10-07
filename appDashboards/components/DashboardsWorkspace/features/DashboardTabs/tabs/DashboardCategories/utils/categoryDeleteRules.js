const getCategoryId = (item) => item?.id ?? item?.category_id;

const isSameCategory = (a, b) => {
  const aId = getCategoryId(a);
  const bId = getCategoryId(b);
  if (aId && bId) return String(aId) === String(bId);
  return String(a?.name ?? '').toLowerCase() === String(b?.name ?? '').toLowerCase();
};

const isLinkedTo = (categories, category) =>
  (categories ?? []).some((item) => isSameCategory(item, category));

export const CATEGORY_DELETE_BLOCKED_MSG =
  'Debes desvincular esta etiqueta de todos los tableros que la usan antes de eliminarla.';

export const canDeleteCategory = (
  category,
  { linked = [], savedCategories = [], linkedDashboards = [] } = {}
) => {
  if (!category) return false;

  if (isLinkedTo(linked, category) || isLinkedTo(savedCategories, category)) {
    return false;
  }

  if (linkedDashboards.length > 0) {
    return false;
  }

  return true;
};
