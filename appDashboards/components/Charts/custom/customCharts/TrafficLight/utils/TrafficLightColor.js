import React from "react";
import { Box, Stack } from "@mui/material";

export function TrafficLightColor({colors,color,value }) {

  return (
    <Stack direction="row" sx={{
      display:'flex',
      justifyContent:'space-between',
      alignContent:'center',
      justifyItems:'center'
    }}>
      <Box
        sx={{
          backgroundColor: colors[color], // Dinámico
          color: "#ffffff",
          padding: "10px 20px",
          border: "none",
          borderRadius: "50%",
          aspectRatio: 1 / 1,
          cursor: "pointer",
          width: "20px",
        }}
      ></Box>
     <Box>
      {value}
     </Box>
    </Stack>
  );
}

export default TrafficLightColor;
