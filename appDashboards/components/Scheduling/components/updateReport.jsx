"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Select,
  MenuItem,
  FormControl,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import {
  CalendarMonth,
  Person,
  Schedule,
  Email,
  InfoOutlined,
  Delete,
} from "@mui/icons-material";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "../components/store/store";
import { debounce } from "lodash";
import {
  resetReport,
  setField,
  setRecipients,
  setTaskTypeId,
} from "../components/store/scheduleSlice";
import {
  useScheduleDetail,
  getSchedulesTaskTypes,
  deleteFiltersReportsMutation,
} from "@components/PanelsWorkspace/hooks/useScheduleData";
import IntervalOption from "../components/SchedulingOptions/IntervalOption";
import WeeklyOption from "../components/SchedulingOptions/WeeklyOption";
import MonthlyOption from "../components/SchedulingOptions/MonthlyOption";
import { Timer as TimerIcon } from "@mui/icons-material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EventNoteIcon from "@mui/icons-material/EventNote";
import moment from "moment";
import "moment/locale/es";
import { useScheduleManager } from "../hooks/useScheduleManager";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import {
  pushNotification,
  resetFilters,
  addGroup,
  addRule,
} from "@redux/actions";
import { prepareScheduleData } from "../utils/scheduleAdapters";
import useDebounce from "hooks/useDebounce";
import { useEmailsList } from "../utils/useEmailsList";
import { DashboardFiltersSection } from "../components/SchedulingOptions/FilterChip";
import { useDashboardData } from "@components/DashboardsWorkspace/features/Dashboard/shared/hooks/useDashboardData";
moment.locale("es");

const TAB_INDEX_TO_TYPE_NAME = {
  0: "interval",
  1: "days_of_the_week",
  2: "days_of_the_month",
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

const SCHEDULE_TYPE_LABEL = {
  interval: "Intervalo",
  days_of_the_week: "Semanal",
  days_of_the_month: "Mensual",
};

// FUNCIONES Y MÉTODOS

const useMutationNotification = (
  data,
  {
    successMsg,
    errorMsg,
    queryKey,
    globalDispatch,
    queryClient,
    setSavingSection,
  },
) => {
  useEffect(() => {
    if (!data) return;
    const isSuccess = data?.status === "success" || data?.status === "ok";

    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey });
      globalDispatch(pushNotification({ msg: successMsg, status: "ok" }));
    } else {
      globalDispatch(pushNotification({ msg: errorMsg, status: "err" }));
    }
    setSavingSection(null);
  }, [data]);
};
// COMPONENTES
//  Card contenedor reutilizable
const SectionCard = ({
  icon,
  title,
  subtitle,
  onSave,
  isSaving,
  children,
  hasChanges,
}) => (
  <Box
    sx={{
      border: "0.5px solid",
      borderColor: hasChanges ? "warning.main" : "divider",
      borderRadius: 2,
      p: 2,
      backgroundColor: "background.paper",
      transition: "border-color 0.2s ease",
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        mb: 2,
      }}
    >
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        {icon}
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {hasChanges && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 1,
              py: 0.4,
              backgroundColor: "rgba(237, 108, 2, 0.08)",
              border: "0.5px solid",
              borderColor: "warning.main",
              borderRadius: 1,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "warning.main",
                flexShrink: 0,
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: "warning.dark", fontWeight: 500, fontSize: "11px" }}
            >
              Cambios sin guardar
            </Typography>
          </Box>
        )}
        {onSave && (
          <Button
            variant="contained"
            size="small"
            disableElevation
            onClick={onSave}
            disabled={isSaving || !hasChanges}
            sx={{
              backgroundColor: hasChanges ?? "gray",
            }}
          >
            {isSaving ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              "Guardar"
            )}
          </Button>
        )}
      </Box>
    </Box>
    {children}
  </Box>
);

