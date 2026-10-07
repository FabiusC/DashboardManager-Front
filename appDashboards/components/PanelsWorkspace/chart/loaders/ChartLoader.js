import { alpha, Box, keyframes, Typography, useTheme } from "@mui/material"
import { Grid } from 'ldrs/react'
import 'ldrs/react/Grid.css'

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`

const ChartLoader = ({ height, message, size = 75, speed = 1.8 }) => {
  const theme = useTheme()
  const loaderColor = alpha(theme.palette.primary.main, 0.7)
  const ringColor = alpha(theme.palette.primary.main, 0.16)

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: height,
        minHeight: height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        // bgcolor: alpha(theme.palette.background.paper, 0.9),
        backgroundImage: `radial-gradient(circle at 20% 20%, ${alpha(theme.palette.primary.light, 0.08)} 0%, transparent 40%),
                          radial-gradient(circle at 80% 80%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 40%)`,
        borderRadius: 1,
        gap: message ? 2.5 : 0,
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: size + 36,
          height: size + 36,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: `1px dashed ${ringColor}`,
            animation: `${rotate} 5s linear infinite`,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: size + 16,
            height: size + 16,
            borderRadius: "50%",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          }}
        />
        <Grid size={size} speed={speed} color={loaderColor} />
      </Box>


      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            animation: `${pulse} 1.5s ease-in-out infinite`,
            fontWeight: 600,
            letterSpacing: 0.2,
            textAlign: "center",
            px: 1,
            fontSize: "1rem",
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  )
}

export default ChartLoader
