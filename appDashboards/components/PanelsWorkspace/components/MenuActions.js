import { useState } from "react"
import { IconButton, Menu, MenuItem, Tooltip, ListItemIcon, ListItemText, Box } from "@mui/material"
import { MoreVert } from "@mui/icons-material"

const DISABLED_MESSAGE = "La descarga solo se permite en la vista de tableros"

export default function MenuActions({
  getPriorityValue,
  panel,
  displayActions = [],
  availableActions = [],
  downloadEnabled = false,
  onOpenDownloadModal,
}) {
  const [anchorEl, setAnchorEl] = useState(null)
  const menuOpen = Boolean(anchorEl)

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleActionClick = (actionKey) => {
    if (!downloadEnabled || typeof onOpenDownloadModal !== "function") return
    onOpenDownloadModal(actionKey)
    handleMenuClose()
  }

  if (!displayActions?.length) return null

  const iconColor = getPriorityValue(panel?.setUp?.current, panel?.setUp?.changed, ["menu_actions", "icon_color", "value"])
  const backgroundColor = getPriorityValue(panel?.setUp?.current, panel?.setUp?.changed, ["menu_actions", "background_color", "value"])
  const enabledKeys = new Set((availableActions || []).map((a) => a.key))
  const paddingTop = getPriorityValue(panel?.setUp.current, panel?.setUp?.changed,["menu_actions","paddingMenuActions","paddingTop","value"])
  const paddingBottom = getPriorityValue(panel?.setUp.current, panel?.setUp?.changed,["menu_actions","paddingMenuActions","paddingBottom","value"])
  const paddingLeft= getPriorityValue(panel?.setUp.current, panel?.setUp?.changed,["menu_actions","paddingMenuActions","paddingLeft","value"])
  const paddingRight= getPriorityValue(panel?.setUp.current, panel?.setUp?.changed,["menu_actions","paddingMenuActions","paddingRight","value"])                                          

  return (
    <>
      <Tooltip title="Acciones" arrow placement="top">
        <span>
          <IconButton
            size="small"
            className="no-drag"
            onClick={handleMenuClick}
            sx={{
              color: iconColor,
              backgroundColor,
              paddingTop: `${paddingTop ?? 4}px`,
              paddingBottom:`${paddingBottom ?? 4}px`,
              paddingLeft:`${paddingLeft ?? 4}px`,
              paddingRight:`${paddingRight ?? 4}px`,
              "&:hover": { bgcolor: "rgba(205, 218, 228, 0.08)" },
            }}
            aria-controls={menuOpen ? "download-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={menuOpen ? "true" : undefined}
            aria-label="Opciones de descarga"
          >
            <MoreVert sx={{ fontSize: 17 }} />
          </IconButton>
        </span>
      </Tooltip>

      <Menu
        id="download-menu"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        MenuListProps={{ "aria-labelledby": "download-menu-button" }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            minWidth: 260,
            borderRadius: 2,
            border: "1px solid #e6e8ec",
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
            overflow: "hidden",
          },
        }}
      >
        <MenuItem
          disabled
          sx={{
            opacity: 1,
            pointerEvents: "none",
            bgcolor: "rgba(25, 118, 210, 0.06)",
            borderBottom: "1px solid #e9edf3",
          }}
        >
          <ListItemText
            primary="Descargar panel"
            secondary="Selecciona el formato de salida"
            primaryTypographyProps={{ fontWeight: 700, fontSize: 13 }}
            secondaryTypographyProps={{ fontSize: 11 }}
          />
        </MenuItem>
        {displayActions.map((action) => {
          const isEnabled = downloadEnabled && enabledKeys.has(action.key)
          const item = (
            <MenuItem
              key={action.key}
              disabled={!isEnabled}
              onClick={() => handleActionClick(action.key)}
              sx={{
                py: 1,
                "&:hover": { bgcolor: isEnabled ? "rgba(25, 118, 210, 0.06)" : undefined },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{action.icon}</ListItemIcon>
              <ListItemText
                primary={action.label}
                secondary={action.description}
                primaryTypographyProps={{ fontWeight: 600, fontSize: 13 }}
                secondaryTypographyProps={{ fontSize: 11, color: "text.secondary" }}
              />
            </MenuItem>
          )
          return isEnabled ? (
            item
          ) : (
            <Tooltip key={action.key} title={DISABLED_MESSAGE} arrow placement="left">
              <Box component="span" sx={{ display: "block" }}>
                {item}
              </Box>
            </Tooltip>
          )
        })}
      </Menu>
    </>
  )
}
