/* 
Name: localStorage
Action:
*/

const APP_NAMESPACE = 'dashboard';

// Estado inicial mínimo para filters (debe coincidir con filtersReducer)
const defaultFiltersState = {
  groups: {
    "root": {
      id: "root",
      operator: "AND",
      children: [],
      parentId: null,
      uiContext_id: "root",
      acceptsSubgroups: true,
      allowMultipleRules: true,
      isCoupled: false
    }
  },
  rules: {},
  runtime: {
    applyVersion: 0
  }
};

export const loadState = () => {
    try {
        if (typeof window === "undefined") return undefined; 
        const serializedSession = sessionStorage.getItem(`reduxState:${APP_NAMESPACE}`);
        const serializedLocal = localStorage.getItem(`reduxState:${APP_NAMESPACE}`);
        
        if (!serializedSession && !serializedLocal)  {
            return undefined;
        }
        
        let parsedState = serializedSession ? JSON.parse(serializedSession) : JSON.parse(serializedLocal);

        // Asegurar que filters siempre tenga su estructura inicial
        if (!parsedState.filters || !parsedState.filters.groups || !parsedState.filters.groups.root) {
            parsedState.filters = defaultFiltersState;
        } else {
            // runtime de filtros nunca debe persistirse
            parsedState.filters.runtime = defaultFiltersState.runtime;
        }
        // Remove microservice from persisted state to always fetch on reload
        if (serializedLocal.microservice) {
            delete serializedLocal.microservice;
        }
        
        return parsedState;
    } catch (error) {
        return undefined;
    }
};

export const saveState = (state) => {
    try {
        if (typeof window === "undefined") return;
        // Create a copy of state
        const stateToSaveSession = { 
            ...state,
            microservice: state.microservice, 
            app: state.app, 
            user: state.user 
        };

        // runtime de filtros nunca debe persistirse
        if (stateToSaveSession.filters && stateToSaveSession.filters.runtime) {
            stateToSaveSession.filters = { ...stateToSaveSession.filters };
            delete stateToSaveSession.filters.runtime;
        }

        const stateToSaveLocal = { ...stateToSaveSession };

        sessionStorage.setItem(`reduxState:${APP_NAMESPACE}`, JSON.stringify(stateToSaveSession)); 
        localStorage.setItem(`reduxState:${APP_NAMESPACE}`, JSON.stringify(stateToSaveLocal)); 
    } catch (error) {
        // Ignore write errors.
    }
};