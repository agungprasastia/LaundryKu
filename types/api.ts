/**
 * Generic API Response wrapper
 * All backend responses follow this format
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Pagination metadata (if backend returns paginated data)
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated API Response
 */
export interface PaginatedResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T[];
  meta?: PaginationMeta;
}

export interface AdminDashboardMetrics {
  total_users?: number;
  users_change?: string;
  total_orders?: number;
  orders_change?: string;
  active_couriers?: number;
  couriers_change?: string;
  total_revenue?: number;
  gmv?: number;
  revenue_change?: string;
}

export interface AdminAnalytics {
  gmv?: number;
  total_gmv?: number;
  total_revenue?: number;
  total_orders?: number;
  total_commission?: number;
  platform_commission?: number;
  total_users?: number;
  active_couriers?: number;
  completed_orders?: number;
  pending_orders?: number;
  cancelled_orders?: number;
}

