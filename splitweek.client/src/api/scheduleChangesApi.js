import { api } from './client';

export const scheduleChangesApi = {
  getRequests: (childId, status) =>
    api.get(`/children/${childId}/schedule-changes${status ? `?status=${status}` : ''}`),
  createRequest: (childId, data) => api.post(`/children/${childId}/schedule-changes`, data),
  approve: (requestId) => api.post(`/schedule-changes/${requestId}/approve`),
  decline: (requestId) => api.post(`/schedule-changes/${requestId}/decline`),
  counter: (requestId, data) => api.post(`/schedule-changes/${requestId}/counter`, data),
  getHistory: (childId) => api.get(`/children/${childId}/schedule-changes/history`),
  exportReport: (childId, format = 'csv') =>
    `/api/children/${childId}/schedule-changes/export?format=${format}`,
};
