/* 
Name: store
Action:
*/

import thunk from 'redux-thunk';
import logger from 'redux-logger';
import { createStore, applyMiddleware } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import rootReducers from "./reducers";
import { loadState, saveState } from './sessionStorage';


const persistedState = loadState()

const isDevelopment = process.env.NODE_ENV === 'development'

const middleware =
    isDevelopment
        ? applyMiddleware(thunk, logger)
        : applyMiddleware(thunk)

const enhancer =
    isDevelopment
        ? composeWithDevTools(middleware)
        : middleware

export const store = createStore(
    rootReducers,
    persistedState,
    enhancer
)
store.subscribe(() => {
    saveState(store.getState());
});

if (typeof window !== 'undefined') {
    window.__REDUX_STORE__ = store;
}

export default store;