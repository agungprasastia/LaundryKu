import { ThemeColors } from '@/constants/colors';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as adminService from '@/services/adminService';
import { getErrorMessage } from '@/utils/helpers';

export default function LaporanScreen() {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: analytics = null,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => {
      const response = await adminService.getAnalytics();
      if (!response.success) throw new Error(response.message || 'Gagal memuat data');
      return response.data || null;
    },
  });

  const error = queryError ? getErrorMessage(queryError, 'Gagal memuat data') : '';

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatCurrency = (value: number | undefined | null): string => {
    if (value == null) return 'Rp 0';
    return `Rp ${Number(value).toLocaleString('id-ID')}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Laporan</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LaundryColors.primary} />
          <Text style={styles.loadingText}>Memuat laporan...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Laporan</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[LaundryColors.primary]} />
        }
      >
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

        {analytics ? (
          <>
            {/* GMV Card */}
            <View style={styles.highlightCard}>
              <View style={styles.highlightIconWrap}>
                <Ionicons name="trending-up" size={28} color={LaundryColors.textWhite} />
              </View>
              <Text style={styles.highlightLabel}>Gross Merchandise Value (GMV)</Text>
              <Text style={styles.highlightValue}>
                {formatCurrency(analytics.gmv || analytics.total_gmv || analytics.total_revenue)}
              </Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="cube" size={20} color={LaundryColors.success} />
                </View>
                <Text style={styles.statLabel}>Total Order</Text>
                <Text style={styles.statValue}>
                  {analytics.total_orders?.toString() || '0'}
                </Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#EBF5FF' }]}>
                  <Ionicons name="cash" size={20} color={LaundryColors.primary} />
                </View>
                <Text style={styles.statLabel}>Total Komisi</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(analytics.total_commission || analytics.platform_commission || analytics.total_admin_commission)}
                </Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#FFF7ED' }]}>
                  <Ionicons name="people" size={20} color={LaundryColors.warning} />
                </View>
                <Text style={styles.statLabel}>Total User</Text>
                <Text style={styles.statValue}>
                  {analytics.total_users?.toString() || '0'}
                </Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#F5F3FF' }]}>
                  <Ionicons name="bicycle" size={20} color="#8B5CF6" />
                </View>
                <Text style={styles.statLabel}>Active Courier</Text>
                <Text style={styles.statValue}>
                  {analytics.active_couriers?.toString() || '0'}
                </Text>
              </View>
            </View>

            {/* Additional stats if available */}
            {(analytics.completed_orders != null || analytics.pending_orders != null) ? (
              <View style={styles.additionalCard}>
                <Text style={styles.additionalTitle}>Detail Pesanan</Text>
                {analytics.completed_orders != null && (
                  <View style={styles.additionalRow}>
                    <Text style={styles.additionalLabel}>Order Selesai</Text>
                    <Text style={styles.additionalValue}>{analytics.completed_orders}</Text>
                  </View>
                )}
                {analytics.pending_orders != null && (
                  <View style={styles.additionalRow}>
                    <Text style={styles.additionalLabel}>Order Pending</Text>
                    <Text style={styles.additionalValue}>{analytics.pending_orders}</Text>
                  </View>
                )}
                {analytics.cancelled_orders != null && (
                  <View style={styles.additionalRow}>
                    <Text style={styles.additionalLabel}>Order Dibatalkan</Text>
                    <Text style={styles.additionalValue}>{analytics.cancelled_orders}</Text>
                  </View>
                )}
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="chart-box-outline" size={48} color={LaundryColors.primaryLight} />
            <Text style={styles.emptyTitle}>Data Belum Tersedia</Text>
            <Text style={styles.emptyDesc}>Belum ada data analytics untuk ditampilkan.</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (LaundryColors: ThemeColors) => StyleSheet.create({
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

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: LaundryColors.errorBg, borderRadius: 12, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: LaundryColors.errorBorder,
  },
  errorText: { flex: 1, fontSize: 12, color: LaundryColors.error, fontWeight: '500' },
  retryText: { fontSize: 12, color: LaundryColors.primary, fontWeight: '700' },

  // Highlight card
  highlightCard: {
    backgroundColor: LaundryColors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  highlightIconWrap: {
    width: 50, height: 50, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  highlightLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: 4 },
  highlightValue: { fontSize: 24, fontWeight: '800', color: LaundryColors.textWhite },

  // Stats grid
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16,
  },
  statCard: {
    flexGrow: 1, flexBasis: '45%',
    backgroundColor: LaundryColors.cardBg, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: LaundryColors.inputBorder,
  },
  statIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statLabel: { fontSize: 12, color: LaundryColors.textSecondary, fontWeight: '500', marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: '800', color: LaundryColors.textPrimary },

  // Additional
  additionalCard: {
    backgroundColor: LaundryColors.cardBg, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: LaundryColors.inputBorder,
  },
  additionalTitle: { fontSize: 16, fontWeight: '700', color: LaundryColors.textPrimary, marginBottom: 12 },
  additionalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: LaundryColors.inputBorder,
  },
  additionalLabel: { fontSize: 14, color: LaundryColors.textSecondary },
  additionalValue: { fontSize: 14, fontWeight: '700', color: LaundryColors.textPrimary },

  // Empty
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary },
  emptyDesc: { fontSize: 14, color: LaundryColors.textSecondary },
});
