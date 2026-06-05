import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LaundryColors } from '@/constants/colors';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function OwnerLayout() {
  return (
    <ProtectedRoute allowedRoles={['owner']}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: LaundryColors.roleMitraIcon,
          tabBarInactiveTintColor: LaundryColors.textMuted,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: LaundryColors.inputBorder,
            height: 65, paddingBottom: 8, paddingTop: 6,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        <Tabs.Screen name="beranda" options={{ title: 'Beranda', tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} /> }} />
        <Tabs.Screen name="services" options={{ title: 'Layanan', tabBarIcon: ({ color }) => <Ionicons name="shirt" size={22} color={color} /> }} />
        <Tabs.Screen name="orders" options={{ title: 'Pesanan', tabBarIcon: ({ color }) => <Ionicons name="cube" size={22} color={color} /> }} />
        <Tabs.Screen name="wallet" options={{ title: 'Wallet', tabBarIcon: ({ color }) => <Ionicons name="wallet" size={22} color={color} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} /> }} />
      </Tabs>
    </ProtectedRoute>
  );
}
