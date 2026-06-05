/**
 * User roles as defined by backend
 */
export type UserRole = 'customer' | 'owner' | 'courier' | 'admin';

/**
 * Frontend role labels (Indonesian)
 */
export type FrontendRole = 'pelanggan' | 'mitra' | 'kurir';

/**
 * Mapping from frontend role labels to backend roles
 */
export const ROLE_MAP: Record<FrontendRole, UserRole> = {
  pelanggan: 'customer',
  mitra: 'owner',
  kurir: 'courier',
};

/**
 * User object from /auth/profile
 */
export interface User {
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  is_verified?: number | boolean;
  created_at?: string;
  updated_at?: string;
  // Courier-specific fields
  vehicle_name?: string | null;
  vehicle_plate_number?: string | null;
}

/**
 * Login request payload
 */
export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Login response data
 */
export interface LoginResponse {
  token?: string;
  access_token?: string;
  user?: User;
}

/**
 * Register request payload
 */
export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  // Courier-specific
  vehicle_name?: string | null;
  vehicle_plate_number?: string | null;
}

/**
 * Update profile payload
 */
export interface UpdateProfilePayload {
  full_name?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

/**
 * Pending user (for admin verification)
 */
export interface PendingUser {
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_verified: number | boolean;
  created_at?: string;
}
