import { api } from './client';

export const routinesApi = {
  getRoutines: (childId) => api.get(`/children/${childId}/routines`),
  createRoutine: (childId, data) => api.post(`/children/${childId}/routines`, data),
  updateRoutine: (routineId, data) => api.put(`/routines/${routineId}`, data),
  deleteRoutine: (routineId) => api.delete(`/routines/${routineId}`),
};
