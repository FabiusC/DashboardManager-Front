import { SET_APP_ID, CLEAR_APP_ID } from '../actions/types';

/**
 * Reducer para manejar el app_id
 * El app_id viene de los query params y se usa para identificar la aplicación
 * Estado: state.app.id
 */
const initialState = {
    id: null
};

const appIdReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_APP_ID:
            return {
                id: action.payload
            };
        
        case CLEAR_APP_ID:
            return {
                id: null
            };
        
        default:
            return state;
    }
};

export default appIdReducer;

