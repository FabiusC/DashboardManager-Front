import createDataContext from "../utils/createDataContext";

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_LAYOUTS":
      return { ...state, layouts: action.payload };

    case "UPDATE_LAYOUT":
      return {
        ...state,
        layouts: {
          ...state.layouts,
          [action.payload.breakpoint]: action.payload.layout,
        },
      };

    case "SET_FLAG":
      return {
        ...state,
        globalState: {
          ...state.globalState,
          [action.payload.key]: action.payload.value,
        },
      };

    default:
      return state;
  }
};

const setLayouts = (d) => (layouts) => d({ type: "SET_LAYOUTS", payload: layouts });
const updateLayout = (d) => (breakpoint, layout) => d({ type: "UPDATE_LAYOUT", payload: { breakpoint, layout } });
const setFlag = (d) => (key, value) => d({ type: "SET_FLAG", payload: { key, value } });

const initialState = {
  layouts: { lg: [] },
  globalState: {
    isLoading: false,
    hasFields: false,
    dataError: false,
    fieldConfigurationError: false,
    hasChartType: false,
    isLoadingData: true,
    isLoadingFieldsDistribution: false,
  },
};

export const { Context: GeneralContext, Provider: GeneralProvider } =
  createDataContext(
    reducer,
    { setLayouts, updateLayout, setFlag },
    initialState
  );
