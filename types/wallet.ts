/**
 * Wallet info
 */
export interface Wallet {
  wallet_id: string;
  user_id: string;
  balance: number;
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
  status: 'pending' | 'approved' | 'rejected';
  bank_name?: string;
  account_number?: string;
  account_holder?: string;
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
  bank_name: string;
  account_number: string;
  account_holder: string;
}

/**
 * Process withdrawal payload (admin)
 */
export interface ProcessWithdrawalPayload {
  status: 'approved' | 'rejected';
  notes?: string;
}
