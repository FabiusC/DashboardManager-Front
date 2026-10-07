import React, { useEffect, useRef, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Divider,
  Button,
  Select,
  MenuItem,
  FormControl,
  Autocomplete,
  useTheme,
} from "@mui/material";
import {
  CheckCircle,
  ErrorRounded,
  InfoOutlined,
  Timer as TimerIcon,
} from "@mui/icons-material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EventNoteIcon from "@mui/icons-material/EventNote";
import {
  SelectField,
  TextField as TextFieldUi,
  TextareaField,
} from "@creangel/ifindit-ui";
import IntervalOption from "./SchedulingOptions/IntervalOption";
import WeeklyOption from "./SchedulingOptions/WeeklyOption";
import MonthlyOption from "./SchedulingOptions/MonthlyOption";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./store/store";
import { debounce } from "lodash";
import {
  resetReport,
  setField,
  setRecipients,
  setTaskTypeId,
  updateRecipientType,
} from "./store/scheduleSlice";
import { getSchedulesTaskTypes } from "@components/PanelsWorkspace/hooks/useScheduleData";
import { DashboardFiltersSection } from "./SchedulingOptions/FilterChip";
import { alpha } from "@mui/system";
import { useScheduleManager } from "../hooks/useScheduleManager";
import { useEmailsList } from "../utils/useEmailsList";

