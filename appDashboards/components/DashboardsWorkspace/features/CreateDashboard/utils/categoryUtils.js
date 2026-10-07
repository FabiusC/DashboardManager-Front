export const buildCategoryPayload = (selected = [], categories = []) => {
  const category_ids = [];
  const category_names = [];

  selected.forEach((name) => {
    const existing = categories.find((category) => category.name === name);
    if (existing) category_ids.push(existing.id);
    else category_names.push(name);
  });

  return { category_ids, category_names };
};
