"use client";
import React from "react";
import { connect } from "react-redux";
import { ArrowBack, CalendarMonth } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import SchedulingBreadcrumb from "../components/SchedulingBreadcrumb";
import moment from "moment";
import "moment/locale/es";
import UpdateScheduleForm from "../components/updateReport";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "../components/store/store";
moment.locale("es");

function Report(props) {
  const globalDispatch = useDispatch();
  return (
    <Box sx={{ m: 2, display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Título */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <CalendarMonth sx={{ color: "primary.main" }} />
        <Typography variant="h6" fontWeight={500}>
          Detalles del reporte
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Visualiza y modifica los detalles del evento programado
      </Typography>

      {/* Breadcrumb */}
      <Box
        sx={{
          mb: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <SchedulingBreadcrumb activeItem="report" />
        <Button
          onClick={() => window.history.back()}
          startIcon={
            <ArrowBack
              sx={{ fontSize: 18, transition: "transform 180ms ease" }}
            />
          }
          sx={{
            textTransform: "none",
            fontWeight: 500,
            fontSize: "0.75rem",
            color: "primary.main",
            border: "1px solid",
            borderColor: "primary.main",
            px: 1.5,
            py: 0.6,
            minWidth: 0,
            borderRadius: 1.5,
            "&:hover": {
              backgroundColor: "primary.main",
              color: "white",
              "& .MuiSvgIcon-root": {
                transform: "translateX(-3px)",
              },
            },
          }}
        >
          Volver
        </Button>
      </Box>

      {/* Cuadro blanco */}
      <Box
        sx={{
          backgroundColor: "white",
          height: "calc(100vh - 280px)",
          borderRadius: 3,
          border: "1px solid #e0e0e0",
          p: 3,
          overflow: "auto",
        }}
      >
        <UpdateScheduleForm globalDispatch={globalDispatch} user={props.user} />
      </Box>
    </Box>
  );
}

const mapStateToProps = (state) => ({
  user: state.user,
  organization: state.organization,
});

export default connect(mapStateToProps)(Report);
