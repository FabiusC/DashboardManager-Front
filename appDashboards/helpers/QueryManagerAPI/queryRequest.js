import { queryManagerGeneralRequest } from "../../services/queryManagerAPI";
import { validatorAPIBasicParameters } from "../../source/validators";
import { pushNotification } from "../../redux/actions";
import { getCurrentStore } from "../../helpers/redux/store";
import { getMicroserviceRegistryServiceId } from "../../utils/microserviceUrlUtils";
import { SERVICE_TYPE_DATA_SOURCE_MANAGER } from "../../constants/microserviceTypes";
export const handleQueryPublic = async (
    dispatch,
    panelId,
    dashboardId,
    nameMessage,
    requestBody,
    urlParameters = {}
) => {
    if (requestBody.query_type === "none_query") {
        return [true, []];
    }

    const store = getCurrentStore();
    const state = store?.getState();
    const application_id = state?.app?.id;
    const registry_service_id = getMicroserviceRegistryServiceId({ serviceTypes: SERVICE_TYPE_DATA_SOURCE_MANAGER });

    const bodyWithIds = {
        ...requestBody,
        ...(application_id && { application_id }),
        ...(registry_service_id && { registry_service_id }),
    };
    const body = bodyWithIds;

    const requestHeader = {
        "Content-Type": "application/json",
    };

    const responseRequest = await queryManagerGeneralRequest({
        version: "v1",
        typeRequest: "POST",
        nameUrl: "queryPublic",
        body,
        headers: requestHeader,
        parameters: urlParameters,
        useJWT: false,
    });

    const [validResponse, responseContent] = validatorAPIBasicParameters(responseRequest);
    if (validResponse) {
        if (responseContent?.status === "success") {
            return [true, responseContent?.data];
        }
        dispatch(pushNotification({ msg: `Ocurrió un error al obtener los ${nameMessage}`, status: "err" }));
        return [false, null];
    }
    dispatch(
        pushNotification({
            msg: `La respuesta del servidor para obtener los ${nameMessage} no ha sido validada`,
            status: "err",
        })
    );
    return [false, null];
};

export const handleQuery = async (dispatch, userToken, nameEndpoint, nameMessage, requestBody, urlParameters) => {
    
    if (requestBody.query_type === "none_query") {
        return [true, []];
    }
    
    // Obtener application_id y registry_service_id de Redux
    const store = getCurrentStore();
    const state = store?.getState();
    const application_id = state?.app?.id;
    const registry_service_id = getMicroserviceRegistryServiceId({ serviceTypes: SERVICE_TYPE_DATA_SOURCE_MANAGER });
    
    // Agregar application_id y registry_service_id al body
    const bodyWithIds = {
        ...requestBody,
        ...(application_id && { application_id }),
        ...(registry_service_id && { registry_service_id })
    };
    
    let requestHeader = {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
    }
    const responseRequest = await queryManagerGeneralRequest({
        version: 'v1',
        typeRequest: 'POST',
        nameUrl: nameEndpoint,
        body: bodyWithIds,
        headers: requestHeader,
        parameters: urlParameters
    });
    const [validResponse, responseContent] = validatorAPIBasicParameters(responseRequest);
    if(validResponse){
        if(responseContent?.status == "success"){
            return [true, responseContent?.data]
        } else {
            dispatch(pushNotification({ msg: `Ocurrió un error al obtener los ${nameMessage}`, status: 'err' }))
            return [false, null]
        }
    } else {
        dispatch(pushNotification({ msg: `La respuesta del servidor para obtener los ${nameMessage} no ha sido validada`, status: 'err' }))
        return [false, null]
    }
}
