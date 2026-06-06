import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { crossAlert } from "@/utils/crossAlert";
import { LaundryColors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import * as notificationService from "@/services/notificationService";
import { Notification } from "@/types/notification";
import {
  CourierScreen,
  EmptyState,
  ErrorState,
  formatDate,
  getErrorMessage,
  InfoRow,
  isVerified,
  LoadingState,
  StatusPill,
  courierStyles,
} from "./_components";

export default function CourierProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    try {
      setError("");
      const response = await notificationService.getNotifications();
      setNotifications(
        response.success && Array.isArray(response.data) ? response.data : [],
      );
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat notifikasi"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleLogout = () => {
    crossAlert("Logout", "Yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const markRead = async (notification: Notification) => {
    try {
      await notificationService.markAsRead(notification.notification_id);
      setNotifications((current) =>
        current.map((item) =>
          item.notification_id === notification.notification_id
            ? { ...item, is_read: true }
            : item,
        ),
      );
    } catch (err) {
      crossAlert("Error", getErrorMessage(err, "Gagal menandai notifikasi"));
    }
  };

  return (
    <CourierScreen
      title="Profil"
      subtitle="Akun kurir"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadNotifications();
          }}
        />
      }
    >
      <View style={courierStyles.card}>
        <View style={[courierStyles.center, { padding: 8 }]}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: LaundryColors.roleKurirIcon,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="person" size={34} color="#FFF" />
          </View>
          <Text style={courierStyles.cardTitle}>
            {user?.full_name || "Kurir"}
          </Text>
          <Text style={courierStyles.muted}>{user?.email || "-"}</Text>
          <StatusPill
            text={
              isVerified(user?.is_verified) ? "Verified" : "Menunggu Verifikasi"
            }
            accent={isVerified(user?.is_verified)}
          />
        </View>
        <InfoRow label="Role" value={user?.role || "-"} />
        <InfoRow label="Vehicle" value={user?.vehicle_name || "-"} />
        <InfoRow label="Plate" value={user?.vehicle_plate_number || "-"} />
        <InfoRow label="Address" value={user?.address || "-"} />
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            backgroundColor: "#FEF2F2",
            borderRadius: 14,
            padding: 13,
            marginTop: 16,
            borderWidth: 1,
            borderColor: "#FECACA",
          }}
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={18}
            color={LaundryColors.error}
          />
          <Text style={{ color: LaundryColors.error, fontWeight: "800" }}>
            Keluar
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={courierStyles.sectionTitle}>Notifications</Text>
      {loading ? (
        <LoadingState text="Memuat notifikasi..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadNotifications} />
      ) : notifications.length === 0 ? (
        <EmptyState title="Belum ada notifikasi" />
      ) : (
        notifications.map((notification) => (
          <TouchableOpacity
            key={notification.notification_id}
            style={[
              courierStyles.card,
              !notification.is_read && {
                borderColor: LaundryColors.roleKurirIcon,
                backgroundColor: "#FFF7ED",
              },
            ]}
            onPress={() => markRead(notification)}
          >
            <View style={courierStyles.row}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "900",
                  color: LaundryColors.textPrimary,
                  flex: 1,
                }}
              >
                {notification.title || notification.type || "Notifikasi"}
              </Text>
              <StatusPill
                text={notification.is_read ? "Read" : "Unread"}
                accent={!notification.is_read}
              />
            </View>
            <Text style={courierStyles.muted}>
              {notification.body || notification.message || "-"}
            </Text>
            <Text style={courierStyles.muted}>
              {formatDate(notification.created_at)}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </CourierScreen>
  );
}
