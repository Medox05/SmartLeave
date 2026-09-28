import api from './api';

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  data?: any;
  is_read: boolean;
  created_at?: string;
  created_ago?: string;
}

export interface NotificationResponse {
  unread_count: number;
  data: AppNotification[];
}

export const notificationService = {
  getNotifications: async (): Promise<NotificationResponse> => {
    const res = await api.get('/notifications');
    return res.data;
  },

  markAsRead: async (id: number): Promise<void> => {
    await api.post(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.post('/notifications/read-all');
  },
};
