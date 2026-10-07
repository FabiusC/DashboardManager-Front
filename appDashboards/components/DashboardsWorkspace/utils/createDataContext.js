import React, { createContext, useReducer, useMemo } from 'react';

export default (reducer, actions, initialState) => {
  const Context = createContext();
  const Provider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    // "Vincula" cada acción para que reciba dispatch
    const boundActions = useMemo(() => {
      const actionsObj = {};
      for (let key in actions) {
        actionsObj[key] = actions[key](dispatch);
      }
      return actionsObj;
    }, [dispatch]);

    const value = useMemo(
      () => ({ state, ...boundActions }),
      [state, boundActions]
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
  };

  return { Context, Provider };
}; 