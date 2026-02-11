import { api } from './client';

export const medicationsApi = {
  getMedications: (childId) => api.get(`/children/${childId}/medications`),
  createMedication: (childId, data) => api.post(`/children/${childId}/medications`, data),
  updateMedication: (medicationId, data) => api.put(`/medications/${medicationId}`, data),
  logDose: (medicationId, data) => api.post(`/medications/${medicationId}/log`, data),
  getLogs: (medicationId, from, to) =>
    api.get(`/medications/${medicationId}/logs?from=${from}&to=${to}`),
};
