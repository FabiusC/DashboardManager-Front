
export const getModifiedFields = (originalData, currentData, fieldsToCheck = null) => {
  let data = {}
  for (const key of fieldsToCheck) {
    if (originalData[key] === null || originalData[key] === undefined || originalData[key] === "") {
      originalData[key] = ""
    }
    if (currentData[key] === null || currentData[key] === undefined || currentData[key] === "") {
      currentData[key] = ""
    }
  }
  if (fieldsToCheck !== null) {
    originalData = Object.entries(originalData)
    originalData = originalData.filter(([key , value]) =>  fieldsToCheck.includes(key))
  }

  
  originalData.forEach(([key , value]) => {
    let currentValue = currentData[key]
    if (typeof value == 'object'){
      value = JSON.stringify(value);
      currentValue = JSON.stringify(currentData[key]);
    }

    //  the value change
    if (value != currentValue){
      data[key] = currentData[key]
    }
  });
  return {
    hasChanges: Object.keys(data).length !== 0 ,
    changedFields : data
  }
};
