export const clearSessionStorage = (varList) => {
    try {
        if (varList && varList.length > 0) {
            varList.forEach(varName => {
                sessionStorage.removeItem(varName);
            });
        }
    } catch (e) {
        console.error('Error clearing session storage:', e);
        return null;
    }
}