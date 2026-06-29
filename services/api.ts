import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { Platform } from 'react-native';

const TOKEN_KEY = 'laundryku_token';

/**
 * In-memory token cache — ensures token is immediately available
 * after login without waiting for async storage reads
 */
let inMemoryToken: string | null = null;

/**
 * Callback for handling 401 unauthorized responses.
 * Set by AuthContext to trigger logout without importing React hooks here.
 */
let onUnauthorizedCallback: (() => void) | null = null;

export function setOnUnauthorized(callback: () => void) {
  onUnauthorizedCallback = callback;
}

/**
 * Determine if we can use SecureStore (native only)
 */
const isWeb = Platform.OS === 'web';

/**
 * Lazy-import SecureStore only on native platforms
 */
let SecureStore: typeof import('expo-secure-store') | null = null;
if (!isWeb) {
  try {
    SecureStore = require('expo-secure-store');
  } catch {
    console.warn('expo-secure-store not available');
  }
}

/**
 * Create axios instance with base URL from environment
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor — attach Bearer token (from memory first, then storage)
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Use in-memory token first (fastest & always available)
    let token = inMemoryToken;

    // If no in-memory token, try reading from persistent storage
    if (!token) {
      token = await getToken();
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor — handle 401
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Save token to persistent storage + in-memory cache
 */
export async function saveToken(token: string): Promise<void> {
  // Always update in-memory immediately
  inMemoryToken = token;

  try {
    if (isWeb) {
      localStorage.setItem(TOKEN_KEY, token);
    } else if (SecureStore) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (error) {
    console.warn('Token save failed:', error);
  }
}

/**
 * Get token from persistent storage (or in-memory cache)
 */
export async function getToken(): Promise<string | null> {
  // Return in-memory token if available
  if (inMemoryToken) return inMemoryToken;

  try {
    let token: string | null = null;
    if (isWeb) {
      token = localStorage.getItem(TOKEN_KEY);
    } else if (SecureStore) {
      token = await SecureStore.getItemAsync(TOKEN_KEY);
    }
    if (token) {
      inMemoryToken = token; // cache it
    }
    return token;
  } catch (error) {
    console.warn('Token read failed:', error);
    return null;
  }
}

/**
 * Remove token from all storage
 */
export async function removeToken(): Promise<void> {
  inMemoryToken = null;

  try {
    if (isWeb) {
      localStorage.removeItem(TOKEN_KEY);
    } else if (SecureStore) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.warn('Token delete failed:', error);
  }
}

export default apiClient;
