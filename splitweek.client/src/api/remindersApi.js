import { api } from './client';

export const remindersApi = {
  getReminders: (childId, upcoming = false) =>
    api.get(`/children/${childId}/reminders${upcoming ? '?upcoming=true' : ''}`),
  createReminder: (childId, data) =>
    api.post(`/children/${childId}/reminders`, data),
  updateReminder: (reminderId, data) =>
    api.put(`/reminders/${reminderId}`, data),
  dismiss: (reminderId) =>
    api.post(`/reminders/${reminderId}/dismiss`),
  deleteReminder: (reminderId) =>
    api.delete(`/reminders/${reminderId}`),
};
