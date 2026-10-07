import { Typography, Box } from '@mui/material'

const ErrorFieldConfiguration = ({ message = "Falló las configuraciones de los campos", size = 80, isDataError = false }) => {
  const errorMessage = isDataError ? "Error al cargar los datos" : message;
  
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 235, 238, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Box
        className="error-data-container"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h1"
            sx={{
              color: '#d32f2f',
              fontWeight: 700,
              fontSize: size,
              lineHeight: 1,
              mb: 1,
              fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
            }}
          >
            ×
          </Typography>
        </Box>
        <div className="error-text-container">
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              color: '#d32f2f',
              letterSpacing: '0.025em',
              mb: '12px',
              textShadow: '0 1px 2px rgba(244, 67, 54, 0.08)',
              fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
            }}
          >
            {errorMessage}
          </Typography>
        </div>
      </Box>
    </Box>
  )
}

export default ErrorFieldConfiguration;
