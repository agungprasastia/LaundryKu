import React, { useState, useEffect, useCallback } from 'react';
import { getErrorMessage } from '@/utils/getErrorMessage';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStyles } from '@/hooks/useAppStyles';
import { Ionicons } from '@expo/vector-icons';
import * as adminService from '@/services/adminService';
import { PendingUser } from '@/types/user';

export default function PenggunaScreen() {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setError('');
      const response = await adminService.getPendingUsers();
      if (response.success && response.data) {
        setUsers(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal memuat data'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pengguna</Text>
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
        <Text style={styles.headerTitle}>Pengguna</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[LaundryColors.primary]} />
        }
      >
        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Ionicons name="information-circle-outline" size={18} color={LaundryColors.primary} />
          <Text style={styles.disclaimerText}>
            Menampilkan pengguna pending verifikasi. Endpoint user management penuh belum tersedia.
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={LaundryColors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={onRefresh}>
              <Text style={styles.retryText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Users list */}
        {users.length === 0 && !error ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={LaundryColors.primaryLight} />
            <Text style={styles.emptyTitle}>Belum Ada Pengguna Pending</Text>
            <Text style={styles.emptyDesc}>Semua pengguna sudah diverifikasi.</Text>
          </View>
        ) : (
          users.map((user, index) => (
            <View key={user.user_id || index} style={styles.userCard}>
              <View style={styles.userCardRow}>
                <View style={[styles.userAvatar, {
                  backgroundColor: user.role === 'owner' ? LaundryColors.roleMitraBg : LaundryColors.roleKurirBg
                }]}>
                  <Ionicons
                    name={user.role === 'owner' ? 'storefront' : 'bicycle'}
                    size={20}
                    color={user.role === 'owner' ? LaundryColors.roleMitraIcon : LaundryColors.roleKurirIcon}
                  />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>{user.full_name}</Text>
                  <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
                </View>
                <View style={styles.userMeta}>
                  <View style={[styles.roleBadge, {
                    backgroundColor: user.role === 'owner' ? LaundryColors.roleMitraBg : LaundryColors.roleKurirBg
                  }]}>
                    <Text style={[styles.roleBadgeText, {
                      color: user.role === 'owner' ? LaundryColors.roleMitraIcon : LaundryColors.roleKurirIcon
                    }]}>
                      {user.role === 'owner' ? 'Owner' : 'Kurir'}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>Pending</Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (LaundryColors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: LaundryColors.background },
  header: {
    backgroundColor: LaundryColors.cardBg,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: LaundryColors.inputBorder,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: LaundryColors.textSecondary },

  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: LaundryColors.rolePelangganBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  disclaimerText: { flex: 1, fontSize: 12, color: LaundryColors.textSecondary, lineHeight: 18 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: LaundryColors.errorBg, borderRadius: 12, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: LaundryColors.errorBorder,
  },
  errorText: { flex: 1, fontSize: 12, color: LaundryColors.error, fontWeight: '500' },
  retryText: { fontSize: 12, color: LaundryColors.primary, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary },
  emptyDesc: { fontSize: 14, color: LaundryColors.textSecondary },

  userCard: {
    backgroundColor: LaundryColors.cardBg, borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: LaundryColors.inputBorder,
  },
  userCardRow: { flexDirection: 'row', alignItems: 'center' },
  userAvatar: {
    width: 42, height: 42, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  userInfo: { flex: 1, marginRight: 8 },
  userName: { fontSize: 14, fontWeight: '700', color: LaundryColors.textPrimary },
  userEmail: { fontSize: 12, color: LaundryColors.textSecondary, marginTop: 2 },
  userMeta: { alignItems: 'flex-end', gap: 4 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  roleBadgeText: { fontSize: 10, fontWeight: '700' },
  statusBadge: { backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '600', color: LaundryColors.warning },
});


