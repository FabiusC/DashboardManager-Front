/* 
Name: initDispatch
Action: 
*/


import { lateralBarOptions } from '../source/appModules';

export const addModules = () => {
	let auxDisplayOptions = Object.assign([], lateralBarOptions);
	let generalObject = {}
	let auxOpenDisplayOptions = {}
	auxDisplayOptions.map((eachOp, index) => {
		if (eachOp?.subOptions != undefined && eachOp.subOptions.length != 0) {
			let generalSubOptions = {}
			generalSubOptions["state"] = false
			let auxSubOptionsObj = {}
			eachOp.subOptions.map((anotherEach) => {
				auxSubOptionsObj[anotherEach.id] = false
			})
			generalSubOptions["sub"] = auxSubOptionsObj
			auxOpenDisplayOptions[eachOp.id] = generalSubOptions
		} else {
			auxOpenDisplayOptions[eachOp.id] = ""
		}
	})
	generalObject["openBar"] = false
	generalObject["modules"] = auxOpenDisplayOptions
	generalObject["selectedOptionBar"] = ""
	return (dispatch) => {
		dispatch({
			type: 'STATE_MAIN_BAR',
			payload: generalObject
		})
	};
};
