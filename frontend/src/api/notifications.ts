import api from './axios';

export interface Notification {
  id: string;
  type: 'follow' | 'post_like' | 'post_comment' | 'comment_like' | 'comment_reply';
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  post?: {
    id: string;
    content: string;
  };
  comment?: {
    id: string;
    content: string;
  };
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  totalPages: number;
}

export const notificationsApi = {
  getAll: async (page = 1, limit = 20): Promise<NotificationsResponse> => {
    const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
    return response.data;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ success: boolean }> => {
    const response = await api.post('/notifications/read-all');
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};













