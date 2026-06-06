import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { crossAlert } from "@/utils/crossAlert";
import { LaundryColors } from "@/constants/colors";
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
import { AvailableCourier, Order, OrderTracking } from "@/types/order";
import TrackingMap, { normalizeCourierLocation } from "@/components/TrackingMap";
const money = (n?: number) =>
  n == null ? "-" : "Rp " + Number(n).toLocaleString("id-ID");
const num = (n?: number) =>
  n == null ? "-" : Number(n).toLocaleString("id-ID");
const date = (v?: string) => (v ? new Date(v).toLocaleString("id-ID") : "-");
const ver = (v: any) => v === true || v === 1;
const em = (e: any, f: string) => e?.response?.data?.message || e?.message || f;
export default function OwnerOrdersScreen() {
  const { user } = useAuth();
  const verified = ver(user?.is_verified);
  const [orders, setOrders] = useState<Order[]>([]),
    [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [error, setError] = useState("");
  const [modal, setModal] = useState(false),
    [detail, setDetail] = useState<Order | null>(null),
    [tracking, setTracking] = useState<OrderTracking | null>(null),
    [detailLoading, setDetailLoading] = useState(false),
    [busy, setBusy] = useState(false);
  const [couriers, setCouriers] = useState<AvailableCourier[]>([]),
    [courierModal, setCourierModal] = useState(false),
    [weightModal, setWeightModal] = useState(false),
    [weight, setWeight] = useState("");
  const load = useCallback(async () => {
    if (!verified) {
      setLoading(false);
      return;
    }
    try {
      setError("");
      const r = await ownerService.getOwnerOrders();
      setOrders(r.success && Array.isArray(r.data) ? r.data : []);
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
      crossAlert("Error", em(e, "Gagal activate delivery"));
    } finally {
      setBusy(false);
    }
  };
  if (!verified)
    return (
      <Screen>
        <Gate />
      </Screen>
    );
  if (loading)
    return (
      <Screen>
        <Center text="Memuat pesanan..." />
      </Screen>
    );
  return (
    <Screen
      refresh={{
        refreshing,
        onRefresh: () => {
          setRefreshing(true);
          load();
        },
      }}
    >
      {error ? <Err t={error} r={load} /> : null}
      {orders.length === 0 ? (
        <Empty />
      ) : (
        orders.map((o) => (
          <TouchableOpacity
            key={o.order_id}
            style={s.card}
            onPress={() => open(o)}
          >
            <View style={s.row}>
              <Text style={s.title}>{o.order_id}</Text>
              <Badge st={o.status} />
            </View>
            <Text style={s.muted}>
              {o.customer_name || "Customer"} •{" "}
              {o.service_name || o.service?.name || "-"}
            </Text>
            <Text style={s.muted}>{o.pickup_address || "-"}</Text>
            <Text style={s.price}>
              {money(o.total_amount ?? o.total_price)} • {date(o.created_at)}
            </Text>
          </TouchableOpacity>
        ))
      )}
      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.row}>
              <Text style={s.sheetT}>Detail Order</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Text style={s.link}>Tutup</Text>
              </TouchableOpacity>
            </View>
            {detailLoading ? (
              <Center text="Memuat detail..." />
            ) : (
              detail && (
                <ScrollView>
                  <Text style={s.title}>{detail.order_id}</Text>
                  <Badge st={detail.status} />
                  <Info
                    k="Customer"
                    v={detail.customer_name || detail.customer_id}
                  />
                  <Info
                    k="Service"
                    v={
                      detail.service_name ||
                      detail.service?.name ||
                      detail.service_id
                    }
                  />
                  <Info k="Pickup" v={detail.pickup_address} />
                  <Info
                    k="Distance"
                    v={
                      detail.distance_km != null
                        ? num(detail.distance_km) + " km"
                        : "-"
                    }
                  />
                  <Info
                    k="Weight"
                    v={
                      detail.weight_kg != null
                        ? num(detail.weight_kg) + " kg"
                        : "-"
                    }
                  />
                  <Info k="Service fee" v={money(detail.service_fee)} />
                  <Info k="Delivery fee" v={money(detail.delivery_fee)} />
                  <Info
                    k="Total"
                    v={money(detail.total_amount ?? detail.total_price)}
                  />
                  <Info k="Owner earning" v={money(detail.owner_earning)} />
                  <Info
                    k="Courier"
                    v={detail.courier_name || detail.courier?.name || "-"}
                  />
                  <OwnerTrackingPanel order={detail} tracking={tracking} />
                  <Text style={s.sec}>Timeline</Text>
                  {ALL_ORDER_STATUSES.map((st) => (
                    <Text
                      key={st}
                      style={[
                        s.timeline,
                        (detail.status_history?.some((x) => x.status === st) ||
                          tracking?.tracking_history?.some(
                            (x) => x.status === st,
                          )) &&
                          s.done,
                      ]}
                    >
                      • {getStatusLabel(st)}
                    </Text>
                  ))}
                  <Action
                    order={detail}
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
      <Modal visible={courierModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.sheetT}>Pilih Kurir</Text>
            {couriers.length === 0 ? (
              <Text style={s.muted}>Tidak ada kurir available.</Text>
            ) : (
              couriers.map((c) => (
                <TouchableOpacity
                  key={c.user_id}
                  style={s.card}
                  onPress={() => assign(c)}
                >
                  <Text style={s.title}>{c.full_name}</Text>
                  <Text style={s.muted}>
                    {c.vehicle_name || "-"} {c.vehicle_plate_number || ""}
                  </Text>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity onPress={() => setCourierModal(false)}>
              <Text style={s.link}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={weightModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.sheetT}>Input Berat Laundry</Text>
            <TextInput
              style={s.input}
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
              placeholder="3.5"
            />
            <TouchableOpacity
              style={s.primary}
              disabled={busy}
              onPress={saveWeight}
            >
              <Text style={s.primaryT}>Simpan Berat</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setWeightModal(false)}>
              <Text style={s.link}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
function OwnerTrackingPanel({ order, tracking }: { order: Order; tracking: OrderTracking | null }) {
  const courierLocation = normalizeCourierLocation(tracking);
  return (
    <View style={s.mapBlock}>
      <Text style={s.sec}>Lokasi Kurir</Text>
      <TrackingMap
        courierLat={courierLocation.lat}
        courierLng={courierLocation.lng}
        pickupLat={order.pickup_lat}
        pickupLng={order.pickup_lng}
        ownerLat={order.owner_lat}
        ownerLng={order.owner_lng}
        height={220}
        showRouteLine
      />
      <Text style={s.muted}>Status order: {getStatusLabel(order.status)}</Text>
      {tracking?.task_status || tracking?.current_phase ? (
        <Text style={s.muted}>Assignment: {tracking.task_status || tracking.current_phase}</Text>
      ) : null}
      <Text style={s.muted}>
        {courierLocation.lat != null && courierLocation.lng != null
          ? `Lokasi kurir terakhir${courierLocation.updatedAt ? `: ${date(courierLocation.updatedAt)}` : ""}`
          : "Kurir belum mengirim lokasi."}
      </Text>
    </View>
  );
}
function Action({ order, busy, status, showCouriers, weight, activate }: any) {
  const b = (t: string, fn: any) => (
    <TouchableOpacity disabled={busy} style={s.primary} onPress={fn}>
      <Text style={s.primaryT}>{busy ? "Memproses..." : t}</Text>
    </TouchableOpacity>
  );
  switch (order.status) {
    case "WAITING_OWNER_CONFIRMATION":
      return b("Konfirmasi Order", () => status("CONFIRMED"));
    case "CONFIRMED":
      return b("Assign Kurir", showCouriers);
    case "LAUNDRY_PICKED":
      return b("Input Berat Laundry", weight);
    case "PROCESSING":
      return b("Selesai Diproses / Siap Diantar", () =>
        status("READY_FOR_DELIVERY"),
      );
    case "READY_FOR_DELIVERY":
      return b("Aktifkan Delivery", activate);
    default:
      return <Text style={s.muted}>Tidak ada action untuk status ini.</Text>;
  }
}
function Screen({ children, refresh }: any) {
  return (
    <View style={s.c}>
      <View style={s.h}>
        <Text style={s.ht}>Pesanan Owner</Text>
        <Text style={s.hs}>Order masuk dan tindakan status</Text>
      </View>
      <ScrollView
        contentContainerStyle={s.body}
        refreshControl={refresh ? <RefreshControl {...refresh} /> : undefined}
      >
        {children}
      </ScrollView>
    </View>
  );
}
function Gate() {
  return (
    <View style={s.card}>
      <Text style={s.title}>Akun owner Anda belum diverifikasi admin.</Text>
      <Text style={s.muted}>Fitur ini akan aktif setelah verifikasi.</Text>
    </View>
  );
}
function Center({ text }: any) {
  return (
    <View style={s.center}>
      <ActivityIndicator color={LaundryColors.roleMitraIcon} />
      <Text style={s.muted}>{text}</Text>
    </View>
  );
}
function Empty() {
  return (
    <View style={s.card}>
      <Text style={s.title}>Belum ada order</Text>
      <Text style={s.muted}>Order customer akan tampil di sini.</Text>
    </View>
  );
}
function Err({ t, r }: any) {
  return (
    <View style={s.err}>
      <Text style={s.errT}>{t}</Text>
      <TouchableOpacity onPress={r}>
        <Text style={s.link}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}
function Badge({ st }: any) {
  return (
    <View style={[s.badge, { backgroundColor: getStatusBgColor(st) }]}>
      <Text style={[s.badgeT, { color: getStatusColor(st) }]}>
        {getStatusLabel(st)}
      </Text>
    </View>
  );
}
function Info({ k, v }: any) {
  return (
    <View style={s.info}>
      <Text style={s.k}>{k}</Text>
      <Text style={s.v}>{v ?? "-"}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: LaundryColors.background },
  h: {
    backgroundColor: "#FFF",
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: LaundryColors.inputBorder,
  },
  ht: { fontSize: 18, fontWeight: "800" },
  hs: { fontSize: 12, color: LaundryColors.textSecondary },
  body: { padding: 16, paddingBottom: 30 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LaundryColors.cardBorder,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center",
  },
  title: { fontSize: 15, fontWeight: "800", color: LaundryColors.textPrimary },
  muted: { fontSize: 12, color: LaundryColors.textSecondary, marginTop: 5 },
  price: { fontSize: 13, fontWeight: "800", marginTop: 8 },
  badge: {
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  badgeT: { fontSize: 10, fontWeight: "900" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: LaundryColors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
    maxHeight: "90%",
  },
  sheetT: { fontSize: 18, fontWeight: "900" },
  info: { marginTop: 8 },
  k: { fontSize: 11, color: LaundryColors.textMuted, fontWeight: "700" },
  v: { fontSize: 14, color: LaundryColors.textPrimary, fontWeight: "700" },
  sec: { fontSize: 15, fontWeight: "900", marginTop: 14, marginBottom: 6 },
  mapBlock: { marginTop: 14, gap: 8 },
  timeline: { fontSize: 12, color: LaundryColors.textMuted, marginVertical: 3 },
  done: { color: LaundryColors.roleMitraIcon, fontWeight: "800" },
  primary: {
    backgroundColor: LaundryColors.roleMitraIcon,
    borderRadius: 14,
    padding: 13,
    alignItems: "center",
    marginTop: 12,
  },
  primaryT: { color: "#FFF", fontWeight: "800" },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    borderRadius: 12,
    padding: 12,
  },
  link: { color: LaundryColors.primary, fontWeight: "800", padding: 10 },
  center: { alignItems: "center", padding: 32 },
  err: {
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  errT: { color: LaundryColors.error, fontWeight: "800" },
});



