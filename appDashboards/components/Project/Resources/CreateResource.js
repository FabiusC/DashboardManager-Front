import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Dialog,
  DialogTitle,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import RedirectingLoader from '@components/Recursive/Loaders/RedirectLoaders';

const CreateProduct = ({ open, onClose, onSelectOption, isRedirecting = false }) => {
  const handleOptionSelect = (option) => {
    if (!isRedirecting) {
      onSelectOption(option);
    }
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={isRedirecting ? undefined : onClose} 
        maxWidth="md" 
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              minHeight: '350px',
              maxWidth: '700px',
              width: 'auto'
            }
          }
        }}
      >

      <Box sx={{ p: 3 }}>
        {isRedirecting ? (
          // Loading state
          <RedirectingLoader/>
        ) : (
          // Options state
          <>
            <Typography variant="body1" sx={{ textAlign: 'center', mb: 3, color: 'text.secondary' }}>
              Inicia la creación de tu recurso aquí
            </Typography>     
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                <Card 
                  sx={{ 
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    }
                  }}
                >
                  <CardActionArea 
                    onClick={() => handleOptionSelect('panel')}
                    sx={{ height: '100%', p: 2 }}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <BarChartIcon 
                        sx={{ 
                          fontSize: 60, 
                          color: 'primary.main', 
                          mb: 2 
                        }} 
                      />
                      <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
                        Crear Panel
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Selecciona para crear un nuevo panel de visualización con gráficos y datos. 
                        Los paneles permiten analizar información de manera interactiva.
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>

                <Card 
                  sx={{ 
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    }
                  }}
                >
                  <CardActionArea 
                    onClick={() => handleOptionSelect('dashboard')}
                    sx={{ height: '100%', p: 2 }}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <DashboardIcon 
                        sx={{ 
                          fontSize: 60, 
                          color: 'primary.main', 
                          mb: 2 
                        }} 
                      />
                      <Typography variant="h6" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
                        Crear Tablero
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Selecciona para crear un nuevo tablero de control con múltiples paneles. 
                        Los tableros permiten organizar y visualizar información de manera integral.
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Box>
          </>
        )}
      </Box>
    </Dialog>
    </>
  );
};

export default CreateProduct; 