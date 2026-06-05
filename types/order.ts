/**
 * All possible order statuses
 */
export type OrderStatus =
  | 'WAITING_OWNER_CONFIRMATION'
  | 'CONFIRMED'
  | 'PICKUP_ON_THE_WAY'
  | 'LAUNDRY_PICKED'
  | 'PROCESSING'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERY_ON_THE_WAY'
  | 'DELIVERED'
  | 'COMPLETED';

/**
 * Order object
 */
export interface Order {
  order_id: string;
  customer_id?: string;
  service_id?: string;
  owner_id?: string;
  status: OrderStatus;
  pickup_address?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  pickup_scheduled_at?: string;
  delivery_address?: string;
  delivery_lat?: number;
  delivery_lng?: number;
  weight_kg?: number;
  total_price?: number;
  platform_fee?: number;
  owner_earning?: number;
  courier_fee?: number;
  invoice_id?: string;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  service_name?: string;
  customer_name?: string;
  owner_name?: string;
  courier_name?: string;
}

/**
 * Create order payload
 */
export interface CreateOrderPayload {
  service_id: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  pickup_scheduled_at: string;
}

/**
 * Order tracking data
 */
export interface OrderTracking {
  order_id: string;
  status: OrderStatus;
  tracking_history?: TrackingEntry[];
  courier_location?: {
    lat: number;
    lng: number;
    updated_at: string;
  };
}

/**
 * Single tracking history entry
 */
export interface TrackingEntry {
  status: OrderStatus;
  timestamp: string;
  description?: string;
}

/**
 * Assign courier payload
 */
export interface AssignCourierPayload {
  courier_id: string;
}

/**
 * Update weight payload
 */
export interface UpdateWeightPayload {
  weight_kg: number;
}

/**
 * Courier task / assignment
 */
export interface CourierTask {
  assignment_id: string;
  order_id: string;
  courier_id?: string;
  type?: 'pickup' | 'delivery';
  status: string;
  pickup_address?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  delivery_address?: string;
  delivery_lat?: number;
  delivery_lng?: number;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  customer_name?: string;
  service_name?: string;
}

/**
 * Courier earnings
 */
export interface CourierEarnings {
  total_earnings?: number;
  this_month?: number;
  today?: number;
  completed_tasks?: number;
}

/**
 * Available courier
 */
export interface AvailableCourier {
  user_id: string;
  full_name: string;
  vehicle_name?: string;
  vehicle_plate_number?: string;
  lat?: number;
  lng?: number;
}
