/* 
Name: reducers of organization var
Action: reducers of organization var
*/

import { SET_ENABLE_ACTIONS, CLEAR_ENABLE_ACTIONS } from '../actions/types';

export default function actionReducer(state = [], action) {
	switch (action.type) {
		case SET_ENABLE_ACTIONS:
			return action.payload;
		case CLEAR_ENABLE_ACTIONS:
			return [];
		default:
			return state;
	}
};