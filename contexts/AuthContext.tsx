import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole, RegisterPayload, UpdateProfilePayload } from '@/types/user';
import * as authService from '@/services/authService';
import { saveToken, removeToken, getToken, setOnUnauthorized } from '@/services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ role: UserRole; isVerified: boolean }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isLoggingOut = useRef(false);

  const isAuthenticated = !!token && !!user;

  /**
   * Clear session state and storage
   */
  const clearSession = useCallback(async () => {
    setUser(null);
    setToken(null);
    await removeToken();
  }, []);

  /**
   * Handle 401 unauthorized — auto logout without infinite loops
   */
  useEffect(() => {
    setOnUnauthorized(() => {
      if (!isLoggingOut.current) {
        isLoggingOut.current = true;
        clearSession().finally(() => {
          isLoggingOut.current = false;
        });
      }
    });
  }, [clearSession]);

  /**
   * Load existing session from SecureStore on app start
   */
  const loadSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedToken = await getToken();
      if (storedToken) {
        setToken(storedToken);
        // Try to fetch profile with stored token
        const profileResponse = await authService.getProfile();
        if (profileResponse.success && profileResponse.data) {
          setUser(profileResponse.data);
        } else {
          // Token invalid, clear session
          await clearSession();
        }
      }
    } catch {
      // Token expired or invalid
      await clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  /**
   * Login with email and password
   * Returns role and verification status for routing
   */
  const login = useCallback(async (email: string, password: string) => {
    const loginResponse = await authService.login({ email, password });

    const tokenValue = loginResponse.data?.access_token || loginResponse.data?.token;
    if (!loginResponse.success || !tokenValue) {
      throw new Error(loginResponse.message || 'Login gagal');
    }

    const newToken = tokenValue;

    // Save token
    await saveToken(newToken);
    setToken(newToken);

    // Fetch profile
    const profileResponse = await authService.getProfile();
    if (!profileResponse.success || !profileResponse.data) {
      throw new Error(profileResponse.message || 'Gagal mengambil profil');
    }

    const userData = profileResponse.data;
    setUser(userData);

    return {
      role: userData.role,
      isVerified: !!(userData.is_verified),
    };
  }, []);

  /**
   * Register a new account
   */
  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authService.register(payload);
    return {
      success: response.success,
      message: response.message || (response.success ? 'Registrasi berhasil' : 'Registrasi gagal'),
    };
  }, []);

  /**
   * Logout — call API, clear token and user
   */
  const logout = useCallback(async () => {
    try {
      isLoggingOut.current = true;
      await authService.logout();
    } catch (error) {
      // Even if API call fails, still clear local session
      console.warn('Logout API call failed:', error);
    } finally {
      await clearSession();
      isLoggingOut.current = false;
    }
  }, [clearSession]);

  /**
   * Refresh profile data from API
   */
  const refreshProfile = useCallback(async () => {
    try {
      const response = await authService.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.warn('Failed to refresh profile:', error);
    }
  }, []);

  /**
   * Update profile
   */
  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    const response = await authService.updateProfile(payload);
    if (!response.success) {
      throw new Error(response.message || 'Gagal mengupdate profil');
    }
    if (response.data) {
      setUser(response.data);
    } else {
      // Refresh profile if response doesn't return updated data
      await refreshProfile();
    }
  }, [refreshProfile]);

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    loadSession,
    refreshProfile,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
