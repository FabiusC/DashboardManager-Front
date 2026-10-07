import { Box, Typography } from "@mui/material";
import { getBorderStyles, getBackgroundStyles, getTitleStyles, getDescriptionStyles } from "../utils/getStyles";

import Chart from './Chart'

const PanelContainer = (props) => {
  const { panelStyles, panel } = props;

  if (!panelStyles) return null;
  // Validar si panelStyles es un objeto vacío
  if (Object.keys(panelStyles).length === 0 && panelStyles.constructor === Object) {
    return null;
  }

  const borderStyles = panelStyles?.externalBorder
    ? getBorderStyles(panelStyles.externalBorder)
    : {};

  const backgroundStyles = panelStyles?.background
    ? getBackgroundStyles(panelStyles.background)
    : {};

  const titleStyles = panelStyles?.title
    ? getTitleStyles(panelStyles.title)
    : {};

  const visibilityModeText = panelStyles?.description?.visibilityModeText;

  const descriptionStyles = visibilityModeText
    ? getDescriptionStyles(visibilityModeText)
    : {};

  return (
    <Box
      sx={{
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100vh",

        ...borderStyles
      }}
    >
      <Box sx={{
        height: "100px",
      }}>
        <Typography sx={{ ...titleStyles, p: 1, height: "60%" }}>
          {panel.title}
        </Typography>
        <Typography sx={{ ...descriptionStyles, p: 1, pt: 0, height: "40%" }}>
          {panel.description}
        </Typography>
      </Box>
      <Box sx={{
        flex: 1,
        ...backgroundStyles,
        // position: 'absolute'
      }}>
        <Typography variant="h4" >
        </Typography>
        <Chart panel={panel} />
      </Box>
    </Box>
  )
}

export default PanelContainer;