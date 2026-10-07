import { CLEAR_NOTIFICATIONS, PUSH_NOTIFICATION, REMOVE_NOTIFICATION } from "../actions/types";

export default function notificationReducer(state = [], action) {
    switch (action.type) {
        case PUSH_NOTIFICATION:
            if (state.length >= 10) {
                return [...state.slice(1), action.payload]
            }
            return [...state, action.payload]
        case REMOVE_NOTIFICATION:
            let copyState = Object.assign([], state);
            copyState.splice(0, 1);
            return copyState
        case CLEAR_NOTIFICATIONS:
            return []
        default:
            return state;
    }
}