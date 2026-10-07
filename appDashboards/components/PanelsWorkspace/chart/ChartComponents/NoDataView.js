import { Typography, Box } from '@mui/material'

const NoDataView = ({ message = "No hay datos disponibles", size = 80 }) => {
  const staticPrefix = process.env.staticPrefix;
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '8px',
        padding: 3,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2.5,
          maxWidth: '400px',
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.6,
          }}
        >
          <img
            src={staticPrefix + '/img/magnifying_glass_ifindit.png'}
            alt="Sin datos"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              objectFit: 'contain',
            }}
          />
        </Box>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 500,
            color: '#64748b',
            fontSize: '0.95rem',
            lineHeight: 1.5,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          {message}
        </Typography>
      </Box>
    </Box>
  )
}
export default NoDataView;
