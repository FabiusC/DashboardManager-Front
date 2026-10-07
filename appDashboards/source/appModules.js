/* 
Name: appModules
Action: available modules in the application
*/

import HomeIcon from "@mui/icons-material/Home";
import FolderIcon from "@mui/icons-material/Folder";
import InsertChartIcon from "@mui/icons-material/InsertChart";
import { CalendarMonth } from "@mui/icons-material";
import MarketPlaceIcon from '@mui/icons-material/Inventory2';

export const lateralBarOptions = [
  {
    action: "__general__home",
    id: "home",
    title: "Inicio",
    icon: (
      <HomeIcon
        sx={{ fontSize: "27px", color: (theme) => theme.palette.primary.main }}
      />
    ),
    handleFunction: "home",
  },
  {
    action: "__general__projects",
    id: "projects",
    title: "Proyectos",
    icon: (
      <FolderIcon
        sx={{ fontSize: "27px", color: (theme) => theme.palette.primary.main }}
      />
    ),
    handleFunction: "projects",
  },
  {
    action: "__general__products",
    id: "products",
    title: "Marketplace",
    icon: (
      <MarketPlaceIcon
        sx={{ fontSize: "27px", color: (theme) => theme.palette.primary.main }}
      />
    ),
    handleFunction: "products",
  },
  {
    action: "__general__reports",
    id: "reports",
    title: "Reportes",
    icon: (
      <CalendarMonth
        sx={{ fontSize: "27px", color: (theme) => theme.palette.primary.main }}
      />
    ),
    handleFunction: "reports",
  },
];