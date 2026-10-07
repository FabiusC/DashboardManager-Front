/* 
Name: reducers of organization var
Action: reducers of organization var
*/

import { ADD_ORGANIZATION, REMOVE_ORGANIZATION } from '../actions/types';

export default function organizationReducer(state = [], action) {
	switch (action.type) {
		case ADD_ORGANIZATION:
			return [...action.payload];
		case REMOVE_ORGANIZATION: 
			return []
		default:
			return state;
	}
};