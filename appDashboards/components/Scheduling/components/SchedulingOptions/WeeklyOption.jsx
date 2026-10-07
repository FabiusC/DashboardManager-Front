import React from "react";

import { AccessTime } from "@mui/icons-material";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { setWeeklyTime, toggleWeekDay } from "../store/scheduleSlice";

const DAYS_OF_WEEK = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  0: "Domingo",
};

export default function WeeklyOption() {
  const dispatch = useDispatch();
  const { selectedWeekDays, weekTime } = useSelector(
    (state) => state.report.weekly,
  );
  return (
    <>
      {/* Select Days */}
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          gutterBottom
        >
          Selecciona los días:
        </Typography>
        <Stack
          direction="row"
          sx={{
            flexWrap: "wrap",
            gap: 0.75,
            height: "auto",
          }}
        >
          {Object.entries(DAYS_OF_WEEK).map(([key, value]) => (
            <Button
              key={key}
              variant={
                selectedWeekDays.includes(Number(key))
                  ? "contained"
                  : "outlined"
              }
              size="small"
              onClick={() => dispatch(toggleWeekDay(Number(key)))}
              sx={{
                flex: "1 1 auto",
                minWidth: 36,
                maxWidth: 80,
                fontSize: { xs: "0.7rem", sm: "0.875rem" },
                fontWeight: 500,
                height: 36,
                py: 1,
                px: { xs: 0.5, sm: 1 },
                whiteSpace: "nowrap",
              }}
            >
              {value}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* Execution Time */}
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
            id="week-time"
            type="time"
            size="small"
            value={weekTime}
            onChange={(e) => dispatch(setWeeklyTime(e.target.value))}
            sx={{ width: 144 }}
          />
        </Stack>
      </Box>
    </>
  );
}
