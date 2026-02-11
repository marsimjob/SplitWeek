import { api } from './client';

export const messagesApi = {
  getMessages: (childId, page = 1, pageSize = 20) =>
    api.get(`/children/${childId}/messages?page=${page}&pageSize=${pageSize}`),
  sendMessage: (childId, data) => api.post(`/children/${childId}/messages`, data),
  markRead: (messageId) => api.post(`/messages/${messageId}/read`),
  getUnreadCount: (childId) => api.get(`/children/${childId}/messages/unread-count`),
};
