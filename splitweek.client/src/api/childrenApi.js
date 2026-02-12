import { api } from './client';

export const childrenApi = {
  getChildren: () => api.get('/children'),
  getChild: (childId) => api.get(`/children/${childId}`),
  createChild: (data) => api.post('/children', data),
  updateChild: (childId, data) => api.put(`/children/${childId}`, data),
  createInvite: (childId) => api.post(`/children/${childId}/invite`),
  acceptInvite: (token) => api.post('/children/accept-invite', { token }),
  getParents: (childId) => api.get(`/children/${childId}/parents`),
};
