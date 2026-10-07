import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  report_id: "",
  application_id: "",
  name: "",
  description: "",
  format: "pdf",
  subject: "",
  body: "",
  recipients: [],
  tab: 0,
  schedule_task_type_id: {},
  interval: {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    offsetValue: 0,
    offsetUnit: "min",
  },
  weekly: { selectedWeekDays: [], weekTime: "09:00" },
  monthly: { selectedMonthDays: [], monthTime: "09:00" },
};

const reportSlice = createSlice({
  name: "report",
  initialState,
  reducers: {
    resetReport() {
      return initialState;
    },
    setField(state, action) {
      const { key, value } = action.payload;
      state[key] = value;
    },

    setRecipients(state, action) {
      state.recipients = action.payload;
    },
    updateRecipientType(state, action) {
      const { email, type } = action.payload;
      const recipient = state.recipients.find((r) => r.email === email);
      if (recipient) {
        recipient.type = type;
      }
    },
    setTaskTypeId(state, action) {
      state.schedule_task_type_id = action.payload;
    },
    setIntervalField(state, action) {
      const { key, value } = action.payload;
      state.interval[key] = value;
    },

    setWeeklyTime(state, action) {
      state.weekly.weekTime = action.payload;
    },
    toggleWeekDay(state, action) {
      const day = action.payload;
      const days = state.weekly.selectedWeekDays;
      const idx = days.indexOf(day);
      if (idx === -1) days.push(day);
      else days.splice(idx, 1);
    },

    setMonthlyTime(state, action) {
      state.monthly.monthTime = action.payload;
    },
    toggleMonthDay(state, action) {
      const day = action.payload;
      const days = state.monthly.selectedMonthDays;
      const idx = days.indexOf(day);
      if (idx === -1) days.push(day);
      else days.splice(idx, 1);
    },
  },
});

export const {
  setField,
  setRecipients,
  updateRecipientType,
  setIntervalField,
  setTaskTypeId,
  setWeeklyTime,
  toggleWeekDay,
  setMonthlyTime,
  toggleMonthDay,
  resetReport
} = reportSlice.actions;

export default reportSlice.reducer;
