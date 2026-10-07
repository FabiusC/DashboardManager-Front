export class ResponseAPIAdapter {
    checkResponse(response) {
        if (typeof response !== 'object' || response === null) {
            console.warn("BAD_API_RESPONSE_FORMAT: Response is not an object");
            return [false, {}];
        }
        
        const requiredKeys = ["msg", "status"];
        let hasAllRequiredKeys = requiredKeys.every((key) => response.hasOwnProperty(key));
       
        if (!hasAllRequiredKeys) {
            console.warn("BAD_API_RESPONSE_FORMAT: Response format is incorrect, missing required keys");
            return [false, {}];
        }

        return [true, response];
    }
    
    adapt(responseData) {
        const { msg, status, data } = responseData;
        return {
            msg: msg,
            status: status,
            data: data,
        };
    }
}
