import apiClient from './api';
import { ApiResponse } from '@/types/api';
import { Wallet, WalletTransaction, Withdrawal, WithdrawPayload } from '@/types/wallet';

/**
 * GET /wallets/me
 */
export async function getMyWallet(): Promise<ApiResponse<Wallet>> {
  const response = await apiClient.get('/wallets/me');
  return response.data;
}

/**
 * GET /wallets/me/transactions
 */
export async function getMyTransactions(): Promise<ApiResponse<WalletTransaction[]>> {
  const response = await apiClient.get('/wallets/me/transactions');
  return response.data;
}

/**
 * POST /wallets/me/withdraw
 */
export async function requestWithdraw(payload: WithdrawPayload): Promise<ApiResponse<Withdrawal>> {
  const response = await apiClient.post('/wallets/me/withdraw', payload);
  return response.data;
}

/**
 * GET /wallets/me/withdrawals
 */
export async function getMyWithdrawals(): Promise<ApiResponse<Withdrawal[]>> {
  const response = await apiClient.get('/wallets/me/withdrawals');
  return response.data;
}
