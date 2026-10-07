import { Box } from "@mui/material";
import SideMenu from "../menus/SideMenu";

const LeftSectionMenu = () => {
  return (
    <Box
      sx={{
        height: "100%",
        flexShrink: 0,
        overflowX: "hidden",
        overflowY: "auto",
        maxHeight: "100%",
      }}
    >
      <SideMenu
      />
    </Box>
  );
};

export default LeftSectionMenu;