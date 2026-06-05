import apiClient from './api';
import { ApiResponse } from '@/types/api';
import { AvailableCourier, CourierTask, CourierEarnings } from '@/types/order';

/**
 * GET /couriers/available
 */
export async function getAvailableCouriers(): Promise<ApiResponse<AvailableCourier[]>> {
  const response = await apiClient.get('/couriers/available');
  return response.data;
}

/**
 * PATCH /couriers/me/location
 */
export async function updateMyLocation(payload: {
  assignment_id?: string;
  lat: number;
  lng: number;
}): Promise<ApiResponse> {
  const response = await apiClient.patch('/couriers/me/location', payload);
  return response.data;
}

/**
 * GET /couriers/me/tasks
 */
export async function getMyTasks(): Promise<ApiResponse<CourierTask[]>> {
  const response = await apiClient.get('/couriers/me/tasks');
  return response.data;
}

/**
 * GET /couriers/me/tasks/history
 */
export async function getMyTasksHistory(): Promise<ApiResponse<CourierTask[]>> {
  const response = await apiClient.get('/couriers/me/tasks/history');
  return response.data;
}

/**
 * PATCH /couriers/tasks/:assignment_id/status
 */
export async function updateTaskStatus(
  assignmentId: string,
  payload: { status: string }
): Promise<ApiResponse> {
  const response = await apiClient.patch(
    `/couriers/tasks/${assignmentId}/status`,
    payload
  );
  return response.data;
}

/**
 * GET /couriers/me/earnings
 */
export async function getMyEarnings(): Promise<ApiResponse<CourierEarnings>> {
  const response = await apiClient.get('/couriers/me/earnings');
  return response.data;
}
