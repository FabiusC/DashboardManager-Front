import {
  GaugeContainer,
  GaugeReferenceArc,
  GaugeValueArc,
  GaugeValueText,
  gaugeClasses,
} from "@mui/x-charts/Gauge";
import { formatValue } from "./util/formatValueText";

export default function GaugeChart(props) {
  // Get styles directly from props
  const value = props.value ?? 0;

  const range = props.calculatedRange ?? {
    min: 0,
    max: 100,
  };

  const startAngle = Number(props.startAngle ?? -110);
  const endAngle = Number(props.endAngle ?? 110);
  const cornerRadius = Number(props.cornerRadius ?? 5);

  const outerRadius = Number(props.outerRadius ?? 80);

  const margin = {
    top: Number(props.margin?.top ?? 20),
    right: Number(props.margin?.right ?? 20),
    bottom: Number(props.margin?.bottom ?? 20),
    left: Number(props.margin?.left ?? 20),
  };

  // Extract color array
  const dataColors = props.panel?.colorStrategy?.preset_palette?.colors ?? [];

  // Validate colors
  const mainColor =
    props.panel?.data?.colorStrategy?.preset_palette?.base_color ??
    dataColors[0] ??
    "#4d52ff"; // Fallback  if there is no more than one color

  const referenceColor = dataColors[1] ?? "#fcff47";

  return (
    <GaugeContainer
      startAngle={startAngle}
      endAngle={endAngle}
      cornerRadius={cornerRadius}
      outerRadius={outerRadius}
      margin={margin}
      value={value}
      valueMin={range.min}
      valueMax={range.max}
    >
      <GaugeReferenceArc sx={{ fill: mainColor }} />
      <GaugeValueArc sx={{ fill: referenceColor }} />
      <GaugeValueText
        text={({ value }) => formatValue(value)}
        sx={{
          [`& .${gaugeClasses.valueText} text`]: { fill: "#333333" },
        }}
      />
    </GaugeContainer>
  );
}
