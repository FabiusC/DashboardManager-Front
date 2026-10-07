/* 
Name: microserviceReducer
Action: reducer for microservice data
*/

import {
    SET_APPLICATION_SERVICES,
    CLEAR_APPLICATION_SERVICES
} from '../actions/types';

const initialState = [];

export default function microserviceReducer(state = initialState, action) {
    switch (action.type) {
        case SET_APPLICATION_SERVICES:
            return action.payload || [];
        case CLEAR_APPLICATION_SERVICES:
            return [];
        default:
            return state;
    }
};
