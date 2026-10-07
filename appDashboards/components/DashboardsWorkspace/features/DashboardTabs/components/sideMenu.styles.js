/**
 * Estilos del contenedor principal del SideMenu
 */
export const getContainerStyles = (activeCount, totalWidth, baseTabWidth) => ({
  position: "sticky",
  top: 0,
  zIndex: 100,
  width: activeCount === 0 ? `${baseTabWidth + 1}px` : activeCount > 0 ? `${totalWidth}px` : baseTabWidth,
  backgroundColor: "#f5f5f5",
  display: "flex",
  flexDirection: activeCount === 0 ? "column-reverse" : "row-reverse",
  alignItems: "flex-start",
  justifyContent: "flex-end",
  minHeight: "100%",
  flex: "0 0 auto",
  transition: "width 0.3s ease-in-out",
  borderRight: activeCount === 0 ? "1px solid #e2e8f0" : "none",
  overflow: "hidden",
});

/**
 * Estilos del contenedor de cada item del menú
 */
export const getItemContainerStyles = (isActive, activeCount, baseTabWidth, expandedWidth) => ({
  width: activeCount === 0 ? `${baseTabWidth}px` : isActive ? `${expandedWidth}px` : `${baseTabWidth}px`,
  height: activeCount === 0 ? "auto" : "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  backgroundColor: isActive ? "#ffffff" : "transparent",
  borderRight: activeCount === 0 ? "none" : "1px solid #e2e8f0",
  color: (theme) => theme.palette.primary.main,
});

/**
 * Estilos del botón clickeable del item
 */
export const getItemButtonStyles = (isActive, isDisabled, activeCount) => (theme) => ({
  cursor: isDisabled ? "not-allowed" : "pointer",
  writingMode: isActive ? "horizontal-tb" : "vertical-rl",
  width: isActive ? "100%" : "auto",
  transform: isActive ? "none" : "rotate(0deg)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: isActive ? 50 : 60,
  paddingBottom: isActive ? 0 : 1,
  opacity: isDisabled ? 0.5 : 1,
  "&:hover": {
    color: isDisabled ? "inherit" : theme.palette.primary.dark,
  },
  borderBottom: activeCount === 0 ? "1px solid #e2e8f0" : "none",
});

/**
 * Estilos del contenido interno del botón
 */
export const getButtonContentStyles = (isActive) => ({
  width: isActive ? "180px" : "auto",
  display: "flex",
  alignItems: "center",
  justifyContent: isActive ? "space-around" : "center",
  flexDirection: isActive ? "row-reverse" : "row",
  gap: 0.5,
  paddingTop: isActive ? 0 : "11px",
  paddingBottom: isActive ? 0 : "4px",
});

/**
 * Estilos del IconButton de chevron
 */
export const getChevronButtonStyles = (isActive) => (theme) => ({
  color: isActive ? theme.palette.primary.main : "inherit",
  cursor: "pointer",
  opacity: 1,
  "&:hover": {
    color: theme.palette.primary.main,
  },
});

/**
 * Estilos del contenedor del contenido activo
 */
export const getActiveContentStyles = () => ({
  width: "100%",
  height: "100%",
  display: "flex",
  justifyContent: "center",
});

