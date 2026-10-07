import { useState, useCallback, useMemo } from "react"
import { Box,
         Paper,
         Tabs,
         Tab,
         Tooltip,
         useTheme,
         alpha } from "@mui/material"

export default function TabComponent(props) {
  const [    activeTab,    setActiveTab] = useState(0)
  const [ isLoadingTab, setIsLoadingTab] = useState(false)
  const theme = useTheme()

  const TabPanel = useCallback(
    ({ children, value, index, ...other }) => (
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
            {children}
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
                    component.icon
                  }
                  sx={{
                    backgroundColor: activeTab === index ? alpha(theme.palette.primary.main, 0.15) : "transparent",
                    color: theme.palette.primary.main,
                    borderRadius: 1,
                    margin: "4px 2px",
                  }}
                />
              </Tooltip>
            ))}
          </Tabs>
          <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {props.setupComponents.map((component, index) => (
              <TabPanel key={`panel-${component.type}-${component.id}`} value={activeTab} index={index}>
                {component.component}
              </TabPanel>
            ))}
          </Box>
      </Paper>
    </Box>
  )
}

