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
  TextInput,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LaundryColors } from '@/constants/colors';
import * as serviceService from '@/services/serviceService';
import * as orderService from '@/services/orderService';
import { LaundryService } from '@/types/service';
import { CreateOrderPayload } from '@/types/order';

export default function CustomerServicesScreen() {
  const router = useRouter();

  const [services, setServices] = useState<LaundryService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Detail modal
  const [selectedService, setSelectedService] = useState<LaundryService | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Create order modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderServiceId, setOrderServiceId] = useState('');
  const [orderServiceName, setOrderServiceName] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLat, setPickupLat] = useState('');
  const [pickupLng, setPickupLng] = useState('');
  const [pickupScheduledAt, setPickupScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      setError('');
      const response = await serviceService.getServices();
      if (response.success && response.data) {
        const all = Array.isArray(response.data) ? response.data : [];
        // Only show active services
        const active = all.filter((s) => s.is_active === true || s.is_active === 1);
        setServices(active);
      } else {
        setServices([]);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal memuat layanan';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  const formatPrice = (price?: number) => {
    if (price == null) return '-';
    return `Rp ${Number(price).toLocaleString('id-ID')}`;
  };

  const handleViewDetail = (svc: LaundryService) => {
    setSelectedService(svc);
    setShowDetail(true);
  };

  const handleOrderPress = (svc: LaundryService) => {
    setOrderServiceId(svc.service_id);
    setOrderServiceName(svc.name);
    setPickupAddress('');
    setPickupLat('');
    setPickupLng('');
    setPickupScheduledAt('');
    setShowDetail(false);
    setShowOrderModal(true);
  };

  const validateOrderForm = (): string | null => {
    if (!pickupAddress.trim()) return 'Alamat pickup harus diisi';
    if (!pickupLat.trim()) return 'Latitude harus diisi';
    if (!pickupLng.trim()) return 'Longitude harus diisi';
    if (!pickupScheduledAt.trim()) return 'Jadwal pickup harus diisi';

    const lat = parseFloat(pickupLat);
    const lng = parseFloat(pickupLng);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return 'Latitude harus antara -90 dan 90';
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return 'Longitude harus antara -180 dan 180';
    }

    // Basic date format validation (YYYY-MM-DD HH:mm:ss)
    const dateRegex = /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/;
    if (!dateRegex.test(pickupScheduledAt.trim())) {
      return 'Format tanggal harus YYYY-MM-DD HH:mm:ss';
    }

    return null;
  };

  const handleSubmitOrder = async () => {
    const validationError = validateOrderForm();
    if (validationError) {
      Alert.alert('Validasi Gagal', validationError);
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateOrderPayload = {
        service_id: orderServiceId,
        pickup_address: pickupAddress.trim(),
        pickup_lat: parseFloat(pickupLat),
        pickup_lng: parseFloat(pickupLng),
        pickup_scheduled_at: pickupScheduledAt.trim(),
      };

      const response = await orderService.createOrder(payload);
      if (response.success) {
        const orderId = response.data?.order_id || 'N/A';
        Alert.alert(
          'Pesanan Berhasil',
          `Pesanan berhasil dibuat!\n\nOrder ID: ${orderId}`,
          [
            {
              text: 'Lihat Pesanan',
              onPress: () => {
                setShowOrderModal(false);
                router.push('/(customer)/orders');
              },
            },
            {
              text: 'OK',
              onPress: () => setShowOrderModal(false),
            },
          ]
        );
      } else {
        Alert.alert('Gagal', response.message || 'Gagal membuat pesanan');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal membuat pesanan';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading ───
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Layanan</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LaundryColors.primary} />
          <Text style={styles.loadingText}>Memuat layanan...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Layanan</Text>
        <Text style={styles.headerSubtitle}>{services.length} layanan tersedia</Text>
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
        {services.length === 0 && !error ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="shirt-outline" size={56} color={LaundryColors.primaryLight} />
            </View>
            <Text style={styles.emptyTitle}>Belum Ada Layanan</Text>
            <Text style={styles.emptyDesc}>
              Belum ada layanan laundry yang tersedia saat ini.
            </Text>
          </View>
        ) : null}

        {/* Service cards */}
        {services.map((svc) => (
          <TouchableOpacity
            key={svc.service_id}
            style={styles.serviceCard}
            activeOpacity={0.7}
            onPress={() => handleViewDetail(svc)}
          >
            <View style={styles.serviceCardHeader}>
              <View style={styles.serviceIconWrap}>
                <Ionicons name="shirt" size={22} color={LaundryColors.primary} />
              </View>
              <View style={styles.serviceMainInfo}>
                <Text style={styles.serviceName}>{svc.name}</Text>
                <Text style={styles.serviceId}>{svc.service_id}</Text>
              </View>
              <View style={styles.servicePriceTag}>
                <Text style={styles.servicePrice}>{formatPrice(svc.price_per_kg)}</Text>
                <Text style={styles.servicePriceUnit}>/kg</Text>
              </View>
            </View>

            {svc.description ? (
              <Text style={styles.serviceDesc} numberOfLines={2}>{svc.description}</Text>
            ) : null}

            <View style={styles.serviceCardActions}>
              <TouchableOpacity
                style={styles.detailButton}
                onPress={() => handleViewDetail(svc)}
                activeOpacity={0.7}
              >
                <Ionicons name="information-circle-outline" size={16} color={LaundryColors.primary} />
                <Text style={styles.detailButtonText}>Detail</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.orderButton}
                onPress={() => handleOrderPress(svc)}
                activeOpacity={0.7}
              >
                <Ionicons name="cart" size={16} color="#FFFFFF" />
                <Text style={styles.orderButtonText}>Pesan Sekarang</Text>
              </TouchableOpacity>
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
              <Text style={styles.modalTitle}>Detail Layanan</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <Ionicons name="close-circle" size={28} color={LaundryColors.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedService ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailIconLarge}>
                  <Ionicons name="shirt" size={40} color={LaundryColors.primary} />
                </View>
                <Text style={styles.detailName}>{selectedService.name}</Text>
                <Text style={styles.detailId}>ID: {selectedService.service_id}</Text>

                {selectedService.description ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Deskripsi</Text>
                    <Text style={styles.detailValue}>{selectedService.description}</Text>
                  </View>
                ) : null}

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Harga per Kg</Text>
                  <Text style={styles.detailPriceValue}>
                    {formatPrice(selectedService.price_per_kg)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.modalOrderButton}
                  onPress={() => handleOrderPress(selectedService)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="cart" size={20} color="#FFFFFF" />
                  <Text style={styles.modalOrderButtonText}>Pesan Layanan Ini</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* ─── Create Order Modal ─── */}
      <Modal visible={showOrderModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buat Pesanan</Text>
              <TouchableOpacity onPress={() => setShowOrderModal(false)} disabled={submitting}>
                <Ionicons name="close-circle" size={28} color={LaundryColors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.orderFormServiceInfo}>
                <Ionicons name="shirt" size={18} color={LaundryColors.primary} />
                <Text style={styles.orderFormServiceName}>{orderServiceName}</Text>
              </View>

              <Text style={styles.inputLabel}>Alamat Pickup *</Text>
              <TextInput
                style={styles.input}
                value={pickupAddress}
                onChangeText={setPickupAddress}
                placeholder="Contoh: Jl. Merdeka No. 10, Jakarta"
                placeholderTextColor={LaundryColors.inputPlaceholder}
                multiline
                editable={!submitting}
              />

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Latitude *</Text>
                  <TextInput
                    style={styles.input}
                    value={pickupLat}
                    onChangeText={setPickupLat}
                    placeholder="-6.2"
                    placeholderTextColor={LaundryColors.inputPlaceholder}
                    keyboardType="numeric"
                    editable={!submitting}
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Longitude *</Text>
                  <TextInput
                    style={styles.input}
                    value={pickupLng}
                    onChangeText={setPickupLng}
                    placeholder="106.8"
                    placeholderTextColor={LaundryColors.inputPlaceholder}
                    keyboardType="numeric"
                    editable={!submitting}
                  />
                </View>
              </View>

              <Text style={styles.inputHint}>
                Latitude: -90 s/d 90 • Longitude: -180 s/d 180
              </Text>

              <Text style={styles.inputLabel}>Jadwal Pickup *</Text>
              <TextInput
                style={styles.input}
                value={pickupScheduledAt}
                onChangeText={setPickupScheduledAt}
                placeholder="2026-06-05 13:00:00"
                placeholderTextColor={LaundryColors.inputPlaceholder}
                editable={!submitting}
              />
              <Text style={styles.inputHint}>
                Format: YYYY-MM-DD HH:mm:ss
              </Text>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitOrder}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Buat Pesanan</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  headerSubtitle: { fontSize: 12, color: LaundryColors.textSecondary, marginTop: 2 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },

  /* Loading */
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: LaundryColors.textSecondary, fontWeight: '500' },

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

  /* Service card */
  serviceCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: LaundryColors.inputBorder,
  },
  serviceCardHeader: { flexDirection: 'row', alignItems: 'center' },
  serviceIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#EBF5FF', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  serviceMainInfo: { flex: 1 },
  serviceName: { fontSize: 15, fontWeight: '700', color: LaundryColors.textPrimary },
  serviceId: { fontSize: 10, color: LaundryColors.textMuted, marginTop: 2 },
  servicePriceTag: { alignItems: 'flex-end' },
  servicePrice: { fontSize: 15, fontWeight: '800', color: LaundryColors.primary },
  servicePriceUnit: { fontSize: 10, color: LaundryColors.textMuted },
  serviceDesc: {
    fontSize: 12, color: LaundryColors.textSecondary,
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: LaundryColors.inputBorder,
    lineHeight: 18,
  },
  serviceCardActions: {
    flexDirection: 'row', justifyContent: 'flex-end',
    marginTop: 12, gap: 8,
  },
  detailButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: LaundryColors.primary,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  detailButtonText: { fontSize: 12, fontWeight: '700', color: LaundryColors.primary },
  orderButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: LaundryColors.primary,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  orderButtonText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  /* Modal */
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary },

  /* Detail modal */
  detailIconLarge: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#EBF5FF', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 12,
  },
  detailName: { fontSize: 20, fontWeight: '700', color: LaundryColors.textPrimary, textAlign: 'center' },
  detailId: { fontSize: 11, color: LaundryColors.textMuted, textAlign: 'center', marginTop: 4 },
  detailSection: {
    marginTop: 16, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: LaundryColors.inputBorder,
  },
  detailLabel: { fontSize: 12, fontWeight: '600', color: LaundryColors.textSecondary, marginBottom: 4 },
  detailValue: { fontSize: 14, color: LaundryColors.textPrimary, lineHeight: 20 },
  detailPriceValue: { fontSize: 22, fontWeight: '800', color: LaundryColors.primary },
  modalOrderButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: LaundryColors.primary, borderRadius: 14,
    height: 50, marginTop: 24, gap: 8,
  },
  modalOrderButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  /* Order form */
  orderFormServiceInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EBF5FF', borderRadius: 12, padding: 12, marginBottom: 16,
  },
  orderFormServiceName: { fontSize: 14, fontWeight: '700', color: LaundryColors.primary },

  inputLabel: {
    fontSize: 13, fontWeight: '600', color: LaundryColors.textPrimary,
    marginBottom: 6, marginTop: 12,
  },
  input: {
    backgroundColor: LaundryColors.inputBg,
    borderWidth: 1, borderColor: LaundryColors.inputBorder,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: LaundryColors.textPrimary,
  },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputHalf: { flex: 1 },
  inputHint: {
    fontSize: 10, color: LaundryColors.textMuted, marginTop: 4, marginBottom: 4,
  },

  submitButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: LaundryColors.primary, borderRadius: 14,
    height: 50, marginTop: 20, marginBottom: 20, gap: 8,
  },
  submitButtonDisabled: { backgroundColor: LaundryColors.primaryLight },
  submitButtonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
