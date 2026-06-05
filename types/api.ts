/**
 * Generic API Response wrapper
 * All backend responses follow this format
 */
export interface ApiResponse<T = any> {
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
export interface PaginatedResponse<T = any> {
  success: boolean;
  message: string;
  data?: T[];
  meta?: PaginationMeta;
}
