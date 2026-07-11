import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const { colors: LaundryColors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: LaundryColors.primary,
        tabBarInactiveTintColor: LaundryColors.textMuted,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Jelajahi',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}



