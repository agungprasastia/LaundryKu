import apiClient from './api';
import { ApiResponse } from '@/types/api';

/**
 * GET /owner/orders
 */
export async function getOwnerOrders(): Promise<ApiResponse> {
  const response = await apiClient.get('/owner/orders');
  return response.data;
}

/**
 * GET /owner/reports/summary
 */
export async function getOwnerReportSummary(): Promise<ApiResponse> {
  const response = await apiClient.get('/owner/reports/summary');
  return response.data;
}
