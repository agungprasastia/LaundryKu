import React, { useState, useEffect } from 'react';
import { ThemeColors } from '@/constants/colors';
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
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crossAlert } from '@/utils/crossAlert';
import { getErrorMessage } from '@/utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStyles } from '@/hooks/useAppStyles';
import {
  getStatusLabel,
  getStatusColor,
  getStatusBgColor,
} from '@/constants/orderStatus';
import * as orderService from '@/services/orderService';
import * as paymentService from '@/services/paymentService';
import { Order, OrderTracking } from '@/types/order';
import { AxiosError } from 'axios';
import { Invoice } from '@/types/payment';
import { StatusTimeline } from '@/components/customer/StatusTimeline';
import { TrackingSection } from '@/components/customer/TrackingSection';

const IS_DUMMY_PAYMENT = process.env.EXPO_PUBLIC_USE_DUMMY_PAYMENT === 'true';

export default function CustomerOrdersScreen() {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  const queryClient = useQueryClient();

  // ─── State ───
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [refreshing, setRefreshing] = useState(false);

  // Detail modal
  const [showDetail, setShowDetail] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [trackingData, setTrackingData] = useState<OrderTracking | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Invoice/Payment
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [lastPaymentId, setLastPaymentId] = useState<string | null>(null);

  // ─── Fetch ───
  const {
    data: activeOrders = [],
    isLoading: activeLoading,
    error: activeError,
    refetch: refetchActive,
  } = useQuery({
    queryKey: ['customer', 'orders'],
    queryFn: async () => {
      const response = await orderService.getMyOrders();
      if (!response.success) throw new Error(response.message || 'Gagal memuat pesanan');
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  const {
    data: historyOrders = [],
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['customer', 'ordersHistory'],
    queryFn: async () => {
      const response = await orderService.getMyOrdersHistory();
      if (!response.success) throw new Error(response.message || 'Gagal memuat riwayat');
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  const loading = activeLoading || historyLoading;
  const error = (activeError || historyError) ? getErrorMessage(activeError || historyError, 'Gagal memuat pesanan') : '';

  const fetchOrders = async () => {
    await Promise.all([refetchActive(), refetchHistory()]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!showDetail || !detailOrder || detailOrder.status === 'COMPLETED') return;

    const interval = setInterval(async () => {
      try {
        const response = await orderService.getOrderTracking(detailOrder.order_id);
        if (response.success && response.data) setTrackingData(response.data);
      } catch (err) {
        console.warn('Tracking polling failed:', err);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [detailOrder, showDetail]);

  // ─── Open Detail ───
  const openDetail = async (order: Order) => {
    setShowDetail(true);
    setDetailOrder(order);
    setTrackingData(null);
    setInvoice(null);
    setDetailLoading(true);

    try {
      const [orderRes, trackingRes] = await Promise.allSettled([
        orderService.getOrderById(order.order_id),
        orderService.getOrderTracking(order.order_id),
      ]);

      if (orderRes.status === 'fulfilled' && orderRes.value?.success && orderRes.value.data) {
        setDetailOrder(orderRes.value.data);
      }

      if (trackingRes.status === 'fulfilled' && trackingRes.value?.success && trackingRes.value.data) {
        setTrackingData(trackingRes.value.data);
      }

      const resolvedOrder = orderRes.status === 'fulfilled' && orderRes.value?.data
        ? orderRes.value.data : order;
      if (resolvedOrder.invoice_id) {
        await fetchInvoice(resolvedOrder.invoice_id);
      }
    } catch (err: unknown) {
      console.warn('Error loading order detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Fetch Invoice ───
  const fetchInvoice = async (invoiceId: string) => {
    setInvoiceLoading(true);
    try {
      const res = await paymentService.getInvoice(invoiceId);
      if (res.success && res.data) {
        setInvoice(res.data);
      }
    } catch (err: unknown) {
      console.warn('Error loading invoice:', err);
    } finally {
      setInvoiceLoading(false);
    }
  };

  // ─── Create Payment ───
  const createPaymentMutation = useMutation({
    mutationFn: paymentService.createPayment,
    onSuccess: (res) => {
      if (res.success) {
        const paymentData = res.data;
        if (paymentData?.payment_id) {
          setLastPaymentId(paymentData.payment_id);
        }
        crossAlert(
          'Payment Dibuat',
          `Payment berhasil dibuat.\n\n` +
          `Payment ID: ${paymentData?.payment_id || 'N/A'}\n` +
          `Status: ${paymentData?.status || 'pending'}` +
          (paymentData?.payment_method ? `\nMetode: ${paymentData.payment_method}` : ''),
        );
        if (invoice?.invoice_id) {
          fetchInvoice(invoice.invoice_id);
        }
      } else {
        if (res.data?.payment_id) {
          setLastPaymentId(res.data.payment_id);
        }
        crossAlert('Gagal', res.message || 'Gagal membuat payment');
      }
    },
    onError: (err: unknown) => {
      const axiosErr = err as AxiosError<{data?: {payment_id: string}, message?: string}>;
      if (axiosErr?.response?.status === 409 && axiosErr?.response?.data?.data?.payment_id) {
        setLastPaymentId(axiosErr.response.data.data.payment_id);
      }
      const msg = axiosErr?.response?.data?.message || (err as Error)?.message || 'Gagal membuat payment';
      crossAlert('Error', msg);
    }
  });

  const paymentLoading = createPaymentMutation.isPending;

  const handleCreatePayment = () => {
    if (!invoice) return;
    createPaymentMutation.mutate({
      invoice_id: invoice.invoice_id,
      payment_method: 'e_wallet',
    });
  };

  // ─── Simulate Payment Callback (Dummy) ───
  const simulatePaymentMutation = useMutation({
    mutationFn: paymentService.simulatePaymentCallback,
    onSuccess: async (res) => {
      if (res.success) {
        crossAlert('Berhasil', 'Simulasi pembayaran berhasil! Invoice sudah terbayar.');
        if (detailOrder) {
          await openDetail(detailOrder);
        }
        queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] });
        queryClient.invalidateQueries({ queryKey: ['customer', 'ordersHistory'] });
      } else {
        crossAlert('Gagal', res.message || 'Simulasi payment gagal');
      }
    },
    onError: (err: unknown) => {
      const msg = (err as AxiosError<{message: string}>)?.response?.data?.message || (err as Error)?.message || 'Simulasi payment gagal';
      crossAlert('Error', msg);
    }
  });

  const callbackLoading = simulatePaymentMutation.isPending;

  const handleDummyCallback = () => {
    if (!lastPaymentId) {
      crossAlert('Info', 'Belum ada payment. Tap "Bayar Sekarang" dulu untuk membuat payment.');
      return;
    }
    simulatePaymentMutation.mutate({
      payment_id: lastPaymentId,
      status: 'success',
    });
  };

  // ─── Complete Order ───
  const completeOrderMutation = useMutation({
    mutationFn: orderService.completeOrder,
    onSuccess: (res) => {
      if (res.success) {
        crossAlert('Berhasil', 'Pesanan berhasil diselesaikan!');
        setShowDetail(false);
        queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] });
        queryClient.invalidateQueries({ queryKey: ['customer', 'ordersHistory'] });
      } else {
        crossAlert('Gagal', res.message || 'Gagal menyelesaikan pesanan');
      }
    },
    onError: (err: unknown) => {
      const msg = (err as AxiosError<{message: string}>)?.response?.data?.message || (err as Error)?.message || 'Gagal menyelesaikan pesanan';
      crossAlert('Error', msg);
    }
  });

  const completeLoading = completeOrderMutation.isPending;

  const handleCompleteOrder = () => {
    if (!detailOrder) return;
    crossAlert(
      'Konfirmasi Selesai',
      'Apakah Anda yakin ingin menyelesaikan pesanan ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Konfirmasi',
          onPress: () => {
            completeOrderMutation.mutate(detailOrder.order_id);
          },
        },
      ]
    );
  };

  // ─── Helpers ───
  const formatPrice = (price?: number) => {
    if (price == null) return '-';
    return `Rp ${Number(price).toLocaleString('id-ID')}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const displayOrders = activeTab === 'active' ? activeOrders : historyOrders;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pesanan Saya</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LaundryColors.primary} />
          <Text style={styles.loadingText}>Memuat pesanan...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pesanan Saya</Text>
      </View>

      {/* ─── Tab Toggle ─── */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Aktif ({activeOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Riwayat ({historyOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[LaundryColors.primary]} />
        }
      >
        {/* Empty */}
        {displayOrders.length === 0 && !error ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="cube-outline" size={56} color={LaundryColors.primaryLight} />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'active' ? 'Belum Ada Pesanan Aktif' : 'Belum Ada Riwayat'}
            </Text>
            <Text style={styles.emptyDesc}>
              {activeTab === 'active'
                ? 'Pesanan aktif Anda akan muncul di sini.'
                : 'Riwayat pesanan Anda akan muncul di sini.'}
            </Text>
          </View>
        ) : null}

        {/* Order cards */}
        {displayOrders.map((order) => (
          <TouchableOpacity
            key={order.order_id}
            style={styles.orderCard}
            activeOpacity={0.7}
            onPress={() => openDetail(order)}
          >
            <View style={styles.orderCardTop}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.orderId} numberOfLines={1} ellipsizeMode="middle">#{order.order_id}</Text>
                {order.service_name ? (
                  <Text style={styles.orderServiceName} numberOfLines={1} ellipsizeMode="middle">{order.service_name}</Text>
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
                  <Ionicons name="location-outline" size={14} color={LaundryColors.textMuted} />
                  <Text style={styles.orderDetailText} numberOfLines={1}>{order.pickup_address}</Text>
                </View>
              ) : null}
              <View style={styles.orderDetailRow}>
                <Ionicons name="calendar-outline" size={14} color={LaundryColors.textMuted} />
                <Text style={styles.orderDetailText}>{formatDate(order.pickup_scheduled_at || order.created_at)}</Text>
                {(order.total_amount ?? order.total_price) != null ? (
                  <Text style={styles.orderAmount}>{formatPrice(order.total_amount ?? order.total_price)}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.viewDetailHint}>
              <Text style={styles.viewDetailText}>Lihat Detail</Text>
              <Ionicons name="chevron-forward" size={14} color={LaundryColors.primary} />
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ─── Detail Modal ─── */}
      <Modal visible={showDetail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Pesanan</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <Ionicons name="close-circle" size={28} color={LaundryColors.textMuted} />
              </TouchableOpacity>
            </View>

            {detailLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={LaundryColors.primary} />
                <Text style={styles.loadingText}>Memuat detail...</Text>
              </View>
            ) : detailOrder ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Order Info */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Informasi Pesanan</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Order ID</Text>
                    <Text style={styles.detailValue}>#{detailOrder.order_id}</Text>
                  </View>
                  {(detailOrder.service?.name || detailOrder.service_name) ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Layanan</Text>
                      <Text style={styles.detailValue}>{detailOrder.service?.name || detailOrder.service_name}</Text>
                    </View>
                  ) : null}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(detailOrder.status) }]}>
                      <Text style={[styles.statusBadgeText, { color: getStatusColor(detailOrder.status) }]}>
                        {getStatusLabel(detailOrder.status)}
                      </Text>
                    </View>
                  </View>
                  {detailOrder.pickup_address ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Alamat Pickup</Text>
                      <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                        {detailOrder.pickup_address}
                      </Text>
                    </View>
                  ) : null}
                  {detailOrder.pickup_scheduled_at ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Jadwal Pickup</Text>
                      <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}>
                        {formatDate(detailOrder.pickup_scheduled_at)}
                      </Text>
                    </View>
                  ) : null}
                  {detailOrder.weight_kg != null ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Berat</Text>
                      <Text style={styles.detailValue}>{detailOrder.weight_kg} kg</Text>
                    </View>
                  ) : null}
                  {detailOrder.distance_km != null ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Jarak</Text>
                      <Text style={styles.detailValue}>{detailOrder.distance_km} km</Text>
                    </View>
                  ) : null}
                  {detailOrder.service_fee != null ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Biaya Laundry</Text>
                      <Text style={styles.detailValue}>{formatPrice(detailOrder.service_fee)}</Text>
                    </View>
                  ) : null}
                  {detailOrder.delivery_fee != null ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Biaya Pengiriman</Text>
                      <Text style={styles.detailValue}>{formatPrice(detailOrder.delivery_fee)}</Text>
                    </View>
                  ) : null}
                  {(detailOrder.total_amount ?? detailOrder.total_price) != null ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Total</Text>
                      <Text style={[styles.detailValue, { fontWeight: '800', color: LaundryColors.primary }]}>
                        {formatPrice(detailOrder.total_amount ?? detailOrder.total_price)}
                      </Text>
                    </View>
                  ) : null}
                  {(detailOrder.courier?.name || detailOrder.courier_name) ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Kurir</Text>
                      <Text style={styles.detailValue}>{detailOrder.courier?.name || detailOrder.courier_name}</Text>
                    </View>
                  ) : null}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Dibuat</Text>
                    <Text style={styles.detailValue}>{formatDate(detailOrder.created_at)}</Text>
                  </View>
                </View>

                {/* ─── Tracking Timeline ─── */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Lokasi Kurir</Text>
                  <TrackingSection order={detailOrder} tracking={trackingData} />
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Tracking Status</Text>
                  <StatusTimeline order={detailOrder} />
                </View>

                {/* ─── Invoice Section ─── */}
                {detailOrder.invoice_id ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Invoice & Pembayaran</Text>

                    {invoiceLoading ? (
                      <ActivityIndicator size="small" color={LaundryColors.primary} style={{ marginVertical: 12 }} />
                    ) : invoice ? (
                      <>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Invoice ID</Text>
                          <Text style={styles.detailValue}>{invoice.invoice_id}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Jumlah</Text>
                          <Text style={[styles.detailValue, { fontWeight: '800', color: LaundryColors.primary }]}>
                            {formatPrice(invoice.amount)}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Status Invoice</Text>
                          <View style={[
                            styles.statusBadge,
                            {
                              backgroundColor: invoice.status === 'paid' ? '#ECFDF5' :
                                invoice.status === 'expired' ? '#FEF2F2' : '#FFF7ED'
                            }
                          ]}>
                            <Text style={[
                              styles.statusBadgeText,
                              {
                                color: invoice.status === 'paid' ? '#10B981' :
                                  invoice.status === 'expired' ? '#EF4444' : '#F97316'
                              }
                            ]}>
                              {invoice.status === 'paid' ? 'Terbayar' :
                                invoice.status === 'expired' ? 'Kedaluwarsa' : 'Belum Bayar'}
                            </Text>
                          </View>
                        </View>

                        {/* Pay Button */}
                        {invoice.status === 'unpaid' ? (
                          <TouchableOpacity
                            style={[styles.actionButton, paymentLoading && styles.actionButtonDisabled]}
                            onPress={handleCreatePayment}
                            disabled={paymentLoading}
                            activeOpacity={0.8}
                          >
                            {paymentLoading ? (
                              <ActivityIndicator size="small" color={LaundryColors.textWhite} />
                            ) : (
                              <>
                                <Ionicons name="card" size={18} color={LaundryColors.textWhite} />
                                <Text style={styles.actionButtonText}>Bayar Sekarang</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        ) : null}

                        {/* Dummy Payment Simulation */}
                        {IS_DUMMY_PAYMENT && invoice.status === 'unpaid' && lastPaymentId ? (
                          <TouchableOpacity
                            style={[styles.dummyButton, callbackLoading && styles.actionButtonDisabled]}
                            onPress={handleDummyCallback}
                            disabled={callbackLoading}
                            activeOpacity={0.8}
                          >
                            {callbackLoading ? (
                              <ActivityIndicator size="small" color={LaundryColors.warning} />
                            ) : (
                              <>
                                <Ionicons name="flask" size={18} color={LaundryColors.warning} />
                                <Text style={styles.dummyButtonText}>Simulasi Payment Success</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        ) : null}
                      </>
                    ) : (
                      <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => detailOrder.invoice_id && fetchInvoice(detailOrder.invoice_id)}
                      >
                        <Text style={styles.retryButtonText}>Muat Invoice</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null}

                {/* ─── Complete Order Button ─── */}
                {detailOrder.status === 'DELIVERED' ? (
                  <View style={{ marginTop: 12 }}>
                    {(!invoice || invoice.status !== 'paid') ? (
                      <Text style={{ color: '#EF4444', fontSize: 13, textAlign: 'center', marginBottom: 8, fontWeight: '500' }}>
                        * Selesaikan pembayaran invoice terlebih dahulu untuk konfirmasi.
                      </Text>
                    ) : null}
                    <TouchableOpacity
                      style={[
                        styles.completeButton,
                        (completeLoading || !invoice || invoice.status !== 'paid') && styles.actionButtonDisabled
                      ]}
                      onPress={handleCompleteOrder}
                      disabled={completeLoading || !invoice || invoice.status !== 'paid'}
                      activeOpacity={0.8}
                    >
                      {completeLoading ? (
                        <ActivityIndicator size="small" color={LaundryColors.textWhite} />
                      ) : (
                        <>
                          <Ionicons name="checkmark-done-circle" size={20} color={LaundryColors.textWhite} />
                          <Text style={styles.completeButtonText}>Konfirmasi Selesai</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : null}

                <View style={{ height: 30 }} />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (LaundryColors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: LaundryColors.background },
  header: {
    backgroundColor: LaundryColors.backgroundWhite,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: LaundryColors.inputBorder,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },

  /* Loading */
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: LaundryColors.textSecondary, fontWeight: '500' },

  /* Tabs */
  tabContainer: {
    flexDirection: 'row', backgroundColor: LaundryColors.backgroundWhite,
    paddingHorizontal: 20, paddingBottom: 12, gap: 8,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 12, backgroundColor: LaundryColors.background,
    borderWidth: 1, borderColor: LaundryColors.inputBorder,
  },
  tabActive: {
    backgroundColor: LaundryColors.primary, borderColor: LaundryColors.primary,
  },
  tabText: { fontSize: 14, fontWeight: '600', color: LaundryColors.textSecondary },
  tabTextActive: { color: LaundryColors.textWhite },

  /* Error */
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: LaundryColors.errorBg, borderRadius: 12, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: LaundryColors.errorBorder,
  },
  errorText: { flex: 1, fontSize: 12, color: LaundryColors.error, fontWeight: '500' },
  retryText: { fontSize: 12, color: LaundryColors.primary, fontWeight: '700' },

  /* Empty */
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: {
    width: 90, height: 90, borderRadius: 9999,
    backgroundColor: LaundryColors.rolePelangganBg, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary },
  emptyDesc: { fontSize: 14, color: LaundryColors.textSecondary, textAlign: 'center' },

  /* Order card */
  orderCard: {
    backgroundColor: LaundryColors.backgroundWhite, borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: LaundryColors.inputBorder,
  },
  orderCardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  orderId: { fontSize: 14, fontWeight: '700', color: LaundryColors.textPrimary },
  orderServiceName: { fontSize: 12, color: LaundryColors.textSecondary, marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusBadgeText: { fontSize: 10, fontWeight: '600' },
  orderCardBottom: {
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: LaundryColors.inputBorder, gap: 6,
  },
  orderDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderDetailText: { fontSize: 12, color: LaundryColors.textSecondary, flex: 1 },
  orderAmount: { fontSize: 14, fontWeight: '700', color: LaundryColors.primary },
  viewDetailHint: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    marginTop: 8, gap: 2,
  },
  viewDetailText: { fontSize: 12, fontWeight: '600', color: LaundryColors.primary },

  /* Modal */
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: LaundryColors.backgroundWhite, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary },
  modalLoading: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },

  /* Detail section */
  detailSection: {
    marginTop: 16, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: LaundryColors.inputBorder,
  },
  detailSectionTitle: {
    fontSize: 16, fontWeight: '700', color: LaundryColors.textPrimary, marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: { fontSize: 12, color: LaundryColors.textSecondary },
  detailValue: { fontSize: 14, fontWeight: '600', color: LaundryColors.textPrimary },

  /* Action buttons */
  actionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: LaundryColors.primary, borderRadius: 12,
    height: 46, marginTop: 12, gap: 6,
  },
  actionButtonDisabled: { opacity: 0.6 },
  actionButtonText: { fontSize: 14, fontWeight: '700', color: LaundryColors.textWhite },

  dummyButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: LaundryColors.roleKurirBg, borderRadius: 12,
    height: 46, marginTop: 8, gap: 6,
    borderWidth: 1, borderColor: '#FDBA74',
  },
  dummyButtonText: { fontSize: 14, fontWeight: '700', color: LaundryColors.warning },

  retryButton: {
    alignItems: 'center', paddingVertical: 10,
  },
  retryButtonText: { fontSize: 14, fontWeight: '700', color: LaundryColors.primary },

  completeButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: LaundryColors.success, borderRadius: 16,
    height: 50, marginTop: 20, gap: 8,
  },
  completeButtonText: { fontSize: 16, fontWeight: '700', color: LaundryColors.textWhite },
});
