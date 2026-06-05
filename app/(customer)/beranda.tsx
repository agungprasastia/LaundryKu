import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LaundryColors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { getStatusLabel, getStatusColor, getStatusBgColor } from '@/constants/orderStatus';
import * as serviceService from '@/services/serviceService';
import * as orderService from '@/services/orderService';
import * as notificationService from '@/services/notificationService';
import { LaundryService } from '@/types/service';
import { Order } from '@/types/order';
import { Notification } from '@/types/notification';

export default function CustomerBerandaScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [services, setServices] = useState<LaundryService[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const unreadCount = notifications.filter(
    (n) => !n.is_read || n.is_read === 0
  ).length;

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [servicesRes, ordersRes, notifsRes] = await Promise.allSettled([
        serviceService.getServices(),
        orderService.getMyOrders(),
        notificationService.getNotifications(),
      ]);

      if (servicesRes.status === 'fulfilled' && servicesRes.value?.success && servicesRes.value.data) {
        const activeServices = (Array.isArray(servicesRes.value.data) ? servicesRes.value.data : [])
          .filter((s: LaundryService) => s.is_active === true || s.is_active === 1);
        setServices(activeServices.slice(0, 3));
      }

      if (ordersRes.status === 'fulfilled' && ordersRes.value?.success && ordersRes.value.data) {
        const allOrders = Array.isArray(ordersRes.value.data) ? ordersRes.value.data : [];
        setOrders(allOrders.slice(0, 3));
      }

      if (notifsRes.status === 'fulfilled' && notifsRes.value?.success && notifsRes.value.data) {
        setNotifications(Array.isArray(notifsRes.value.data) ? notifsRes.value.data : []);
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
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatPrice = (price?: number) => {
    if (price == null) return '-';
    return `Rp ${Number(price).toLocaleString('id-ID')}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // ─── Quick Actions ───
  const quickActions = [
    {
      icon: 'shirt' as const,
      label: 'Lihat\nLayanan',
      color: '#2563EB',
      bg: '#EBF5FF',
      onPress: () => router.push('/(customer)/services'),
    },
    {
      icon: 'cube' as const,
      label: 'Pesanan\nSaya',
      color: '#10B981',
      bg: '#ECFDF5',
      onPress: () => router.push('/(customer)/orders'),
    },
    {
      icon: 'notifications' as const,
      label: 'Notifikasi',
      color: '#F97316',
      bg: '#FFF7ED',
      onPress: () => router.push('/(customer)/profile'),
    },
    {
      icon: 'person' as const,
      label: 'Profil\nSaya',
      color: '#8B5CF6',
      bg: '#F5F3FF',
      onPress: () => router.push('/(customer)/profile'),
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={LaundryColors.primary} />
        <Text style={styles.loadingText}>Memuat beranda...</Text>
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
              <Text style={styles.headerGreeting}>Halo, {user?.full_name || 'Pelanggan'} 👋</Text>
              <Text style={styles.headerSub}>Selamat datang di LaundryKu</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notifButton}
            onPress={() => router.push('/(customer)/profile')}
          >
            <Ionicons name="notifications-outline" size={24} color={LaundryColors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
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

          {/* ─── QUICK ACTIONS ─── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Aksi Cepat</Text>
          </View>

          <View style={styles.quickActionsCard}>
            <View style={styles.quickActionsRow}>
              {quickActions.map((action, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.quickActionItem}
                  activeOpacity={0.7}
                  onPress={action.onPress}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: action.bg }]}>
                    <Ionicons name={action.icon} size={24} color={action.color} />
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ─── LAYANAN TERATAS ─── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Layanan Populer</Text>
            <TouchableOpacity onPress={() => router.push('/(customer)/services')}>
              <Text style={styles.linkText}>Lihat Semua {'>'}</Text>
            </TouchableOpacity>
          </View>

          {services.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="shirt-outline" size={32} color={LaundryColors.textMuted} />
              <Text style={styles.emptyText}>Belum ada layanan tersedia</Text>
            </View>
          ) : (
            services.map((svc) => (
              <TouchableOpacity
                key={svc.service_id}
                style={styles.serviceCard}
                activeOpacity={0.7}
                onPress={() => router.push('/(customer)/services')}
              >
                <View style={styles.serviceIconWrap}>
                  <Ionicons name="shirt" size={22} color={LaundryColors.primary} />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{svc.name}</Text>
                  {svc.description ? (
                    <Text style={styles.serviceDesc} numberOfLines={1}>{svc.description}</Text>
                  ) : null}
                </View>
                <View style={styles.servicePriceWrap}>
                  <Text style={styles.servicePrice}>{formatPrice(svc.price_per_kg_customer)}</Text>
                  <Text style={styles.servicePriceUnit}>/kg</Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          {/* ─── PESANAN TERBARU ─── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pesanan Terbaru</Text>
            <TouchableOpacity onPress={() => router.push('/(customer)/orders')}>
              <Text style={styles.linkText}>Lihat Semua {'>'}</Text>
            </TouchableOpacity>
          </View>

          {orders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="cube-outline" size={32} color={LaundryColors.textMuted} />
              <Text style={styles.emptyText}>Belum ada pesanan</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(customer)/services')}
              >
                <Text style={styles.emptyButtonText}>Pesan Sekarang</Text>
              </TouchableOpacity>
            </View>
          ) : (
            orders.map((order) => (
              <TouchableOpacity
                key={order.order_id}
                style={styles.orderCard}
                activeOpacity={0.7}
                onPress={() => router.push('/(customer)/orders')}
              >
                <View style={styles.orderCardTop}>
                  <View>
                    <Text style={styles.orderId}>#{order.order_id}</Text>
                    {order.service_name ? (
                      <Text style={styles.orderServiceName}>{order.service_name}</Text>
                    ) : null}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(order.status) }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(order.status) }]}>
                      {getStatusLabel(order.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.orderCardBottom}>
                  {order.pickup_address ? (
                    <View style={styles.orderDetailRow}>
                      <Ionicons name="location-outline" size={13} color={LaundryColors.textMuted} />
                      <Text style={styles.orderDetailText} numberOfLines={1}>{order.pickup_address}</Text>
                    </View>
                  ) : null}
                  <View style={styles.orderDetailRow}>
                    <Ionicons name="calendar-outline" size={13} color={LaundryColors.textMuted} />
                    <Text style={styles.orderDetailText}>{formatDate(order.created_at)}</Text>
                    {(order.total_amount ?? order.total_price) != null ? (
                      <Text style={styles.orderAmount}>{formatPrice(order.total_amount ?? order.total_price)}</Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}

          <View style={{ height: 20 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LaundryColors.background },
  scrollContent: { paddingBottom: 20 },

  loadingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: LaundryColors.background, gap: 12,
  },
  loadingText: { fontSize: 14, color: LaundryColors.textSecondary, fontWeight: '500' },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16, paddingHorizontal: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: LaundryColors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerGreeting: { fontSize: 16, fontWeight: '700', color: LaundryColors.textPrimary },
  headerSub: { fontSize: 12, color: LaundryColors.textSecondary, marginTop: 1 },

  notifButton: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: LaundryColors.background,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute', top: 6, right: 6,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#FFFFFF',
  },
  notifBadgeText: { fontSize: 9, fontWeight: '700', color: '#FFFFFF' },

  /* Error */
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', marginHorizontal: 20, marginTop: 12,
    borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FECACA',
  },
  errorBannerText: { flex: 1, fontSize: 12, color: LaundryColors.error, fontWeight: '500' },
  retryText: { fontSize: 12, color: LaundryColors.primary, fontWeight: '700' },

  /* Section */
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginTop: 20, marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: LaundryColors.textPrimary },
  linkText: { fontSize: 13, color: LaundryColors.primary, fontWeight: '600' },

  /* Quick Actions */
  quickActionsCard: {
    marginHorizontal: 20, backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: LaundryColors.inputBorder,
  },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  quickActionItem: { alignItems: 'center', flex: 1 },
  quickActionIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 10, color: LaundryColors.textPrimary, fontWeight: '600',
    textAlign: 'center', lineHeight: 13,
  },

  /* Empty */
  emptyCard: {
    marginHorizontal: 20, backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 24, alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: LaundryColors.inputBorder,
  },
  emptyText: { fontSize: 13, color: LaundryColors.textSecondary, fontWeight: '500' },
  emptyButton: {
    backgroundColor: LaundryColors.primary, borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 8, marginTop: 4,
  },
  emptyButtonText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  /* Service card */
  serviceCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 8, backgroundColor: '#FFFFFF',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: LaundryColors.inputBorder,
  },
  serviceIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#EBF5FF', alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 14, fontWeight: '700', color: LaundryColors.textPrimary },
  serviceDesc: { fontSize: 11, color: LaundryColors.textSecondary, marginTop: 2 },
  servicePriceWrap: { alignItems: 'flex-end' },
  servicePrice: { fontSize: 14, fontWeight: '800', color: LaundryColors.primary },
  servicePriceUnit: { fontSize: 10, color: LaundryColors.textMuted },

  /* Order card */
  orderCard: {
    marginHorizontal: 20, marginBottom: 8, backgroundColor: '#FFFFFF',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: LaundryColors.inputBorder,
  },
  orderCardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  orderId: { fontSize: 13, fontWeight: '700', color: LaundryColors.textPrimary },
  orderServiceName: { fontSize: 11, color: LaundryColors.textSecondary, marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeText: { fontSize: 10, fontWeight: '600' },
  orderCardBottom: {
    marginTop: 10, paddingTop: 10, borderTopWidth: 1,
    borderTopColor: LaundryColors.inputBorder, gap: 4,
  },
  orderDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  orderDetailText: { fontSize: 11, color: LaundryColors.textSecondary, flex: 1 },
  orderAmount: { fontSize: 13, fontWeight: '700', color: LaundryColors.primary },
});