const emails = ["svangegas@creangel.com", "dpenagos@creangel.com"];
const TAB_INDEX_TO_TYPE_NAME = {
  0: "interval",
  1: "days_of_the_week",
  2: "days_of_the_month",
  3: "cron_string",
};
const DAY_NAMES = {
  0: "lunes",
  1: "martes",
  2: "miércoles",
  3: "jueves",
  4: "viernes",
  5: "sábado",
  6: "domingo",
};
const Footer = ({ isLoading, data, handleClose, handleCreate }) => {
  const theme = useTheme();
  const isSuccess = data?.status === "success" || data?.status === "ok";
  const isError = data?.status === "error" || data?.status === "err";
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: "1 1 100%",
        overflowX: "hidden",
        gap: 2,
      }}
    >
      {/* Mensaje de respuesta */}
      {data && (
        <Box
          sx={{
            p: 2,
            backgroundColor: alpha(
              isSuccess ? theme.palette.success.main : theme.palette.error.main,
              0.08,
            ),
            borderRadius: 1.5,
            borderLeft: `3px solid ${isSuccess ? theme.palette.success.main : theme.palette.error.main}`,
            mb: 2,
            width: "100%",
            flex: "flex-1",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {isSuccess ? (
              <CheckCircle
                sx={{ fontSize: 24, color: theme.palette.success.main }}
              />
            ) : (
              <ErrorRounded
                sx={{ fontSize: 24, color: theme.palette.error.main }}
              />
            )}
            <Typography variant="body2">
              {isSuccess
                ? "El programa fue creado exitosamente"
                : data?.msg || "Ocurrió un error al crear el programa"}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Botones */}
      <DialogActions sx={{ p: 0 }}>
        {isSuccess ? (
          <Button
            variant="contained"
            color="primary"
            disableElevation
            sx={{ px: 4 }}
            onClick={handleClose}
          >
            Aceptar
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} variant="text" color="inherit">
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="primary"
              disableElevation
              sx={{ px: 4 }}
              onClick={handleCreate}
              disabled={isLoading}
            >
              {isLoading ? (
                "Creando..."
              ) : isError ? (
                <>
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    Reintentar
                  </Box>
                  <Box
                    component="span"
                    sx={{ display: { xs: "inline", sm: "none" } }}
                  >
                    Reintentar
                  </Box>
                </>
              ) : (
                <>
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    Crear programa
                  </Box>
                  <Box
                    component="span"
                    sx={{ display: { xs: "inline", sm: "none" } }}
                  >
                    Crear
                  </Box>
                </>
              )}
            </Button>
          </>
        )}
      </DialogActions>
    </Box>
  );
};
const ScheduleSpecificationForm = () => {
  const dispatch = useDispatch();
  const tabValue = useSelector((state) => state.report.tab);
  const taskId = useSelector((state) => state.report.schedule_task_type_id);
  const { days, hours, minutes, seconds } = useSelector(
    (state) => state.report.interval,
  );
  const weekly = useSelector((state) => state.report.weekly);
  const monthly = useSelector((state) => state.report.monthly);
  const apiResponse = getSchedulesTaskTypes();
  const taskTypes = apiResponse?.data?.results || [];

  const message = (() => {
    if (tabValue === 0) {
      const parts = [
        days > 0 && `${days} día${days > 1 ? "s" : ""}`,
        hours > 0 && `${hours} hora${hours > 1 ? "s" : ""}`,
        minutes > 0 && `${minutes} minuto${minutes > 1 ? "s" : ""}`,
        seconds > 0 && `${seconds} segundo${seconds > 1 ? "s" : ""}`,
      ].filter(Boolean);

      if (parts.length === 0)
        return { text: "Configura el intervalo de envío", warning: null };

      const totalSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds;
      const isValid = totalSeconds >= 900;

      return {
        text: `Los reportes se enviarán cada ${parts.join(", ")}`,
        warning: !isValid
          ? "El intervalo debe ser igual o superior a 15 minutos"
          : null,
      };
    }
    if (tabValue === 1) {
      const dayNames = weekly.selectedWeekDays.map((d) => DAY_NAMES[d] || d);
      return {
        text:
          dayNames.length > 0
            ? `Los reportes se enviarán los ${dayNames.join(", ")} a las ${weekly.weekTime || "--:--"}`
            : "Selecciona los días de la semana",
        warning: null,
      };
    }
    if (tabValue === 2) {
      return {
        text:
          monthly.selectedMonthDays.length > 0
            ? `Los reportes se enviarán los días ${monthly.selectedMonthDays.join(", ")} de cada mes a las ${monthly.monthTime || "--:--"}`
            : "Selecciona los días del mes",
        warning: null,
      };
    }
  })();
  useEffect(() => {
    if (taskTypes.length === 0) return;

    if (!taskId) {
      const defaultType = taskTypes.find((t) => t.type === "interval");
      if (defaultType) {
        dispatch(setTaskTypeId({ tabIndex: 0, typeId: defaultType.id }));
      }
      return;
    }

    const currentTypeName = TAB_INDEX_TO_TYPE_NAME[tabValue];
    const currentType = taskTypes.find((t) => t.type === currentTypeName);
    if (currentType && taskId.typeId !== currentType.id) {
      dispatch(setTaskTypeId({ tabIndex: tabValue, typeId: currentType.id }));
    }
  }, [taskTypes, tabValue]);

  const handleTabChange = (event, newValue) => {
    const targetTypeName = TAB_INDEX_TO_TYPE_NAME[newValue];
    const matchedType = taskTypes.find((item) => item.type === targetTypeName);
    if (matchedType) {
      dispatch(setField({ key: "tab", value: newValue }));
      dispatch(
        setTaskTypeId({
          tabIndex: newValue,
          typeId: matchedType.id,
        }),
      );
    }
  };

  return (
    <Box
      sx={{
        height: "32rem",
        overflowY: { xs: "auto", sm: "hidden" },
        overflowX: "hidden",
        "&::-webkit-scrollbar": {
          width: 4,
        },
        "&::-webkit-scrollbar-track": {
          background: "transparent",
        },
        "&::-webkit-scrollbar-thumb": {
          background: "rgba(0,0,0,0.15)",
          borderRadius: 2,
        },
      }}
    >
      <Typography variant="overline" fontWeight="700" color="text.secondary">
        Especificación de horario
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          mb: 1.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1,
            backgroundColor: "rgba(33, 150, 243, 0.05)",
            borderRadius: 1,
            border: "1px solid rgba(33, 150, 243, 0.15)",
          }}
        >
          <InfoOutlined sx={{ fontSize: 16, color: "info.main" }} />
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontSize: "0.875rem" }}
          >
            {message?.text}
          </Typography>
        </Box>

        {message?.warning && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 1,
              backgroundColor: "rgba(237, 108, 2, 0.05)",
              borderRadius: 1,
              border: "1px solid rgba(237, 108, 2, 0.3)",
            }}
          >
            <InfoOutlined sx={{ fontSize: 16, color: "warning.main" }} />
            <Typography
              variant="body2"
              sx={{
                color: "warning.dark",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              {message.warning}
            </Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ display: "flex", gap: 1, mt: 1, mb: 0, flexWrap: "wrap" }}>
        {[
          {
            label: "Intervalo",
            desc: "Cada X días, horas o minutos",
            index: 0,
            icon: <TimerIcon sx={{ fontSize: 20 }} />,
          },
          {
            label: "Semanal",
            desc: "Días específicos de la semana",
            index: 1,
            icon: <CalendarMonthIcon sx={{ fontSize: 20 }} />,
          },
          {
            label: "Mensual",
            desc: "Días específicos del mes",
            index: 2,
            icon: <EventNoteIcon sx={{ fontSize: 20 }} />,
          },
        ].map((opt) => (
          <Box
            key={opt.index}
            onClick={() => handleTabChange(null, opt.index)}
            sx={{
              flex: { xs: "1 1 100%", sm: "1 1 0" },
              border: tabValue === opt.index ? "2px solid" : "0.5px solid",
              borderColor: tabValue === opt.index ? "#7F77DD" : "divider",
              borderRadius: 2,
              p: 1.5,
              cursor: "pointer",
              bgcolor: tabValue === opt.index ? "#EEEDFE" : "background.paper",
            }}
          >
            <Box
              sx={{
                color: tabValue === opt.index ? "#534AB7" : "text.secondary",
                mb: 0.5,
              }}
            >
              {opt.icon}
            </Box>
            <Typography
              fontWeight={500}
              fontSize="0.875rem"
              sx={{
                color: tabValue === opt.index ? "#3C3489" : "text.primary",
              }}
            >
              {opt.label}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: tabValue === opt.index ? "#534AB7" : "text.secondary",
              }}
            >
              {opt.desc}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ py: 3 }}>
        {/* Renderizado dinámico de secciones según tabValue */}
        {tabValue === 0 && <IntervalOption />}
        {tabValue === 1 && <WeeklyOption />}
        {tabValue === 2 && <MonthlyOption />}
      </Box>
    </Box>
  );
};
const EmailConfigurationForm = () => {
  const dispatch = useDispatch();
  const { subject, body, recipients } = useSelector((state) => state.report);
  const handleTypeChange = (email, newType) => {
    dispatch(updateRecipientType({ email, type: newType }));
  };
  const { emails, isLoadingList, handleGetEmailsList } = useEmailsList();
  const isMounted = useRef(false);
  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        if (!isMounted.current) return;
        handleGetEmailsList({
          showLoading: false,
          searchValue: value ?? "",
          sortField: "email",
          sortDirection: "asc",
        });
      }, 400),
    [handleGetEmailsList],
  );

  useEffect(() => {
    handleGetEmailsList({
      showLoading: true,
      sortField: "email",
      sortDirection: "asc",
      searchValue: "",
    });
    isMounted.current = true;
  }, []);
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="overline"
        fontWeight="700"
        color="text.secondary"
        gutterBottom
      >
        Configuración de Correo
      </Typography>

      <Box sx={{ mt: 2, mb: 3 }}>
        <Autocomplete
          multiple
          freeSolo
          options={emails}
          loading={isLoadingList}
          value={recipients.map((r) => r.email)}
          filterOptions={(x) => x}
          isOptionEqualToValue={(option, value) => {
            const optionEmail =
              typeof option === "string" ? option : option.email;
            const valueEmail = typeof value === "string" ? value : value.email;
            return optionEmail === valueEmail;
          }}
          getOptionLabel={(option) =>
            typeof option === "string" ? option : option.email
          }
          onInputChange={(_, newInputValue) => {
            debouncedSearch(newInputValue);
          }}
          onChange={(_, newValue) => {
            if (newValue.length < recipients.length) {
              const updatedRecipients = newValue
                .map((item) => {
                  const email = typeof item === "string" ? item : item.email;
                  const existing = recipients.find((r) => r.email === email);
                  return existing || { email, type: "to" };
                })
                .filter(Boolean);
              dispatch(setRecipients(updatedRecipients));
              return;
            }
            const lastAdded = newValue[newValue.length - 1];
            if (!lastAdded) return;
            const lastEmail =
              typeof lastAdded === "string" ? lastAdded : lastAdded.email;
            if (recipients.find((r) => r.email === lastEmail)) return;

            const updatedRecipients = newValue
              .map((item) => {
                const email = typeof item === "string" ? item : item.email;
                const existing = recipients.find((r) => r.email === email);
                return existing || { email, type: "to" };
              })
              .filter(Boolean);

            dispatch(setRecipients(updatedRecipients));
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label="Destinatarios"
              required={recipients.length === 0}
              inputProps={{
                ...params.inputProps,
                required: recipients.length === 0,
              }}
            />
          )}
        />

        {/* Lista de refinamiento (opcional pero muy profesional) */}
        {recipients.length > 0 && (
          <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 1 }}>
            {recipients.map((r) => (
              <FormControl key={r.email} size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={r.type}
                  onChange={(e) => handleTypeChange(r.email, e.target.value)}
                  sx={{ fontSize: "0.75rem", height: "24px" }}
                >
                  <MenuItem value="to">TO: {r.email.split(" ")[0]}</MenuItem>
                  <MenuItem value="cc">CC: {r.email.split(" ")[0]}</MenuItem>
                  <MenuItem value="bcc">BCC: {r.email.split(" ")[0]}</MenuItem>
                </Select>
              </FormControl>
            ))}
          </Box>
        )}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <TextFieldUi
          id="subject"
          value={subject || ""}
          title="Asunto del correo"
          placeholder="Ej: Reporte"
          required={true}
          onChange={(e) => dispatch(setField({ key: "subject", value: e }))}
        />
        <TextareaField
          id="body"
          value={body || ""}
          title="Cuerpo del correo"
          placeholder="Escribe el mensaje aquí"
          required={true}
          rows={1}
          maxLength={300}
          showCharCount={true}
          onChange={(e) => dispatch(setField({ key: "body", value: e }))}
        />
      </Box>
    </Box>
  );
};
const BasicInformationForm = () => {
  const dispatch = useDispatch();
  const application_id = JSON.parse(
    localStorage.getItem("reduxState:dashboard"),
  ).app.id;
  dispatch(setField({ key: "application_id", value: application_id }));
  const { name, description, format } = useSelector((state) => state.report);
  useEffect(() => {
    return () => {
      dispatch(resetReport());
    };
  }, []);
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="overline"
        fontWeight="700"
        color="text.secondary"
        gutterBottom
      >
        Información Básica
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <TextFieldUi
          id="nombre"
          value={name || ""}
          title="Nombre del Reporte"
          placeholder="Reporte"
          required={true}
          onChange={(e) => dispatch(setField({ key: "name", value: e }))}
        />
        <TextareaField
          id="description"
          value={description || ""}
          title="Descripción"
          placeholder="Escribe aquí..."
          required={true}
          rows={1}
          minRows={1}
          maxLength={300}
          showCharCount={true}
          onChange={(e) => dispatch(setField({ key: "description", value: e }))}
        />
        <SelectField
          id="format"
          value={format}
          title="Formato"
          required={true}
          placeholder="Seleccionar..."
          options={[{ label: "PDF", value: "pdf" }]}
          onChange={(e) => dispatch(setField({ key: "format", value: e }))}
        />
      </Box>
    </Box>
  );
};

