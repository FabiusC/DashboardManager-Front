/* 
Name: recursiveSecurity
Action: functions to validate auth of all the React Project
*/

export const checkMaxLevelAccess = (userInfo) => {
    let auxLevelAccessArray = []
    userInfo[0].userData.permissions.map((eachPermission) => {
        auxLevelAccessArray.push(eachPermission.rol.value)
    })
    let valueMaxLevelAccess = Math.max(...auxLevelAccessArray)
    let indexMaxLevelAccess = auxLevelAccessArray.indexOf(valueMaxLevelAccess)
    return valueMaxLevelAccess;
};

export const validateExpirationTime = (dateExperitationToken) => {
    let currentDate = new Date();
    let year = currentDate.getFullYear();
    let month = ('0' + (currentDate.getMonth() + 1)).slice(-2); // Months are zero-based
    let day = ('0' + currentDate.getDate()).slice(-2);
    let hours = ('0' + currentDate.getHours()).slice(-2);
    let minutes = ('0' + currentDate.getMinutes()).slice(-2);
    let seconds = ('0' + currentDate.getSeconds()).slice(-2);
    let currentDateUser = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    let dateExpirationUser = dateExperitationToken.substring(0, 10) + "T" + dateExperitationToken.substring(11, 19);
    let dateClient = new Date(currentDateUser);
    let dateExpiration = new Date(dateExpirationUser);
    //console.log("dateClient", dateClient)
    //console.log("dateExpiration", dateExpiration)
    if (dateClient <= dateExpiration) {
        return true
    } else {
        return false
    }
};
