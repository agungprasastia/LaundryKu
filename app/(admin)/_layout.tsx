import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminLayout() {
  const { colors: LaundryColors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: LaundryColors.primary,
          tabBarInactiveTintColor: LaundryColors.textMuted,
          tabBarStyle: {
            backgroundColor: LaundryColors.cardBg,
            borderTopWidth: 1,
            borderTopColor: LaundryColors.inputBorder,
            height: 60 + (insets.bottom > 0 ? insets.bottom - 4 : 8),
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="beranda"
          options={{
            title: 'Beranda',
            tabBarIcon: ({ color }) => (
              <Ionicons name="home" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="verifikasi"
          options={{
            title: 'Verifikasi',
            tabBarIcon: ({ color }) => (
              <Ionicons name="shield-checkmark-outline" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="pengguna"
          options={{
            title: 'Pengguna',
            tabBarIcon: ({ color }) => (
              <Ionicons name="people-outline" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="laporan"
          options={{
            title: 'Laporan',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="chart-box-outline" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: 'Wallet',
            tabBarIcon: ({ color }) => (
              <Ionicons name="wallet-outline" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profil"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color }) => (
              <Ionicons name="person-outline" size={22} color={color} />
            ),
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
