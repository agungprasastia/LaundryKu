import apiClient from './api';
import { ApiResponse } from '@/types/api';
import { PendingUser } from '@/types/user';
import { ProcessWithdrawalPayload } from '@/types/wallet';

/**
 * GET /admin/dashboard/metrics
 */
export async function getDashboardMetrics(): Promise<ApiResponse> {
  const response = await apiClient.get('/admin/dashboard/metrics');
  return response.data;
}

/**
 * GET /admin/users/pending
 */
export async function getPendingUsers(): Promise<ApiResponse<PendingUser[]>> {
  const response = await apiClient.get('/admin/users/pending');
  return response.data;
}

/**
 * PATCH /admin/users/:user_id/verify
 */
export async function verifyUser(
  userId: string,
  isVerified: boolean
): Promise<ApiResponse> {
  const response = await apiClient.patch(`/admin/users/${userId}/verify`, {
    is_verified: isVerified,
  });
  return response.data;
}

/**
 * GET /admin/wallets/me
 */
export async function getAdminWallet(): Promise<ApiResponse> {
  const response = await apiClient.get('/admin/wallets/me');
  return response.data;
}

/**
 * PATCH /admin/wallets/withdrawals/:withdraw_id/process
 */
export async function processWithdrawal(
  withdrawId: string,
  payload: ProcessWithdrawalPayload
): Promise<ApiResponse> {
  const response = await apiClient.patch(
    `/admin/wallets/withdrawals/${withdrawId}/process`,
    payload
  );
  return response.data;
}

/**
 * GET /admin/orders
 */
export async function getAdminOrders(): Promise<ApiResponse> {
  const response = await apiClient.get('/admin/orders');
  return response.data;
}

/**
 * GET /admin/analytics
 */
export async function getAnalytics(): Promise<ApiResponse> {
  const response = await apiClient.get('/admin/analytics');
  return response.data;
}
