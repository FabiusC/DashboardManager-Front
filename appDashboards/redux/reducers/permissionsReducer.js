/* 
Name: reducers of permissions var
Action: reducers of permissions var
*/

import { ADD_PERMISSIONS, REMOVE_PERMISSIONS } from '../actions/types';

export default function permissionsReducer(state = [], action) {
	switch (action.type) {
		case ADD_PERMISSIONS:
			return [...action.payload];
		case REMOVE_PERMISSIONS:
			return [];
		default:
			return state;
	}
};