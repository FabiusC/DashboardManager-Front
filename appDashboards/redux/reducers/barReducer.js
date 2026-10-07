/* 
Name: barReducer
Action: state of main bar: open or close
*/

import { STATE_MAIN_BAR, CLEAR_STATE_MAIN_BAR, SET_SELECTED_OPTION, SET_DASHBOARD_LOADING } from '../actions/types';

export default function barReducer(state = {"openBar": false, modules: {}, selectedOptionBar: "home", dashboardLoading: false}, action) {
	switch (action.type) {
		case STATE_MAIN_BAR:
			return { ...state, ...action.payload };
		case CLEAR_STATE_MAIN_BAR:
			return state;
		case SET_SELECTED_OPTION:
			return { ...state, selectedOptionBar: action.payload };
		case SET_DASHBOARD_LOADING:
			return { ...state, dashboardLoading: !!action.payload };
		default:
			return state;
	}
};