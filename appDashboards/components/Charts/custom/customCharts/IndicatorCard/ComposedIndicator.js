import { Box, Typography, Grid } from "@mui/material";
import { getTextAlignValue } from "./utils/alignTextFormatter";

function MultiValueIndicator(props) {
  const data = props?.data ?? [];
  const styles = props?.styles ?? {};
  const margin = props?.marginChart ?? 0;
  const valueAlignment =  props?.valueStylesText?.textAlign || "left";
  const titleAlignment =  props?.titleStylesText?.titleAlignment || "center";
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        color: "#333",
        backgroundColor: 'transparent',
        marginTop: `${margin.marginTop ?? 0}px`,
        marginRight: `${margin.marginRight ?? 0}px`,
        marginBottom: `${margin.marginBottom ?? 0}px`,
        marginLeft: `${margin.marginLeft ?? 0}px`,
      }}
    >
      <Box>
        <Grid container spacing={2} direction="column">
          {data.map((item, index) => (
            <Grid item xs={12} key={index}>
              <Typography
                variant="subtitle1"
                component="div"
                color="textSecondary"
                sx={{
                  textAlign: getTextAlignValue(titleAlignment),
                  ...styles.titleStylesText,
                }}
              >
                {item.title}
              </Typography>
              <Typography
                variant="h6"
                component="div"
                fontWeight="bold"
                sx={{
                  textAlign: getTextAlignValue(valueAlignment),
                  ...styles.valueStylesText,
                }}
              >
                {item.value}
                {item.unit && (
                  <span style={{ fontSize: "0.8em", marginLeft: "4px" }}>
                    {item.unit}
                  </span>
                )}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}

export default MultiValueIndicator;