import React, { useCallback, useEffect, useState } from "react";
import { ThemeColors } from "@/constants/colors";
import {
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { crossAlert } from "@/utils/crossAlert";
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStyles } from '@/hooks/useAppStyles';
import {
  ALL_ORDER_STATUSES,
  getStatusBgColor,
  getStatusColor,
  getStatusLabel,
} from "@/constants/orderStatus";
import { useAuth } from "@/contexts/AuthContext";
import * as ownerService from "@/services/ownerService";
import * as orderService from "@/services/orderService";
import * as courierService from "@/services/courierService";
import { AvailableCourier, Order, OrderTracking, OrderStatus } from "@/types/order";
import TrackingMap, { normalizeCourierLocation } from "@/components/TrackingMap";
import {
  OwnerScreen,
  VerificationGate,
  LoadingState,
  EmptyState,
  ErrorState,
  PrimaryButton,
  ownerStyles,
} from "@/components/owner/roleComponents";

const money = (n?: number) =>
  n == null ? "-" : "Rp " + Number(n).toLocaleString("id-ID");
const num = (n?: number) =>
  n == null ? "-" : Number(n).toLocaleString("id-ID");
const date = (v?: string) => (v ? new Date(v).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-");
import { getErrorMessage } from '@/utils/helpers';
const ver = (v: unknown) => v === true || v === 1;
const em = (e: unknown, f: string) => getErrorMessage(e, f);

export default function OwnerOrdersScreen() {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  const sharedOwnerStyles = useAppStyles(ownerStyles);
  const { user } = useAuth();
  const verified = ver(user?.is_verified);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  
  const [modal, setModal] = useState(false);
  const [detail, setDetail] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  
  const [couriers, setCouriers] = useState<AvailableCourier[]>([]);
  const [courierModal, setCourierModal] = useState(false);
  const [weightModal, setWeightModal] = useState(false);
  const [weight, setWeight] = useState("");

  const load = useCallback(async () => {
    if (!verified) {
      setLoading(false);
      return;
    }
    try {
      setError("");
      const r = await ownerService.getOwnerOrders();
      setOrders(r.success && Array.isArray(r.data) ? r.data : []);
    } catch (e: unknown) {
      setError(em(e, "Gagal memuat pesanan"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [verified]);

  useEffect(() => {
    load();
  }, [load]);

  const open = async (o: Order) => {
    setModal(true);
    setDetail(o);
    setTracking(null);
    setDetailLoading(true);
    try {
      const [a, b] = await Promise.allSettled([
        orderService.getOrderById(o.order_id),
        orderService.getOrderTracking(o.order_id),
      ]);
      if (a.status === "fulfilled" && a.value.success && a.value.data)
        setDetail(a.value.data);
      if (b.status === "fulfilled" && b.value.success && b.value.data)
        setTracking(b.value.data);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async () => {
    if (detail) await open(detail);
    load();
  };

  const status = async (s: string) => {
    if (!detail) return;
    setBusy(true);
    try {
      await orderService.updateOrderStatus(detail.order_id, s);
      crossAlert("Berhasil", "Status diperbarui");
      await refreshDetail();
    } catch (e: unknown) {
      crossAlert("Error", em(e, "Gagal update status"));
    } finally {
      setBusy(false);
    }
  };

  const showCouriers = async () => {
    setBusy(true);
    try {
      const r = await courierService.getAvailableCouriers();
      setCouriers(r.success && Array.isArray(r.data) ? r.data : []);
      setCourierModal(true);
    } catch (e: unknown) {
      crossAlert("Error", em(e, "Gagal memuat kurir"));
    } finally {
      setBusy(false);
    }
  };

  const assign = async (c: AvailableCourier) => {
    if (!detail) return;
    setBusy(true);
    try {
      await orderService.assignCourier(detail.order_id, {
        courier_id: c.user_id,
      });
      crossAlert("Berhasil", "Kurir ditugaskan");
      setCourierModal(false);
      await refreshDetail();
    } catch (e: unknown) {
      crossAlert("Error", em(e, "Gagal assign kurir"));
    } finally {
      setBusy(false);
    }
  };

  const saveWeight = async () => {
    const w = Number(weight);
    if (!w || w <= 0)
      return crossAlert("Validasi", "weight_kg wajib angka > 0");
    if (!detail) return;
    setBusy(true);
    try {
      await orderService.updateOrderWeight(detail.order_id, { weight_kg: w });
      crossAlert("Berhasil", "Berat tersimpan dan kalkulasi diperbarui");
      setWeightModal(false);
      setWeight("");
      await refreshDetail();
    } catch (e: unknown) {
      crossAlert("Error", em(e, "Gagal input berat"));
    } finally {
      setBusy(false);
    }
  };

  const activate = async () => {
    if (!detail) return;
    setBusy(true);
    try {
      await orderService.activateDelivery(detail.order_id);
      crossAlert("Berhasil", "Delivery diaktifkan");
      await refreshDetail();
    } catch (e: unknown) {
      crossAlert("Error", em(e, "Gagal activate delivery"));
    } finally {
      setBusy(false);
    }
  };

  if (!verified)
    return (
      <OwnerScreen title="Pesanan Masuk" subtitle="Kelola order dari customer">
        <VerificationGate />
      </OwnerScreen>
    );

  if (loading)
    return (
      <OwnerScreen title="Pesanan Masuk" subtitle="Kelola order dari customer">
        <LoadingState text="Memuat pesanan..." />
      </OwnerScreen>
    );

  return (
    <OwnerScreen
      title="Pesanan Masuk"
      subtitle="Kelola order dari customer"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[LaundryColors.roleMitraIcon]} />}
    >
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      
      {orders.length === 0 ? (
        <EmptyState title="Belum ada order" message="Order customer akan tampil di sini." icon="receipt-outline" />
      ) : (
        orders.map((o) => (
          <TouchableOpacity
            key={o.order_id}
            style={sharedOwnerStyles.card}
            onPress={() => open(o)}
            activeOpacity={0.8}
          >
            <View style={sharedOwnerStyles.row}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1, marginRight: 8 }}>
                <Ionicons name="basket" size={20} color={LaundryColors.roleMitraIcon} />
                <Text style={styles.title} numberOfLines={1} ellipsizeMode="middle">{o.order_id}</Text>
              </View>
              <Badge st={o.status} />
            </View>
            <View style={styles.divider} />
            <Text style={styles.customerName}>{o.customer_name || "Customer"}</Text>
            <Text style={styles.serviceName}>{o.service_name || o.service?.name || "Layanan Reguler"}</Text>
            
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color={LaundryColors.textSecondary} />
              <Text style={styles.muted} numberOfLines={1} ellipsizeMode="tail">
                {o.pickup_address || "-"}
              </Text>
            </View>
            
            <View style={styles.footerRow}>
              <Text style={styles.price}>{money(o.total_amount ?? o.total_price)}</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.muted}>Dibuat: {date(o.created_at)}</Text>
                {o.pickup_scheduled_at ? (
                  <Text style={[styles.muted, { color: LaundryColors.roleMitraIcon, fontWeight: '600', marginTop: 2 }]}>
                    Pickup: {date(o.pickup_scheduled_at)}
                  </Text>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* DETAIL MODAL */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={sharedOwnerStyles.row}>
              <Text style={styles.sheetTitle}>Detail Order</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Ionicons name="close-circle" size={28} color={LaundryColors.textMuted} />
              </TouchableOpacity>
            </View>

            {detailLoading ? (
              <LoadingState text="Memuat detail..." />
            ) : (
              detail && (
                <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <Text style={styles.title}>{detail.order_id}</Text>
                    <Badge st={detail.status} />
                  </View>
                  
                  <View style={styles.infoBox}>
                    <Info k="Customer" v={detail.customer_name || detail.customer_id} />
                    <Info k="Service" v={detail.service_name || detail.service?.name || detail.service_id} />
                    <Info k="Pickup Scheduled" v={detail.pickup_scheduled_at ? date(detail.pickup_scheduled_at) : "-"} />
                    <Info k="Pickup Address" v={detail.pickup_address} />
                    <Info k="Distance" v={detail.distance_km != null ? num(detail.distance_km) + " km" : "-"} />
                    <Info k="Weight" v={detail.weight_kg != null ? num(detail.weight_kg) + " kg" : "-"} />
                  </View>

                  <View style={styles.infoBox}>
                    <Info k="Service fee" v={money(detail.service_fee)} />
                    <Info k="Delivery fee" v={money(detail.delivery_fee)} />
                    <View style={styles.divider} />
                    <Info k="Total Amount" v={money(detail.total_amount ?? detail.total_price)} bold />
                    <Info k="Owner Earning" v={money(detail.owner_earning)} highlight />
                    <Info k="Courier" v={detail.courier_name || detail.courier?.name || "-"} />
                  </View>

                  <OwnerTrackingPanel order={detail} tracking={tracking} />

                  <Text style={styles.sectionHeading}>Timeline</Text>
                  <View style={styles.timelineContainer}>
                    {ALL_ORDER_STATUSES.map((st, index) => {
                      const isDone = detail.status_history?.some((x) => x.status === st) || tracking?.tracking_history?.some((x) => x.status === st);
                      return (
                        <View key={st} style={styles.timelineItem}>
                          <View style={styles.timelineIconContainer}>
                            <View style={[styles.timelineDot, isDone && styles.timelineDotDone]} />
                            {index !== ALL_ORDER_STATUSES.length - 1 && (
                              <View style={[styles.timelineLine, isDone && styles.timelineLineDone]} />
                            )}
                          </View>
                          <Text style={[styles.timelineText, isDone && styles.timelineTextDone]}>
                            {getStatusLabel(st)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  <Action
                    order={detail}
                    tracking={tracking}
                    busy={busy}
                    status={status}
                    showCouriers={showCouriers}
                    weight={() => setWeightModal(true)}
                    activate={activate}
                  />
                </ScrollView>
              )
            )}
          </View>
        </View>
      </Modal>

      {/* COURIER MODAL */}
      <Modal visible={courierModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={sharedOwnerStyles.row}>
              <Text style={styles.sheetTitle}>Pilih Kurir</Text>
              <TouchableOpacity onPress={() => setCourierModal(false)}>
                <Ionicons name="close-circle" size={28} color={LaundryColors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingVertical: 16 }}>
              {couriers.length === 0 ? (
                <EmptyState title="Tidak ada kurir available" icon="bicycle-outline" />
              ) : (
                couriers.map((c) => (
                  <TouchableOpacity
                    key={c.user_id}
                    style={sharedOwnerStyles.card}
                    onPress={() => assign(c)}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View style={styles.avatar}>
                        <Ionicons name="bicycle" size={20} color={LaundryColors.textWhite} />
                      </View>
                      <View>
                        <Text style={styles.title}>{c.full_name}</Text>
                        <Text style={styles.muted}>
                          {c.vehicle_name || "-"} • {c.vehicle_plate_number || ""}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* WEIGHT MODAL */}
      <Modal visible={weightModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={sharedOwnerStyles.row}>
              <Text style={styles.sheetTitle}>Input Berat Laundry (Kg)</Text>
              <TouchableOpacity onPress={() => setWeightModal(false)}>
                <Ionicons name="close-circle" size={28} color={LaundryColors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 16 }}>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
                placeholder="Misal: 3.5"
                placeholderTextColor={LaundryColors.textMuted}
                autoFocus
              />
              <PrimaryButton text={busy ? "Menyimpan..." : "Simpan Berat"} onPress={saveWeight} disabled={busy} />
            </View>
          </View>
        </View>
      </Modal>
    </OwnerScreen>
  );
}

function OwnerTrackingPanel({ order, tracking }: { order: Order; tracking: OrderTracking | null }) {
  const styles = useAppStyles(createStyles);
  const courierLocation = normalizeCourierLocation(tracking);
  return (
    <View style={styles.mapBlock}>
      <Text style={styles.sectionHeading}>Lokasi Kurir</Text>
      <View style={styles.mapContainer}>
        <TrackingMap
          courierLat={courierLocation.lat}
          courierLng={courierLocation.lng}
          pickupLat={order.pickup_lat}
          pickupLng={order.pickup_lng}
          ownerLat={order.owner_lat}
          ownerLng={order.owner_lng}
          height={200}
          showRouteLine
        />
      </View>
      
      <View style={styles.infoBox}>
        <Info k="Status Order" v={getStatusLabel(order.status)} />
        {tracking?.task_status || tracking?.current_phase ? (
          <Info k="Assignment" v={tracking.task_status || tracking.current_phase} />
        ) : null}
        <Info k="Terakhir Diperbarui" v={courierLocation.lat != null && courierLocation.lng != null
            ? (courierLocation.updatedAt ? date(courierLocation.updatedAt) : "Baru saja")
            : "Belum ada lokasi"} />
      </View>
    </View>
  );
}

interface ActionProps {
  order: Order;
  tracking: OrderTracking | null;
  busy: boolean;
  status: (newStatus: OrderStatus) => void;
  showCouriers: () => void;
  weight: () => void;
  activate: () => void;
}

function Action({ order, tracking, busy, status, showCouriers, weight, activate }: ActionProps) {
  const styles = useAppStyles(createStyles);
  switch (order.status) {
    case "WAITING_OWNER_CONFIRMATION":
      return <PrimaryButton text="Konfirmasi Order" onPress={() => status("CONFIRMED")} disabled={busy} />;
    case "CONFIRMED":
      return <PrimaryButton text="Assign Kurir" onPress={showCouriers} disabled={busy} />;
    case "LAUNDRY_PICKED":
      return <PrimaryButton text="Input Berat Laundry" onPress={weight} disabled={busy} />;
    case "PROCESSING":
      return <PrimaryButton text="Selesai Diproses / Siap Diantar" onPress={() => status("READY_FOR_DELIVERY")} disabled={busy} />;
    case "READY_FOR_DELIVERY":
      const isAlreadyActivated = tracking?.current_phase === 'delivery';
      return (
        <PrimaryButton
          text={isAlreadyActivated ? "Delivery Sudah Aktif" : "Aktifkan Delivery"}
          onPress={activate}
          disabled={busy || isAlreadyActivated}
        />
      );
    default:
      return (
        <View style={{ marginTop: 16, alignItems: "center" }}>
          <Text style={styles.muted}>Tidak ada action untuk status ini.</Text>
        </View>
      );
  }
}

function Badge({ st }: { st: string }) {
  const styles = useAppStyles(createStyles);
  return (
    <View style={[styles.badge, { backgroundColor: getStatusBgColor(st) }]}>
      <Text style={[styles.badgeText, { color: getStatusColor(st) }]}>
        {getStatusLabel(st)}
      </Text>
    </View>
  );
}

function Info({ k, v, bold, highlight }: { k: string; v: React.ReactNode; bold?: boolean; highlight?: boolean }) {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{k}</Text>
      <Text style={[styles.infoValue, bold && { fontWeight: "700", fontSize: 16 }, highlight && { color: LaundryColors.roleMitraIcon, fontWeight: "700" }]}>{v ?? "-"}</Text>
    </View>
  );
}

const createStyles = (LaundryColors: ThemeColors) => StyleSheet.create({
  title: { fontSize: 16, fontWeight: "700", color: LaundryColors.textPrimary },
  customerName: { fontSize: 16, fontWeight: "700", color: LaundryColors.textPrimary, marginTop: 4 },
  serviceName: { fontSize: 14, color: LaundryColors.textSecondary, marginTop: 2 },
  price: { fontSize: 16, fontWeight: "700", color: LaundryColors.roleMitraIcon },
  divider: { height: 1, backgroundColor: LaundryColors.inputBorder, marginVertical: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, paddingRight: 16 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: LaundryColors.inputBorder },
  
  badge: {
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
  
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: LaundryColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "92%",
  },
  sheetTitle: { fontSize: 20, fontWeight: "700", color: LaundryColors.textPrimary },
  
  infoBox: {
    backgroundColor: LaundryColors.backgroundWhite,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  infoLabel: { fontSize: 14, color: LaundryColors.textSecondary, fontWeight: "600" },
  infoValue: { fontSize: 14, color: LaundryColors.textPrimary, fontWeight: "700", textAlign: "right", flex: 1, marginLeft: 16 },
  
  sectionHeading: { fontSize: 16, fontWeight: "700", color: LaundryColors.textPrimary, marginTop: 20, marginBottom: 10 },
  mapBlock: { marginTop: 8 },
  mapContainer: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: LaundryColors.inputBorder },

  timelineContainer: {
    backgroundColor: LaundryColors.backgroundWhite,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timelineIconContainer: {
    alignItems: "center",
    marginRight: 12,
    width: 20,
  },
  muted: {
    fontSize: 12,
    color: LaundryColors.textSecondary,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 8,
    backgroundColor: LaundryColors.inputBorder,
    marginTop: 4,
  },
  timelineDotDone: {
    backgroundColor: LaundryColors.roleMitraIcon,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: LaundryColors.inputBorder,
    marginVertical: 4,
  },
  timelineLineDone: {
    backgroundColor: LaundryColors.roleMitraIcon,
  },
  timelineText: {
    fontSize: 14,
    color: LaundryColors.textSecondary,
    fontWeight: "500",
    paddingTop: 1,
    marginBottom: 16,
  },
  timelineTextDone: {
    color: LaundryColors.textPrimary,
    fontWeight: "700",
  },

  input: {
    backgroundColor: LaundryColors.backgroundWhite,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontWeight: "600",
    color: LaundryColors.textPrimary,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LaundryColors.roleMitraIcon,
    alignItems: "center",
    justifyContent: "center",
  },
});
