import { useDispatch } from "react-redux";
import { dashboardGeneralRequest as generalRequest } from "../../services/dashboardAPI";
import { handleRequestErrorNotification, validatorAPIBasicParameters } from "../../source/validators";
import { pushNotification } from "../../redux/actions";

export const handleList = async (dispatch, userToken, nameList, nameMessage, filters = [], perPage = 10, searchTerm = "", page = 1, fieldsSearch = [], order = "desc", orderBy = "created_at", idUrl = "") => {
    let requestHeader = {
       'Authorization': 'Bearer ' + userToken,
       'Content-Type': 'application/json'
    }

    let requestBody = {
        limit: perPage,
        offset: (page - 1) * perPage,
        field_str_q: searchTerm,
        order: order,
        order_by: orderBy,
        filters: filters,
        field_str_search: fieldsSearch
    }

    const responseRequest = await generalRequest({
        version: 'v1',
        typeRequest: 'POST',
        nameUrl: nameList,
        body: requestBody,
        headers: requestHeader,
        dynamicParams: idUrl
    });
    const [validResponse, responseContent] = validatorAPIBasicParameters(responseRequest);
    if(validResponse){
        if(responseContent?.status == "success"){
            return responseContent.data
        } else {
            dispatch(pushNotification({ msg: `Ocurrió un error al momento de listar los/las ${nameMessage}`, status: 'err' }))
            return false
        }
    } 
    else {
        dispatch(pushNotification({ msg: `La respuesta del servidor para listar los/las ${nameMessage} no ha sido validada`, status: 'err' }))
        return false
    }
} 

export const deleteRequest = async ( dispatch, userToken, nameEndpoint, nameMessage, key, id) => {
    let requestHeader = {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
    }
    const responseRequest = await generalRequest({
        version: 'v1',
        typeRequest: 'DELETE',
        nameUrl: nameEndpoint,
        headers: requestHeader,
        dynamicParams: id
    });
    const [validResponse, responseContent] = validatorAPIBasicParameters(responseRequest);
    console.log("Response from deleteRequest:", responseContent);
    
    if(validResponse){
        if(responseContent?.status == "success"){
            dispatch(pushNotification({ msg: `Se ha eliminado el ${nameMessage} correctamente.`, status: 'ok' }))
            return [true, responseContent.data]
        } else {
            dispatch(pushNotification({ msg: `Ocurrió un error al eliminar el ${nameMessage}`, status: 'err' }))
            return false
        }
    } else {
        dispatch(pushNotification({ msg: `La respuesta del servidor para eliminar el ${nameMessage} no ha sido validada`, status: 'invalidResponse' }))
        return false
    }
}

export const getRequest = async ( dispatch, userToken, key, id, name, nameMessage, idUrl) => {
    /* let requestHeader = {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
    } */
    let requestParameters = {};
    if(key.trim() !== "" & id.trim() !== ""){
        return requestParameters = {
            [key] : id
        }
    }
    const responseRequest = await generalRequest({
        version: 'v1',
        typeRequest: 'GET',
        nameUrl: name,
        /* headers: requestHeader, */
        parameters: requestParameters,
        dynamicParams: idUrl
    });
    const [validResponse, responseContent] = validatorAPIBasicParameters(responseRequest);
    if(validResponse){
        if(responseContent?.status == "success"){
            return responseContent.data
        } else {
            dispatch(pushNotification({ msg: `Ocurrió un error al momento de listar los/las ${nameMessage}`, status: 'err' }))
            return false
        }
    } else {
        dispatch(pushNotification({ msg: `La respuesta del servidor para listar los/las ${nameMessage} no ha sido validada`, status: 'err' }))
        return false
    }
}

export const handleEditItemEntity = async (userToken, nameEndpoint, nameMessage, itemId, requestBody, dispatch, activeNotification = false ) => {

    /* let requestHeader = {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
    } */
    const responseRequest = await generalRequest({
        version: 'v1',
        typeRequest: 'PUT',
        nameUrl: nameEndpoint,
        body: requestBody,
        /* headers: requestHeader, */
        dynamicParams: itemId
    });
    const [validResponse, responseContent] = validatorAPIBasicParameters(responseRequest);
    if(validResponse){
        if(responseContent?.status == "success"){
            if( activeNotification ){
                dispatch(pushNotification({ msg: `Se ha actualizado el/la ${nameMessage} correctamente.`, status: 'ok' }))
            }
            return [true, responseContent.data]
        } else {
            dispatch(pushNotification({ msg: `Ocurrió un error al momento de actualizar el/la ${nameMessage}`, status: 'err' }))
            return [false, []]
        }
    } else {
        dispatch(pushNotification({ msg: `La respuesta del servidor para actualizar el/la ${nameMessage} no ha sido validada`, status: 'err' }))
        return [false, []]
    }
}

export const handleCreateItemEntity = async (dispatch, userToken, nameEndpoint, nameMessage, requestBody) => {
    /* let requestHeader = {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
    } */
    const responseRequest = await generalRequest({
        version: 'v1',
        typeRequest: 'POST',
        nameUrl: nameEndpoint,
        body: requestBody,
        /* headers: requestHeader */
    });
    const [validResponse, responseContent] = validatorAPIBasicParameters(responseRequest);
    if(validResponse){
        if(responseContent?.status == "success"){
            dispatch(pushNotification({ msg: `Se ha creado el/la ${nameMessage} correctamente.`, status: 'ok' }))
            return true
        } else {
            dispatch(pushNotification({ msg: `Ocurrió un error al momento de crear el/la ${nameMessage}`, status: 'err' }))
            return false
        }
    } else {
        dispatch(pushNotification({ msg: `La respuesta del servidor para crear el/la ${nameMessage} no ha sido validada`, status: 'err' }))
        return false
    }
}

export const handleCreateItemEntityWithResponse = async (dispatch, userToken, nameEndpoint, nameMessage, requestBody, enableNotification = true) => {
    /* let requestHeader = {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
    } */
    const responseRequest = await generalRequest({
        version: 'v1',
        typeRequest: 'POST',
        nameUrl: nameEndpoint,
        body: requestBody,
        /* headers: requestHeader */
    });
    const [validResponse, responseContent] = validatorAPIBasicParameters(responseRequest);
    if(validResponse){
        if(responseContent?.status == "success"){
            if(enableNotification){
                dispatch(pushNotification({ msg: `Se ha creado el/la ${nameMessage} correctamente.`, status: 'ok' }))
            }
            return [true, responseContent?.data]
        } else {
            if(enableNotification){
                dispatch(pushNotification({ msg: `Ocurrió un error al momento de crear el/la ${nameMessage}`, status: 'err' }))
            }
            return [false, responseContent]
        }
    } else {
        if(enableNotification){
            dispatch(pushNotification({ msg: `La respuesta del servidor para crear el/la ${nameMessage} no ha sido validada`, status: 'err' }))
        }
        return [false, responseContent]
    }
}