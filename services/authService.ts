import apiClient from './api';
import { ApiResponse } from '@/types/api';
import { User, LoginPayload, LoginResponse, RegisterPayload, UpdateProfilePayload } from '@/types/user';

/**
 * POST /auth/login
 */
export async function login(payload: LoginPayload): Promise<ApiResponse<LoginResponse>> {
  const response = await apiClient.post('/auth/login', payload);
  return response.data;
}

/**
 * POST /auth/register
 */
export async function register(payload: RegisterPayload): Promise<ApiResponse> {
  const response = await apiClient.post('/auth/register', payload);
  return response.data;
}

/**
 * GET /auth/profile
 */
export async function getProfile(): Promise<ApiResponse<User>> {
  const response = await apiClient.get('/auth/profile');
  return response.data;
}

/**
 * PATCH /auth/profile
 */
export async function updateProfile(payload: UpdateProfilePayload): Promise<ApiResponse<User>> {
  const response = await apiClient.patch('/auth/profile', payload);
  return response.data;
}

/**
 * POST /auth/logout
 */
export async function logout(): Promise<ApiResponse> {
  const response = await apiClient.post('/auth/logout');
  return response.data;
}
