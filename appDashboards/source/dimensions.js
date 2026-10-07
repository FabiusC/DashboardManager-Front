import { addDimensionObject, replaceDimensionObject } from "../redux/actions";

export const getDimensionsWindowObject = (dispatcher) => {
    const handleWindowResize = () => {
        dispatcher(replaceDimensionObject(
            {
                "width": window.innerWidth,
                "height": window.innerHeight,
                "orientation": window.innerWidth > window.innerHeight ? "landscape" : "portrait"
            }
        ));
    };
    window.addEventListener('resize', handleWindowResize);
    dispatcher(addDimensionObject({
        "width": window.innerWidth,
        "height": window.innerHeight,
        "orientation": window.innerWidth > window.innerHeight ? "landscape" : "portrait"
    }));
    return () => {
        window.removeEventListener('resize', handleWindowResize);
    };
};

export const getOptimalWidthSubsectionHalf = (setOptimaWidthSubSectionSize, dimensionObject) => {
    let width = null;
    if (dimensionObject?.width !== undefined && typeof dimensionObject?.width === "number") {
        if (dimensionObject.width > 1200) {
            if ((dimensionObject.width - 100) < (dimensionObject.width / 2)) {
                width = `${dimensionObject.width - 30}px`;
            } else {
                width = `${Math.round(dimensionObject.width / 2) - 100}px`
            }
        } else {
            width = "100%"
        }
        setOptimaWidthSubSectionSize(width);
    }
}