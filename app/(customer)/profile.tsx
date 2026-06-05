import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LaundryColors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import * as notificationService from '@/services/notificationService';
import { Notification } from '@/types/notification';

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifError, setNotifError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [markingRead, setMarkingRead] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setNotifError('');
      const res = await notificationService.getNotifications();
      if (res.success && res.data) {
        setNotifications(Array.isArray(res.data) ? res.data : []);
      } else {
        setNotifications([]);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal memuat notifikasi';
      setNotifError(msg);
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
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.notification_id === notificationId ? { ...n, is_read: true } : n
          )
        );
      } else {
        Alert.alert('Gagal', res.message || 'Gagal menandai notifikasi');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal menandai notifikasi';
      Alert.alert('Error', msg);
    } finally {
      setMarkingRead(null);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Yakin ingin keluar?', [
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
                    <Text style={styles.notifMessage}>{notif.message}</Text>
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
});
