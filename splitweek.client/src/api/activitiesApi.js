import { api } from './client';

export const activitiesApi = {
  getActivities: (childId) => api.get(`/children/${childId}/activities`),
  createActivity: (childId, data) => api.post(`/children/${childId}/activities`, data),
  updateActivity: (activityId, data) => api.put(`/activities/${activityId}`, data),
  deleteActivity: (activityId) => api.delete(`/activities/${activityId}`),
};
