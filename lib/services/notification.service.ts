import apiClient from '../api-client';

export const notificationService = {
  getAll: (recipientId: number) => 
    apiClient.get(`/api/notifications/${recipientId}`),
  
  getUnread: (recipientId: number) => 
    apiClient.get(`/api/notifications/${recipientId}/unread`),
  
  markAsRead: (notificationId: number) => 
    apiClient.put(`/api/notifications/${notificationId}/read`),
};