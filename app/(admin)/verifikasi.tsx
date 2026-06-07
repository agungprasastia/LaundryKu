import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LaundryColors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import * as adminService from '@/services/adminService';
import { PendingUser } from '@/types/user';

export default function VerifikasiScreen() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchPendingUsers = useCallback(async () => {
    try {
      setError('');
      const response = await adminService.getPendingUsers();
      if (response.success && response.data) {
        setPendingUsers(Array.isArray(response.data) ? response.data : []);
      } else {
        setPendingUsers([]);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal memuat data';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingUsers();
  };

  // Step 1: Show inline confirmation
  const handleVerify = (userId: string) => {
    setConfirmingId(userId);
  };

  const cancelConfirm = () => {
    setConfirmingId(null);
  };

  // Step 2: Actually verify
  const doVerify = async (userId: string) => {
    setConfirmingId(null);
    setVerifyingId(userId);
    setSuccessMsg('');
    try {
      const response = await adminService.verifyUser(userId, true);
      if (response.success) {
        // Show inline success message
        const verifiedUser = pendingUsers.find(u => u.user_id === userId);
        setSuccessMsg(`✅ ${verifiedUser?.full_name || 'User'} berhasil diverifikasi!`);
        // Remove from list immediately
        setPendingUsers(prev => prev.filter(u => u.user_id !== userId));
        // Auto-hide success after 4 seconds
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(response.message || 'Gagal memverifikasi pengguna');
        setTimeout(() => setError(''), 4000);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal memverifikasi';
      setError(msg);
      setTimeout(() => setError(''), 4000);
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Verifikasi</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LaundryColors.primary} />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Verifikasi</Text>
        <Text style={styles.headerSubtitle}>
          {pendingUsers.length} menunggu verifikasi
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[LaundryColors.primary]} />
        }
      >
        {/* Success banner */}
        {successMsg ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        ) : null}

        {/* Error banner */}
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={LaundryColors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={onRefresh}>
              <Text style={styles.retryText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Empty state */}
        {pendingUsers.length === 0 && !error ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="checkmark-circle-outline" size={56} color={LaundryColors.success} />
            </View>
            <Text style={styles.emptyTitle}>Semua Terverifikasi</Text>
            <Text style={styles.emptyDesc}>Tidak ada pengguna yang menunggu verifikasi saat ini.</Text>
          </View>
        ) : null}

        {/* Pending users list */}
        {pendingUsers.map((user, index) => (
          <View key={user.user_id || index} style={styles.userCard}>
            <View style={styles.userCardHeader}>
              <View style={[styles.userAvatar, {
                backgroundColor: user.role === 'owner' ? LaundryColors.roleMitraBg : LaundryColors.roleKurirBg
              }]}>
                <Text style={{ fontSize: 22 }}>
                  {user.role === 'owner' ? '🏪' : '🚚'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>{user.full_name}</Text>
                <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
              </View>
              <View style={[styles.roleBadge, {
                backgroundColor: user.role === 'owner' ? LaundryColors.roleMitraBg : LaundryColors.roleKurirBg
              }]}>
                <Text style={[styles.roleBadgeText, {
                  color: user.role === 'owner' ? LaundryColors.roleMitraIcon : LaundryColors.roleKurirIcon
                }]}>
                  {user.role === 'owner' ? 'Owner' : 'Kurir'}
                </Text>
              </View>
            </View>

            <View style={styles.userCardDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={14} color={LaundryColors.textMuted} />
                <Text style={styles.detailText}>
                  {user.created_at || 'Tanggal tidak tersedia'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="shield-outline" size={14} color="#F97316" />
                <Text style={[styles.detailText, { color: '#F97316' }]}>
                  Menunggu Verifikasi
                </Text>
              </View>
            </View>

            {/* Inline confirmation or verify button */}
            {confirmingId === user.user_id ? (
              <View style={styles.confirmContainer}>
                <Text style={styles.confirmText}>
                  Yakin verifikasi {user.full_name}?
                </Text>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelConfirm}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelButtonText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmVerifyButton}
                    onPress={() => doVerify(user.user_id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.confirmVerifyText}>Ya, Verifikasi</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.verifyButton, verifyingId === user.user_id && styles.verifyButtonDisabled]}
                onPress={() => handleVerify(user.user_id)}
                disabled={verifyingId === user.user_id}
                activeOpacity={0.8}
              >
                {verifyingId === user.user_id ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.verifyButtonText}>Memverifikasi...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.verifyButtonText}>Verifikasi</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LaundryColors.background },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: LaundryColors.inputBorder,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary },
  headerSubtitle: { fontSize: 12, color: LaundryColors.textSecondary, marginTop: 2 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },

  // Loading
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: LaundryColors.textSecondary },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 12, color: LaundryColors.error, fontWeight: '500' },
  retryText: { fontSize: 12, color: LaundryColors.primary, fontWeight: '700' },

  // Empty
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary },
  emptyDesc: { fontSize: 13, color: LaundryColors.textSecondary, textAlign: 'center' },

  // User card
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: { flex: 1, marginRight: 8 },
  userName: { fontSize: 15, fontWeight: '700', color: LaundryColors.textPrimary },
  userEmail: { fontSize: 12, color: LaundryColors.textSecondary, marginTop: 2 },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '700' },
  userCardDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: LaundryColors.inputBorder,
    gap: 6,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, color: LaundryColors.textSecondary },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LaundryColors.success,
    borderRadius: 12,
    height: 44,
    marginTop: 14,
    gap: 6,
  },
  verifyButtonDisabled: { backgroundColor: '#86EFAC' },
  verifyButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  // Success banner
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successText: { flex: 1, fontSize: 13, color: '#059669', fontWeight: '600' },

  // Inline confirmation
  confirmContainer: {
    marginTop: 14,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  confirmText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    height: 40,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  confirmVerifyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LaundryColors.success,
    borderRadius: 10,
    height: 40,
    gap: 4,
  },
  confirmVerifyText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});
