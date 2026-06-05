import apiClient from './api';
import { ApiResponse } from '@/types/api';
import { LaundryService, CreateServicePayload, UpdateServicePayload } from '@/types/service';

/**
 * GET /services
 */
export async function getServices(): Promise<ApiResponse<LaundryService[]>> {
  const response = await apiClient.get('/services');
  return response.data;
}

/**
 * GET /services/:service_id
 */
export async function getServiceById(serviceId: string): Promise<ApiResponse<LaundryService>> {
  const response = await apiClient.get(`/services/${serviceId}`);
  return response.data;
}

/**
 * POST /services
 */
export async function createService(payload: CreateServicePayload): Promise<ApiResponse<LaundryService>> {
  const response = await apiClient.post('/services', payload);
  return response.data;
}

/**
 * PATCH /services/:service_id
 */
export async function updateService(
  serviceId: string,
  payload: UpdateServicePayload
): Promise<ApiResponse<LaundryService>> {
  const response = await apiClient.patch(`/services/${serviceId}`, payload);
  return response.data;
}

/**
 * DELETE /services/:service_id
 */
export async function deleteService(serviceId: string): Promise<ApiResponse> {
  const response = await apiClient.delete(`/services/${serviceId}`);
  return response.data;
}
