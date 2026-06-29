import { Tabs } from "expo-router";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { LaundryColors } from "@/constants/colors";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function CourierLayout() {
  return (
    <ProtectedRoute allowedRoles={["courier"]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: LaundryColors.roleKurirIcon,
          tabBarInactiveTintColor: LaundryColors.textMuted,
          tabBarStyle: {
            backgroundColor: LaundryColors.textWhite,
            borderTopWidth: 1,
            borderTopColor: LaundryColors.inputBorder,
            height: 65,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        }}
      >
        <Tabs.Screen
          name="beranda"
          options={{
            title: "Beranda",
            tabBarIcon: ({ color }) => (
              <Ionicons name="home" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: "Tugas",
            tabBarIcon: ({ color }) => (
              <Ionicons name="list" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="earnings"
          options={{
            title: "Pendapatan",
            tabBarIcon: ({ color }) => (
              <Ionicons name="cash" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: "Wallet",
            tabBarIcon: ({ color }) => (
              <Ionicons name="wallet" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profil",
            tabBarIcon: ({ color }) => (
              <Ionicons name="person-outline" size={22} color={color} />
            ),
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
