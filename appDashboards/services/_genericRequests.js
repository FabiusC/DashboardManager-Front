import axios from 'axios'
import { ResponseAPIAdapter } from '../adapters/responseAPIAdapter'
import { getCurrentStore } from '../helpers/redux/store';
import { pushNotification } from '@redux/actions';

axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'

const GENERIC_ERROR_MSG = "some error happens during request";
const GENERIC_SUCCESS_MSG = "success in request";
const BAD_PAYLOAD_FORMAT_ERROR_MSG = "bad payload format";
const GENERIC_FORM_HEADERS = {
    "Content-Type": "multipart/form-data"
};
const GENERIC_CORS_HEADER = {
    "Access-Control-Allow-Origin": "*",
};

const responseAPIAdapter = new ResponseAPIAdapter();

// Generador de dispatch que usa el store actual
const getDispatch = () => {
    try {
        return getCurrentStore().dispatch;
    } catch (error) {
        console.warn('Could not get dispatch from store:', error);
        return null;
    }
};

const handleError = (resolve, error, errorMsg = GENERIC_ERROR_MSG) => {
    try {
        if (error.response?.data) {
            let [isValid, validResponse] = responseAPIAdapter.checkResponse(error.response["data"]);
            if (!isValid) {
                resolve({ "msg": validResponse[""], "status": "err", "data": {} });
            }
            resolve({"msg": validResponse?.msg, "status": "err", "data": validResponse.data });
        } else {
            let [isValid, validResponse] = responseAPIAdapter.checkResponse(error.response)
            if (!isValid) {
                resolve({ "msg": validResponse[""], "status": "err", "data": {} });
            }
            resolve({"msg": validResponse.data.msg, "status": "err", "data": {} });
        }
    } catch (error) {
        resolve({ "msg": errorMsg, "status": "err", "data": {} });
    }
}

function getRequestGeneric(url, params = {}, headers = {}, enableNotification = false, nameMessage = "entity") {
    return new Promise((resolve, reject) => {
        axios.get(url, { headers: { ...headers },
            params: { ...params } })
            .then(response => {
                if (response.status === 200 || response.status === 201) {
                    let [isValid, validResponse] = responseAPIAdapter.checkResponse(response["data"]);
                    let responsePayloadMessage = (typeof(validResponse)== "object" && (validResponse.hasOwnProperty("msg") || validResponse.hasOwnProperty("message")) ) 
                    ? validResponse.msg || validResponse.message
                    : GENERIC_SUCCESS_MSG;
                    if (!isValid) {
                        if (enableNotification) {
                            const dispatch = getDispatch();
                            if (dispatch) {
                                dispatch(pushNotification({ msg: `La respuesta del servidor para listar los/las ${nameMessage} no ha sido validada`, status: 'err' }));
                            }
                        }
                        resolve({ "msg": BAD_PAYLOAD_FORMAT_ERROR_MSG, "status": "err", "data": {} });
                    } else {
                        if (enableNotification) {
                            const dispatch = getDispatch();
                            if (dispatch) {
                                dispatch(pushNotification({ msg: responsePayloadMessage, status: 'ok' }));
                            }
                        }
                        let responsePayloadParsed = responseAPIAdapter.adapt(validResponse);
                        resolve(responsePayloadParsed);
                    }
                } else {
                    try {
                        let json_object = { ...response.data };
                        if (json_object.hasOwnProperty("status") && json_object.hasOwnProperty("msg")) {
                            resolve(json_object)
                        } else {
                            resolve({ "msg": GENERIC_ERROR_MSG, "status": "err", "data": {} });
                        }
                    } catch {
                        handleError(resolve, error)
                    }
                }
            })
            .catch(error => {
                handleError(resolve, error); 
                reject(error);
            });
    });
}

async function postRequestGeneric(url, dataPost, headers = {}, enableNotification = false, nameMessage = "entity") {
    const response = await new Promise(resolve => {
        axios.post(url, dataPost, { headers }).
            then(response => {
                if (response.status === 200 || response.status === 201) {
                    let [isValid, validResponse] = responseAPIAdapter.checkResponse(response["data"]);
                    let responsePayloadMessage = (typeof(validResponse)== "object" && (validResponse.hasOwnProperty("msg") || validResponse.hasOwnProperty("message")) ) 
                    ? validResponse.msg || validResponse.message
                    : GENERIC_SUCCESS_MSG;
                    if (!isValid) {
                        if (enableNotification) {
                            const dispatch = getDispatch();
                            if (dispatch) {
                                dispatch(pushNotification({ msg: `La respuesta del servidor para crear los/las ${nameMessage} no ha sido validada`, status: 'err' }));
                            }
                        }
                        resolve({ "msg": BAD_PAYLOAD_FORMAT_ERROR_MSG, "status": "err", "data": {} });
                    } else {
                        if (enableNotification) {
                            const dispatch = getDispatch();
                            if (dispatch) {
                                dispatch(pushNotification({ msg: responsePayloadMessage, status: 'ok' }));
                            }
                        }
                        let responsePayloadParsed = responseAPIAdapter.adapt(validResponse);
                        resolve(responsePayloadParsed);
                    }
                } else {
                    try {
                        let json_object = { ...response.data };
                        if (json_object.hasOwnProperty("status") && json_object.hasOwnProperty("msg")) {
                            resolve(json_object)
                        } else {
                            resolve({ "msg": GENERIC_ERROR_MSG, "status": "err", "data": {} });
                        }
                    } catch {
                        handleError(resolve, error)
                    }
                }
            }).catch(
                function (error) {
                    handleError(resolve, error)
                }
            )
    })
    return response;
}

