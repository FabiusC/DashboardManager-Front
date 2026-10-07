import { Box, Typography, useTheme } from "@mui/material"
import { keyframes } from "@mui/system"

const drawLine = keyframes`
  0% {
    stroke-dashoffset: 1000;
  }
  100% {
    stroke-dashoffset: 0;
  }
`

const fillBar = keyframes`
  0% {
    height: 0%;
  }
  100% {
    height: var(--target-height);
  }
`

const rotateSlice = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`

const fadeInUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`

const AnimatedChartLoader = ({
  height,
  chart_type = "mixed",
  message = "Generando gráfico...",
  primaryColor,
  secondaryColor,
}) => {
  const theme = useTheme()
  const primary = primaryColor || theme.palette.primary.main
  const secondary = secondaryColor || theme.palette.secondary.main

  const renderLineChart = () => (
    <Box sx={{ width: 200, height: 120, position: "relative" }}>
      <svg width="100%" height="100%" viewBox="0 0 200 120">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={primary} />
            <stop offset="100%" stopColor={secondary} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[20, 40, 60, 80, 100].map((y, index) => (
          <line
            key={index}
            x1="20"
            y1={y}
            x2="180"
            y2={y}
            stroke={theme.palette.divider}
            strokeWidth="0.5"
            opacity="0.5"
          />
        ))}

        {/* Animated line */}
        <polyline
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          points="20,80 50,40 80,60 110,20 140,50 170,30"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1000"
          sx={{
            animation: `${drawLine} 3s ease-in-out infinite`,
          }}
        />

        {/* Data points */}
        {[
          { x: 20, y: 80 },
          { x: 50, y: 40 },
          { x: 80, y: 60 },
          { x: 110, y: 20 },
          { x: 140, y: 50 },
          { x: 170, y: 30 },
        ].map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={primary}
            sx={{
              animation: `${fadeInUp} 0.5s ease-out forwards`,
              animationDelay: `${index * 0.2 + 1}s`,
              opacity: 0,
            }}
          />
        ))}
      </svg>
    </Box>
  )

  const renderBarChart = () => (
    <Box sx={{ display: "flex", alignItems: "end", gap: 1, height: 120, px: 2 }}>
      {[40, 80, 60, 100, 45, 75, 90, 55].map((targetHeight, index) => (
        <Box
          key={index}
          sx={{
            width: 16,
            backgroundColor: index % 2 === 0 ? primary : secondary,
            borderRadius: "2px 2px 0 0",
            "--target-height": `${targetHeight}%`,
            animation: `${fillBar} 1s ease-out forwards`,
            animationDelay: `${index * 0.1}s`,
            height: 0,
          }}
        />
      ))}
    </Box>
  )

  const renderPieChart = () => (
    <Box sx={{ position: "relative", width: 100, height: 100 }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="pieGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primary} />
            <stop offset="100%" stopColor={secondary} />
          </linearGradient>
        </defs>

        {/* Pie slices */}
        <circle
          cx="50"
          cy="50"
          r="30"
          fill="none"
          stroke="url(#pieGradient1)"
          strokeWidth="20"
          strokeDasharray="47 141"
          strokeDashoffset="0"
          transform="rotate(-90 50 50)"
          sx={{
            animation: `${rotateSlice} 2s ease-in-out infinite`,
          }}
        />
        <circle
          cx="50"
          cy="50"
          r="30"
          fill="none"
          stroke={secondary}
          strokeWidth="20"
          strokeDasharray="31 157"
          strokeDashoffset="-47"
          transform="rotate(-90 50 50)"
          opacity="0.7"
        />
        <circle
          cx="50"
          cy="50"
          r="30"
          fill="none"
          stroke={theme.palette.grey[300]}
          strokeWidth="20"
          strokeDasharray="63 125"
          strokeDashoffset="-78"
          transform="rotate(-90 50 50)"
          opacity="0.5"
        />
      </svg>
    </Box>
  )

  const renderMixedChart = () => (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
        {/* Mini bar chart */}
        <Box sx={{ display: "flex", alignItems: "end", gap: 1, height: 40 }}>
          {[60, 80, 40, 100].map((height, index) => (
            <Box
              key={index}
              sx={{
                width: 8,
                height: `${height}%`,
                backgroundColor: primary,
                borderRadius: "1px 1px 0 0",
                animation: `${fillBar} 1.5s ease-out infinite`,
                animationDelay: `${index * 0.2}s`,
                "--target-height": `${height}%`,
              }}
            />
          ))}
        </Box>

        {/* Mini line chart */}
        <svg width="60" height="40" viewBox="0 0 60 40">
          <polyline
            fill="none"
            stroke={secondary}
            strokeWidth="2"
            points="5,30 20,10 35,20 55,5"
            strokeLinecap="round"
            strokeDasharray="100"
            sx={{
              animation: `${drawLine} 2s ease-in-out infinite`,
            }}
          />
        </svg>

        {/* Mini pie */}
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r="15"
            fill="none"
            stroke={primary}
            strokeWidth="8"
            strokeDasharray="30 70"
            transform="rotate(-90 20 20)"
            sx={{
              animation: `${rotateSlice} 3s linear infinite`,
            }}
          />
        </svg>
      </Box>
    </Box>
  )

  const renderChart = () => {
    switch (chart_type) {
      case "line":
        return renderLineChart()
      case "bar":
        return renderBarChart()
      case "pie":
        return renderPieChart()
      default:
        return renderMixedChart()
    }
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: height,
        minHeight: height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: theme.palette.background.paper,
        borderRadius: 1,
        gap: 3,
      }}
    >
      {renderChart()}

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          animation: `${fadeInUp} 1s ease-out infinite alternate`,
          textAlign: "center",
          fontWeight: 500,
        }}
      >
        {message}
      </Typography>
    </Box>
  )
}

export default AnimatedChartLoader
