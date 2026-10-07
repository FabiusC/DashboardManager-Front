const getBorderStyles = (border = {}) => ({
  border: `${border?.size ?? 0}px ${border?.style ?? "solid"} ${border?.color ?? "black"}`,
  borderRadius: `${border?.radius ?? 0}px`,
});

const getBackgroundStyles = (background = {}) => ({
  backgroundColor: background?.backgroundColor ?? "transparent",
});

const getTitleStyles = (title = {}) => ({
  backgroundColor: title?.backgroundColor ?? "transparent",
  color: title?.fontColor ?? "black",
  fontFamily: title?.fontFamily ?? "Arial",
  fontSize: `${title?.fontSize ?? 16}px`,
  fontWeight: title?.fontWeight ?? "bold",
  textAlign: title?.textAlign ?? "center",
});

const getDescriptionStyles = (description = {}) => ({
  color: description?.fontColor ?? "black",
  backgroundColor: description?.backgroundColor ?? "transparent",
  fontFamily: description?.fontFamily ?? "Arial",
  fontSize: `${description?.fontSize ?? 16}px`,
  fontWeight: description?.fontWeight ?? "bold",
  textAlign: description?.textAlign ?? "center",
});

export {
  getBorderStyles,
  getBackgroundStyles,
  getTitleStyles,
  getDescriptionStyles
};