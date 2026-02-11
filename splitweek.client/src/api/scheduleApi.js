import { api } from './client';

export const scheduleApi = {
  getSchedule: (childId, month) => api.get(`/children/${childId}/schedule?month=${month}`),
  createEntry: (childId, data) => api.post(`/children/${childId}/schedule`, data),
  updateEntry: (childId, scheduleId, data) => api.put(`/children/${childId}/schedule/${scheduleId}`, data),
  bulkCreate: (childId, data) => api.post(`/children/${childId}/schedule/bulk`, data),
  confirmHandoff: (childId, scheduleId) => api.post(`/children/${childId}/schedule/${scheduleId}/confirm-handoff`),
};
