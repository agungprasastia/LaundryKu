/**
 * All possible order statuses
 */
export type OrderStatus =
  | "WAITING_OWNER_CONFIRMATION"
  | "CONFIRMED"
  | "PICKUP_ON_THE_WAY"
  | "LAUNDRY_PICKED"
  | "PROCESSING"
  | "READY_FOR_DELIVERY"
  | "DELIVERY_ON_THE_WAY"
  | "DELIVERED"
  | "COMPLETED";

/**
 * Status history entry from order_status_logs (returned by getOrderDetail)
 */
export interface StatusHistoryEntry {
  status: OrderStatus;
  at: string;
}

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
  owner_lat?: number;
  owner_lng?: number;
  pickup_scheduled_at?: string;
  delivery_address?: string;
  delivery_lat?: number;
  delivery_lng?: number;
  weight_kg?: number;
  distance_km?: number;
  service_fee?: number;
  delivery_fee?: number;
  total_amount?: number;
  total_price?: number; // kept for backward compat
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
  // Nested from getOrderDetail
  service?: {
    name?: string;
    price_per_kg_customer?: number;
  };
  courier?: {
    name?: string;
    vehicle?: string;
  } | null;
  status_history?: StatusHistoryEntry[];
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
  order_status?: OrderStatus | string;
  current_phase?: "pickup" | "delivery" | string;
  task_status?: string;
  courier?: {
    name?: string;
    vehicle?: string;
  } | null;
  tracking_history?: TrackingEntry[];
  courier_location?: {
    lat: number;
    lng: number;
    updated_at: string;
  };
  lat?: number;
  lng?: number;
  courier_lat?: number;
  courier_lng?: number;
  location?: {
    lat?: number;
    lng?: number;
    updated_at?: string;
  };
  updated_at?: string;
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
  courier_id: number;
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
  type?: "pickup" | "delivery";
  status: string;
  current_phase?: "pickup" | "delivery" | string;
  pickup_status?: string;
  delivery_status?: string;
  order_status?: OrderStatus | string;
  pickup_address?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  owner_lat?: number;
  owner_lng?: number;
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
  user_id: number;
  full_name: string;
  vehicle_name?: string;
  vehicle_plate_number?: string;
  lat?: number;
  lng?: number;
}
