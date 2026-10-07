"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, Typography, Box, Tooltip, alpha, useTheme } from "@mui/material"
import { PieChart } from "@mui/icons-material"
import { MarqueeText } from "@components/Recursive/MarqueeText"


const DEFAULT_PANEL_W = 3
const DEFAULT_PANEL_H = 12

export const PanelTooltipContent = ({ panel }) => {
  
  const theme = useTheme()

  return (
    <Box sx={{ p: 1, maxWidth: 320 }}>
      {/* Imagen expandida en el tooltip */}
      <Box
        sx={{
          width: "100%",
          height: "160px",
          borderRadius: "4px",
          overflow: "hidden",
          mb: 2,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: alpha(theme.palette.background.paper, 0.5),
            zIndex: 1
          }}
        >
          <PieChart sx={{ fontSize: 64, color: theme.palette.primary.main }} />
        </Box>
      </Box>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        {panel.title}
      </Typography>
    </Box>
  )
}

export const PanelIcon = ({ panel, isActive = true, onBlockedDrag }) => {
  const theme = useTheme()
  const dragRef = useRef(null)
  useEffect(() => {
    const el = dragRef.current
    if (!el || isActive) return undefined

    let cancelled = false
    const w = Number(panel.width) > 0 ? Number(panel.width) : DEFAULT_PANEL_W
    const h = Number(panel.height) > 0 ? Number(panel.height) : DEFAULT_PANEL_H
    el.setAttribute("gs-id", String(panel.id))
    el.setAttribute("gs-w", String(w))
    el.setAttribute("gs-h", String(h))

    // Dynamic import keeps gridstack off the Next.js SSR bundle.
    import("gridstack").then(({ GridStack }) => {
      if (cancelled || !dragRef.current) return
      GridStack.setupDragIn(
        [dragRef.current],
        { appendTo: "body", helper: "clone", pause: false },
        [{ id: String(panel.id), w, h }]
      )
    })

    return () => { cancelled = true }
  }, [isActive, panel.id, panel.width, panel.height])

  return (
    <Tooltip
      title={<PanelTooltipContent panel={panel} />}
      placement="right"
      arrow
      disableInteractive
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: 3,
            borderRadius: 1,
            p: 0,
            maxWidth: "none",
          },
        },
      }}
    >
    <Card
      ref={dragRef}
      className="dashboard-panel-drag"
      onMouseDown={() => { if (isActive && typeof onBlockedDrag === 'function') { onBlockedDrag(panel) } }}
      sx={{
        mb: 1,
        height: '90px',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.2) : "transparent",
        cursor: isActive ? 'not-allowed' : 'grab',
        "&:hover": {
          boxShadow: 3,
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            border: "1px solid",
            borderColor: isActive ? "green" : "#000",
            bgcolor: isActive ? "green" : "transparent",
          }}
        />

      </Box>
      <CardContent sx={{ width: "100%", display: 'flex', flexDirection: 'column', justifyContent: "center", alignItems: "center", gap: 1, p: 1, mt: 2, boxSizing: "border-box" }}>
          <Box
            sx={{
              width: "50px",
              height: "50px",
              borderRadius: "3px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(theme.palette.background.paper, 0.5),
                zIndex: 1
              }}
            >
              <PieChart sx={{ fontSize: 40, color: theme.palette.primary.main }} />
            </Box>
          </Box>
          <MarqueeText
              text={panel.title}
              variant={"body2"}
              maxWidth="100%"
              sx={{
              fontWeight: "medium",
              }}
          />

      </CardContent>
    </Card>
    </Tooltip>
  )
}
