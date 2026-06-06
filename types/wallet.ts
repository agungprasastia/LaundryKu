/**
 * Wallet info
 */
export interface Wallet {
  wallet_id: string;
  user_id: string;
  balance: number;
  available_balance?: number;
  pending_balance?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Wallet transaction
 */
export interface WalletTransaction {
  transaction_id: string;
  wallet_id?: string;
  type: 'credit' | 'debit';
  amount: number;
  description?: string;
  reference_id?: string;
  created_at?: string;
}

/**
 * Withdrawal request
 */
export interface Withdrawal {
  withdraw_id: string;
  wallet_id?: string;
  user_id?: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'approved' | 'rejected';
  bank_name?: string;
  bank_account_number?: string;
  account_number?: string;
  account_holder?: string;
  e_wallet_number?: string;
  e_wallet_provider?: string;
  notes?: string;
  processed_at?: string;
  created_at?: string;
  // Joined
  full_name?: string;
  email?: string;
}

/**
 * Withdraw request payload
 */
export interface WithdrawPayload {
  amount: number;
  bank_account_number?: string;
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
  e_wallet_number?: string;
  e_wallet_provider?: string;
}

/**
 * Process withdrawal payload (admin)
 */
export interface ProcessWithdrawalPayload {
  status: 'success' | 'failed' | 'approved' | 'rejected';
  notes?: string;
}
