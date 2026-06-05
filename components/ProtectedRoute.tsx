import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';
import { LaundryColors } from '@/constants/colors';

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
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      // Not logged in → go to login
      router.replace('/(auth)/login');
      return;
    }

    // Check role
    if (!allowedRoles.includes(user.role)) {
      // Wrong role → redirect to correct role dashboard
      redirectToRoleDashboard(user.role);
      return;
    }

    // Check verification for owner/courier
    if ((user.role === 'owner' || user.role === 'courier') && !user.is_verified) {
      router.replace('/(auth)/waiting-verification');
      return;
    }
  }, [isLoading, isAuthenticated, user]);

  function redirectToRoleDashboard(role: UserRole) {
    switch (role) {
      case 'admin':
        router.replace('/(admin)/beranda');
        break;
      case 'customer':
        router.replace('/(customer)/beranda');
        break;
      case 'owner':
        if (!user?.is_verified) {
          router.replace('/(auth)/waiting-verification');
        } else {
          router.replace('/(owner)/beranda');
        }
        break;
      case 'courier':
        if (!user?.is_verified) {
          router.replace('/(auth)/waiting-verification');
        } else {
          router.replace('/(courier)/beranda');
        }
        break;
      default:
        router.replace('/(auth)/login');
    }
  }

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

const styles = StyleSheet.create({
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
