import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LaundryColors } from '@/constants/colors';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminLayout() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: LaundryColors.primary,
          tabBarInactiveTintColor: LaundryColors.textMuted,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: LaundryColors.inputBorder,
            height: 65,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="beranda"
          options={{
            title: 'Beranda',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="verifikasi"
          options={{
            title: 'Verifikasi',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="shield-checkmark-outline" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="pengguna"
          options={{
            title: 'Pengguna',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="laporan"
          options={{
            title: 'Laporan',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="chart-box-outline" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: 'Wallet',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="wallet-outline" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profil"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={22} color={color} />
            ),
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
