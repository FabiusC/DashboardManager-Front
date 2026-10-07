import { Box, Typography, useTheme } from "@mui/material"
import { keyframes } from "@mui/system"

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`

const ChartSkeletonLoader = ({
  height,
  chart_type = "bar",
  message = "Cargando gráfico...",
}) => {
  const theme = useTheme()

  const renderChartSkeleton = () => {
    switch (chart_type) {
      case "bar":
        return (
          <Box sx={{ display: "flex", alignItems: "end", gap: 1, height: 120, px: 2 }}>
            {[40, 80, 60, 100, 45, 75, 90].map((height, index) => (
              <Box
                key={index}
                sx={{
                  width: 20,
                  height: `${height}%`,
                  background: `linear-gradient(90deg, ${theme.palette.grey[200]} 0px, ${theme.palette.grey[100]} 40px, ${theme.palette.grey[200]} 80px)`,
                  backgroundSize: "200px",
                  animation: `${shimmer} 1.5s ease-in-out infinite`,
                  borderRadius: "2px 2px 0 0",
                  animationDelay: `${index * 0.1}s`,
                }}
              />
            ))}
          </Box>
        )

      case "line":
        return (
          <Box sx={{ position: "relative", height: 120, px: 2 }}>
            <svg width="100%" height="100%" viewBox="0 0 300 120">
              <defs>
                <linearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={theme.palette.grey[200]} />
                  <stop offset="50%" stopColor={theme.palette.grey[100]} />
                  <stop offset="100%" stopColor={theme.palette.grey[200]} />
                  <animateTransform
                    attributeName="gradientTransform"
                    type="translate"
                    values="-100 0;100 0;-100 0"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke="url(#shimmerGradient)"
                strokeWidth="3"
                points="20,80 60,40 100,60 140,20 180,50 220,30 260,70"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {[20, 60, 100, 140, 180, 220, 260].map((x, index) => (
                <circle
                  key={index}
                  cx={x}
                  cy={[80, 40, 60, 20, 50, 30, 70][index]}
                  r="4"
                  fill="url(#shimmerGradient)"
                  sx={{
                    animation: `${pulse} 1.5s ease-in-out infinite`,
                    animationDelay: `${index * 0.2}s`,
                  }}
                />
              ))}
            </svg>
          </Box>
        )

      case "pie":
        return (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 120 }}>
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: `conic-gradient(
                  ${theme.palette.grey[200]} 0deg 90deg,
                  ${theme.palette.grey[100]} 90deg 180deg,
                  ${theme.palette.grey[200]} 180deg 270deg,
                  ${theme.palette.grey[100]} 270deg 360deg
                )`,
                animation: `${pulse} 2s ease-in-out infinite`,
                position: "relative",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 40,
                  height: 40,
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: "50%",
                },
              }}
            />
          </Box>
        )

      default:
        return (
          <Box sx={{ display: "flex", alignItems: "end", gap: 1, height: 120, px: 2 }}>
            {[40, 80, 60, 100, 45, 75, 90].map((height, index) => (
              <Box
                key={index}
                sx={{
                  width: 20,
                  height: `${height}%`,
                  background: `linear-gradient(90deg, ${theme.palette.grey[200]} 0px, ${theme.palette.grey[100]} 40px, ${theme.palette.grey[200]} 80px)`,
                  backgroundSize: "200px",
                  animation: `${shimmer} 1.5s ease-in-out infinite`,
                  borderRadius: "2px 2px 0 0",
                  animationDelay: `${index * 0.1}s`,
                }}
              />
            ))}
          </Box>
        )
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
        position: "relative",
        overflow: "hidden",
      }}
    >

      {/* Chart skeleton */}
      <Box sx={{ flex: 1, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {renderChartSkeleton()}
      </Box>

      {/* Loading message */}
      <Box sx={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)" }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            animation: `${pulse} 1.5s ease-in-out infinite`,
            fontWeight: 500,
          }}
        >
          {message}
        </Typography>
      </Box>
    </Box>
  )
}

export default ChartSkeletonLoader
