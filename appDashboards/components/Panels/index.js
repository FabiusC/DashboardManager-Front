import { useEffect, useState } from "react";
import { getRequest, } from "@helpers/dashboardAPI/genericRequest";
import { connect, useDispatch } from "react-redux";
import { pushNotification } from "@redux/actions";
import { Box, Typography, CircularProgress, Alert, AlertTitle } from "@mui/material";
import { styled, keyframes } from "@mui/system";

import processStylesConfig from "./utils/processStylesConfig";
import PanelContainer from "./components/Panel";





const Panel = (props) => {
  const [panel, setPanel] = useState({})
  const [panelStyles, setPanelStyles] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const idData = props.panelId
  const dispatch = useDispatch();

  const setUpInformation = async (id) => {
    if (!id) {
      setError("ID del panel no proporcionado");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let idData = { id: id }
      let data = await getRequest(dispatch, props.user[0].userID, '', '', 'panelViewMode', 'configuración del panel', { "panel_id": id });


      if (data ) {
        if (data.status == "error" ) {
          const errorMsg = data.status  || "Error en la respuesta del servidor";
          setError(errorMsg);
          return;
        }

        setPanel(data)
      } else {
        const errorMsg = "No se pudo obtener la información del panel";
        setError(errorMsg);
      }
    } catch (error) {
      const errorMsg = error.message || "Error al cargar la información del panel";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (idData) {
      setUpInformation(idData)
    }
  }, [idData])

  useEffect(() => {
    if (panel.setup) {
      const processedConfig = processStylesConfig(panel.setup)
      setPanelStyles(processedConfig)
    }
  }, [panel])




  return (
    <>
      {isLoading && (
        <Box
          sx={{
            width: '100%',
            minHeight: 400,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            backgroundColor: 'white',
          }}
        >
          <Typography sx={{ fontSize: 16, color: 'text.secondary' }}>
            Cargando información del panel
          </Typography>
          <CircularProgress size={40} thickness={4} color="primary" />
        </Box>
      )}

      {
        error && (
          <Box
            sx={{
              boxSizing: 'border-box',
              width: '100%',
              height: '100vh',
              minHeight: 400,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              px: 2,
              backgroundColor: 'white',
            }}
          >
            <Alert
              severity="error"
              variant="outlined"
              sx={{
                maxWidth: 480,
                width: '100%',
                borderRadius: 2,
                boxShadow: 1,
                p: 2,
              }}
            >
              <AlertTitle sx={{ typography: 'h6', mb: 1 }}>
                Ha ocurrido un error
              </AlertTitle>
              <Typography variant="body2" color="text.secondary">
                {error}
              </Typography>
            </Alert>
          </Box>
        )
      }
      {
        !isLoading && !error && panel && (
          <Box sx={{
            width: "100%",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
          }}>
            <PanelContainer panelStyles={panelStyles} panel={panel} />
          </Box>
        )
      }


    </>
  )
}

const mapStateToProps = (state) => ({
  user: state.user,
});

export default connect(mapStateToProps)(Panel);
