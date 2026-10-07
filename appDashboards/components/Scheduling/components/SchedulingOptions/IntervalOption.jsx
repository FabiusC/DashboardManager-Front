import { useMemo, useCallback, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  FormControl,
  Grid,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { setIntervalField } from "../store/scheduleSlice";
import { NumberField } from "@creangel/ifindit-ui";

const IntervalOption = ({}) => {
  const dispatch = useDispatch();
  const { days, hours, minutes, seconds } = useSelector(
    (state) => state.report.interval,
  );
  return (
    <>
      {/* Recurring Every */}
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          gutterBottom
        >
          Recurrente cada:
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {" "}
          {[
            {
              label: "Días",
              value: days,
              set: (value) =>
                dispatch(setIntervalField({ key: "days", value: value })),
            },
            {
              label: "Horas",
              value: hours,
              set: (value) =>
                dispatch(setIntervalField({ key: "hours", value: value })),
            },
            {
              label: "Minutos",
              value: minutes,
              set: (value) =>
                dispatch(setIntervalField({ key: "minutes", value: value })),
            },
            {
              label: "Segundos",
              value: seconds,
              set: (value) =>
                dispatch(setIntervalField({ key: "seconds", value: value })),
            },
          ].map((f) => (
            <Box key={f.label} sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                gutterBottom
              >
                {f.label}
              </Typography>
              <NumberField
                size="small"
                fullWidth
                inputProps={{ style: { textAlign: "center" } }}
                value={f.value === 0 ? null : f.value}
                onChange={(value) => f.set(value ?? 0)}
                onFocus={(e) => e.target.select()}
                placeholder="0"
              />
            </Box>
          ))}
        </Box>
      </Box>
      {/* Desface inhabilitado */}
      {/* Offset */}
      {/*       <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          gutterBottom
        >
          Desfase:
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <TextField
            type="number"
            size="small"
            inputProps={{ min: 0, style: { textAlign: "center" } }}
            value={offsetValue}
            onChange={(e) =>
              dispatch(
                setIntervalField({
                  key: "offsetValue",
                  value: Number(e.target.value),
                }),
              )
            }
            sx={{ width: 96 }}
          />
          <FormControl size="small" sx={{ width: 96 }}>
            <Select
              value={offsetUnit}
              onChange={(e) =>
                dispatch(
                  setIntervalField({
                    key: "offsetUnit",
                    value: e.target.value,
                  }),
                )
              }
            >
              <MenuItem value="min">Minutos</MenuItem>
              <MenuItem value="sec">Segundos</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box> */}
    </>
  );
};

export default IntervalOption;