//  Sección: Info general
const GeneralInfoSection = ({ onSave, isSaving, originalData }) => {
  const dispatch = useDispatch();
  const { name, description, format, subject, body } = useSelector(
    (s) => s.report,
  );
  const [hasChanges, setHasChanges] = useState(false);
useEffect(() => {
  return () => {
    dispatch(resetReport());
  };
}, []);
  useEffect(() => {
    if (!originalData) return;
    const changed =
      name !== originalData.name ||
      description !== originalData.description ||
      format !== originalData.format ||
      subject !== originalData.subject ||
      body !== originalData.body;
    setHasChanges(changed);
  }, [name, description, format, subject, body, originalData]);
  return (
    <SectionCard
      icon={<InfoOutlined sx={{ fontSize: 18, color: "#7F77DD" }} />}
      title="Información general"
      subtitle="Nombre, descripción, formato del reporte, asunto y cuerpo de correo"
      onSave={onSave}
      isSaving={isSaving}
      hasChanges={hasChanges}
    >
      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="Nombre"
          size="small"
          fullWidth
          value={name || ""}
          onChange={(e) =>
            dispatch(setField({ key: "name", value: e.target.value }))
          }
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={format || "pdf"}
            onChange={(e) =>
              dispatch(setField({ key: "format", value: e.target.value }))
            }
          >
            <MenuItem value="pdf">PDF</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <TextField
        label="Descripción"
        size="small"
        fullWidth
        multiline
        rows={2}
        value={description || ""}
        onChange={(e) =>
          dispatch(setField({ key: "description", value: e.target.value }))
        }
        sx={{ mt: 2 }}
      />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
        <TextField
          label="Asunto"
          size="small"
          fullWidth
          value={subject || ""}
          onChange={(e) =>
            dispatch(setField({ key: "subject", value: e.target.value }))
          }
        />
        <TextField
          label="Cuerpo del correo"
          size="small"
          fullWidth
          multiline
          rows={3}
          value={body || ""}
          onChange={(e) =>
            dispatch(setField({ key: "body", value: e.target.value }))
          }
        />
      </Box>
    </SectionCard>
  );
};

//  Sección:  destinatarios
const EmailSection = ({
  onAddRecipient,
  onUpdateRecipient,
  onDeleteRecipient,
}) => {
  const { emails, isLoadingList, handleGetEmailsList } = useEmailsList();
  const { recipients } = useSelector((s) => s.report);
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

  const handleTypeChange = (newType, recipient) => {
    onUpdateRecipient({ type: newType, recipient });
  };

  return (
    <SectionCard
      icon={<Email sx={{ fontSize: 18, color: "#7F77DD" }} />}
      title="Correo y destinatarios"
      subtitle="lista de destinatarios"
    >
      <Typography variant="caption" color="text.secondary" fontWeight={500}>
        Destinatarios
      </Typography>

      <Autocomplete
        multiple
        freeSolo
        options={emails}
        loading={isLoadingList}
        value={recipients.map((r) => r.email)}
        filterOptions={(x) => x}
        getOptionLabel={(option) =>
          typeof option === "string" ? option : option.email
        }
        onInputChange={(_, newInputValue) => {
          debouncedSearch(newInputValue);
        }}
        onChange={(_, newValue) => {
          const lastAdded = newValue[newValue.length - 1];
          if (!lastAdded) return;

          const email =
            typeof lastAdded === "string" ? lastAdded : lastAdded.email;
          if (recipients.find((r) => r.email === email)) return;
          onAddRecipient({ email, type: "to" });
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            placeholder="Agregar destinatario..."
            inputProps={{
              ...params.inputProps,
              required: recipients.length === 0,
            }}
            sx={{ mt: 1, mb: 1 }}
          />
        )}
        renderTags={() => null}
      />

      {recipients.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
          {recipients.map((r) => (
            <Box
              key={r.email}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 0.75,
                border: "0.5px solid",
                borderColor: "divider",
                borderRadius: 1.5,
                backgroundColor: "background.paper",
                flex: "1 1 280px",
              }}
            >
              <Person sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="body2" sx={{ flex: 1 }}>
                {r.email}
              </Typography>
              <Select
                value={r.type}
                onChange={(e) => handleTypeChange(e.target.value, r)}
                size="small"
                sx={{ fontSize: "0.75rem", height: "26px", minWidth: 80 }}
              >
                <MenuItem value="to">TO</MenuItem>
                <MenuItem value="cc">CC</MenuItem>
                <MenuItem value="bcc">BCC</MenuItem>
              </Select>
              <Button
                size="small"
                color="error"
                variant="text"
                onClick={() => onDeleteRecipient(r)}
                sx={{ minWidth: 0, p: 0.5 }}
              >
                <Delete sx={{ fontSize: 16 }} />
              </Button>
            </Box>
          ))}
        </Box>
      )}
    </SectionCard>
  );
};

