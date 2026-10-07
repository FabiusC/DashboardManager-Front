import React, { useRef } from "react";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import { StyledAppBar } from "./mainBarStyles";
import { StyledAvatar } from "@components/Recursive/mui_styled_components";

export default function MainBarHeader({
  open,
  drawerWidth,
  organizationInfo,
  user,
  userOptions,
  onUserMenuAction,
}) {
  const anchorEl = useRef();
  const [openUser, setOpenUser] = React.useState(false);
  const handleUserOpen = () => setOpenUser(true);
  const handleUserClose = () => setOpenUser(false);

  return (
    <StyledAppBar position="fixed" open={open} drawerWidth={drawerWidth}>
      <Toolbar
        disableGutters
        sx={{
          minHeight: 56,
          px: 3,
          py: 1.5,
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "center", minWidth: 0, flex: 1 }}
        >
          {organizationInfo &&
            (organizationInfo.logo1 ? (
              <img
                src={organizationInfo.logo1}
                alt={organizationInfo.name}
                style={{ height: "auto", width: 160, objectFit: "contain" }}
              />
            ) : (
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{
                  color: "text.primary",
                  fontWeight: 600,
                  textTransform: "capitalize",
                  fontSize: "1rem",
                }}
              >
                {organizationInfo?.name}
              </Typography>
            ))}
        </Box>
        <Box sx={{ flexShrink: 0 }}>
          <IconButton
            ref={anchorEl}
            onClick={handleUserOpen}
            size="small"
            aria-label="User menu"
            sx={{
              "&:hover": { backgroundColor: "action.hover" },
            }}
          >
            <StyledAvatar>
              {user?.[0]?.userData?.username?.[0]?.toUpperCase() ?? "?"}
            </StyledAvatar>
          </IconButton>
        </Box>
        <Menu
          elevation={8}
          anchorEl={() => anchorEl?.current}
          id="account-menu"
          open={openUser}
          onClose={handleUserClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: "visible",
              mt: 1.5,
              minWidth: 180,
              borderRadius: 1.5,
              "& .MuiAvatar-root": { width: 32, height: 32, ml: -0.5, mr: 1 },
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "top" }}
        >
          {userOptions.map((eachOp) => (
            <MenuItem
              key={eachOp.id}
              onClick={(e) => {
                onUserMenuAction(e, eachOp.handleFunction);
                handleUserClose();
              }}
              sx={{ py: 1.25 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{eachOp.icon}</ListItemIcon>
              {eachOp.title}
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </StyledAppBar>
  );
}
