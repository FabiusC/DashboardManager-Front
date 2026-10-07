import { getUserInfo } from '../../services/creangelAuthAPI';
import { validatorAPIBasicParameters } from '../../source/validators';
import { validateExpirationTime } from '../../source/recursiveSecurity';
import AuthAdapter from '../../adapters/authAdapter';
import { removeUserInfo } from '../../redux/actions';

const authAdapter = new AuthAdapter

export const handleGetUserInfo = async (user, userIdentity, dispatch) => {
    let stateExpiration = validateExpirationTime(user.userData.expiration)
    if (stateExpiration) {
        let requestHeader = {
            'Authorization': 'Bearer ' + user.userID,
            'Content-Type': 'application/json'
        }
        let requestBody = {
            "user_id": userIdentity,
        }
        let responseUserInfo = await getUserInfo(requestBody, requestHeader)
        let userInfo = [];
        if (authAdapter.checkUsersInfo(responseUserInfo["data"])) {
            userInfo = authAdapter.adaptUsersObject(responseUserInfo["data"]); 
        }
        const [validResponseUserInfo, responseContentUserInfo] = validatorAPIBasicParameters(responseUserInfo, user.userData, dispatch);
        if (validResponseUserInfo) {
            if (responseContentUserInfo?.status == "ok" || responseContentUserInfo?.status == true) {
                return userInfo
            } 
        }
    } else {
        dispatch(removeUserInfo());
    }
}