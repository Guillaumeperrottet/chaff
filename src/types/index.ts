// src/types/index.ts
export interface Notification {
  id: string;
  read: boolean;
  title: string;
  message: string;
  category?: string;
  link?: string;
  createdAt: string;
  data?: unknown;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}
