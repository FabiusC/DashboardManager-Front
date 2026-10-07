import createDataContext from '../utils/createDataContext';

const initialState = {
  tabsSideMenu: [],
  dashboardTabs: [],
  selectedDashboardId: null,
};

const dashboardTabsReducer = (state, action) => {
  switch (action.type) {
    case 'SET_SIDE_TAB_STATE':
      const { name, key, value } = action.payload;
      return {
        ...state,
        tabsSideMenu: state.tabsSideMenu.map(tab =>
          tab.name === name
            ? {
              ...tab,
              state: { ...tab.state, [key]: value },
            }
            : tab
        ),
      };

    case 'INIT_TABS':
      return {
        ...state,
        tabsSideMenu: action.payload.tabsSideMenu ?? [],
      };

    case 'SET_DASHBOARD_TABS':
      return {
        ...state,
        dashboardTabs: action.payload.dashboardTabs ?? [],
      };

    case 'SELECT_DASHBOARD':
      return {
        ...state,
        selectedDashboardId: action.payload.dashboardId ?? null,
      };

    default:
      return state;
  }
};

const changeSideTabState =
  dispatch =>
    (name, key, value) =>
      dispatch({ type: 'SET_SIDE_TAB_STATE', payload: { name, key, value } });

const initTabs =
  dispatch =>
    (tabsSideMenu) =>
      dispatch({
        type: 'INIT_TABS',
        payload: { tabsSideMenu },
      });

const setDashboardTabs =
  dispatch =>
    (dashboardTabs) =>
      dispatch({
        type: 'SET_DASHBOARD_TABS',
        payload: { dashboardTabs },
      });

const selectDashboard =
  dispatch =>
    (dashboardId) =>
      dispatch({
        type: 'SELECT_DASHBOARD',
        payload: { dashboardId },
      });

export const {
  Context: DashboardTabsContext,
  Provider: DashboardTabsProvider,
} = createDataContext(
  dashboardTabsReducer,
  { initTabs, changeSideTabState, setDashboardTabs, selectDashboard },
  initialState
); 