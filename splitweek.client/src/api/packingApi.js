import { api } from './client';

export const packingApi = {
  getTemplates: (childId) => api.get(`/children/${childId}/packing/templates`),
  createTemplate: (childId, data) => api.post(`/children/${childId}/packing/templates`, data),
  updateTemplate: (templateId, data) => api.put(`/packing/templates/${templateId}`, data),
  deleteTemplate: (templateId) => api.delete(`/packing/templates/${templateId}`),

  getInstance: (childId, scheduleId) => api.get(`/children/${childId}/packing/instances?scheduleId=${scheduleId}`),
  createInstance: (childId, data) => api.post(`/children/${childId}/packing/instances`, data),
  addItem: (instanceId, data) => api.post(`/packing/instances/${instanceId}/items`, data),
  checkItem: (instanceId, itemId, data) => api.put(`/packing/instances/${instanceId}/items/${itemId}/check`, data),
  markReady: (instanceId) => api.post(`/packing/instances/${instanceId}/ready`),
  getHistory: (childId) => api.get(`/children/${childId}/packing/history`),
};
