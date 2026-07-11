import React, { useState, useEffect, useCallback } from 'react';
import { getErrorMessage } from '@/utils/getErrorMessage';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { crossAlert } from '@/utils/crossAlert';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LaundryColors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import * as notificationService from '@/services/notificationService';
import { Notification } from '@/types/notification';
import { SettingsModal, HelpModal, AboutModal } from '@/components/ProfileModals';

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifError, setNotifError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [markingRead, setMarkingRead] = useState<string | null>(null);

  const [notifModal, setNotifModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [helpModal, setHelpModal] = useState(false);
  const [aboutModal, setAboutModal] = useState(false);

  const handleUnavailableFeature = () => {
    crossAlert('Fitur Belum Tersedia', 'Fitur ini belum tersedia.', [{ text: 'OK' }]);
  };

  const [editModal, setEditModal] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);

  const handleEditProfile = () => {
    setForm({
      full_name: user?.full_name || "",
      address: user?.address || "",
    });
    setEditModal(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: form.full_name,
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

  const fetchNotifications = useCallback(async () => {
    try {
      setNotifError('');
      const res = await notificationService.getNotifications();
      if (res.success && res.data) {
        setNotifications(Array.isArray(res.data) ? res.data : []);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      setNotifError(getErrorMessage(err, 'Gagal memuat notifikasi'));
    } finally {
      setNotifLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    setMarkingRead(notificationId);
    try {
      const res = await notificationService.markAsRead(notificationId);
      if (res.success) {
        await fetchNotifications();
      } else {
        crossAlert('Gagal', res.message || 'Gagal menandai notifikasi');
      }
    } catch (err) {
      crossAlert('Error', getErrorMessage(err, 'Gagal menandai notifikasi'));
    } finally {
      setMarkingRead(null);
    }
  };

  const handleLogout = () => {
    crossAlert('Logout', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read || n.is_read === 0).length;

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profil', color: LaundryColors.primary, action: handleEditProfile },
    { icon: 'notifications-outline', label: 'Notifikasi', color: LaundryColors.warning, action: () => setNotifModal(true) },
    { icon: 'settings-outline', label: 'Pengaturan', color: '#8B5CF6', action: () => setSettingsModal(true) },
    { icon: 'help-circle-outline', label: 'Bantuan', color: LaundryColors.success, action: () => setHelpModal(true) },
    { icon: 'information-circle-outline', label: 'Tentang Aplikasi', color: LaundryColors.textSecondary, action: () => setAboutModal(true) },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[LaundryColors.primary]} />
        }
      >
        {/* ─── Profile Card ─── */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color={LaundryColors.textWhite} />
          </View>
          <Text style={styles.name}>{user?.full_name || 'Pelanggan'}</Text>
          <Text style={styles.email}>{user?.email || '-'}</Text>

          <View style={styles.infoBadgeRow}>
            <View style={styles.roleBadge}>
               <Ionicons name="shield-checkmark" size={12} color={LaundryColors.primary} />
              <Text style={styles.roleBadgeText}>Pelanggan</Text>
            </View>
            {user?.is_verified ? (
              <View style={[styles.roleBadge, { backgroundColor: LaundryColors.roleMitraBg }]}>
                <Ionicons name="checkmark-circle" size={12} color={LaundryColors.success} />
                <Text style={[styles.roleBadgeText, { color: LaundryColors.success }]}>Terverifikasi</Text>
              </View>
            ) : null}
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

        {/* ─── Logout ─── */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={LaundryColors.error} />
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

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

            <ScrollView showsVerticalScrollIndicator={false}>
              {notifLoading ? (
                <View style={styles.notifLoadingWrap}>
                  <ActivityIndicator size="small" color={LaundryColors.primary} />
                  <Text style={styles.notifLoadingText}>Memuat notifikasi...</Text>
                </View>
              ) : notifError ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color={LaundryColors.error} />
                  <Text style={styles.errorText}>{notifError}</Text>
                  <TouchableOpacity onPress={onRefresh}>
                    <Text style={styles.retryText}>Coba Lagi</Text>
                  </TouchableOpacity>
                </View>
              ) : notifications.length === 0 ? (
                <View style={styles.emptyNotif}>
                  <Ionicons name="notifications-off-outline" size={32} color={LaundryColors.textMuted} />
                  <Text style={styles.emptyNotifText}>Belum ada notifikasi</Text>
                </View>
              ) : (
                notifications.map((notif) => {
                  const isRead = !!notif.is_read && notif.is_read !== 0;
                  return (
                    <View
                      key={notif.notification_id}
                      style={[styles.notifCard, !isRead && styles.notifCardUnread]}
                    >
                      <View style={styles.notifCardHeader}>
                        <View style={[
                          styles.notifDot,
                          isRead && { backgroundColor: 'transparent', borderColor: LaundryColors.textMuted },
                        ]} />
                        <View style={styles.notifContent}>
                          {notif.title ? (
                            <Text style={styles.notifTitle}>{notif.title}</Text>
                          ) : null}
                          <Text style={styles.notifMessage}>{notif.body || notif.message}</Text>
                          <Text style={styles.notifDate}>{formatDate(notif.created_at)}</Text>
                        </View>
                      </View>

                      {!isRead ? (
                        <TouchableOpacity
                          style={styles.markReadButton}
                          onPress={() => handleMarkAsRead(notif.notification_id)}
                          disabled={markingRead === notif.notification_id}
                          activeOpacity={0.7}
                        >
                          {markingRead === notif.notification_id ? (
                            <ActivityIndicator size="small" color={LaundryColors.primary} />
                          ) : (
                            <>
                              <Ionicons name="checkmark" size={14} color={LaundryColors.primary} />
                              <Text style={styles.markReadText}>Tandai Dibaca</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  );
                })
              )}
            </ScrollView>
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

            <View style={styles.formGap}>
              <View>
                <Text style={styles.formLabel}>Nama Lengkap</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan nama lengkap..."
                  value={form.full_name}
                  onChangeText={(t) => setForm({ ...form, full_name: t })}
                />
              </View>
              <View>
                <Text style={styles.formLabel}>Alamat Rumah / Pengiriman</Text>
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
    </View>
  );
}

// ─── Styles ──────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LaundryColors.background },
  header: {
    backgroundColor: LaundryColors.backgroundWhite,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: LaundryColors.inputBorder,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

  /* Profile Card */
  profileCard: {
    backgroundColor: LaundryColors.backgroundWhite, borderRadius: 20, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: LaundryColors.inputBorder,
    marginBottom: 16,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 9999,
    backgroundColor: LaundryColors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  name: { fontSize: 20, fontWeight: '700', color: LaundryColors.textPrimary },
  email: { fontSize: 14, color: LaundryColors.textSecondary, marginTop: 4 },
  infoBadgeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: LaundryColors.rolePelangganBg,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '700', color: LaundryColors.primary },

  // Menu
  menuCard: {
    backgroundColor: LaundryColors.textWhite, borderRadius: 16,
    borderWidth: 1, borderColor: LaundryColors.inputBorder, marginBottom: 16,
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

  /* Section */
  sectionHeader: { marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: LaundryColors.textPrimary },

  /* Notifications */
  notifLoadingWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 16, justifyContent: 'center',
  },
  notifLoadingText: { fontSize: 12, color: LaundryColors.textSecondary },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: LaundryColors.errorBg, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: LaundryColors.errorBorder,
  },
  errorText: { flex: 1, fontSize: 12, color: LaundryColors.error, fontWeight: '500' },
  retryText: { fontSize: 12, color: LaundryColors.primary, fontWeight: '700' },

  emptyNotif: {
    backgroundColor: LaundryColors.backgroundWhite, borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: LaundryColors.inputBorder,
  },
  emptyNotifText: { fontSize: 14, color: LaundryColors.textSecondary },

  notifCard: {
    backgroundColor: LaundryColors.backgroundWhite, borderRadius: 16, padding: 16,
    marginBottom: 8, borderWidth: 1, borderColor: LaundryColors.inputBorder,
  },
  notifCardUnread: {
    borderLeftWidth: 3, borderLeftColor: LaundryColors.primary,
    backgroundColor: LaundryColors.notifUnreadBg,
  },
  notifCardHeader: { flexDirection: 'row', gap: 10 },
  notifDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: LaundryColors.primary,
    marginTop: 4,
    borderWidth: 1, borderColor: LaundryColors.primary,
  },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: LaundryColors.textPrimary },
  notifMessage: { fontSize: 12, color: LaundryColors.textSecondary, marginTop: 2, lineHeight: 18 },
  notifDate: { fontSize: 10, color: LaundryColors.textMuted, marginTop: 4 },

  markReadButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    gap: 4, marginTop: 8,
  },
  markReadText: { fontSize: 12, fontWeight: '600', color: LaundryColors.primary },

  /* Logout */
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: LaundryColors.errorBg, borderRadius: 16, height: 50, gap: 8,
    borderWidth: 1, borderColor: LaundryColors.errorBorder, marginTop: 24,
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: LaundryColors.error },

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
    backgroundColor: LaundryColors.primary,
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

  /* Extracted inline styles */
  editButton: {
    position: 'absolute', top: 16, right: 16, padding: 8,
    backgroundColor: LaundryColors.surfaceBlueTint, borderRadius: 12,
  },
  bottomSpacer: { height: 30 },
  formGap: { gap: 16 },
  formLabel: {
    fontSize: 14, fontWeight: '500',
    color: LaundryColors.textSecondary, marginBottom: 6,
  },
});


