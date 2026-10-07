/* 
Name: reducers
Action: all reducers
*/

import { combineReducers } from 'redux';
import userReducer from './userReducer';
import permissionsReducer from './permissionsReducer';
import notificationReducer from './notificationReducer';
import organizationReducer from './organizationReducer';
import actionReducer from './actionReducer';
import dimensionReducer from './dimensionReducer';
import barReducer from './barReducer';
import languageReducer from './languageReducer';
import filtersReducer from './filtersReducer';
import appIdReducer from './appIdReducer';
import microserviceReducer from './microserviceReducer';

export default combineReducers({
    notifications: notificationReducer,
    user: userReducer,
    permissions: permissionsReducer,
    organization: organizationReducer,
    actions: actionReducer,
    dimensions: dimensionReducer,
    bar: barReducer,
    language: languageReducer,
    filters: filtersReducer,
    app: appIdReducer,
    microservice: microserviceReducer
});