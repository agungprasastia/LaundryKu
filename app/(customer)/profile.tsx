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
import { LaundryColors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import * as notificationService from '@/services/notificationService';
import { Notification } from '@/types/notification';

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifError, setNotifError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [markingRead, setMarkingRead] = useState<string | null>(null);

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
          <TouchableOpacity onPress={handleEditProfile} style={{ position: 'absolute', top: 16, right: 16, padding: 8, backgroundColor: '#EFF6FF', borderRadius: 12 }}>
            <Ionicons name="pencil" size={16} color={LaundryColors.primary} />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color="#FFFFFF" />
          </View>
          <Text style={styles.name}>{user?.full_name || 'Pelanggan'}</Text>
          <Text style={styles.email}>{user?.email || '-'}</Text>

          <View style={styles.infoBadgeRow}>
            <View style={styles.roleBadge}>
              <Ionicons name="shield-checkmark" size={12} color={LaundryColors.primary} />
              <Text style={styles.roleBadgeText}>Pelanggan</Text>
            </View>
            {user?.is_verified ? (
              <View style={[styles.roleBadge, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                <Text style={[styles.roleBadgeText, { color: '#10B981' }]}>Terverifikasi</Text>
              </View>
            ) : null}
          </View>

          {/* Account Details */}
          <View style={styles.detailsList}>
            {user?.address ? (
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={16} color={LaundryColors.textMuted} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Alamat</Text>
                  <Text style={styles.detailValue}>{user.address}</Text>
                </View>
              </View>
            ) : null}
            <View style={styles.detailItem}>
              <Ionicons name="mail-outline" size={16} color={LaundryColors.textMuted} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{user?.email || '-'}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color={LaundryColors.textMuted} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Bergabung</Text>
                <Text style={styles.detailValue}>{formatDate(user?.created_at)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Notifications Section ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Notifikasi {unreadCount > 0 ? `(${unreadCount} belum dibaca)` : ''}
          </Text>
        </View>

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

        {/* ─── Logout ─── */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={LaundryColors.error} />
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

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
                <Text style={{ fontSize: 13, fontWeight: "500", color: LaundryColors.textSecondary, marginBottom: 6 }}>Nama Lengkap</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan nama lengkap..."
                  value={form.full_name}
                  onChangeText={(t) => setForm({ ...form, full_name: t })}
                />
              </View>
              <View>
                <Text style={{ fontSize: 13, fontWeight: "500", color: LaundryColors.textSecondary, marginBottom: 6 }}>Alamat Rumah / Pengiriman</Text>
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
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: LaundryColors.inputBorder,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

  /* Profile Card */
  profileCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: LaundryColors.inputBorder,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: LaundryColors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  name: { fontSize: 20, fontWeight: '700', color: LaundryColors.textPrimary },
  email: { fontSize: 13, color: LaundryColors.textSecondary, marginTop: 4 },
  infoBadgeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: LaundryColors.rolePelangganBg,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '700', color: LaundryColors.primary },

  detailsList: {
    width: '100%', marginTop: 20, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: LaundryColors.inputBorder, gap: 14,
  },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 10, color: LaundryColors.textMuted, fontWeight: '500' },
  detailValue: { fontSize: 13, color: LaundryColors.textPrimary, fontWeight: '500', marginTop: 1 },

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
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 12, color: LaundryColors.error, fontWeight: '500' },
  retryText: { fontSize: 12, color: LaundryColors.primary, fontWeight: '700' },

  emptyNotif: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: LaundryColors.inputBorder,
  },
  emptyNotifText: { fontSize: 13, color: LaundryColors.textSecondary },

  notifCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: LaundryColors.inputBorder,
  },
  notifCardUnread: {
    borderLeftWidth: 3, borderLeftColor: LaundryColors.primary,
    backgroundColor: '#FAFCFF',
  },
  notifCardHeader: { flexDirection: 'row', gap: 10 },
  notifDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: LaundryColors.primary,
    marginTop: 5,
    borderWidth: 1, borderColor: LaundryColors.primary,
  },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 13, fontWeight: '700', color: LaundryColors.textPrimary },
  notifMessage: { fontSize: 12, color: LaundryColors.textSecondary, marginTop: 2, lineHeight: 18 },
  notifDate: { fontSize: 10, color: LaundryColors.textMuted, marginTop: 4 },

  markReadButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    gap: 4, marginTop: 8,
  },
  markReadText: { fontSize: 11, fontWeight: '600', color: LaundryColors.primary },

  /* Logout */
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FEF2F2', borderRadius: 14, height: 50, gap: 8,
    borderWidth: 1, borderColor: '#FECACA', marginTop: 24,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: LaundryColors.error },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,.4)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#F8FAFC",
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
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  modalButtonPrimary: {
    backgroundColor: LaundryColors.primary,
  },
  modalButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    fontWeight: "600",
    color: LaundryColors.textPrimary,
  },
});


