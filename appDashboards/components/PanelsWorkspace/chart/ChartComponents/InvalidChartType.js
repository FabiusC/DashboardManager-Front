import { Typography, Box } from "@mui/material";

const InvalidChartType = ({ size = 50 }) => {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: "8px",
        padding: 3,
        backgroundColor: "transparent",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
          maxWidth: "400px",
          textAlign: "center",
        }}
      >
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            color: "text.secondary",
            fontSize: "0.95rem",
          }}
        >
          Tipo de gráfica no válida
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            opacity: 0.9,
          }}
        >
          No se reconoce el tipo de gráfica configurado para este panel.
        </Typography>
      </Box>
    </Box>
  );
};

export default InvalidChartType;
