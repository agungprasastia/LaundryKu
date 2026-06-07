import apiClient from "./api";
import { ApiResponse } from "@/types/api";
import { Order } from "@/types/order";

export interface OwnerReportSummary {
  total_orders?: number;
  total_order?: number;
  total_revenue?: number;
  owner_revenue?: number;
  owner_earning?: number;
  total_owner_earning?: number;
  active_orders?: number;
  pending_orders?: number;
  completed_orders?: number;
}

/** GET /owner/orders */
export async function getOwnerOrders(): Promise<ApiResponse<Order[]>> {
  const response = await apiClient.get("/owner/orders");
  return response.data;
}

/** GET /owner/reports/summary */
export async function getOwnerReportSummary(): Promise<
  ApiResponse<OwnerReportSummary>
> {
  const response = await apiClient.get("/owner/reports/summary");
  return response.data;
}

