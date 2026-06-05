import apiClient from './api';
import { ApiResponse } from '@/types/api';
import { Notification } from '@/types/notification';

/**
 * GET /notifications
 */
export async function getNotifications(): Promise<ApiResponse<Notification[]>> {
  const response = await apiClient.get('/notifications');
  return response.data;
}

/**
 * PATCH /notifications/:notification_id/read
 */
export async function markAsRead(notificationId: string): Promise<ApiResponse> {
  const response = await apiClient.patch(`/notifications/${notificationId}/read`);
  return response.data;
}
