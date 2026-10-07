import { useState, useCallback, useMemo, useEffect } from "react"
import { Box,
         Paper,
         Tabs,
         Tab,
         Tooltip,
         useTheme,
         alpha,
         Switch,
         CircularProgress,
         Typography} from "@mui/material"
import { Palette, AutoAwesome } from "@mui/icons-material"

export default function TabComponent(props) {
  const [    activeTab,    setActiveTab] = useState(0)
  const [ isLoadingTab, setIsLoadingTab] = useState(false)
  const theme = useTheme()

  useEffect(() => {
    const componentIndex = props.setupComponents.findIndex(comp => comp.type === props.currentComponentType)
    if (componentIndex !== -1) {
      setActiveTab(componentIndex)
    }
  }, [props.currentComponentType, props.setupComponents])
  const getComponentIcon = (componentType) => {
    switch (componentType) {
      case "preset":
        return <Palette sx={{ fontSize: 48 }} />
      case "custom":
        return <AutoAwesome sx={{ fontSize: 48 }} />
      default:
        return <Palette sx={{ fontSize: 48 }} />
    }
  }

  const TabPanel = useCallback(
    ({ children, value, index, isActive, componentType, ...other }) => (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`panel-tabpanel-${index}`}
        aria-labelledby={`panel-tab-${index}`}
        style={{
          height: "100%",
          display: value === index ? "flex" : "none",
          flexDirection: "column",
        }}
        {...other}
      >
        {value === index && (
          <Box
            sx={{
              p: 2,
              overflowY: "auto",
              overflowX: "hidden",
              flex: 1,
              maxHeight: "calc(100vh - 300px)",
              "&::-webkit-scrollbar": {
                width: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: "#f1f1f1",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#c1c1c1",
                borderRadius: "4px",
                "&:hover": {
                  background: "#a8a8a8",
                },
              },
            }}
          >
            {!isActive ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "200px",
                  flexDirection: "column",
                  gap: 2,
                  textAlign: "center",
                }}
              >
                <Box sx={{ opacity: 0.5 }}>
                  {getComponentIcon(componentType)}
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Componente desactivado
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                  Este componente no está activo. Para activarlo, cambia a la estrategia correspondiente.
                </Typography>
                {console.log("Switch state for", componentType, ":", isActive)}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {props.switchLoadingStates && props.switchLoadingStates[componentType] && <CircularProgress size={16} />}
                  <Switch
                    checked={isActive}
                    disabled={props.switchLoadingStates && props.switchLoadingStates[componentType]}
                    onChange={() => {
                      console.log("Switch clicked - componentType:", componentType, "currentComponentType:", props.currentComponentType);
                      if (props.onStrategyChange) {
                        props.onStrategyChange(componentType);
                      }
                    }}
                  />
                </Box>
              </Box>
            ) : (
              children
            )}
          </Box>
        )}
      </div>
    ),
    [],
  )

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  return (
    <Box display="flex" flexDirection="column" sx={{ width: "100%", height: "100%" }}>
      <Paper sx={{ width: "100%", boxShadow: "none", display: "flex", flexDirection: "column", height: "100%" }}>
        <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              minHeight: 48,
              flexShrink: 0,
              "& .MuiTabs-scrollButtons": {
                "&.Mui-disabled": {
                  opacity: 0.3,
                },
              },
              "& .MuiTab-root": {
                minWidth: 48,
                width: 48,
                height: 48,
                padding: 0,
                margin: "0 2px"
              },
            }}
          >
            {props.setupComponents.map((component, index) => (
              <Tooltip title={component.title} placement="top" arrow>
                <Tab
                  disabled={isLoadingTab}
                  icon={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {component.icon}
                        <Box
                          sx={{
                            position: "absolute",
                            top: -2,
                            right: -2,
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: props.currentComponentType === component.type ? "success.main" : "error.main",
                            border: "1px solid white",
                          }}
                        />
                      </Box>
                    </Box>
                  }
                  sx={{
                    backgroundColor: activeTab === index ? alpha(theme.palette.primary.main, 0.15) : "transparent",
                    color: theme.palette.primary.main,
                    borderRadius: 1,
                    margin: "4px 2px",
                    minWidth: "auto",
                    padding: "6px 12px",
                  }}
                />
              </Tooltip>
            ))}
          </Tabs>
          <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {props.setupComponents.map((component, index) => (
              <TabPanel 
                key={`panel-${component.type}-${component.id}`} 
                value={activeTab} 
                index={index}
                isActive={props.currentComponentType === component.type}
                componentType={component.type}
              >
                {component.component}
              </TabPanel>
            ))}
          </Box>
      </Paper>
    </Box>
  )
}

