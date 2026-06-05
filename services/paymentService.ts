import apiClient from './api';
import { ApiResponse } from '@/types/api';
import { Invoice, CreatePaymentPayload, PaymentCallbackPayload, Payment } from '@/types/payment';

/**
 * GET /payments/invoice/:invoice_id
 */
export async function getInvoice(invoiceId: string): Promise<ApiResponse<Invoice>> {
  const response = await apiClient.get(`/payments/invoice/${invoiceId}`);
  return response.data;
}

/**
 * POST /payments
 */
export async function createPayment(payload: CreatePaymentPayload): Promise<ApiResponse<Payment>> {
  const response = await apiClient.post('/payments', payload);
  return response.data;
}

/**
 * POST /payments/callback — for development/simulation only
 */
export async function simulatePaymentCallback(
  payload: PaymentCallbackPayload
): Promise<ApiResponse> {
  const response = await apiClient.post('/payments/callback', payload);
  return response.data;
}