async function putRequestGeneric(url, dataPost, headers = {}, enableNotification = false, nameMessage = "entity") {
    const response = await new Promise(resolve => {
        axios.put(url, dataPost, { headers }).
            then(response => {
                if (response.status === 200 || response.status === 201) {
                    let [isValid, validResponse] = responseAPIAdapter.checkResponse(response["data"]); 
                    let responsePayloadMessage = (typeof(validResponse)== "object" && (validResponse.hasOwnProperty("msg") || validResponse.hasOwnProperty("message")) ) 
                    ? validResponse.msg || validResponse.message
                    : GENERIC_SUCCESS_MSG;
                    if (!isValid) {
                        if (enableNotification) {
                            const dispatch = getDispatch();
                            if (dispatch) {
                                dispatch(pushNotification({ msg: `La respuesta del servidor para actualizar los/las ${nameMessage} no ha sido validada`, status: 'err' }));
                            }
                        }
                        resolve({ "msg": BAD_PAYLOAD_FORMAT_ERROR_MSG, "status": "err", "data": {} });
                    } else {
                        if (enableNotification) {
                            const dispatch = getDispatch();
                            if (dispatch) {
                                dispatch(pushNotification({ msg: responsePayloadMessage, status: 'ok' }));
                            }
                        }
                        let responsePayloadParsed = responseAPIAdapter.adapt(validResponse);
                        resolve(responsePayloadParsed);
                    }
                } else {
                    try {
                        let json_object = { ...response.data };
                        if (json_object.hasOwnProperty("status") && json_object.hasOwnProperty("msg")) {
                            resolve(json_object)
                        } else {
                            resolve({ "msg": GENERIC_ERROR_MSG, "status": "err", "data": {} });
                        }
                    } catch {
                        handleError(resolve, error)
                    }
                }
            }).catch(
                function (error) {
                    handleError(resolve, error)
                }
            )
    })
    return response;
}

async function uploadFileFormRequestGeneric(url, form, headers = { ...GENERIC_FORM_HEADERS }, enableNotification = false, nameMessage = "entity") {
    const response = await new Promise(resolve => {
        axios.post(url, form, {
            "headers": { ...headers }
        }).then(response => {
            if (response.status === 200 || response.status === 201) {
                let [isValid, validResponse] = responseAPIAdapter.checkResponse(response["data"]);
                let responsePayloadMessage = (typeof(validResponse)== "object" && (validResponse.hasOwnProperty("msg") || validResponse.hasOwnProperty("message")) ) 
                ? validResponse.msg || validResponse.message
                : GENERIC_SUCCESS_MSG;
                if (!isValid) {
                    if (enableNotification) {
                        const dispatch = getDispatch();
                        if (dispatch) {
                            dispatch(pushNotification({ msg: `La respuesta del servidor para subir los/las ${nameMessage} no ha sido validada`, status: 'err' }));
                        }
                    }
                    resolve({ "msg": BAD_PAYLOAD_FORMAT_ERROR_MSG, "status": "err", "data": {} });
                } else {
                    if (enableNotification) {
                        const dispatch = getDispatch();
                        if (dispatch) {
                            dispatch(pushNotification({ msg: responsePayloadMessage, status: 'ok' }));
                        }
                    }
                    let responsePayloadParsed = responseAPIAdapter.adapt(validResponse);
                    resolve(responsePayloadParsed);
                }
            } else {
                try {
                    let json_object = { ...response.data };
                    if (json_object.hasOwnProperty("status") && json_object.hasOwnProperty("msg")) {
                        resolve(json_object)
                    } else {
                        resolve({ "msg": GENERIC_ERROR_MSG, "status": "err", "data": {} });
                    }
                } catch {
                    handleError(resolve, error)
                }
            }
        }).catch(
            function (error) {
                handleError(resolve, error)
            }
        )
    })
    return response;
}

async function deleteRequestGeneric(url, data, headers = {}, enableNotification = false, nameMessage = "entity") {
    const response = await new Promise(resolve => {
        axios.delete(url, {
            data,
            headers
        }).then(response => {
            if (response.status === 200 || response.status === 201) {
                let [isValid, validResponse] = responseAPIAdapter.checkResponse(response["data"]);
                let responsePayloadMessage = (typeof(validResponse)== "object" && (validResponse.hasOwnProperty("msg") || validResponse.hasOwnProperty("message")) ) 
                ? validResponse.msg || validResponse.message
                : GENERIC_SUCCESS_MSG;
                if (!isValid) {
                    if (enableNotification) {
                        const dispatch = getDispatch();
                        if (dispatch) {
                            dispatch(pushNotification({ msg: `La respuesta del servidor para eliminar los/las ${nameMessage} no ha sido validada`, status: 'err' }));
                        }
                    }
                    resolve({ "msg": BAD_PAYLOAD_FORMAT_ERROR_MSG, "status": "err", "data": {} });
                } else {
                    if (enableNotification) {
                        const dispatch = getDispatch();
                        if (dispatch) {
                            dispatch(pushNotification({ msg: responsePayloadMessage, status: 'ok' }));
                        }
                    }
                    let responsePayloadParsed = responseAPIAdapter.adapt(validResponse);
                    resolve(responsePayloadParsed);
                }
            } else {
                try {
                    let json_object = { ...response.data  };
                    if (json_object.hasOwnProperty("status") && json_object.hasOwnProperty("msg")) {
                        resolve(json_object)
                    } else {
                        resolve({ "msg": GENERIC_ERROR_MSG, "status": "err", "data": {} });
                    }
                } catch {
                    handleError(resolve, error)
                }
            }
        }).catch(
            function (error) {
                handleError(resolve, error)
            }
        )
    })
    return response;
}

export {
    getRequestGeneric, 
    postRequestGeneric, 
    putRequestGeneric, 
    uploadFileFormRequestGeneric, 
    deleteRequestGeneric
}
