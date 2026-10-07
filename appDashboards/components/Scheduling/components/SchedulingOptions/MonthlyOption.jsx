import React from "react";

import { AccessTime } from "@mui/icons-material";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { setMonthlyTime, toggleMonthDay } from "../store/scheduleSlice";

function DayGrid() {
      const dispatch = useDispatch();
  const { selectedMonthDays } = useSelector(
    (state) => state.report.monthly,
  );
  return (
    <Box
      sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.75 }}
    >
      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
        <Button
          key={d}
          variant={selectedMonthDays.includes(Number(d)) ? "contained" : "outlined"}
          onClick={() => dispatch(toggleMonthDay(Number(d)))}
          sx={{ minWidth: 0, fontSize: 16, fontWeight: 500, height: 36, p: 0 }}
        >
          {d}
        </Button>
      ))}
    </Box>
  );
}

export default function MonthlyOption() {
  const dispatch = useDispatch();
  const { selectedMonthDays, monthTime } = useSelector(
    (state) => state.report.monthly,
  );
  return (
    <>
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          gutterBottom
        >
          Selecciona los días del mes: 
        </Typography>
        <DayGrid selected={selectedMonthDays} onToggle={toggleMonthDay} />
      </Box>

      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          gutterBottom
        >
          Hora de ejecución: 
        </Typography>
        <Stack direction="row" alignItems="center" spacing={1}>
          <TextField
            id="month-time"
            type="time"
            size="small"
            value={monthTime}
            onChange={(e) => dispatch(setMonthlyTime(e.target.value))}
            sx={{ width: 144 }}
          />
        </Stack>
      </Box>
    </>
  );
}
