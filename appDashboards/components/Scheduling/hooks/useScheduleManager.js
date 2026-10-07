import { store } from "../components/store/store";
import {
  addRecipientMutation,
  deleteRecipientMutation,
  updateRecipientMutation,
  useCreateScheduleMutation,
  useUpdateGeneralScheduleMutation,
  useUpdateRecipientMutation,
  useUpdateScheduleMutation,
} from "@components/PanelsWorkspace/hooks/useScheduleData";
import { useRouter } from "next/router";
import { store as globalStore } from "@redux/store";
import { pushNotification } from "@redux/actions";
import { buildCalendar, buildInterval } from "../utils/scheduleAdapters";
import { convertStateToApiPayload } from "@helpers/filtersConverter";

export const useScheduleManager = (report_id) => {
  const router = useRouter();
  const dashboardId = router.query.id;
  
  const { mutate, isLoading, data, reset } =
    useCreateScheduleMutation(dashboardId);
  const {
    mutate: updateGeneral,
    isLoading: isLoadingGeneral,
    data: dataGeneral,
  } = useUpdateGeneralScheduleMutation(report_id);
  const {
    mutate: updateSchedule,
    isLoading: isLoadingSchedule,
    data: dataSchedule,
  } = useUpdateScheduleMutation(report_id);
  const { mutate: deleteRecipient, data: dataDeleteRecipient } =
    deleteRecipientMutation(report_id);
  const { mutate: addRecipient, data: dataAddRecipient } =
    addRecipientMutation(report_id);
  const { mutate: updateRecipient, data: dataUpdateRecipient } =
    useUpdateRecipientMutation(report_id);

  // Utils
  const validateSchedule = (state) => {
    const tab = state.tab;

    if (tab === 0) {
      const { days, hours, minutes, seconds } = state.interval;
      const totalSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds;
      if (totalSeconds === 0) {
        return "Debes configurar al menos un valor de intervalo";
      }
      if (totalSeconds < 900) {
        return "El intervalo debe ser igual o superior a 15 minutos";
      }
    }

    if (tab === 1) {
      if (!state.weekly.selectedWeekDays.length) {
        return "Debes seleccionar al menos un día de la semana";
      }
      if (!state.weekly.weekTime) {
        return "Debes seleccionar una hora de ejecución";
      }
    }

    if (tab === 2) {
      if (!state.monthly.selectedMonthDays.length) {
        return "Debes seleccionar al menos un día del mes";
      }
      if (!state.monthly.monthTime) {
        return "Debes seleccionar una hora de ejecución";
      }
    }

    return null;
  };

  // Orquestadores para cada petición

  const handleCreateSchedule = (filtersState = null) => {
    const state = store.getState().report;
    const validationError = validateSchedule(state);
    if (validationError) {
      globalStore.dispatch(
        pushNotification({ msg: validationError, status: "err" }),
      );
      return;
    }
    const payload = {
      application_id: state.application_id,
      name: state.name,
      description: state.description,
      format: state.format,
      recipients: state.recipients,
      subject: state.subject,
      body: state.body,
      schedule_task: {
        ...(state.tab === 0 && {
          interval: buildInterval(
            state.interval.days,
            state.interval.hours,
            state.interval.minutes,
            state.interval.seconds,
            state.interval.offsetValue,
            state.interval.offsetUnit,
          ),
        }),
        ...(state.tab === 1 && {
          calendar: buildCalendar(
            state.weekly.weekTime,
            "*",
            state.weekly.selectedWeekDays.join(","),
          ),
        }),
        ...(state.tab === 2 && {
          calendar: buildCalendar(
            state.monthly.monthTime,
            state.monthly.selectedMonthDays.join(","),
            "*",
          ),
        }),
        schedule_task_type_id: state.schedule_task_type_id.typeId,
        schedule_config: {
          timezone_name: "America/Bogota",
        },
      },
      ...(filtersState ? { filters: convertStateToApiPayload(filtersState) } : {}),
    };
    mutate(payload);
  };
  const handleUpdateGeneral = () => {
    const state = store.getState().report;
    updateGeneral({
      name: state.name,
      description: state.description,
      format: state.format,
      subject: state.subject,
      body: state.body,
    });
  };
  const handleUpdateSchedule = () => {
    const state = store.getState().report;
    const validationError = validateSchedule(state);
    if (validationError) {
      globalStore.dispatch(
        pushNotification({ msg: validationError, status: "err" }),
      );
      return;
    }
    updateSchedule({
      ...(state.tab === 0 && {
        interval: buildInterval(
          state.interval.days,
          state.interval.hours,
          state.interval.minutes,
          state.interval.seconds,
          state.interval.offsetValue,
          state.interval.offsetUnit,
        ),
      }),
      ...(state.tab === 1 && {
        calendar: buildCalendar(
          state.weekly.weekTime,
          "*",
          state.weekly.selectedWeekDays.join(","),
        ),
      }),
      ...(state.tab === 2 && {
        calendar: buildCalendar(
          state.monthly.monthTime,
          state.monthly.selectedMonthDays.join(","),
          "*",
        ),
      }),
      schedule_task_type_id: state.schedule_task_type_id.typeId,
      schedule_config: {
        timezone_name: "America/Bogota",
      },
    });
  };
  const handleAddRecipient = (params) => {
    if (params) {
      addRecipient(params);
    }
  };
  const handleUpdateRecipient = (params) => {
    if (params) {
      updateRecipient({
        type: params.type,
        recipient_id: params.recipient.id,
      });
    }
  };
  const handleDeleteRecipient = (params) => {
    if (params.id) {
      deleteRecipient(params.id);
    }
  };
  return {
    handleCreateSchedule,
    isLoading,
    data,
    reset,

    handleUpdateGeneral,
    isLoadingGeneral,
    dataGeneral,

    handleUpdateSchedule,
    isLoadingSchedule,
    dataSchedule,

    handleAddRecipient,
    dataAddRecipient,

    handleUpdateRecipient,
    dataUpdateRecipient,

    handleDeleteRecipient,
    dataDeleteRecipient,
  };
};
