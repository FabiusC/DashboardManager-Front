/* 
Name: reducers of user var
Action: reducers of user var
*/

import { ADD_USERINFO, REMOVE_USERINFO } from '../actions/types';

export default function userReducer(state = [], action) {
    switch (action.type) {
        case ADD_USERINFO:
            return [action.payload];
        case REMOVE_USERINFO:
            return [];
        default:
            return state;
    }
};