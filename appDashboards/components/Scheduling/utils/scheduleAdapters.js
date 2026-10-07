import { setField, setIntervalField, setTaskTypeId } from "../components/store/scheduleSlice";

// Método trasnforma lo que se recibe de los detalles de un reporte programado para pasarlo al store de redux

export const prepareScheduleData = (schedule_task,dispatch) => {
  if (!schedule_task) return;

  const type = schedule_task.schedule_task_type?.type;

  const tabMap = {
    interval: 0,
    days_of_the_week: 1,
    days_of_the_month: 2,
  };
  const tab = tabMap[type] ?? 0;

  dispatch(setField({ key: "tab", value: tab }));
  dispatch(
    setTaskTypeId({
      tabIndex: tab,
      typeId: schedule_task.schedule_task_type_id,
    }),
  );

  if (type === "interval" && schedule_task.interval) {
    const { every_seconds, offset_seconds } = schedule_task.interval;
    const days = Math.floor(every_seconds / 86400);
    const remaining = every_seconds % 86400;
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    dispatch(setIntervalField({ key: "days", value: days }));
    dispatch(setIntervalField({ key: "hours", value: hours }));
    dispatch(setIntervalField({ key: "minutes", value: minutes }));
    dispatch(setIntervalField({ key: "seconds", value: seconds }));
    dispatch(
      setIntervalField({
        key: "offsetValue",
        value: offset_seconds >= 60 ? offset_seconds / 60 : offset_seconds,
      }),
    );
    dispatch(
      setIntervalField({
        key: "offsetUnit",
        value: offset_seconds >= 60 ? "min" : "sec",
      }),
    );
  }

  if (type === "days_of_the_week" && schedule_task.calendar) {
    const { day_of_week, hour, minute } = schedule_task.calendar;
    const days = day_of_week !== "*" ? day_of_week.split(",").map(Number) : [];
    dispatch(
      setField({
        key: "weekly",
        value: {
          selectedWeekDays: days,
          weekTime: `${hour}:${minute}`,
        },
      }),
    );
  }

  if (type === "days_of_the_month" && schedule_task.calendar) {
    const { day_of_month, hour, minute } = schedule_task.calendar;
    const days =
      day_of_month !== "*" ? day_of_month.split(",").map(Number) : [];
    dispatch(
      setField({
        key: "monthly",
        value: {
          selectedMonthDays: days,
          monthTime: `${hour}:${minute}`,
        },
      }),
    );
  }
};
// Métodos formatean la data contenida en el store de redux para formatearla a como la espera el endpoint
export const buildCalendar = (time, dayOfMonth = "*", dayOfWeek = "*") => {
  const [hour, minute] = time.split(":");
  return {
    year: "*",
    month: "*",
    day_of_month: dayOfMonth,
    day_of_week: dayOfWeek,
    hour,
    minute,
    second: "0",
  };
};
export const buildInterval = (
  days,
  hours,
  minutes,
  seconds,
  offsetValue,
  offsetUnit,
) => {
  const totalSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds;
  const offsetSeconds = offsetUnit === "min" ? offsetValue * 60 : offsetValue;
  return {
    every_seconds: totalSeconds,
    offset_seconds: offsetSeconds,
  };
};
