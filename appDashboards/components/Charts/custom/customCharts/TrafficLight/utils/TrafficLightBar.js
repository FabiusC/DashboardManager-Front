import React from "react";
import { Box } from "@mui/material";
import { margin } from "@mui/system";

export function TrafficLightBar({colors,ranges }) {
  
  const numberFormat = (value) => {
    const isNumeric = value != null && value !== '' && !isNaN(Number(value));
    return isNumeric ? new Intl.NumberFormat('es-ES', { useGrouping: true }).format(value) : value;
  }
        
  return (
      <Box
        sx={{
          width: "100%",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "10px",
            display: "flex",
            flex: "1 1 auto",
          }}
        >
          <Box
            sx={{
              width: "100%",
              backgroundColor:colors.green,
            }}
          ></Box>

          <Box
            sx={{
              width: "100%",
              backgroundColor:colors.yellow,
            }}
          ></Box>
          <Box
            sx={{
              width: "100%",
              backgroundColor:colors.red,
            }}
          ></Box>
        </Box>
        <Box
          sx={{
            width: "100%",
            height: "20px",
            display: "flex",
            flex: "1 1 auto",
          }}
        >
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{numberFormat(ranges.unique_green_max)}</span>
            <span style={{margin:'0 3px'}}>{numberFormat(ranges.unique_green_min)}</span>
          </Box>

          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{margin:'0 3px'}}>{ranges.unique_yellow_max === ranges.unique_green_min || ranges.unique_yellow_max === 0  ? '' :  numberFormat(ranges.unique_yellow_max)}</span>
            <span style={{margin:'0 3px'}}>{numberFormat(ranges.unique_yellow_min)}</span>
          </Box>
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
           <span style={{margin:'0 3px'}}>{ranges.unique_red_max === ranges.unique_yellow_min || ranges.unique_red_max === 0  ? '' :  numberFormat(ranges.unique_red_max)}</span>
            <span>{numberFormat(ranges.unique_red_min)}</span>
          </Box>
        </Box>
      </Box>
  );
}

export default TrafficLightBar;
