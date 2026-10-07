import createDataContext from '../utils/createDataContext';


const initialState = {
  openCreateModal: false,
  openDeleteFieldModal: false,
  openCreateFieldModal: false,
};

const modalsReducer = (state, action) => {
  switch (action.type) {
    case 'OPEN_MODAL':
      return { ...state, [action.payload]: true };
    case 'CLOSE_MODAL':
      return { ...state, [action.payload]: false };
    default:
      return state;
  }
};


const openModal  = dispatch => key => dispatch({ type: 'OPEN_MODAL',  payload: key });
const closeModal = dispatch => key => dispatch({ type: 'CLOSE_MODAL', payload: key });


export const {  Context: ModalsContext, Provider: ModalsProvider } = createDataContext(
  modalsReducer,
  { openModal, closeModal },
  initialState
);
