import { nivoNumberFormat } from "./numberFormatter";

const DEFAULT_AXES = ["axisLeft", "axisRight", "axisBottom"];

const isEnabled = (value) => value === true || value === "true";

export const buildAxisValueFormatProps = ({
  styles = {},
  liveChartProps = {},
  axes = DEFAULT_AXES,
} = {}) => {
  const formattedAxes = {};

  for (const axis of axes) {
    const liveAxis = liveChartProps?.[axis] ?? {};
    const styleAxis = styles?.[axis] ?? {};
    const enableAxisValueFormat = liveAxis.enableAxisValueFormat ?? styleAxis.enableAxisValueFormat ?? liveChartProps?.enableAxisValueFormat ?? styles?.enableAxisValueFormat;

    if (!isEnabled(enableAxisValueFormat)) continue;

    formattedAxes[axis] = {
      format: nivoNumberFormat(),
    };
  }

  return formattedAxes;
};
