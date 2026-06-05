/**
 * Laundry service offered by owners
 */
export interface LaundryService {
  service_id: string;
  owner_id?: string;
  name: string;
  description?: string;
  price_per_kg?: number;
  price_per_kg_owner?: number;
  price_per_kg_customer?: number;
  is_active?: boolean | number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Create service payload
 */
export interface CreateServicePayload {
  service_id: string;
  name: string;
  description?: string;
  price_per_kg_owner: number;
}

/**
 * Update service payload
 */
export interface UpdateServicePayload {
  name?: string;
  description?: string;
  price_per_kg_owner?: number;
}
