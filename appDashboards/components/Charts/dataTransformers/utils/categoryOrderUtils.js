export const normalizeCategoryValue = (value) =>
  String(value ?? "")
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const isKnownSeries = (values, getOrder) => {
  if (!Array.isArray(values) || typeof getOrder !== "function") return false;

  const uniqueValues = [...new Set(values.filter(Boolean))];
  return (
    uniqueValues.length > 0 &&
    uniqueValues.every((value) => getOrder(value) !== null)
  );
};

export const sortByKnownOrder = (
  items,
  getValue,
  getOrder
) => {
  if (
    !Array.isArray(items) ||
    typeof getValue !== "function" ||
    typeof getOrder !== "function"
  ) {
    return items;
  }

  const values = items.map(getValue);
  if (!isKnownSeries(values, getOrder)) return items;

  return [...items].sort(
    (a, b) => getOrder(getValue(a)) - getOrder(getValue(b))
  );
};

export const sortByKnownOrders = (
  items,
  getValue,
  orderDefinitions
) => {
  if (
    !Array.isArray(items) ||
    typeof getValue !== "function" ||
    !Array.isArray(orderDefinitions)
  ) {
    return items;
  }

  const values = items.map(getValue);
  const orderDefinition = orderDefinitions.find(
    ({ getOrder }) =>
      typeof getOrder === "function" && isKnownSeries(values, getOrder)
  );

  if (!orderDefinition) return items;

  return [...items].sort(
    (a, b) =>
      orderDefinition.getOrder(getValue(a)) -
      orderDefinition.getOrder(getValue(b))
  );
};

export const MONTH_ORDER = Object.freeze({
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
});

export const normalizeMonth = normalizeCategoryValue;

export const getMonthOrder = (value) =>
  MONTH_ORDER[normalizeMonth(value)] ?? null;

export const isMonthSeries = (values) =>
  isKnownSeries(values, getMonthOrder);

export const sortByMonthOrder = (items, getValue = (item) => item) =>
  sortByKnownOrder(items, getValue, getMonthOrder);

export const DAY_ORDER = Object.freeze({
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  domingo: 7,
});

export const normalizeDay = normalizeCategoryValue;

export const getDayOrder = (value) =>
  DAY_ORDER[normalizeDay(value)] ?? null;

export const isDaySeries = (values) =>
  isKnownSeries(values, getDayOrder);

export const sortByDayOrder = (items, getValue = (item) => item) =>
  sortByKnownOrder(items, getValue, getDayOrder);

export const CALENDAR_ORDER_DEFINITIONS = Object.freeze([
  { getOrder: getMonthOrder },
  { getOrder: getDayOrder },
]);

export const sortByCalendarOrder = (items, getValue = (item) => item) =>
  sortByKnownOrders(items, getValue, CALENDAR_ORDER_DEFINITIONS);
