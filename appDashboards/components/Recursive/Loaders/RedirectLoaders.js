import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const RedirectingLoader = () => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '400px',
      minWidth: '450px',
      maxWidth: '600px',
      padding: 4,
      margin: 2
    }}>
      <CircularProgress 
        size={80} 
        sx={{ 
          mb: 4,
          color: 'primary.main'
        }} 
      />
      <Typography 
        variant="h5" 
        color="primary.main" 
        gutterBottom
        sx={{ 
          fontWeight: 600,
          mb: 2
        }}
      >
        Redirigiendo...
      </Typography>
      <Typography 
        variant="body1" 
        color="text.secondary" 
        textAlign="center"
        sx={{
          fontSize: '1.1rem',
          lineHeight: 1.6
        }}
      >
        Por favor espera mientras te redirigimos a la nueva página
      </Typography>
    </Box>
  );
};

export default RedirectingLoader;
