import createDataContext from '../utils/createDataContext';

const initialState = {
  tabsSideMenu: [],
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

export const {
  Context: DashboardTabsContext,
  Provider: DashboardTabsProvider,
} = createDataContext(
  dashboardTabsReducer,
  { initTabs, changeSideTabState },
  initialState
); 