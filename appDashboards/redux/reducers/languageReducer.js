/* 
Name: group of customQuery var
Action: group of customQuery var
*/

export default function languageReducer(state = "es", action) {
    switch (action.type) {
        case 'SET_LANGUAGE':
          return action.payload;
        default:
          return state;
      }
}