const ScheduleReportMUI = ({ open, handleClose, panels = [] }) => {
  const { handleCreateSchedule, isLoading, data, reset } = useScheduleManager();
  const filtersState = useSelector((state) => state.filters || {});
  const dispatch = useDispatch();
  const handleCreate = useCallback(() => {
    handleCreateSchedule(filtersState);
  }, [filtersState, handleCreateSchedule]);
  useEffect(() => {
    dispatch(resetReport());
    return () => {
      dispatch(resetReport());
      reset();
    };
  }, [open]);
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <Box sx={{ p: 4 }}>
        {/* Cabecera */}
        <DialogTitle sx={{ p: 0, mb: 1 }}>
          <Typography variant="h5" sx={{ mb: 1 }} fontWeight="600">
            Programar Reporte
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configura los la programación de tu reporte diligenciando la
            información basica, configuración de correo y configuración de
            tiempo
          </Typography>
        </DialogTitle>

        {!isLoading ? (
          <Box>
            <DialogContent sx={{ p: 0, overflowX: "hidden" }}>
              <DashboardFiltersSection
                filtersState={filtersState}
                panels={panels}
              />
              <Divider sx={{ my: 3 }} />
              <Provider store={store}>
                {/* Sección 1: Basic Information */}
                <BasicInformationForm />
                <Divider sx={{ my: 3 }} />

                {/* Sección 2: Email Configuration */}
                <EmailConfigurationForm />
                <Divider sx={{ my: 3 }} />

                {/* Sección 3: Schedule Specification */}
                <ScheduleSpecificationForm />
              </Provider>
            </DialogContent>

            <DialogActions sx={{ p: 0, mt: 2 }}>
              <Footer
                isLoading={isLoading}
                data={data}
                handleClose={handleClose}
                handleCreate={handleCreate}
              />
            </DialogActions>
          </Box>
        ) : (
          /* Estado de Carga */
          <Box sx={{ py: 10, textAlign: "center" }}>
            <Typography variant="h6">Creando programa...</Typography>
          </Box>
        )}
      </Box>
    </Dialog>
  );
};

export default ScheduleReportMUI;
