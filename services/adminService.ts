import apiClient from './api';
import { AdminAnalytics, AdminDashboardMetrics, ApiResponse } from '@/types/api';
import { PendingUser } from '@/types/user';
import { ProcessWithdrawalPayload, Wallet, WalletTransaction, Withdrawal, WithdrawPayload } from '@/types/wallet';

/**
 * GET /admin/dashboard/metrics
 */
export async function getDashboardMetrics(): Promise<ApiResponse<AdminDashboardMetrics>> {
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
export async function getAdminWallet(): Promise<ApiResponse<Wallet>> {
  const response = await apiClient.get('/admin/wallets/me');
  return response.data;
}

/**
 * POST /admin/wallets/me/withdraw
 */
export async function requestAdminWithdraw(payload: WithdrawPayload): Promise<ApiResponse<Withdrawal>> {
  const response = await apiClient.post('/admin/wallets/me/withdraw', payload);
  return response.data;
}

/**
 * GET /admin/wallets/me/transactions
 */
export async function getAdminTransactions(): Promise<ApiResponse<WalletTransaction[]>> {
  const response = await apiClient.get('/admin/wallets/me/transactions');
  return response.data;
}

/**
 * GET /admin/wallets/withdrawals/pending
 */
export async function getPendingWithdrawals(): Promise<ApiResponse<Withdrawal[]>> {
  const response = await apiClient.get('/admin/wallets/withdrawals/pending');
  return response.data;
}

/**
 * GET /admin/wallets/withdrawals
 */
export async function getAllWithdrawals(): Promise<ApiResponse<Withdrawal[]>> {
  const response = await apiClient.get('/admin/wallets/withdrawals');
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
export async function getAnalytics(): Promise<ApiResponse<AdminAnalytics>> {
  const response = await apiClient.get('/admin/analytics');
  return response.data;
}

