export function normalizeDepartmentCode(value) {
  if (value == null || value === '') return null;
  return String(value).padStart(2, '0');
}

export function resolveDepartmentCode(value, features = []) {
  if (value == null || value === '') return null;

  const raw = String(value).trim();
  const normalized = normalizeDepartmentCode(raw);

  if (features.some((feature) => feature.properties?.DPTO === normalized)) {
    return normalized;
  }

  const lower = raw.toLowerCase();
  const match = features.find(
    (feature) => String(feature.properties?.NOMBRE_DPT || '').toLowerCase() === lower,
  );

  return match?.properties?.DPTO ?? null;
}

export function getDepartmentCodesFromFilters(rules, features = [], excludeFields = []) {
  if (!rules || typeof rules !== 'object') return [];

  const excluded = new Set(excludeFields.filter(Boolean).map(String));

  const codes = Object.values(rules)
    .filter((rule) => rule?.operator === 'EQUALS' && !excluded.has(String(rule.field)))
    .map((rule) => resolveDepartmentCode(rule.value, features))
    .filter(Boolean);

  return [...new Set(codes)];
}
