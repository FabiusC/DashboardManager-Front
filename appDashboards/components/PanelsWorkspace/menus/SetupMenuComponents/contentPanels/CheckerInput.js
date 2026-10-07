import { ExpandMore } from "@mui/icons-material"
import { alpha, Box, Checkbox, Skeleton, Stack, Typography, useTheme } from "@mui/material"
import { useEffect, useState } from "react"

const CheckerInput = ({
  keyName,
  config,
  idComponent,
  getValue,
  handleInputChange,
  renderInput, // Cambiamos renderChildInput por renderInput para recursividad completa
  getContentChildren,
  setError,
  // Props para manejar multiple_parents
  multipleParents = true,
  allCheckersInGroup = [],
  onCheckerChange,
  // Nuevas props para manejar la recursividad
  level = 1, // Nivel de anidación (1, 2, 3...)
  //parentData = null, // Datos del parent para contexto
  parentData, // Datos del parent para contexto
  clearTrigger = 0,
}) => {
  const { type, type_es, value, id, value_type, is_parent } = config
  const theme = useTheme()

  const parsedValue = value === "true" ? true : value === "false" ? false : value
  
  // Estado local para el checkbox para actualización inmediata
  const [localChecked, setLocalChecked] = useState(() => {
    // Inicializar con el valor actual
    const currentValue = getValue(keyName, type, parsedValue, parentData)
    return currentValue === true
  })
  
  // Sincronizar el estado local con el estado global solo cuando sea necesario
  useEffect(() => {
    const currentValue = getValue(keyName, type, parsedValue, parentData)
    const globalChecked = currentValue === true
    
    // Solo actualizar si el valor global es diferente al local Y no estamos en modo multipleParents
    // Esto evita interferir con la actualización inmediata del usuario
    if (globalChecked !== localChecked && !multipleParents) {
      setLocalChecked(globalChecked)
    }
  }, [keyName, type, parsedValue, parentData]) 
  
  // Estado local para controlar si los hijos están cargados (solo para checkers que son padres)
  const [childrenLoaded, setChildrenLoaded] = useState(false)
  const [isLoadingChildren, setIsLoadingChildren] = useState(false)
  const [childrenData, setChildrenData] = useState([])
  const [hasChildren, setHasChildren] = useState(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Solo ejecutar efectos relacionados con children si es padre
  useEffect(() => {
    if (is_parent && clearTrigger > 0) {
      setChildrenLoaded(false)
      setChildrenData([])
      setHasChildren(null)
      setIsLoadingChildren(false)
    }
  }, [clearTrigger, is_parent])

  useEffect(() => {
    if (is_parent && clearTrigger > 0 && isExpanded) {
      loadChildren()
    }
  }, [clearTrigger, is_parent])

  // Función para cargar los hijos (solo para checkers que son padres)
  const loadChildren = async () => {
    if (!is_parent) return []

    setIsLoadingChildren(true)
    try {
      const childrenResponse = await getContentChildren(idComponent, id)
      const children = childrenResponse?.children || []
      setChildrenData(children)
      setHasChildren(children.length > 0)
      setChildrenLoaded(true)
      return children
    } catch (error) {
      console.error("Error loading children:", error)
      setHasChildren(false)
      return []
    } finally {
      setIsLoadingChildren(false)
    }
  }

  // Función para expandir/contraer todos los hijos (solo para checkers que son padres)
  const toggleExpand = async () => {
    if (!is_parent) return
    
    setIsExpanded(!isExpanded)
    if (!isExpanded && !childrenLoaded && !isLoadingChildren) {
      // Si estamos expandiendo por primera vez y no hemos cargado los children
      await loadChildren()
    }
  }

  
  // Manejar el cambio del checkbox con lógica de exclusión mutua
  const handleCheckboxChange = async (e) => {
    const newValue = e.target.checked
    
    // Actualizar inmediatamente el estado local para feedback visual
    setLocalChecked(newValue)
    
    if (newValue && !multipleParents) {
      // Si multiple_parents es false y estamos marcando este checkbox,
      // necesitamos desmarcar todos los otros checkboxes del grupo
      if (onCheckerChange) {
        onCheckerChange(id, newValue, allCheckersInGroup, parentData)
      }
      return
    }

    if (newValue && is_parent) {
      handleInputChange(keyName, type, id, newValue.toString(), value_type, idComponent, parentData, {
        saveOnly: true,
        hydrateChildren: await loadChildren(),
      })
      return
    }

    handleInputChange(keyName, type, id, newValue.toString(), value_type, idComponent, parentData)
  }

  // Función para manejar cambios en checkboxes hijos (para recursividad)
  const handleChildCheckerChange = (checkedId, newValue, childCheckersInGroup) => {
    if (newValue) {
      // Si estamos marcando un checkbox hijo, desmarcamos todos los otros del grupo hijo
      childCheckersInGroup.forEach((checker) => {
        const isCurrentChecker = checker.id === checkedId
        const checkerValue = isCurrentChecker ? "true" : "false"
        handleInputChange(keyName, checker.type, checker.id, checkerValue, checker.value_type, idComponent, parentData)
      })
    } else {
      // Si estamos desmarcando, solo actualizamos este checkbox
      const currentChecker = childCheckersInGroup.find((c) => c.id === checkedId)
      if (currentChecker) {
        handleInputChange(
          keyName,
          currentChecker.type,
          currentChecker.id,
          "false",
          currentChecker.value_type,
          idComponent,
          parentData
        )
      }
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        borderRadius: "8px",
        padding: 1,
        backgroundColor: alpha(theme.palette.background.paper, 0.5),
        // Diferentes estilos según el nivel
        // Resaltar si es el único que puede estar activo
        ...(localChecked &&
          !multipleParents && {
            borderColor: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
          }),
      }}
    >
      {/* Cabecera del checker con checkbox */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: level === 1 ? "0.875rem" : level === 2 ? "0.8rem" : "0.75rem",
              fontWeight: level === 1 ? 500 : 400,
            }}
          >
            {type_es}
          </Typography>
          {/* Indicador de nivel */}
        </Box>
        <Checkbox
          checked={localChecked}
          onChange={handleCheckboxChange}
          size="small"
          sx={{
            width: "15%",
            height: "40px",
            // Estilo especial para modo exclusivo
            ...(localChecked &&
              !multipleParents && {
                color: theme.palette.primary.main,
                "&.Mui-checked": {
                  color: theme.palette.primary.main,
                },
              }),
          }}
        />
      </Box>

      {/* Mostrar botón de expansión solo si el checkbox está marcado Y es padre */}
      {localChecked && is_parent && (
        <Box
          sx={{
            width: "100%",
            mt: 1,
            border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
            borderRadius: 1,
            overflow: "hidden",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: "-16px",
              left: "24px",
              width: "2px",
              height: "16px",
              backgroundColor: alpha(theme.palette.primary.main, 0.3),
              zIndex: 1,
            },
          }}
        >
          {/* Botón para expandir/contraer todos */}
          <Box
            onClick={toggleExpand}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              cursor: "pointer",
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.8rem" }}>
              Configuración avanzada
            </Typography>
            {isExpanded ? (
              <ExpandMore sx={{ color: theme.palette.primary.main }} />
            ) : (
              <ExpandMore
                sx={{
                  color: theme.palette.primary.main,
                  transform: "rotate(-90deg)",
                  transition: "transform 0.3s",
                }}
              />
            )}
          </Box>

          {/* Contenedor de los hijos con animación */}
          <Box
            sx={{
              maxHeight: isExpanded ? "2000px" : "0px",
              transition: "max-height 0.3s ease-in-out",
              overflow: "hidden",
            }}
          >
            {childrenLoaded && hasChildren ? (
              childrenData.map((child, index) => {
                // Determinar si los children tienen multiple_parents
                const childMultipleParents = parentData?.multiple_parents !== false

                // Obtener todos los checkboxes del mismo nivel para exclusión mutua
                const childCheckersInGroup = childrenData.filter((item) => item.content_input === "checker")

                return (
                  <Box
                    key={`${keyName}-child-${child.id || index}`}
                    sx={{
                      borderBottom:
                        index < childrenData.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : "none",
                      backgroundColor: alpha(theme.palette.background.default, 0.4),
                    }}
                  >
                    <Box sx={{ p: 1 }}>
                      {/* Usar renderInput recursivamente para manejar todos los tipos */}
                      {renderInput(keyName, child, idComponent, {
                        level: level + 1,
                        parentData: [...parentData, config.type],
                        multipleParents: childMultipleParents,
                        allCheckersInGroup: childCheckersInGroup,
                        onCheckerChange: handleChildCheckerChange,
                      })}
                    </Box>
                  </Box>
                )
              })
            ) : isLoadingChildren ? (
              // Mostrar skeletons mientras carga
              [1, 2, 3].map((item) => (
                <Box
                  key={item}
                  sx={{
                    borderBottom: item < 3 ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : "none",
                    backgroundColor: alpha(theme.palette.background.default, 0.4),
                  }}
                >
                  <Box sx={{ p: 1 }}>
                    <Stack spacing={1}>
                      <Skeleton width="100%" height={40} />
                      <Skeleton width="80%" height={20} />
                    </Stack>
                  </Box>
                </Box>
              ))
            ) : null}
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default CheckerInput