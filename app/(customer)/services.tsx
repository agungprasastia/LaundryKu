import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crossAlert } from '@/utils/crossAlert';
import { getErrorMessage } from '@/utils/helpers';
import { useRouter } from 'expo-router';
import InteractiveButton from '@/components/ui/InteractiveButton';
import { Ionicons } from '@expo/vector-icons';

import * as serviceService from '@/services/serviceService';
import * as orderService from '@/services/orderService';
import { LaundryService } from '@/types/service';
import { CreateOrderPayload } from '@/types/order';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStyles } from '@/hooks/useAppStyles';
import * as Location from 'expo-location';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export default function CustomerServicesScreen() {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);

  // Detail modal
  const [selectedService, setSelectedService] = useState<LaundryService | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Create order modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderServiceId, setOrderServiceId] = useState('');
  const [orderServiceName, setOrderServiceName] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  const [pickupScheduledAt, setPickupScheduledAt] = useState('');
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | 'datetime'>('date');

  // GPS location state
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [locationError, setLocationError] = useState('');

  const {
    data: services = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['customer', 'services'],
    queryFn: async () => {
      const response = await serviceService.getServices();
      if (!response.success) throw new Error(response.message || 'Gagal memuat layanan');
      const all = Array.isArray(response.data) ? response.data : [];
      return all.filter((s) => s.is_active === true || s.is_active === 1);
    },
  });

  const error = queryError ? getErrorMessage(queryError, 'Gagal memuat layanan') : '';

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
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
    setPickupLat(null);
    setPickupLng(null);
    setPickupScheduledAt('');
    setPickupDate(null);
    setLocationStatus('idle');
    setLocationError('');
    setShowDetail(false);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedService(null);
    setOrderServiceId('');
    setOrderServiceName('');
    setPickupAddress('');
    setPickupLat(null);
    setPickupLng(null);
    setPickupScheduledAt('');
    setPickupDate(null);
    setLocationStatus('idle');
    setLocationError('');
  };

  // ─── GPS Location Handler ───
  const handleGetLocation = async () => {
    setLocationStatus('loading');
    setLocationError('');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('error');
        setLocationError('Izin lokasi ditolak');
        crossAlert(
          'Izin Lokasi Diperlukan',
          'Izin lokasi diperlukan untuk menentukan lokasi pickup. Silakan aktifkan izin lokasi di pengaturan.',
          [
            { text: 'Buka Pengaturan', onPress: () => { if (Platform.OS !== 'web') Linking.openSettings(); } },
            { text: 'Batal' }
          ]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setPickupLat(location.coords.latitude);
      setPickupLng(location.coords.longitude);
      setLocationStatus('success');
    } catch (err: unknown) {
      setLocationStatus('error');
      const msg = getErrorMessage(err, 'Gagal mengambil lokasi');
      setLocationError(msg);
      crossAlert('Gagal Mengambil Lokasi', msg, [{ text: 'OK' }]);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event?.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }

    if (Platform.OS === 'android') {
      if (pickerMode === 'date') {
        if (selectedDate) {
          setPickupDate(selectedDate);
          setPickerMode('time');
        }
        return;
      }
      
      if (selectedDate) {
        const finalDate = pickupDate ? new Date(pickupDate) : new Date();
        finalDate.setHours(selectedDate.getHours());
        finalDate.setMinutes(selectedDate.getMinutes());
        finalDate.setSeconds(selectedDate.getSeconds());
        
        setPickupDate(finalDate);
        setShowDatePicker(false);
        
        const yy = finalDate.getFullYear();
        const mm = String(finalDate.getMonth() + 1).padStart(2, '0');
        const dd = String(finalDate.getDate()).padStart(2, '0');
        const hh = String(finalDate.getHours()).padStart(2, '0');
        const min = String(finalDate.getMinutes()).padStart(2, '0');
        const ss = String(finalDate.getSeconds()).padStart(2, '0');
        setPickupScheduledAt(`${yy}-${mm}-${dd} ${hh}:${min}:${ss}`);
      }
    } else {
      setShowDatePicker(false);
      if (selectedDate) {
        setPickupDate(selectedDate);
        const yy = selectedDate.getFullYear();
        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(selectedDate.getDate()).padStart(2, '0');
        const hh = String(selectedDate.getHours()).padStart(2, '0');
        const min = String(selectedDate.getMinutes()).padStart(2, '0');
        const ss = String(selectedDate.getSeconds()).padStart(2, '0');
        setPickupScheduledAt(`${yy}-${mm}-${dd} ${hh}:${min}:${ss}`);
      }
    }
  };

  const onWebDateChange = (val: string) => {
    if (val) {
      const parsed = new Date(val);
      setPickupDate(parsed);
      const yy = parsed.getFullYear();
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const dd = String(parsed.getDate()).padStart(2, '0');
      const hh = String(parsed.getHours()).padStart(2, '0');
      const min = String(parsed.getMinutes()).padStart(2, '0');
      setPickupScheduledAt(`${yy}-${mm}-${dd} ${hh}:${min}:00`);
    } else {
      setPickupDate(null);
      setPickupScheduledAt('');
    }
  };

  const validateOrderForm = (): string | null => {
    if (!pickupAddress.trim()) return 'Alamat pickup harus diisi';
    if (!pickupScheduledAt.trim()) return 'Jadwal pickup harus diisi';

    if (pickupLat == null || pickupLng == null) {
      return 'Silakan tekan tombol Gunakan Lokasi Saya Saat Ini terlebih dahulu.';
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/;
    if (!dateRegex.test(pickupScheduledAt.trim())) {
      return 'Format tanggal harus YYYY-MM-DD HH:mm:ss';
    }

    return null;
  };

  const createOrderMutation = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: (response) => {
      const orderId = response.data?.order_id || 'N/A';
      crossAlert(
        'Pesanan Berhasil',
        `Pesanan berhasil dibuat!\n\nOrder ID: ${orderId}`,
        [
          {
            text: 'Lihat Pesanan',
            onPress: () => {
              closeOrderModal();
              router.push('/(customer)/orders');
            },
          },
          {
            text: 'OK',
            onPress: closeOrderModal,
          },
        ]
      );
      queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] });
    },
    onError: (err) => {
      crossAlert('Error', getErrorMessage(err, 'Gagal membuat pesanan'));
    }
  });

  const submitting = createOrderMutation.isPending;

  const handleSubmitOrder = async () => {
    const validationError = validateOrderForm();
    if (validationError) {
      crossAlert('Validasi Gagal', validationError);
      return;
    }

    const payload: CreateOrderPayload = {
      service_id: orderServiceId,
      pickup_address: pickupAddress.trim(),
      pickup_lat: pickupLat!,
      pickup_lng: pickupLng!,
      pickup_scheduled_at: pickupScheduledAt.trim(),
    };

    createOrderMutation.mutate(payload);
  };

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
            <InteractiveButton onPress={onRefresh}>
              <Text style={styles.retryText}>Coba Lagi</Text>
            </InteractiveButton>
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
          <InteractiveButton
            key={svc.service_id}
            style={styles.serviceCard}
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
                <Text style={styles.servicePrice}>{formatPrice(svc.price_per_kg_customer)}</Text>
                <Text style={styles.servicePriceUnit}>/kg</Text>
              </View>
            </View>

            {svc.description ? (
              <Text style={styles.serviceDesc} numberOfLines={2}>{svc.description}</Text>
            ) : null}

            <View style={styles.serviceCardActions}>
              <InteractiveButton
                style={styles.detailButton}
                onPress={() => handleViewDetail(svc)}
              >
                <Ionicons name="information-circle-outline" size={16} color={LaundryColors.primary} />
                <Text style={styles.detailButtonText}>Detail</Text>
              </InteractiveButton>
              <InteractiveButton
                style={styles.orderButton}
                onPress={() => handleOrderPress(svc)}
              >
                <Ionicons name="cart" size={16} color={LaundryColors.textWhite} />
                <Text style={styles.orderButtonText}>Pesan Sekarang</Text>
              </InteractiveButton>
            </View>
          </InteractiveButton>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ─── Detail Modal ─── */}
      <Modal visible={showDetail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Layanan</Text>
              <InteractiveButton onPress={() => setShowDetail(false)}>
                <Ionicons name="close-circle" size={28} color={LaundryColors.textMuted} />
              </InteractiveButton>
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
                    {formatPrice(selectedService.price_per_kg_customer)}
                  </Text>
                </View>

                <InteractiveButton
                  style={styles.modalOrderButton}
                  onPress={() => handleOrderPress(selectedService)}
                >
                  <Ionicons name="cart" size={20} color={LaundryColors.textWhite} />
                  <Text style={styles.modalOrderButtonText}>Pesan Layanan Ini</Text>
                </InteractiveButton>
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
              <InteractiveButton onPress={closeOrderModal} disabled={submitting}>
                <Ionicons name="close-circle" size={28} color={LaundryColors.textMuted} />
              </InteractiveButton>
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

              {/* ─── GPS Location Section ─── */}
              <Text style={styles.inputLabel}>Lokasi Pickup *</Text>

              <InteractiveButton
                style={[
                  styles.locationButton,
                  locationStatus === 'success' && styles.locationButtonSuccess,
                  locationStatus === 'loading' && styles.locationButtonLoading,
                ]}
                onPress={handleGetLocation}
                disabled={submitting || locationStatus === 'loading'}
              >
                {locationStatus === 'loading' ? (
                  <ActivityIndicator size="small" color={LaundryColors.primary} />
                ) : locationStatus === 'success' ? (
                  <Ionicons name="checkmark-circle" size={20} color={LaundryColors.success} />
                ) : (
                  <Ionicons name="location" size={20} color={LaundryColors.primary} />
                )}
                <Text
                  style={[
                    styles.locationButtonText,
                    locationStatus === 'success' && styles.locationButtonTextSuccess,
                  ]}
                >
                  {locationStatus === 'loading'
                    ? 'Mengambil lokasi...'
                    : locationStatus === 'success'
                    ? 'Lokasi berhasil diambil'
                    : 'Gunakan Lokasi Saya Saat Ini'}
                </Text>
              </InteractiveButton>

              {locationStatus === 'success' && pickupLat != null && pickupLng != null && (
                <Text style={styles.locationCoords}>
                  📍 {pickupLat.toFixed(6)}, {pickupLng.toFixed(6)}
                </Text>
              )}

              {locationStatus === 'error' && locationError ? (
                <Text style={styles.locationErrorText}>⚠️ {locationError}</Text>
              ) : null}

              <Text style={styles.inputLabel}>Jadwal Pickup *</Text>
              
              {Platform.OS === 'web' ? (
                <View style={[styles.input, { paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden' }]}>
                  {React.createElement('input', {
                    type: 'datetime-local',
                    value: pickupDate ? new Date(pickupDate.getTime() - pickupDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
                    onChange: (e) => onWebDateChange(e.target.value),
                    disabled: submitting,
                    style: {
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      height: '100%',
                      padding: '12px 14px',
                      fontSize: '14px',
                      color: LaundryColors.textPrimary,
                      backgroundColor: 'transparent',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }
                  })}
                </View>
              ) : (
                <>
                  <InteractiveButton 
                    style={[styles.input, { justifyContent: 'center' }]} 
                    onPress={() => {
                      if (!submitting) {
                        setPickerMode(Platform.OS === 'ios' ? 'datetime' : 'date');
                        setShowDatePicker(true);
                      }
                    }}
                  >
                    <Text style={{ color: pickupScheduledAt ? LaundryColors.textPrimary : LaundryColors.inputPlaceholder }}>
                      {pickupScheduledAt || 'Pilih Jadwal Pickup'}
                    </Text>
                  </InteractiveButton>
                  {showDatePicker && (
                    <DateTimePicker
                      value={pickupDate || new Date()}
                      mode={Platform.OS === 'ios' ? 'datetime' : pickerMode as 'date' | 'time'}
                      display="default"
                      onChange={onDateChange}
                      minimumDate={new Date()}
                    />
                  )}
                </>
              )}

              <InteractiveButton
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitOrder}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={LaundryColors.textWhite} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={LaundryColors.textWhite} />
                    <Text style={styles.submitButtonText}>Buat Pesanan</Text>
                  </>
                )}
              </InteractiveButton>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  headerSubtitle: { fontSize: 12, color: LaundryColors.textSecondary, marginTop: 2 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },

  /* Loading */
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: LaundryColors.textSecondary, fontWeight: '500' },

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

  /* Service card */
  serviceCard: {
    backgroundColor: LaundryColors.backgroundWhite, borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: LaundryColors.inputBorder,
  },
  serviceCardHeader: { flexDirection: 'row', alignItems: 'center' },
  serviceIconWrap: {
    width: 44, height: 44, borderRadius: 16,
    backgroundColor: LaundryColors.rolePelangganBg, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  serviceMainInfo: { flex: 1 },
  serviceName: { fontSize: 16, fontWeight: '700', color: LaundryColors.textPrimary },
  serviceId: { fontSize: 10, color: LaundryColors.textMuted, marginTop: 2 },
  servicePriceTag: { alignItems: 'flex-end' },
  servicePrice: { fontSize: 16, fontWeight: '800', color: LaundryColors.primary },
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
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8,
  },
  detailButtonText: { fontSize: 12, fontWeight: '700', color: LaundryColors.primary },
  orderButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: LaundryColors.primary,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8,
  },
  orderButtonText: { fontSize: 12, fontWeight: '700', color: LaundryColors.textWhite },

  /* Modal */
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: LaundryColors.backgroundWhite,
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
    backgroundColor: LaundryColors.rolePelangganBg, alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 12,
  },
  detailName: { fontSize: 20, fontWeight: '700', color: LaundryColors.textPrimary, textAlign: 'center' },
  detailId: { fontSize: 12, color: LaundryColors.textMuted, textAlign: 'center', marginTop: 4 },
  detailSection: {
    marginTop: 16, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: LaundryColors.inputBorder,
  },
  detailLabel: { fontSize: 12, fontWeight: '600', color: LaundryColors.textSecondary, marginBottom: 4 },
  detailValue: { fontSize: 14, color: LaundryColors.textPrimary, lineHeight: 20 },
  detailPriceValue: { fontSize: 24, fontWeight: '800', color: LaundryColors.primary },
  modalOrderButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: LaundryColors.primary, borderRadius: 16,
    height: 50, marginTop: 24, gap: 8,
  },
  modalOrderButtonText: { fontSize: 16, fontWeight: '700', color: LaundryColors.textWhite },

  /* Order form */
  orderFormServiceInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: LaundryColors.rolePelangganBg, borderRadius: 12, padding: 12, marginBottom: 16,
  },
  orderFormServiceName: { fontSize: 14, fontWeight: '700', color: LaundryColors.primary },

  inputLabel: {
    fontSize: 14, fontWeight: '600', color: LaundryColors.textPrimary,
    marginBottom: 6, marginTop: 12,
  },
  input: {
    backgroundColor: LaundryColors.inputBg,
    borderWidth: 1, borderColor: LaundryColors.inputBorder,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 14, color: LaundryColors.textPrimary,
  },
  
  locationButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderWidth: 1.5, borderColor: LaundryColors.primary,
    borderRadius: 12, paddingVertical: 16, borderStyle: 'dashed',
    backgroundColor: '#F0F7FF',
  },
  locationButtonSuccess: {
    borderColor: LaundryColors.success, borderStyle: 'solid', backgroundColor: LaundryColors.roleMitraBg,
  },
  locationButtonLoading: {
    borderColor: LaundryColors.primaryLight, backgroundColor: '#F8FAFF',
  },
  locationButtonText: {
    fontSize: 14, fontWeight: '600', color: LaundryColors.primary,
  },
  locationButtonTextSuccess: {
    color: LaundryColors.success,
  },
  locationCoords: {
    fontSize: 12, color: LaundryColors.textMuted, textAlign: 'center',
    marginTop: 6, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  locationErrorText: {
    fontSize: 12, color: LaundryColors.error, marginTop: 6,
  },

  submitButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: LaundryColors.primary, borderRadius: 16,
    height: 50, marginTop: 20, marginBottom: 20, gap: 8,
  },
  submitButtonDisabled: { backgroundColor: LaundryColors.primaryLight },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: LaundryColors.textWhite },
});
