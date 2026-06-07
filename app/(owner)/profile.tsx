import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { crossAlert } from "@/utils/crossAlert";
import { useRouter } from "expo-router";
import { LaundryColors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import * as notificationService from "@/services/notificationService";
import { Notification } from "@/types/notification";
import {
  EmptyState,
  ErrorState,
  formatDate,
  getErrorMessage,
  isVerified,
  LoadingState,
  OwnerScreen,
  ownerStyles,
} from "@/components/owner/roleComponents";

export default function OwnerProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const r = await notificationService.getNotifications();
      setItems(r.success && Array.isArray(r.data) ? r.data : []);
    } catch (e: any) {
      setError(getErrorMessage(e, "Gagal memuat notifikasi"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleLogout = () => {
    crossAlert("Logout", "Yakin ingin keluar dari akun Anda?", [
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

  const read = async (n: Notification) => {
    try {
      if (!n.is_read) {
        await notificationService.markAsRead(n.notification_id);
        load();
      }
    } catch (e: any) {
      crossAlert("Error", getErrorMessage(e, "Error"));
    }
  };

  const latLng =
    user?.lat != null && user?.lng != null
      ? `${user.lat}, ${user.lng}`
      : "Belum diatur";

  const isUserVerified = isVerified(user?.is_verified);

  return (
    <OwnerScreen
      title="Profil Mitra"
      subtitle="Pengaturan akun & notifikasi"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          colors={[LaundryColors.roleMitraIcon]}
        />
      }
    >
      {/* PROFILE HEADER */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="business" size={40} color="#FFF" />
          </View>
          {isUserVerified && (
            <View style={styles.verifiedBadgeIcon}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            </View>
          )}
        </View>
        <Text style={styles.profileName}>{user?.full_name || "Mitra Laundry"}</Text>
        <Text style={styles.profileEmail}>{user?.email || "-"}</Text>

        <View style={[styles.statusPill, { backgroundColor: isUserVerified ? "#ECFDF5" : "#FFF7ED" }]}>
          <Text style={[styles.statusPillText, { color: isUserVerified ? "#10B981" : "#F59E0B" }]}>
            {isUserVerified ? "Mitra Terverifikasi" : "Menunggu Verifikasi"}
          </Text>
        </View>
      </View>

      {/* PROFILE DETAILS */}
      <View style={styles.detailsCard}>
        <Text style={styles.detailsHeading}>Informasi Akun</Text>
        
        <View style={styles.detailRow}>
          <View style={styles.detailIconBox}>
            <Ionicons name="id-card-outline" size={20} color={LaundryColors.roleMitraIcon} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Peran</Text>
            <Text style={styles.detailValue}>{user?.role?.toUpperCase() || "OWNER"}</Text>
          </View>
        </View>

        <View style={styles.detailDivider} />

        <View style={styles.detailRow}>
          <View style={styles.detailIconBox}>
            <Ionicons name="location-outline" size={20} color={LaundryColors.roleMitraIcon} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Alamat Outlet</Text>
            <Text style={styles.detailValue}>{user?.address || "-"}</Text>
          </View>
        </View>

        <View style={styles.detailDivider} />

        <View style={styles.detailRow}>
          <View style={styles.detailIconBox}>
            <Ionicons name="map-outline" size={20} color={LaundryColors.roleMitraIcon} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Koordinat (Lat/Lng)</Text>
            <Text style={styles.detailValue}>{latLng}</Text>
          </View>
        </View>
      </View>

      {/* NOTIFICATIONS SECTION */}
      <View style={styles.notificationsHeaderRow}>
        <Text style={ownerStyles.sectionTitle}>Notifikasi Terbaru</Text>
        {items.filter(i => !i.is_read).length > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{items.filter(i => !i.is_read).length} Baru</Text>
          </View>
        )}
      </View>

      {loading ? (
        <LoadingState text="Memuat notifikasi..." />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState title="Tidak ada notifikasi" icon="notifications-off-outline" />
      ) : (
        items.map((n) => (
          <TouchableOpacity
            key={n.notification_id}
            style={[styles.notificationCard, !n.is_read && styles.notificationCardUnread]}
            onPress={() => read(n)}
            activeOpacity={0.8}
          >
            <View style={[styles.notifIconBox, !n.is_read && styles.notifIconBoxUnread]}>
              <Ionicons 
                name={n.is_read ? "notifications-outline" : "notifications"} 
                size={22} 
                color={!n.is_read ? LaundryColors.roleMitraIcon : LaundryColors.textMuted} 
              />
            </View>
            <View style={styles.notifContentBox}>
              <View style={styles.notifHeaderRow}>
                <Text style={[styles.notifTitle, !n.is_read && styles.notifTitleUnread]} numberOfLines={1}>
                  {n.title || n.type || "Notifikasi"}
                </Text>
                <Text style={styles.notifTime}>{formatDate(n.created_at)}</Text>
              </View>
              <Text style={styles.notifMessage} numberOfLines={2}>
                {n.body || n.message || "-"}
              </Text>
            </View>
            {!n.is_read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))
      )}

      {/* LOGOUT */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color={LaundryColors.error} />
        <Text style={styles.logoutButtonText}>Keluar Akun</Text>
      </TouchableOpacity>
    </OwnerScreen>
  );
}

const styles = StyleSheet.create({
  profileHeaderCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: LaundryColors.roleMitraIcon,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#EBF5FF",
  },
  verifiedBadgeIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderRadius: 12,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
  profileEmail: {
    fontSize: 14,
    color: LaundryColors.textSecondary,
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
    marginTop: 12,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
  },

  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  detailsHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  detailIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: LaundryColors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
  detailDivider: {
    height: 1,
    backgroundColor: LaundryColors.inputBorder,
    marginVertical: 16,
    marginLeft: 56,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: LaundryColors.error,
  },

  notificationsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  unreadBadge: {
    backgroundColor: LaundryColors.roleMitraIcon,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFF",
  },

  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  notificationCardUnread: {
    backgroundColor: "#F8FAFC",
    borderColor: "#DBEAFE",
  },
  notifIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notifIconBoxUnread: {
    backgroundColor: "#EBF5FF",
  },
  notifContentBox: {
    flex: 1,
    paddingRight: 8,
  },
  notifHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: LaundryColors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  notifTitleUnread: {
    color: LaundryColors.textPrimary,
    fontWeight: "700",
  },
  notifTime: {
    fontSize: 11,
    color: LaundryColors.textMuted,
    fontWeight: "500",
  },
  notifMessage: {
    fontSize: 13,
    color: LaundryColors.textSecondary,
    lineHeight: 20,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: LaundryColors.roleMitraIcon,
    marginTop: 18,
  },
});
