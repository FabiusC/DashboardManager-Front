import { generalRequest } from "../services/_centralizedAPI";
import { handleRequestErrorNotification, validatorAPIBasicParameters } from "../source/validators";
import { pushNotification } from "../redux/actions";

export const handleList = async ( nameList, nameMessage , perPage, searchTerm, offset, filters ,dispatch ) => {

    let requestBody = {
        limit: perPage,
        offset: offset,
        q_str: searchTerm || "",
        order: "desc",
        order_by: "created_at",
        filters: filters || []
    }

    const responseRequest = await generalRequest({
        version: 'v1',
        typeRequest: 'POST',
        nameUrl: nameList,
        body: requestBody
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

export const deleteRequest = async ( name, id, key, nameMessage ,dispatch) => {

    let requestBody = {
        [key] : id
    }
    const responseRequest = await generalRequest({
        version: 'v1',
        typeRequest: 'DELETE',
        nameUrl: name,
        body: requestBody
    });
    const [validResponse, responseContent] = validatorAPIBasicParameters(responseRequest);
    let result = false
    handleRequestErrorNotification(validResponse, responseContent, dispatch,
        {
            "success": `Se ha eliminado el ${nameMessage} correctamente.`,
            "err": `Ocurrió un error al eliminar el ${nameMessage}`,
            "invalidResponse": `La respuesta del servidor para eliminar el ${nameMessage} no es válida.`
        },
        {
            "success": (dat) => {
                result = true
            },
            "err": () => {
                result = false
            },
            "invalidResponse": () => {
                result = false
            }
        }
    )

    return result
}

export const getRequest = async ( name, nameMessage ,id, key, dispatch ) => {

    let requestParameters = {
        [key] : id
    }
    const responseRequest = await generalRequest({
        version: 'v1',
        typeRequest: 'GET',
        nameUrl: name,
        parameters: requestParameters
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