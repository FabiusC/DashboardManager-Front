import { ADD_DIMENSION_OBJECT, REPLACE_DIMENSION_OBJECT, RESTAURE_DEFAULT_OBJECT } from '../actions/types';

export default function dimensionReducer(state = {}, action) {
    switch (action.type) {
        case ADD_DIMENSION_OBJECT:
            return { ...action.payload };
        case REPLACE_DIMENSION_OBJECT:
            return { ...action.payload };
        case RESTAURE_DEFAULT_OBJECT:
            return {
                "width": null,
                "height": null,
                "orientation": null
            };
        default:
            return state;
    }
}