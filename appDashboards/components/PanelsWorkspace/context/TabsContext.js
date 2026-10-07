import createDataContext from '../utils/createDataContext';

const initialState = {
  tabsSideMenu:  [], 
  tabsSetupMenu: [],
};

const tabsReducer = (state, action) => {
  switch (action.type) {
    case 'SET_SIDE_TAB_STATE':
      const { name: sideName, key: sideKey, value: sideValue } = action.payload;
      
      // Solo para la tab "publication": cuando se activa, cerrar todas las demás
      if (sideKey === 'isActive' && sideValue === true && sideName === 'publication') {
        return {
          ...state,
          tabsSideMenu: state.tabsSideMenu.map(tab =>
            tab.name === sideName
              ? {
                  ...tab,
                  state: { ...tab.state, [sideKey]: sideValue },
                }
              : {
                  ...tab,
                  state: { ...tab.state, isActive: false },
                }
          ),
          // También cerrar todas las tabs del setupMenu
          tabsSetupMenu: state.tabsSetupMenu.map(tab => ({
            ...tab,
            state: { ...tab.state, isActive: false },
          })),
        };
      }
      
      // Si se activa cualquier otra tab y "publication" está abierta, cerrar "publication"
      if (sideKey === 'isActive' && sideValue === true && sideName !== 'publication') {
        return {
          ...state,
          tabsSideMenu: state.tabsSideMenu.map(tab =>
            tab.name === sideName
              ? {
                  ...tab,
                  state: { ...tab.state, [sideKey]: sideValue },
                }
              : tab.name === 'publication'
              ? {
                  ...tab,
                  state: { ...tab.state, isActive: false },
                }
              : tab
          ),
        };
      }
      
      // Para otros cambios de estado, comportamiento normal
      return {
        ...state,
        tabsSideMenu: state.tabsSideMenu.map(tab =>
          tab.name === sideName
            ? {
                ...tab,
                state: { ...tab.state, [sideKey]: sideValue },
              }
            : tab
        ),
      };

    case 'SET_SETUP_TAB_STATE':
      const { name: setupName, key: setupKey, value: setupValue } = action.payload;
      
      if (setupKey === 'isActive' && setupValue === true) {
        return {
          ...state,
          tabsSetupMenu: state.tabsSetupMenu.map(tab =>
            tab.name === setupName
              ? {
                  ...tab,
                  state: { ...tab.state, [setupKey]: setupValue },
                }
              : {
                  ...tab,
                  state: { ...tab.state, isActive: false },
                }
          ),
        };
      }
      
      // Para otros cambios de estado, comportamiento normal
      return {
        ...state,
        tabsSetupMenu: state.tabsSetupMenu.map(tab =>
          tab.name === setupName
            ? {
                ...tab,
                state: { ...tab.state, [setupKey]: setupValue },
              }
            : tab
        ),
      };

    case 'INIT_TABS':
      return {
        ...state,
        tabsSideMenu:  action.payload.tabsSideMenu  ?? [],
        tabsSetupMenu: action.payload.tabsSetupMenu ?? [],
      };

    default:
      return state;
  }
};

const changeSideTabState =
  dispatch =>
  (name, key, value) =>
    dispatch({ type: 'SET_SIDE_TAB_STATE', payload: { name, key, value } });

const changeSetupTabState =
  dispatch =>
  (name, key, value) =>
    dispatch({ type: 'SET_SETUP_TAB_STATE', payload: { name, key, value } });

const initTabs =
  dispatch =>
  (tabsSideMenu, tabsSetupMenu) =>
    dispatch({
      type: 'INIT_TABS',
      payload: { tabsSideMenu, tabsSetupMenu },
    });

export const {
  Context: TabsContext,
  Provider: TabsProvider,
} = createDataContext(
  tabsReducer,
  { initTabs, changeSideTabState, changeSetupTabState },
  initialState
);