/**
 * Invoice object
 */
export interface Invoice {
  invoice_id: string;
  order_id: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'expired';
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
 * Payment callback payload (for simulation)
 */
export interface PaymentCallbackPayload {
  invoice_id: string;
  status: 'paid' | 'failed';
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
