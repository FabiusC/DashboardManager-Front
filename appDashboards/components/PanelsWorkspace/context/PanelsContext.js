// context/PanelContext.js
import createDataContext from "../utils/createDataContext";

/* ───────── Estado inicial ────── */
const initialState = {
  panel: {
    id: null,
    width: 3,
    height: 12,
  },
  setUp: {
    current: {},
    changed: {},
  },
};

/* ──────── Helper de parsing ───── */
const parsePanelPayload = (raw) => {
  const {
    setUp,
    components,
    setUpChanged,
    functions,
    liveChartProps,
    ...general
  } = raw;

  return {
    panel: general,
    setUp: {
      current: setUp || {},
      changed: setUpChanged || {},
      components: components || [],

    },
  };
};

/* ───────── Reducer ──────────── */
const reducer = (state, action) => {
  switch (action.type) {
    case "INIT_PANEL":
      return {
        panel: { ...state.panel, ...action.payload.panel },
        setUp: {
          current: { ...state.setUp.current, ...action.payload.setUp.current },
          changed: { ...state.setUp.changed, ...action.payload.setUp.changed },
          components: { ...state.setUp.changed, ...action.payload.setUp.components },
        },
      };
    case "SET_PANEL_FIELD":
      return {
        ...state,
        panel: { ...state.panel, ...action.payload },
      };
    case "SET_SETUP":
      return {
        ...state,
        setUp: { ...state.setUp, current: action.payload },
      };

    case "SET_SETUP_CHANGED":
      return {
        ...state,
        setUp: { ...state.setUp, changed: action.payload },
      };

    case "SET_DIMENSION":
      return {
        ...state,
        panel: { ...state.panel, [action.payload.key]: action.payload.value },
      };

    default:
      return state;
  }
};

/* ───────── Dispatchers ───────── */
const initPanel = (d) => (rawPanel) =>
  d({ type: "INIT_PANEL", payload: parsePanelPayload(rawPanel) });

const setSetUp = (d) => (setUp) =>
  d({ type: "SET_SETUP", payload: setUp });

const setSetUpChanged = (d) => (changes) =>
  d({ type: "SET_SETUP_CHANGED", payload: changes });

const setDimension = (d) => (key, value) =>
  d({ type: "SET_DIMENSION", payload: { key, value } });

const setPanelField = (d) => (fields) =>
  d({ type: "SET_PANEL_FIELD", payload: fields });
/* ───────── Exportación ───────── */
export const { Context: PanelsContext, Provider: PanelsProvider } =
  createDataContext(
    reducer,
    { initPanel, setSetUp, setSetUpChanged, setDimension , setPanelField},
    initialState
  );
