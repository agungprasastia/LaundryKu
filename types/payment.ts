/**
 * Invoice object
 */
export interface Invoice {
  invoice_id: string;
  order_id: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'expired' | 'cancelled';
  breakdown?: {
    service_fee?: number;
    delivery_fee?: number;
  };
  payment_url?: string;
  created_at?: string;
  paid_at?: string;
  // Joined
  customer_name?: string;
  service_name?: string;
}

/**
 * Create payment payload
 */
export interface CreatePaymentPayload {
  invoice_id: string;
  payment_method?: string;
}

/**
 * Payment callback payload (for simulation / dummy mode)
 * Backend dummy mode accepts: { payment_id, status: 'success' }
 * or Midtrans style: { order_id: payment_id, transaction_status: 'settlement' }
 */
export interface PaymentCallbackPayload {
  payment_id?: string;
  order_id?: string;
  status?: string;
  transaction_status?: string;
  payment_method?: string;
  paid_amount?: number;
}

/**
 * Payment object
 */
export interface Payment {
  payment_id: string;
  invoice_id: string;
  amount: number;
  payment_method?: string;
  status: string;
  paid_at?: string;
  created_at?: string;
}
