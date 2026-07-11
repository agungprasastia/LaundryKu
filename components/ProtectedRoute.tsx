import React, { useCallback, useEffect } from 'react';
import { ThemeColors } from '@/constants/colors';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStyles } from '@/hooks/useAppStyles';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

/**
 * ProtectedRoute component
 * - If not authenticated → redirect to login
 * - If wrong role → redirect to correct role's beranda
 * - If owner/courier not verified → redirect to waiting-verification
 * - Shows loading spinner while checking session
 */
export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
const redirectToRoleDashboard = useCallback((role: UserRole) => {
    switch (role) {
      case 'admin':
        router.replace('/(admin)/beranda');
        break;
      case 'customer':
        router.replace('/(customer)/beranda');
        break;
      case 'owner':
        router.replace(user?.is_verified ? '/(owner)/beranda' : '/(auth)/waiting-verification');
        break;
      case 'courier':
        router.replace(user?.is_verified ? '/(courier)/beranda' : '/(auth)/waiting-verification');
        break;
      default:
        router.replace('/(auth)/login');
    }
  }, [router, user?.is_verified]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace('/(auth)/login');
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      redirectToRoleDashboard(user.role);
      return;
    }

    if ((user.role === 'owner' || user.role === 'courier') && !user.is_verified) {
      router.replace('/(auth)/waiting-verification');
    }
  }, [allowedRoles, isAuthenticated, isLoading, redirectToRoleDashboard, router, user]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={LaundryColors.primary} />
        <Text style={styles.loadingText}>Memuat...</Text>
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  if (!allowedRoles.includes(user.role)) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}

const createStyles = (LaundryColors: ThemeColors) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LaundryColors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: LaundryColors.textSecondary,
    fontWeight: '500',
  },
});





