import { OrderStatus } from '@/types/order';

/**
 * Order status labels in Indonesian
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  WAITING_OWNER_CONFIRMATION: 'Menunggu Konfirmasi Owner',
  CONFIRMED: 'Dikonfirmasi Owner',
  PICKUP_ON_THE_WAY: 'Kurir Menuju Lokasi Pickup',
  LAUNDRY_PICKED: 'Laundry Sudah Diambil',
  PROCESSING: 'Sedang Diproses',
  READY_FOR_DELIVERY: 'Siap Diantar',
  DELIVERY_ON_THE_WAY: 'Kurir Menuju Customer',
  DELIVERED: 'Sudah Diterima Customer',
  COMPLETED: 'Selesai',
};

/**
 * Order status colors for UI badges
 */
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  WAITING_OWNER_CONFIRMATION: '#F97316', // orange
  CONFIRMED: '#2563EB',                   // blue
  PICKUP_ON_THE_WAY: '#8B5CF6',          // purple
  LAUNDRY_PICKED: '#6366F1',             // indigo
  PROCESSING: '#0EA5E9',                  // sky
  READY_FOR_DELIVERY: '#10B981',         // green
  DELIVERY_ON_THE_WAY: '#8B5CF6',        // purple
  DELIVERED: '#059669',                    // emerald
  COMPLETED: '#10B981',                   // green
};

/**
 * Order status background colors (light) for badges
 */
export const ORDER_STATUS_BG_COLORS: Record<OrderStatus, string> = {
  WAITING_OWNER_CONFIRMATION: '#FFF7ED',
  CONFIRMED: '#EBF5FF',
  PICKUP_ON_THE_WAY: '#F5F3FF',
  LAUNDRY_PICKED: '#EEF2FF',
  PROCESSING: '#F0F9FF',
  READY_FOR_DELIVERY: '#ECFDF5',
  DELIVERY_ON_THE_WAY: '#F5F3FF',
  DELIVERED: '#ECFDF5',
  COMPLETED: '#ECFDF5',
};

/**
 * Get Indonesian label for an order status
 */
export function getStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] || status;
}

/**
 * Get color for an order status
 */
export function getStatusColor(status: string): string {
  return ORDER_STATUS_COLORS[status as OrderStatus] || '#64748B';
}

/**
 * Get background color for an order status badge
 */
export function getStatusBgColor(status: string): string {
  return ORDER_STATUS_BG_COLORS[status as OrderStatus] || '#F1F5F9';
}

/**
 * All order statuses in order
 */
export const ALL_ORDER_STATUSES: OrderStatus[] = [
  'WAITING_OWNER_CONFIRMATION',
  'CONFIRMED',
  'PICKUP_ON_THE_WAY',
  'LAUNDRY_PICKED',
  'PROCESSING',
  'READY_FOR_DELIVERY',
  'DELIVERY_ON_THE_WAY',
  'DELIVERED',
  'COMPLETED',
];
