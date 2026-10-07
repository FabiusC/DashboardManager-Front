import React from "react";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import { Tooltip } from "@mui/material";
import Zoom from "@mui/material/Zoom";
import ExpandMore from "@mui/icons-material/ExpandMore";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";

function renderTitle(itemMenu, expandedMenu) {
  if (expandedMenu) return itemMenu.title;
  if (itemMenu.alias !== undefined) return itemMenu.alias;
  const words = itemMenu.title.trim().split(/\s+/);
  if (words.length >= 2) {
    return (
      <div style={{ textAlign: "center", lineHeight: "1.2" }}>
        {words[0]} <br /> {words.slice(1).join(" ")}
      </div>
    );
  }
  return itemMenu.title;
}

export default function MainBarNavList({
  options,
  stateDisplayOptions,
  selectedOption,
  openBar,
  actions,
  onOpenDisplayOption,
  onOpenUncollapse,
  onNavigate,
}) {
  const itemButtonSx = {
    py: 1.25,
    borderRadius: 1.5,
    mx: 0.75,
    "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
  };
  const selectedSx = { backgroundColor: "rgba(255,255,255,0.15)" };
  return (
    <List key="optionsBar" sx={{ pt: 0.5, px: 0.5, pb: 1 }}>
      {options.map(
        (eachOp, index) =>
          actions &&
          eachOp.action &&
          eachOp.action in actions && (
            <Box component="div" key={"optionsBar" + index}>
              {openBar === true && (
                <ListItem
                  key={eachOp.id}
                  disablePadding
                  onClick={(e) =>
                    stateDisplayOptions[eachOp.id] != ""
                      ? onOpenDisplayOption(e, eachOp.id)
                      : onNavigate(e, eachOp.handleFunction)
                  }
                >
                  <ListItemButton
                    key={"button" + eachOp.id}
                    className={`list-item-button ${selectedOption === eachOp.id ? "selected" : ""}`}
                    sx={[
                      itemButtonSx,
                      selectedOption === eachOp.id && selectedSx,
                    ]}
                  >
                    <ListItemIcon
                      key={"icon" + eachOp.id}
                      sx={{ minWidth: 40, color: "#fff" }}
                    >
                      {eachOp.icon}
                    </ListItemIcon>
                    <ListItemText
                      key={"text" + eachOp.id}
                      primary={renderTitle(eachOp, openBar)}
                      primaryTypographyProps={{
                        fontSize: "0.9375rem",
                        fontWeight: 500,
                      }}
                    />
                    {stateDisplayOptions[eachOp.id] != "" &&
                      stateDisplayOptions[eachOp.id].state == true && (
                        <ExpandMore sx={{ color: "rgba(255,255,255,0.8)" }} />
                      )}
                    {stateDisplayOptions[eachOp.id] != "" &&
                      stateDisplayOptions[eachOp.id].state == false && (
                        <NavigateNextRoundedIcon
                          sx={{ color: "rgba(255,255,255,0.8)" }}
                        />
                      )}
                  </ListItemButton>
                </ListItem>
              )}
              {openBar === true &&
                stateDisplayOptions[eachOp.id] != "" &&
                stateDisplayOptions[eachOp.id].state == true && (
                  <Collapse
                    key={"subOptionsCollapse" + eachOp.id}
                    in={stateDisplayOptions[eachOp.id].state}
                    timeout="auto"
                    unmountOnExit
                  >
                    <List
                      key={"subOptions" + eachOp.id}
                      component="div"
                      disablePadding
                    >
                      {eachOp.subOptions?.map((eachSubOp) => {
                        if (eachSubOp.action in actions) {
                          return (
                            <ListItem
                              key={eachOp.id + "_" + eachSubOp.title}
                              disablePadding
                              onClick={(e) =>
                                onNavigate(
                                  e,
                                  eachSubOp.handleFunction,
                                  eachSubOp.id,
                                )
                              }
                            >
                              <ListItemButton
                                sx={{
                                  pl: 4,
                                  py: 1,
                                  borderRadius: 1.5,
                                  mx: 0.75,
                                  "&:hover": {
                                    backgroundColor: "rgba(255,255,255,0.1)",
                                  },
                                }}
                                className={`list-item-button ${selectedOption === eachSubOp.id ? "selected" : ""}`}
                                style={
                                  selectedOption === eachSubOp.id
                                    ? {
                                        backgroundColor:
                                          "rgba(255,255,255,0.15)",
                                      }
                                    : undefined
                                }
                              >
                                <ListItemIcon
                                  sx={{ minWidth: 36, color: "#fff" }}
                                >
                                  {eachSubOp.icon}
                                </ListItemIcon>
                                <ListItemText
                                  className="color_body_text"
                                  primary={eachSubOp.title}
                                  primaryTypographyProps={{
                                    fontSize: "0.875rem",
                                  }}
                                />
                              </ListItemButton>
                            </ListItem>
                          );
                        }
                        return null;
                      })}
                    </List>
                  </Collapse>
                )}
              {openBar === false && (
                <ListItem
                  key={eachOp.id}
                  disablePadding
                  onClick={(e) =>
                    stateDisplayOptions[eachOp.id] != ""
                      ? onOpenUncollapse(e, eachOp.id)
                      : onNavigate(e, eachOp.handleFunction)
                  }
                >
                  <ListItemButton
                    key={"button" + eachOp.id}
                    className={`fullWidht center_vert list-item-button ${selectedOption === eachOp.id ? "selected" : ""}`}
                    sx={[
                      itemButtonSx,
                      { justifyContent: "center" },
                      selectedOption === eachOp.id && selectedSx,
                    ]}
                  >
                    <Tooltip
                      title={eachOp.title}
                      placement="right"
                      slots={{ transition: Zoom }}
                      arrow
                    >
                      <ListItemIcon
                        key={"icon" + eachOp.id}
                        className="fullWidht center_horz"
                        sx={{ minWidth: 40, color: "#fff" }}
                      >
                        {eachOp.icon}
                      </ListItemIcon>
                    </Tooltip>
                  </ListItemButton>
                </ListItem>
              )}
            </Box>
          ),
      )}
    </List>
  );
}
