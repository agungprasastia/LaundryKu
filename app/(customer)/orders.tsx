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
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LaundryColors } from '@/constants/colors';
import {
  getStatusLabel,
  getStatusColor,
  getStatusBgColor,
  ALL_ORDER_STATUSES,
} from '@/constants/orderStatus';
import * as orderService from '@/services/orderService';
import * as paymentService from '@/services/paymentService';
import { Order, OrderTracking, TrackingEntry } from '@/types/order';
import { Invoice } from '@/types/payment';

const IS_DUMMY_PAYMENT = process.env.EXPO_PUBLIC_USE_DUMMY_PAYMENT === 'true';

export default function CustomerOrdersScreen() {
  // ─── State ───
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Detail modal
  const [showDetail, setShowDetail] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [trackingData, setTrackingData] = useState<OrderTracking | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Invoice/Payment
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [callbackLoading, setCallbackLoading] = useState(false);

  // ─── Fetch ───
  const fetchOrders = useCallback(async () => {
    try {
      setError('');
      const [activeRes, historyRes] = await Promise.allSettled([
        orderService.getMyOrders(),
        orderService.getMyOrdersHistory(),
      ]);

      if (activeRes.status === 'fulfilled' && activeRes.value?.success && activeRes.value.data) {
        setActiveOrders(Array.isArray(activeRes.value.data) ? activeRes.value.data : []);
      } else {
        setActiveOrders([]);
      }

      if (historyRes.status === 'fulfilled' && historyRes.value?.success && historyRes.value.data) {
        setHistoryOrders(Array.isArray(historyRes.value.data) ? historyRes.value.data : []);
      } else {
        setHistoryOrders([]);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal memuat pesanan';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

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

      // Fetch invoice if available
      const resolvedOrder = orderRes.status === 'fulfilled' && orderRes.value?.data
        ? orderRes.value.data : order;
      if (resolvedOrder.invoice_id) {
        await fetchInvoice(resolvedOrder.invoice_id);
      }
    } catch (err: any) {
      // Don't crash — keep showing whatever data we got
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
    } catch (err: any) {
      console.warn('Error loading invoice:', err);
    } finally {
      setInvoiceLoading(false);
    }
  };

  // ─── Create Payment ───
  const handleCreatePayment = async () => {
    if (!invoice) return;
    setPaymentLoading(true);
    try {
      const res = await paymentService.createPayment({
        invoice_id: invoice.invoice_id,
        payment_method: 'e_wallet',
      });
      if (res.success) {
        const paymentData = res.data;
        Alert.alert(
          'Payment Dibuat',
          `Payment berhasil dibuat.\n\n` +
          `Payment ID: ${paymentData?.payment_id || 'N/A'}\n` +
          `Status: ${paymentData?.status || 'pending'}` +
          (paymentData?.payment_method ? `\nMetode: ${paymentData.payment_method}` : ''),
        );
        // Refresh invoice
        if (invoice.invoice_id) {
          await fetchInvoice(invoice.invoice_id);
        }
      } else {
        Alert.alert('Gagal', res.message || 'Gagal membuat payment');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal membuat payment';
      Alert.alert('Error', msg);
    } finally {
      setPaymentLoading(false);
    }
  };

  // ─── Simulate Payment Callback (Dummy) ───
  const handleDummyCallback = async () => {
    if (!invoice) return;
    setCallbackLoading(true);
    try {
      const res = await paymentService.simulatePaymentCallback({
        invoice_id: invoice.invoice_id,
        status: 'paid',
      });
      if (res.success) {
        Alert.alert('Berhasil', 'Simulasi pembayaran berhasil! Invoice sudah terbayar.');
        // Refresh detail
        if (detailOrder) {
          await openDetail(detailOrder);
        }
        fetchOrders();
      } else {
        Alert.alert('Gagal', res.message || 'Simulasi payment gagal');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Simulasi payment gagal';
      Alert.alert('Error', msg);
    } finally {
      setCallbackLoading(false);
    }
  };

  // ─── Complete Order ───
  const handleCompleteOrder = async () => {
    if (!detailOrder) return;
    Alert.alert(
      'Konfirmasi Selesai',
      'Apakah Anda yakin ingin menyelesaikan pesanan ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Konfirmasi',
          onPress: async () => {
            setCompleteLoading(true);
            try {
              const res = await orderService.completeOrder(detailOrder.order_id);
              if (res.success) {
                Alert.alert('Berhasil', 'Pesanan berhasil diselesaikan!');
                setShowDetail(false);
                fetchOrders();
              } else {
                Alert.alert('Gagal', res.message || 'Gagal menyelesaikan pesanan');
              }
            } catch (err: any) {
              const msg = err?.response?.data?.message || err?.message || 'Gagal menyelesaikan pesanan';
              Alert.alert('Error', msg);
            } finally {
              setCompleteLoading(false);
            }
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

  // ─── Loading ───
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
              <View style={{ flex: 1 }}>
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
                  <Ionicons name="location-outline" size={14} color={LaundryColors.textMuted} />
                  <Text style={styles.orderDetailText} numberOfLines={1}>{order.pickup_address}</Text>
                </View>
              ) : null}
              <View style={styles.orderDetailRow}>
                <Ionicons name="calendar-outline" size={14} color={LaundryColors.textMuted} />
                <Text style={styles.orderDetailText}>{formatDate(order.created_at)}</Text>
                {order.total_price != null ? (
                  <Text style={styles.orderAmount}>{formatPrice(order.total_price)}</Text>
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
                  {detailOrder.service_name ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Layanan</Text>
                      <Text style={styles.detailValue}>{detailOrder.service_name}</Text>
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
                  {detailOrder.weight_kg != null ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Berat</Text>
                      <Text style={styles.detailValue}>{detailOrder.weight_kg} kg</Text>
                    </View>
                  ) : null}
                  {detailOrder.total_price != null ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Total</Text>
                      <Text style={[styles.detailValue, { fontWeight: '800', color: LaundryColors.primary }]}>
                        {formatPrice(detailOrder.total_price)}
                      </Text>
                    </View>
                  ) : null}
                  {detailOrder.courier_name ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Kurir</Text>
                      <Text style={styles.detailValue}>{detailOrder.courier_name}</Text>
                    </View>
                  ) : null}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Dibuat</Text>
                    <Text style={styles.detailValue}>{formatDate(detailOrder.created_at)}</Text>
                  </View>
                </View>

                {/* ─── Tracking Timeline ─── */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Tracking Status</Text>
                  {renderTimeline(detailOrder, trackingData)}
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
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <>
                                <Ionicons name="card" size={18} color="#FFFFFF" />
                                <Text style={styles.actionButtonText}>Bayar Sekarang</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        ) : null}

                        {/* Dummy Payment Simulation */}
                        {IS_DUMMY_PAYMENT && invoice.status === 'unpaid' ? (
                          <TouchableOpacity
                            style={[styles.dummyButton, callbackLoading && styles.actionButtonDisabled]}
                            onPress={handleDummyCallback}
                            disabled={callbackLoading}
                            activeOpacity={0.8}
                          >
                            {callbackLoading ? (
                              <ActivityIndicator size="small" color="#F97316" />
                            ) : (
                              <>
                                <Ionicons name="flask" size={18} color="#F97316" />
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
                  <TouchableOpacity
                    style={[styles.completeButton, completeLoading && styles.actionButtonDisabled]}
                    onPress={handleCompleteOrder}
                    disabled={completeLoading}
                    activeOpacity={0.8}
                  >
                    {completeLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-done-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.completeButtonText}>Konfirmasi Selesai</Text>
                      </>
                    )}
                  </TouchableOpacity>
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

// ─── Timeline Renderer ───
function renderTimeline(order: Order, tracking: OrderTracking | null) {
  const currentStatusIndex = ALL_ORDER_STATUSES.indexOf(order.status);

  // Build tracking map for timestamps
  const trackingMap = new Map<string, TrackingEntry>();
  if (tracking?.tracking_history) {
    tracking.tracking_history.forEach((entry) => {
      trackingMap.set(entry.status, entry);
    });
  }

  return (
    <View style={timelineStyles.container}>
      {ALL_ORDER_STATUSES.map((status, index) => {
        const isCompleted = index <= currentStatusIndex;
        const isCurrent = index === currentStatusIndex;
        const entry = trackingMap.get(status);
        const statusColor = isCompleted ? getStatusColor(status) : LaundryColors.textMuted;

        return (
          <View key={status} style={timelineStyles.step}>
            {/* Connector line (above) */}
            {index > 0 && (
              <View style={[
                timelineStyles.connector,
                { backgroundColor: isCompleted ? LaundryColors.primary : '#E2E8F0' }
              ]} />
            )}

            <View style={timelineStyles.stepRow}>
              {/* Dot */}
              <View style={[
                timelineStyles.dot,
                isCompleted && { backgroundColor: statusColor, borderColor: statusColor },
                isCurrent && timelineStyles.dotCurrent,
              ]}>
                {isCompleted && (
                  <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                )}
              </View>

              {/* Label */}
              <View style={timelineStyles.labelWrap}>
                <Text style={[
                  timelineStyles.label,
                  isCompleted && { color: LaundryColors.textPrimary, fontWeight: '600' },
                  isCurrent && { fontWeight: '700' },
                ]}>
                  {getStatusLabel(status)}
                </Text>
                {entry?.timestamp ? (
                  <Text style={timelineStyles.timestamp}>
                    {formatTimelineDate(entry.timestamp)}
                  </Text>
                ) : null}
                {entry?.description ? (
                  <Text style={timelineStyles.description}>{entry.description}</Text>
                ) : null}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function formatTimelineDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

// ─── Timeline Styles ───
const timelineStyles = StyleSheet.create({
  container: { marginTop: 8, paddingLeft: 4 },
  step: { position: 'relative' },
  connector: {
    position: 'absolute', left: 9, top: 0, width: 2, height: 12,
  },
  stepRow: {
    flexDirection: 'row', alignItems: 'flex-start', paddingTop: 12, gap: 10,
  },
  dot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  dotCurrent: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 3,
  },
  labelWrap: { flex: 1 },
  label: { fontSize: 12, color: LaundryColors.textMuted },
  timestamp: { fontSize: 10, color: LaundryColors.textMuted, marginTop: 1 },
  description: { fontSize: 10, color: LaundryColors.textSecondary, marginTop: 1 },
});

// ─── Main Styles ───
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LaundryColors.background },
  header: {
    backgroundColor: '#FFFFFF',
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
    flexDirection: 'row', backgroundColor: '#FFFFFF',
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
  tabText: { fontSize: 13, fontWeight: '600', color: LaundryColors.textSecondary },
  tabTextActive: { color: '#FFFFFF' },

  /* Error */
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 12, color: LaundryColors.error, fontWeight: '500' },
  retryText: { fontSize: 12, color: LaundryColors.primary, fontWeight: '700' },

  /* Empty */
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#EBF5FF', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary },
  emptyDesc: { fontSize: 13, color: LaundryColors.textSecondary, textAlign: 'center' },

  /* Order card */
  orderCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: LaundryColors.inputBorder,
  },
  orderCardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  orderId: { fontSize: 14, fontWeight: '700', color: LaundryColors.textPrimary },
  orderServiceName: { fontSize: 11, color: LaundryColors.textSecondary, marginTop: 2 },
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
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
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
    fontSize: 15, fontWeight: '700', color: LaundryColors.textPrimary, marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: { fontSize: 12, color: LaundryColors.textSecondary },
  detailValue: { fontSize: 13, fontWeight: '600', color: LaundryColors.textPrimary },

  /* Action buttons */
  actionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: LaundryColors.primary, borderRadius: 12,
    height: 46, marginTop: 12, gap: 6,
  },
  actionButtonDisabled: { opacity: 0.6 },
  actionButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  dummyButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF7ED', borderRadius: 12,
    height: 46, marginTop: 8, gap: 6,
    borderWidth: 1, borderColor: '#FDBA74',
  },
  dummyButtonText: { fontSize: 13, fontWeight: '700', color: '#F97316' },

  retryButton: {
    alignItems: 'center', paddingVertical: 10,
  },
  retryButtonText: { fontSize: 13, fontWeight: '700', color: LaundryColors.primary },

  completeButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#10B981', borderRadius: 14,
    height: 50, marginTop: 20, gap: 8,
  },
  completeButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
