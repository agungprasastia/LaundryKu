import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, StyleSheet, Text, TouchableOpacity, View, Modal, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { crossAlert } from "@/utils/crossAlert";
import { LaundryColors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import * as notificationService from "@/services/notificationService";
import { Notification } from "@/types/notification";
import { SettingsModal, HelpModal, AboutModal } from '@/components/ProfileModals';
import {
  CourierScreen,
  EmptyState,
  ErrorState,
  formatDate,
  getErrorMessage,
  isVerified,
  LoadingState,
  courierStyles,
} from "@/components/courier/roleComponents";

export default function CourierProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [notifModal, setNotifModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [helpModal, setHelpModal] = useState(false);
  const [aboutModal, setAboutModal] = useState(false);

  const handleUnavailableFeature = () => {
    crossAlert('Fitur Belum Tersedia', 'Fitur ini belum tersedia.', [{ text: 'OK' }]);
  };

  const [editModal, setEditModal] = useState(false);
  const [form, setForm] = useState({
    vehicle_name: "",
    vehicle_plate_number: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);

  const handleEditProfile = () => {
    setForm({
      vehicle_name: user?.vehicle_name || "",
      vehicle_plate_number: user?.vehicle_plate_number || "",
      address: user?.address || "",
    });
    setEditModal(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({
        vehicle_name: form.vehicle_name,
        vehicle_plate_number: form.vehicle_plate_number,
        address: form.address,
      });
      crossAlert("Berhasil", "Profil diperbarui");
      setEditModal(false);
    } catch (e: any) {
      crossAlert("Error", getErrorMessage(e, "Gagal memperbarui profil"));
    } finally {
      setSaving(false);
    }
  };

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

  const markRead = async (notification: Notification) => {
    if (notification.is_read) return;
    try {
      await notificationService.markAsRead(notification.notification_id);
      await loadNotifications();
    } catch (err) {
      crossAlert("Error", getErrorMessage(err, "Gagal menandai notifikasi"));
    }
  };

  const isUserVerified = isVerified(user?.is_verified);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profil', color: LaundryColors.roleKurirIcon, action: handleEditProfile },
    { icon: 'notifications-outline', label: 'Notifikasi', color: LaundryColors.warning, action: () => setNotifModal(true) },
    { icon: 'settings-outline', label: 'Pengaturan', color: '#8B5CF6', action: () => setSettingsModal(true) },
    { icon: 'help-circle-outline', label: 'Bantuan', color: LaundryColors.success, action: () => setHelpModal(true) },
    { icon: 'information-circle-outline', label: 'Tentang Aplikasi', color: LaundryColors.textSecondary, action: () => setAboutModal(true) },
  ];

  return (
    <CourierScreen
      title="Profil Kurir"
      subtitle="Pengaturan akun & notifikasi"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadNotifications();
          }}
          colors={[LaundryColors.roleKurirIcon]}
        />
      }
    >
      {/* PROFILE HEADER */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="bicycle" size={40} color={LaundryColors.textWhite} />
          </View>
          {isUserVerified && (
            <View style={styles.verifiedBadgeIcon}>
              <Ionicons name="checkmark-circle" size={24} color={LaundryColors.success} />
            </View>
          )}
        </View>
        <Text style={styles.profileName}>{user?.full_name || "Kurir Laundry"}</Text>
        <Text style={styles.profileEmail}>{user?.email || "-"}</Text>

        <View style={[styles.statusPill, { backgroundColor: isUserVerified ? "#ECFDF5" : "#FFF7ED" }]}>
          <Text style={[styles.statusPillText, { color: isUserVerified ? "#10B981" : "#F59E0B" }]}>
            {isUserVerified ? "Kurir Terverifikasi" : "Menunggu Verifikasi"}
          </Text>
        </View>
      </View>

      {/* ─── Menu Items ─── */}
      <View style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]}
            onPress={item.action}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            {item.label === 'Notifikasi' && unreadCount > 0 && (
              <View style={{ backgroundColor: LaundryColors.error, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{unreadCount}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={LaundryColors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* LOGOUT */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color={LaundryColors.error} />
        <Text style={styles.logoutButtonText}>Keluar Akun</Text>
      </TouchableOpacity>

      {/* NOTIFICATIONS MODAL */}
      <Modal visible={notifModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifikasi</Text>
              <TouchableOpacity onPress={() => setNotifModal(false)}>
                <Ionicons name="close" size={24} color={LaundryColors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <View style={{ flex: 1 }}>
              {loading ? (
                <LoadingState text="Memuat notifikasi..." />
              ) : error ? (
                <ErrorState message={error} onRetry={loadNotifications} />
              ) : notifications.length === 0 ? (
                <EmptyState title="Tidak ada notifikasi" icon="notifications-off-outline" />
              ) : (
                <View style={{ flex: 1 }}>
                  {notifications.map((n) => (
                    <TouchableOpacity
                      key={n.notification_id}
                      style={[styles.notificationCard, !n.is_read && styles.notificationCardUnread]}
                      onPress={() => markRead(n)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.notifIconBox, !n.is_read && styles.notifIconBoxUnread]}>
                        <Ionicons 
                          name={n.is_read ? "notifications-outline" : "notifications"} 
                          size={22} 
                          color={!n.is_read ? LaundryColors.roleKurirIcon : LaundryColors.textMuted} 
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
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <SettingsModal visible={settingsModal} onClose={() => setSettingsModal(false)} />
      <HelpModal visible={helpModal} onClose={() => setHelpModal(false)} />
      <AboutModal visible={aboutModal} onClose={() => setAboutModal(false)} />

      {/* EDIT PROFILE MODAL */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profil</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <Ionicons name="close" size={24} color={LaundryColors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: "500", color: LaundryColors.textSecondary, marginBottom: 6 }}>Kendaraan (Cth: Honda Beat)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan tipe kendaraan..."
                  value={form.vehicle_name}
                  onChangeText={(t) => setForm({ ...form, vehicle_name: t })}
                />
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: "500", color: LaundryColors.textSecondary, marginBottom: 6 }}>Plat Nomor</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan plat nomor..."
                  value={form.vehicle_plate_number}
                  onChangeText={(t) => setForm({ ...form, vehicle_plate_number: t })}
                />
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: "500", color: LaundryColors.textSecondary, marginBottom: 6 }}>Alamat Rumah</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan alamat lengkap..."
                  value={form.address}
                  onChangeText={(t) => setForm({ ...form, address: t })}
                  multiline
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={saveProfile}
                disabled={saving}
              >
                <Text style={styles.modalButtonText}>
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </CourierScreen>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,.4)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: LaundryColors.surfaceSlate,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
  modalFooter: {
    marginTop: 24,
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  modalButtonPrimary: {
    backgroundColor: LaundryColors.roleKurirIcon,
  },
  modalButtonText: {
    color: LaundryColors.textWhite,
    fontWeight: "700",
    fontSize: 16,
  },
  input: {
    backgroundColor: LaundryColors.backgroundWhite,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontWeight: "600",
    color: LaundryColors.textPrimary,
  },
  profileHeaderCard: {
    alignItems: "center",
    backgroundColor: LaundryColors.backgroundWhite,
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
    backgroundColor: LaundryColors.roleKurirIcon,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: LaundryColors.surfaceSlate,
  },
  verifiedBadgeIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: LaundryColors.backgroundWhite,
    borderRadius: 12,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
  profileEmail: {
    fontSize: 14,
    color: LaundryColors.textSecondary,
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 99,
    marginTop: 12,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Menu
  menuCard: {
    backgroundColor: LaundryColors.textWhite, borderRadius: 16,
    borderWidth: 1, borderColor: LaundryColors.inputBorder, marginBottom: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1, borderBottomColor: LaundryColors.inputBorder,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: LaundryColors.textPrimary },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: LaundryColors.errorBg,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: LaundryColors.errorBorder,
  },
  logoutButtonText: {
    fontSize: 16,
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
    backgroundColor: LaundryColors.roleKurirIcon,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: LaundryColors.textWhite,
  },

  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: LaundryColors.backgroundWhite,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  notificationCardUnread: {
    backgroundColor: LaundryColors.surfaceSlate,
    borderColor: "#DBEAFE",
  },
  notifIconBox: {
    width: 44,
    height: 44,
    borderRadius: 24,
    backgroundColor: LaundryColors.surfaceGray,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notifIconBoxUnread: {
    backgroundColor: LaundryColors.rolePelangganBg,
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
    fontSize: 16,
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
    fontSize: 12,
    color: LaundryColors.textMuted,
    fontWeight: "500",
  },
  notifMessage: {
    fontSize: 14,
    color: LaundryColors.textSecondary,
    lineHeight: 20,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: LaundryColors.roleKurirIcon,
    marginTop: 20,
  },
});
