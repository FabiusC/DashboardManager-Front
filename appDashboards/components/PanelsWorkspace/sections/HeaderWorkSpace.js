import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Fade } from '@mui/material';
import DatasourceInformation from '../components/DatasourceInformation';
import PanelWorkspaceToolbar from '../components/PanelWorkspaceToolbar';
import { ArrowBack, Save } from '@mui/icons-material';
import FieldsSelectionPanel from '../components/FieldsSelectionPanel';
import { useRouter } from 'next/router';
const HeaderWorkspace = ({
  setFieldToDelete,
  onOperationChange,
  panelTitle = "Panel sin título",
  isSaving = false,
}) => {
  const router = useRouter();

  const handleReturnIndex = () => {
    sessionStorage.removeItem('resourceId');
    sessionStorage.removeItem('resourceType');
    sessionStorage.removeItem('resourceName');
    router.push('/projects/folders/resources');
  }
  const [actions, setActions] = useState({
    return: {
      name: "returnIndex",
      label: "Volver",
      description: "Regresar al índice de paneles",
      icon: <ArrowBack />,
      state: { isLoading: false, isDisabled: false, isActive: true },
      action: () => {
        handleReturnIndex();
      }

    },
  });
  return (
    <Box
      sx={{
        boxSizing: 'border-box',
        gridArea: "header",
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid #e2e8f0",
        paddingTop: 0,
        paddingBottom: 0,
        flexDirection: "column",
        width: '100%',
        gap: 1.5,
        py: 1.5,
        px: 2,
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      {/* Primera fila: Título del panel, info de guardado y toolbar */}
      <Box sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 1,
        pl: 4, // Padding izquierdo adicional
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {/* Título del panel */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 4,
              height: 24,
              backgroundColor: 'primary.main',
              borderRadius: 2,
            }} />
            <Typography variant="h5" sx={{ 
              fontWeight: 700, 
              color: 'text.primary',
              fontSize: '1.5rem',
            }}>
              {panelTitle}
            </Typography>
          </Box>
          <DatasourceInformation />
          {/* Info de guardado */}
          <Fade in={isSaving}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              px: 2,
              py: 0.5,
              backgroundColor: 'primary.light',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'primary.main',
            }}>
              <CircularProgress size={14} thickness={4} color="primary" />
              <Typography variant="caption" sx={{ 
                color: 'primary.dark',
                fontWeight: 500,
                fontSize: '0.75rem',
              }}>
                Guardando...
              </Typography>
            </Box>
          </Fade>
        </Box>

        {/* Toolbar */}
        <PanelWorkspaceToolbar actions={actions} />
      </Box>


      {/* Tercera fila: Panel de selección de campos */}
      <Box sx={{
        width: '100%',
        px: 2,
        pl: 4, // Padding izquierdo adicional
      }}>
        <FieldsSelectionPanel
          setFieldToDelete={setFieldToDelete}
          onOperationChange={onOperationChange}
        />
      </Box>
    </Box>
  );
};

export default HeaderWorkspace;
