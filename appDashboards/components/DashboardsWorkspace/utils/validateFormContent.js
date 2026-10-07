export default (text) => {
    const descriptionText = text || '';
    const threeWords = descriptionText.trim().split(/\s+/).length >= 3;
    return threeWords;
}