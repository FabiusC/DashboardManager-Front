import { pushNotification, removeUserInfo, removeOrganization, clearNotifications } from "../redux/actions";
import { validateExpirationTime } from "./recursiveSecurity";
import { ResponseAPIAdapter } from "../adapters/responseAPIAdapter";
import { Login } from "@mui/icons-material";

const apiAdapter= new ResponseAPIAdapter()

export function isValidUUID4(str) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(str);
}

export function urlValidator(strURL) {
    let output
    if (typeof strURL !== "string") {
        output = {
            "msg": "La URL ingresada no es una cadena de texto válida.",
            "status": "err",
        }
        return output;
    }
    try {
        new URL(strURL);
        output = {
            "msg": "La URL ingresada es válida.",
            "status": "ok",
        }
        return output;
    } catch {
        output = {
            "msg": "La URL ingresada no es válida. Intente nuevamente.",
            "status": "err",
        }
        return output
    }
}

export function validatorAPIBasicParameters(respObj, userObject = undefined, dispatcher = undefined) {    
    const [isValid, initialDataObject] = apiAdapter.checkResponse(respObj);    
    if (!isValid) {
        return [false, {}];
    }
    

    if (userObject && userObject["expiration"] !== undefined) {
        if (!validateExpirationTime(userObject["expiration"])) {
            dispatcher(removeUserInfo());
            dispatcher(removeOrganization())
            localStorage.removeItem("authToken");
        }
    }

    if (initialDataObject) {
        const { data, msg, status } = initialDataObject;
        
        if (msg === "Token revoked" && status === "err") {
            dispatcher(removeUserInfo());
            dispatcher(removeOrganization());
            dispatcher(clearNotifications());
            localStorage.removeItem("authToken");
        }
    
        if (data && typeof data === 'object' && data["msg"] === "Token revoked" && data["status"] === "err") {
            dispatcher(removeUserInfo());
            dispatcher(removeOrganization());
            dispatcher(clearNotifications());
            localStorage.removeItem("authToken");
        }
    
        return [true, initialDataObject];
    }
    return [false, {}];
}

export function validatorNameValidVariable(name) {
    const regExpr = /^\w+$/;
    if (regExpr.test(name) && name.length > 3 && (Array(name.length).fill("_").join("") !== name)) {
        return true;
    }
    return false;
}

export function handleRequestErrorNotification(
    validResponse,
    responseContent,
    dispatchObject,
    messages,
    functionsEachCase,
    enableOkNotification
) {
    let responseStatus = responseContent["status"];
    let responseMsg = responseContent["msg"];
    let dat = responseContent["data"];
    let notificationObject = {
        "msg": "",
        "status": "err"
    }
    let existsFunctions = functionsEachCase !== undefined && typeof functionsEachCase === "object";
    let return_value = undefined;
    if (validResponse) {
        if (responseStatus === "ok" || responseStatus === true || responseStatus === "success") {
            notificationObject["msg"] = messages["success"];
            notificationObject["status"] = "ok";
            if (existsFunctions && functionsEachCase.hasOwnProperty("success") && typeof functionsEachCase["success"] === "function") {
                return_value = functionsEachCase["success"](dat);
            }
            if (enableOkNotification == undefined || enableOkNotification == true) {
                dispatchObject(pushNotification(notificationObject));
            }
        } else {
            notificationObject["msg"] = `${messages["err"]} -> ${responseMsg}`;
            if (existsFunctions && functionsEachCase.hasOwnProperty("err") && typeof functionsEachCase["err"] === "function") {
                return_value = functionsEachCase["err"]();
            }
            dispatchObject(pushNotification(notificationObject));
        }
    } else {
        notificationObject["msg"] = messages["invalidResponse"];
        if (existsFunctions && functionsEachCase.hasOwnProperty("invalidResponse") && typeof functionsEachCase["invalidResponse"] === "function") {
            return_value = functionsEachCase["invalidResponse"]();
            
        }
        dispatchObject(pushNotification(notificationObject));
    }
}
