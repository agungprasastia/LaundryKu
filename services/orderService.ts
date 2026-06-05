import apiClient from './api';
import { ApiResponse } from '@/types/api';
import {
  Order,
  CreateOrderPayload,
  OrderTracking,
  AssignCourierPayload,
  UpdateWeightPayload,
} from '@/types/order';

/**
 * POST /orders
 */
export async function createOrder(payload: CreateOrderPayload): Promise<ApiResponse<Order>> {
  const response = await apiClient.post('/orders', payload);
  return response.data;
}

/**
 * GET /orders/my-orders
 */
export async function getMyOrders(): Promise<ApiResponse<Order[]>> {
  const response = await apiClient.get('/orders/my-orders');
  return response.data;
}

/**
 * GET /orders/my-orders/history
 */
export async function getMyOrdersHistory(): Promise<ApiResponse<Order[]>> {
  const response = await apiClient.get('/orders/my-orders/history');
  return response.data;
}

/**
 * GET /orders/:order_id
 */
export async function getOrderById(orderId: string): Promise<ApiResponse<Order>> {
  const response = await apiClient.get(`/orders/${orderId}`);
  return response.data;
}

/**
 * GET /orders/:order_id/tracking
 */
export async function getOrderTracking(orderId: string): Promise<ApiResponse<OrderTracking>> {
  const response = await apiClient.get(`/orders/${orderId}/tracking`);
  return response.data;
}

/**
 * PATCH /orders/:order_id/status
 */
export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<ApiResponse<Order>> {
  const response = await apiClient.patch(`/orders/${orderId}/status`, { status });
  return response.data;
}

/**
 * POST /orders/:order_id/assign-courier
 */
export async function assignCourier(
  orderId: string,
  payload: AssignCourierPayload
): Promise<ApiResponse> {
  const response = await apiClient.post(`/orders/${orderId}/assign-courier`, payload);
  return response.data;
}

/**
 * PATCH /orders/:order_id/weight
 */
export async function updateOrderWeight(
  orderId: string,
  payload: UpdateWeightPayload
): Promise<ApiResponse> {
  const response = await apiClient.patch(`/orders/${orderId}/weight`, payload);
  return response.data;
}

/**
 * PATCH /orders/:order_id/activate-delivery
 */
export async function activateDelivery(orderId: string): Promise<ApiResponse> {
  const response = await apiClient.patch(`/orders/${orderId}/activate-delivery`);
  return response.data;
}

/**
 * PATCH /orders/:order_id/complete
 */
export async function completeOrder(orderId: string): Promise<ApiResponse> {
  const response = await apiClient.patch(`/orders/${orderId}/complete`);
  return response.data;
}