//  Sección: Horario
const ScheduleSection = ({ onSave, isSaving, originalData }) => {
  const dispatch = useDispatch();
  const tabValue = useSelector((s) => s.report.tab);
  const taskId = useSelector((s) => s.report.schedule_task_type_id);
  const { days, hours, minutes, seconds, offsetValue, offsetUnit } =
    useSelector((s) => s.report.interval);
  const [hasChanges, setHasChanges] = useState(false);
  const weekly = useSelector((s) => s.report.weekly);
  const monthly = useSelector((s) => s.report.monthly);
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
        return { text: "Configura el intervalo de envío", warning: null }; // ✅

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
    if (!taskId || !taskId.typeId) {
      const defaultType = taskTypes.find((t) => t.type === "interval");
      if (defaultType)
        dispatch(setTaskTypeId({ tabIndex: 0, typeId: defaultType.id }));
      return;
    }
    const currentTypeName = TAB_INDEX_TO_TYPE_NAME[tabValue];
    const currentType = taskTypes.find((t) => t.type === currentTypeName);
    if (
      currentType &&
      taskId.typeId !== currentType.id &&
      tabValue !== taskId.tabIndex
    ) {
      dispatch(setTaskTypeId({ tabIndex: tabValue, typeId: currentType.id }));
    }
  }, [taskTypes, tabValue]);

  useEffect(() => {
    if (!originalData?.schedule_task) return;

    const schedule_task = originalData.schedule_task;
    const type = schedule_task?.schedule_task_type?.type;
    const tabMap = { interval: 0, days_of_the_week: 1, days_of_the_month: 2 };
    const originalTab = tabMap[type] ?? 0;

    let changed = false;

    if (tabValue !== originalTab) {
      changed = true;
    } else if (tabValue === 0 && schedule_task.interval) {
      const { every_seconds } = schedule_task.interval;
      const origDays = Math.floor(every_seconds / 86400);
      const remaining = every_seconds % 86400;
      const origHours = Math.floor(remaining / 3600);
      const origMinutes = Math.floor((remaining % 3600) / 60);
      const origSeconds = remaining % 60;

      changed =
        days !== origDays ||
        hours !== origHours ||
        minutes !== origMinutes ||
        seconds !== origSeconds;
    } else if (tabValue === 1 && schedule_task.calendar) {
      const { day_of_week, hour, minute } = schedule_task.calendar;
      const origDays =
        day_of_week !== "*" ? day_of_week.split(",").map(Number) : [];
      const origTime = `${hour}:${minute}`;

      changed =
        weekly.weekTime !== origTime ||
        JSON.stringify([...weekly.selectedWeekDays].sort()) !==
          JSON.stringify([...origDays].sort());
    } else if (tabValue === 2 && schedule_task.calendar) {
      const { day_of_month, hour, minute } = schedule_task.calendar;
      const origDays =
        day_of_month !== "*" ? day_of_month.split(",").map(Number) : [];
      const origTime = `${hour}:${minute}`;

      changed =
        monthly.monthTime !== origTime ||
        JSON.stringify([...monthly.selectedMonthDays].sort()) !==
          JSON.stringify([...origDays].sort());
    }

    setHasChanges(changed);
  }, [
    tabValue,
    days,
    hours,
    minutes,
    seconds,
    offsetValue,
    offsetUnit,
    weekly,
    monthly,
    originalData,
  ]);

  const handleTabChange = (_, newValue) => {
    const matchedType = taskTypes.find(
      (item) => item.type === TAB_INDEX_TO_TYPE_NAME[newValue],
    );
    if (matchedType) {
      dispatch(setField({ key: "tab", value: newValue }));
      dispatch(setTaskTypeId({ tabIndex: newValue, typeId: matchedType.id }));
    }
  };

  return (
    <SectionCard
      icon={<Schedule sx={{ fontSize: 18, color: "#7F77DD" }} />}
      title="Especificación de horario"
      subtitle="Tipo de recurrencia y configuración temporal"
      onSave={onSave}
      isSaving={isSaving}
      hasChanges={hasChanges}
    >
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

      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        {[
          {
            label: "Intervalo",
            desc: "Cada X días, horas o minutos",
            index: 0,
            icon: <TimerIcon sx={{ fontSize: 18 }} />,
          },
          {
            label: "Semanal",
            desc: "Días específicos de la semana",
            index: 1,
            icon: <CalendarMonthIcon sx={{ fontSize: 18 }} />,
          },
          {
            label: "Mensual",
            desc: "Días específicos del mes",
            index: 2,
            icon: <EventNoteIcon sx={{ fontSize: 18 }} />,
          },
        ].map((opt) => (
          <Box
            key={opt.index}
            onClick={() => handleTabChange(null, opt.index)}
            sx={{
              flex: 1,
              border:
                tabValue === opt.index ? "2px solid #7F77DD" : "0.5px solid",
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
              fontSize="0.8rem"
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

      {tabValue === 0 && <IntervalOption />}
      {tabValue === 1 && <WeeklyOption />}
      {tabValue === 2 && <MonthlyOption />}
    </SectionCard>
  );
};

//  Header del reporte
const ReportHeader = ({ data }) => {
  const scheduleType = data?.schedule_task?.schedule_task_type?.type;
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
        <Box
          sx={{
            width: 70,
            height: 70,
            borderRadius: 2,
            backgroundColor: "#EEEDFE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CalendarMonth sx={{ color: "#534AB7", fontSize: 42 }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={500}>
            {data?.name || "—"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data?.description || "—"}
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Chip
          label={data?.is_active ? "Activo" : "Inactivo"}
          size="small"
          sx={{
            backgroundColor: data?.is_active ? "#EAF3DE" : "#F1EFE8",
            color: data?.is_active ? "#27500A" : "#5F5E5A",
            fontSize: "11px",
          }}
        />
        {scheduleType && (
          <Chip
            label={SCHEDULE_TYPE_LABEL[scheduleType] || scheduleType}
            size="small"
            sx={{
              backgroundColor: "#EEEDFE",
              color: "#3C3489",
              fontSize: "11px",
            }}
          />
        )}
        <Chip
          label={(data?.format || "pdf").toUpperCase()}
          size="small"
          sx={{
            backgroundColor: "#F1EFE8",
            color: "#5F5E5A",
            fontSize: "11px",
          }}
        />
        <Typography variant="caption" color="text.secondary">
          Creado{" "}
          {data?.created_at
            ? moment(data.created_at).format("DD MMM YYYY, HH:mm")
            : "—"}
        </Typography>
      </Box>
    </Box>
  );
};
// Componente principal
const UpdateScheduleFormContent = ({
  globalDispatch,
  filtersState,
  panels,
  onClear,
}) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const reportId =
    typeof window !== "undefined" ? sessionStorage.getItem("reportId") : null;
  const { data, isLoading } = useScheduleDetail(reportId);
  const {
    handleUpdateGeneral,
    isLoadingGeneral,
    dataGeneral,

    handleUpdateSchedule,
    isLoadingSchedule,
    dataSchedule,

    handleDeleteRecipient,
    dataDeleteRecipient,

    handleAddRecipient,
    dataAddRecipient,

    handleUpdateRecipient,
    dataUpdateRecipient,
  } = useScheduleManager(reportId);
  const [savingSection, setSavingSection] = useState(null);

  useEffect(() => {
    if (!data) return;
    dispatch(resetReport());
    dispatch(setField({ key: "report_id", value: data.id || "" }));
    dispatch(setField({ key: "name", value: data.name || "" }));
    dispatch(setField({ key: "description", value: data.description || "" }));
    dispatch(setField({ key: "format", value: data.format || "pdf" }));
    dispatch(setField({ key: "subject", value: data.subject || "" }));
    dispatch(setField({ key: "body", value: data.body || "" }));
    dispatch(setRecipients(data.recipients || []));
    globalDispatch(setField({ key: "filters", value: data }));
    prepareScheduleData(data.schedule_task, dispatch);
  }, [data]);

  useMutationNotification(dataGeneral, {
    successMsg: "Información general actualizada con éxito",
    errorMsg: "Ocurrió un error al actualizar la información general",
    queryKey: ["scheduleDetail"],
    globalDispatch,
    queryClient,
    setSavingSection,
  });

  useMutationNotification(dataSchedule, {
    successMsg: "Información de horario actualizada con éxito",
    errorMsg: "Ocurrió un error al actualizar la información del horario",
    queryKey: ["scheduleDetail"],
    globalDispatch,
    queryClient,
    setSavingSection,
  });

  useMutationNotification(dataAddRecipient, {
    successMsg: "Destinatario agregado con éxito",
    errorMsg: "Ocurrió un error al agregar el destinatario",
    queryKey: ["scheduleDetail"],
    globalDispatch,
    queryClient,
    setSavingSection,
  });

  useMutationNotification(dataUpdateRecipient, {
    successMsg: "Destinatario actualizado con éxito",
    errorMsg: "Ocurrió un error al actualizar el destinatario",
    queryKey: ["scheduleDetail"],
    globalDispatch,
    queryClient,
    setSavingSection,
  });

  useMutationNotification(dataDeleteRecipient, {
    successMsg: "Destinatario eliminado con éxito",
    errorMsg: "Ocurrió un error al eliminar el destinatario",
    queryKey: ["scheduleDetail"],
    globalDispatch,
    queryClient,
    setSavingSection,
  });

  const handleSaveGeneral = useCallback(async () => {
    setSavingSection("general");
    handleUpdateGeneral();
    setSavingSection(null);
  }, [data]);

  const handleAddAddressee = useCallback(async (params) => {
    setSavingSection("email");
    handleAddRecipient(params);
    setSavingSection(null);
  }, []);
  const handleUpdateAddressee = useCallback(async (params) => {
    setSavingSection("email");
    handleUpdateRecipient(params);
    setSavingSection(null);
  }, []);
  const handleDeleteAddressee = useCallback(async (params) => {
    setSavingSection("email");
    handleDeleteRecipient(params);
    setSavingSection(null);
  }, []);

  const handleSaveSchedule = useCallback(async () => {
    setSavingSection("schedule");
    handleUpdateSchedule();
    setSavingSection(null);
  }, []);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress sx={{ color: "#7F77DD" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ m: 2, display: "flex", flexDirection: "column", gap: 1 }}>
      <ReportHeader data={data} />

      <Box
        sx={{
          backgroundColor: "white",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <DashboardFiltersSection
          filtersState={filtersState}
          panels={panels || []}
          onClear={onClear}
          variant="report"
        />
        <GeneralInfoSection
          onSave={handleSaveGeneral}
          isSaving={savingSection === "general"}
          originalData={data}
        />
        <EmailSection
          onAddRecipient={handleAddAddressee}
          onUpdateRecipient={handleUpdateAddressee}
          onDeleteRecipient={handleDeleteAddressee}
        />
        <ScheduleSection
          onSave={handleSaveSchedule}
          isSaving={savingSection === "schedule"}
          originalData={data}
        />
      </Box>
    </Box>
  );
};

const UpdateScheduleForm = ({
  globalDispatch,
  filtersState,
  panels,
  onClear,
}) => (
  <Provider store={store}>
    <UpdateScheduleFormContent
      globalDispatch={globalDispatch}
      filtersState={filtersState}
      panels={panels}
      onClear={onClear}
    />
  </Provider>
);

const UpdateScheduleReportScreen = ({ globalDispatch, user }) => {
  const queryClient = useQueryClient();
  const reportId =
    typeof window !== "undefined" ? sessionStorage.getItem("reportId") : null;
  const { data, isLoading } = useScheduleDetail(reportId);
  const filtersState = useSelector((s) => s.filters || {});
  const dashboardId = data?.dashboard_id;
  const { panels } = useDashboardData(dashboardId, user, false, !!dashboardId);
  const { mutate: deleteFilters } = deleteFiltersReportsMutation(reportId);
  const onClear = useCallback(() => {
    if (!reportId) return;
    deleteFilters(undefined, {
      onSuccess: () => {
        globalDispatch(resetFilters());
        queryClient.invalidateQueries({
          queryKey: ["reportFilters", reportId],
        });
        queryClient.invalidateQueries({
          queryKey: ["scheduleDetail", reportId],
        });
        globalDispatch(
          pushNotification({ msg: "Filtros eliminados", status: "ok" }),
        );
      },
      onError: () => {
        globalDispatch(
          pushNotification({
            msg: "Ocurrió un error al eliminar los filtros",
            status: "err",
          }),
        );
      },
    });
  }, [deleteFilters, globalDispatch, queryClient, reportId]);
  const appliedRef = useRef({ reportId: null, applied: false });
  useEffect(() => {
    if (!reportId) return;
    if (!data?.filters) return;
    if (
      appliedRef.current.reportId === reportId &&
      appliedRef.current.applied === true
    ) {
      return;
    }
    appliedRef.current = { reportId, applied: true };
    const payload = data.filters;
    globalDispatch(resetFilters());
    const reportRootGroupId = `report::${reportId}::group`;
    globalDispatch(
      addGroup({
        id: reportRootGroupId,
        parentId: "root",
        uiContext_id: "report",
        operator: payload?.operator || "AND",
        children: [],
        acceptsSubgroups: true,
        allowMultipleRules: true,
        isCoupled: false,
      }),
    );

    let groupCounter = 0;
    const addTree = (node, parentGroupId) => {
      if (!node) return;

      const isLeafRule =
        !!node.field &&
        !!node.operator &&
        (!Array.isArray(node.conditions) || node.conditions.length === 0);

      if (isLeafRule) {
        const cleanVal = String(node.value).replace(/\s+/g, "_");
        const ruleId = `${parentGroupId}::rule::${node.field}::${node.operator}::${cleanVal}`;

        globalDispatch(
          addRule({
            id: ruleId,
            parentId: parentGroupId,
            field: node.field,
            value: node.value,
            operator: node.operator,
          }),
        );
        return;
      }

      const childConditions = Array.isArray(node.conditions)
        ? node.conditions
        : [];
      if (childConditions.length === 0) return;

      const groupId = `${parentGroupId}::subgroup::${groupCounter++}`;
      globalDispatch(
        addGroup({
          id: groupId,
          parentId: parentGroupId,
          uiContext_id: "report",
          operator: node.operator || "AND",
          children: [],
          acceptsSubgroups: true,
          allowMultipleRules: true,
          isCoupled: false,
        }),
      );

      childConditions.forEach((c) => addTree(c, groupId));
    };

    (payload?.conditions || []).forEach((c) => addTree(c, reportRootGroupId));
  }, [data, globalDispatch, reportId]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress sx={{ color: "#7F77DD" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ m: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <UpdateScheduleForm
        globalDispatch={globalDispatch}
        filtersState={filtersState}
        panels={panels}
        onClear={onClear}
      />
    </Box>
  );
};

export default UpdateScheduleReportScreen;
