import { dashboardGeneralRequest as generalRequest } from "../../services/dashboardAPI";
import { validatorAPIBasicParameters } from "../../source/validators";
import { pushNotification } from "../../redux/actions";

export const handleAsociateChartTypeToPanel = async (dispatch, userToken, nameEndpoint, nameMessage, requestBody, urlParameters, dynamicParams) => {
    let requestHeader = {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
    }
    const responseRequest = await generalRequest({
        version: 'v1',
        typeRequest: 'POST',
        nameUrl: nameEndpoint,
        body: requestBody,
        headers: requestHeader,
        parameters: urlParameters,
        dynamicParams: dynamicParams
    });
    const [validResponse, responseContent] = validatorAPIBasicParameters(responseRequest);
    if(validResponse){
        if(responseContent?.status == "success"){
            return [true, responseContent?.data]
        } else {
            dispatch(pushNotification({ msg: `Ocurrió un error al asociar la ${nameMessage}`, status: 'err' }))
            return [false, null]
        }
    } else {
        dispatch(pushNotification({ msg: `La respuesta del servidor para asociar la ${nameMessage} no ha sido validada`, status: 'err' }))
        return [false, null]
    }
}

export const handleGetFieldsDistribution = async (dispatch, userToken, nameEndpoint, nameMessage, requestBody, urlParameters, dynamicParams) => {
    let requestHeader = {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
    }
    const responseRequest = await generalRequest({
        version: 'v1',
        typeRequest: 'POST',
        nameUrl: nameEndpoint,
        body: requestBody,
        headers: requestHeader,
        parameters: urlParameters,
        dynamicParams: dynamicParams
    });
    const [validResponse, responseContent] = validatorAPIBasicParameters(responseRequest);
    if(validResponse){
        if(responseContent?.status == "success"){
            return [true, responseContent?.data]
        } else {
            dispatch(pushNotification({ msg: `Ocurrió un error al obtener el ${nameMessage}`, status: 'err' }))
            return [false, null]
        }
    } else {
        dispatch(pushNotification({ msg: `La respuesta del al obtener el ${nameMessage} no ha sido validada`, status: 'err' }))
        return [false, null]
    }
}
