import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Animated,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LaundryColors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import * as adminService from '@/services/adminService';
import { PendingUser } from '@/types/user';

// ─── Component ───────────────────────────────────
export default function AdminBerandaScreen() {
  const { user } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // State for API data
  const [metrics, setMetrics] = useState<any>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [metricsRes, pendingRes] = await Promise.all([
        adminService.getDashboardMetrics(),
        adminService.getPendingUsers(),
      ]);

      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }
      if (pendingRes.success && pendingRes.data) {
        setPendingUsers(Array.isArray(pendingRes.data) ? pendingRes.data : []);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal memuat data dashboard';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Build stats from API data
  const statsData = [
    {
      icon: 'people',
      label: 'Total User',
      value: metrics?.total_users?.toString() || '0',
      change: metrics?.users_change || '',
      changeSub: metrics?.users_change ? 'vs kemarin' : '',
      color: '#2563EB',
      bg: '#EBF5FF',
    },
    {
      icon: 'cube',
      label: 'Total Order',
      value: metrics?.total_orders?.toString() || '0',
      change: metrics?.orders_change || '',
      changeSub: metrics?.orders_change ? 'vs kemarin' : '',
      color: '#10B981',
      bg: '#ECFDF5',
    },
    {
      icon: 'bicycle',
      label: 'Active Couriers',
      value: metrics?.active_couriers?.toString() || '0',
      change: metrics?.couriers_change || '',
      changeSub: metrics?.couriers_change ? 'vs kemarin' : '',
      color: '#F97316',
      bg: '#FFF7ED',
    },
    {
      icon: 'cash',
      label: 'Revenue (GMV)',
      value: metrics?.total_revenue != null
        ? `Rp ${Number(metrics.total_revenue).toLocaleString('id-ID')}`
        : (metrics?.gmv != null ? `Rp ${Number(metrics.gmv).toLocaleString('id-ID')}` : 'Rp 0'),
      change: metrics?.revenue_change || '',
      changeSub: metrics?.revenue_change ? 'vs kemarin' : '',
      color: '#EF4444',
      bg: '#FEF2F2',
    },
  ];

  const quickActions = [
    { icon: 'checkmark-circle', label: 'Verifikasi\nMitra', color: '#2563EB', bg: '#EBF5FF' },
    { icon: 'checkmark-circle', label: 'Verifikasi\nKurir', color: '#2563EB', bg: '#EBF5FF' },
    { icon: 'people', label: 'Kelola\nPengguna', color: '#2563EB', bg: '#EBF5FF' },
    { icon: 'desktop', label: 'Monitoring\nSistem', color: '#2563EB', bg: '#EBF5FF' },
    { icon: 'chatbubble-ellipses', label: 'Komplain', color: '#2563EB', bg: '#EBF5FF' },
  ];

  const systemStatuses = [
    { label: 'API', status: 'Normal', color: '#10B981' },
    { label: 'Payment', status: 'Normal', color: '#10B981' },
    { label: 'Maps', status: 'Normal', color: '#10B981' },
    { label: 'Notification', status: 'Normal', color: '#10B981' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={LaundryColors.primary} />
        <Text style={styles.loadingText}>Memuat dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[LaundryColors.primary]} />
        }
      >
        {/* ─── HEADER ─── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerGreeting}>
                Halo, {user?.full_name || 'Admin'} 👋
              </Text>
              <Text style={styles.headerSub}>Selamat datang di LaundryKu Admin</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notifButton}>
            <Ionicons name="notifications-outline" size={24} color={LaundryColors.textPrimary} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={LaundryColors.error} />
              <Text style={styles.errorBannerText}>{error}</Text>
              <TouchableOpacity onPress={onRefresh}>
                <Text style={styles.retryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ─── RINGKASAN PLATFORM ─── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ringkasan Platform</Text>
            <TouchableOpacity style={styles.filterBtn}>
              <Text style={styles.filterText}>Hari ini</Text>
              <Ionicons name="chevron-down" size={14} color={LaundryColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            {statsData.map((stat, i) => (
              <View key={i} style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: stat.bg }]}>
                  <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                </View>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                {stat.change ? (
                  <Text style={styles.statChange}>
                    <Text style={{ color: '#10B981' }}>{stat.change}</Text>
                    {'  '}
                    <Text style={{ color: LaundryColors.textMuted }}>{stat.changeSub}</Text>
                  </Text>
                ) : null}
              </View>
            ))}
          </View>

          {/* ─── AKSI CEPAT ─── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Aksi Cepat</Text>
          </View>

          <View style={styles.quickActionsCard}>
            <View style={styles.quickActionsRow}>
              {quickActions.map((action, i) => (
                <TouchableOpacity key={i} style={styles.quickActionItem} activeOpacity={0.7}>
                  <View style={[styles.quickActionIcon, { backgroundColor: action.bg }]}>
                    <Ionicons name={action.icon as any} size={24} color={action.color} />
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ─── VERIFIKASI PENDING ─── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Verifikasi Pending</Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>Lihat Semua {'>'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pendingCard}>
            {pendingUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={32} color={LaundryColors.success} />
                <Text style={styles.emptyText}>Tidak ada verifikasi pending</Text>
              </View>
            ) : (
              pendingUsers.slice(0, 3).map((item, i) => (
                <View
                  key={item.user_id || i}
                  style={[
                    styles.pendingItem,
                    i < Math.min(pendingUsers.length, 3) - 1 && styles.pendingItemBorder,
                  ]}
                >
                  <View style={[styles.pendingAvatar, {
                    backgroundColor: item.role === 'owner' ? '#EBF5FF' : '#FFF7ED'
                  }]}>
                    <Text style={{ fontSize: 20 }}>
                      {item.role === 'owner' ? '🏪' : '👤'}
                    </Text>
                  </View>
                  <View style={styles.pendingInfo}>
                    <Text style={styles.pendingName}>{item.full_name}</Text>
                    <Text style={styles.pendingRole}>
                      {item.role === 'owner' ? 'Mitra Laundry' : 'Kurir'}
                    </Text>
                    <Text style={styles.pendingDate}>
                      {item.created_at ? `Didaftarkan: ${item.created_at}` : item.email}
                    </Text>
                  </View>
                  <View style={styles.pendingActions}>
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>Menunggu Verifikasi</Text>
                    </View>
                    <TouchableOpacity style={styles.cekButton} activeOpacity={0.7}>
                      <Text style={styles.cekButtonText}>Cek</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* ─── STATUS SISTEM ─── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Status Sistem</Text>
          </View>

          <View style={styles.systemStatusCard}>
            <View style={styles.systemStatusRow}>
              {systemStatuses.map((sys, i) => (
                <View key={i} style={styles.systemStatusItem}>
                  <View style={[styles.systemStatusDot, { backgroundColor: sys.color }]}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                  <Text style={styles.systemStatusLabel}>{sys.label}</Text>
                  <Text style={[styles.systemStatusValue, { color: sys.color }]}>{sys.status}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 20 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LaundryColors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LaundryColors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: LaundryColors.textSecondary,
    fontWeight: '500',
  },

  /* Error */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: LaundryColors.error,
    fontWeight: '500',
  },
  retryText: {
    fontSize: 12,
    color: LaundryColors.primary,
    fontWeight: '700',
  },

  /* Empty state */
  emptyState: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: LaundryColors.textSecondary,
    fontWeight: '500',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: LaundryColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGreeting: {
    fontSize: 16,
    fontWeight: '700',
    color: LaundryColors.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: LaundryColors.textSecondary,
    marginTop: 1,
  },
  notifButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: LaundryColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  /* Section headers */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: LaundryColors.textPrimary,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterText: {
    fontSize: 13,
    color: LaundryColors.textSecondary,
    fontWeight: '500',
  },
  linkText: {
    fontSize: 13,
    color: LaundryColors.primary,
    fontWeight: '600',
  },

  /* Stats */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: LaundryColors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: LaundryColors.textPrimary,
    marginBottom: 3,
  },
  statChange: {
    fontSize: 9,
    lineHeight: 13,
  },

  /* Quick Actions */
  quickActionsCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 10,
    color: LaundryColors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
  },

  /* Pending Verifications */
  pendingCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    overflow: 'hidden',
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  pendingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: LaundryColors.inputBorder,
  },
  pendingAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pendingInfo: {
    flex: 1,
  },
  pendingName: {
    fontSize: 13,
    fontWeight: '700',
    color: LaundryColors.textPrimary,
  },
  pendingRole: {
    fontSize: 11,
    color: LaundryColors.textSecondary,
    marginTop: 1,
  },
  pendingDate: {
    fontSize: 10,
    color: LaundryColors.textMuted,
    marginTop: 2,
  },
  pendingActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  pendingBadge: {
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingBadgeText: {
    fontSize: 9,
    color: '#F97316',
    fontWeight: '600',
  },
  cekButton: {
    borderWidth: 1.5,
    borderColor: LaundryColors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  cekButtonText: {
    fontSize: 12,
    color: LaundryColors.primary,
    fontWeight: '700',
  },

  /* System Status */
  systemStatusCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  systemStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  systemStatusItem: {
    alignItems: 'center',
    gap: 4,
  },
  systemStatusDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemStatusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: LaundryColors.textPrimary,
  },
  systemStatusValue: {
    fontSize: 11,
    fontWeight: '500',
  },
});





