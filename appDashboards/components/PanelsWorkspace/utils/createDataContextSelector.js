import { createContext } from "use-context-selector";
import { useReducer, useMemo } from "react";


export default (reducer, actions, initialState) => {
  const Context = createContext(null);

  const Provider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    const boundActions = useMemo(() => {
      const obj = {};
      for (const key in actions) {
        obj[key] = actions[key](dispatch);
      }
      return obj;
    }, [dispatch]);

    const value = useMemo(
      () => ({
        state,
        ...boundActions,
      }),
      [state, boundActions]
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
  };

  return { Context, Provider };
};
