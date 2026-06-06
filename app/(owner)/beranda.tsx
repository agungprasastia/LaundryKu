import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LaundryColors } from "@/constants/colors";
import {
  getStatusBgColor,
  getStatusColor,
  getStatusLabel,
} from "@/constants/orderStatus";
import { useAuth } from "@/contexts/AuthContext";
import * as ownerService from "@/services/ownerService";
import * as walletService from "@/services/walletService";
import { Order } from "@/types/order";
import { Wallet } from "@/types/wallet";

const money = (n?: number) => "Rp " + Number(n || 0).toLocaleString("id-ID");
const date = (v?: string) =>
  v ? new Date(v).toLocaleDateString("id-ID") : "-";
const verified = (v: unknown) => v === true || v === 1;
const activeStatuses = [
  "WAITING_OWNER_CONFIRMATION",
  "CONFIRMED",
  "PICKUP_ON_THE_WAY",
  "LAUNDRY_PICKED",
  "PROCESSING",
  "READY_FOR_DELIVERY",
  "DELIVERY_ON_THE_WAY",
  "DELIVERED",
];

export default function OwnerBerandaScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isVerified = verified(user?.is_verified);
  const [loading, setLoading] = useState(isVerified);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] =
    useState<ownerService.OwnerReportSummary | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  const load = useCallback(async () => {
    if (!isVerified) return;
    try {
      setError("");
      const [summaryRes, ordersRes, walletRes] = await Promise.allSettled([
        ownerService.getOwnerReportSummary(),
        ownerService.getOwnerOrders(),
        walletService.getMyWallet(),
      ]);
      if (summaryRes.status === "fulfilled" && summaryRes.value.success)
        setSummary(summaryRes.value.data || null);
      if (ordersRes.status === "fulfilled" && ordersRes.value.success)
        setOrders(
          Array.isArray(ordersRes.value.data) ? ordersRes.value.data : [],
        );
      if (walletRes.status === "fulfilled" && walletRes.value.success)
        setWallet(walletRes.value.data || null);
    } catch (e: any) {
      setError(
        e?.response?.data?.message || e?.message || "Gagal memuat beranda",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isVerified]);

  useEffect(() => {
    load();
  }, [load]);
  const retry = () => {
    setRefreshing(true);
    load();
  };

  if (!isVerified) return <Gate name={user?.full_name} />;
  if (loading)
    return (
      <Shell title={"Halo, " + (user?.full_name || "Mitra")}>
        <Loader text="Memuat dashboard owner..." />
      </Shell>
    );

  const totalOrders =
    summary?.total_orders ?? summary?.total_order ?? orders.length;
  const active =
    summary?.active_orders ??
    orders.filter((order) => activeStatuses.includes(order.status)).length;
  const revenue =
    summary?.owner_revenue ??
    summary?.owner_earning ??
    summary?.total_owner_earning ??
    summary?.total_revenue ??
    orders.reduce((sum, order) => sum + Number(order.owner_earning || 0), 0);
  const available = (wallet as any)?.available_balance ?? wallet?.balance ?? 0;
  const pending = (wallet as any)?.pending_balance ?? 0;

  return (
    <Shell
      title={"Halo, " + (user?.full_name || "Mitra")}
      refresh={{ refreshing, onRefresh: retry }}
    >
      {error ? <ErrorCard message={error} onRetry={retry} /> : null}
      <View style={styles.verify}>
        <Ionicons
          name="shield-checkmark"
          size={18}
          color={LaundryColors.success}
        />
        <Text style={styles.verifyText}>Owner terverifikasi</Text>
      </View>
      <View style={styles.grid}>
        <Metric
          label="Total Order"
          value={String(totalOrders)}
          icon="receipt-outline"
        />
        <Metric label="Pendapatan" value={money(revenue)} icon="cash-outline" />
        <Metric
          label="Available"
          value={money(available)}
          icon="wallet-outline"
        />
        <Metric label="Pending" value={money(pending)} icon="time-outline" />
        <Metric
          label="Order Aktif"
          value={String(active)}
          icon="flash-outline"
        />
      </View>
      <Text style={styles.section}>Quick Action</Text>
      <View style={styles.actions}>
        {[
          ["Kelola Layanan", "services"],
          ["Pesanan Masuk", "orders"],
          ["Wallet", "wallet"],
          ["Laporan", "beranda"],
        ].map(([label, route]) => (
          <TouchableOpacity
            key={label}
            style={styles.action}
            onPress={() => router.push(("/(owner)/" + route) as any)}
          >
            <Text style={styles.actionText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.section}>Order Terbaru</Text>
      {orders.length === 0 ? (
        <Empty text="Belum ada order." />
      ) : (
        orders
          .slice(0, 5)
          .map((order) => <OrderCard key={order.order_id} order={order} />)
      )}
    </Shell>
  );
}

function Gate({ name }: { name?: string }) {
  return (
    <Shell title={"Halo, " + (name || "Mitra")}>
      <View style={styles.wait}>
        <Ionicons
          name="hourglass-outline"
          size={42}
          color={LaundryColors.roleMitraIcon}
        />
        <Text style={styles.waitTitle}>Menunggu verifikasi admin</Text>
        <Text style={styles.mutedCenter}>
          Akun owner Anda belum diverifikasi admin. Fitur owner aktif setelah
          verifikasi.
        </Text>
      </View>
    </Shell>
  );
}
function Shell({
  title,
  children,
  refresh,
}: {
  title: string;
  children: React.ReactNode;
  refresh?: any;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSub}>LaundryKu Mitra</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          refresh ? (
            <RefreshControl {...refresh} colors={[LaundryColors.primary]} />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </View>
  );
}
function Loader({ text }: { text: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={LaundryColors.primary} />
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}
function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.error}>
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity onPress={onRetry}>
        <Text style={styles.link}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}
function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: any;
}) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={18} color={LaundryColors.roleMitraIcon} />
      <Text style={styles.metricVal}>{value}</Text>
      <Text style={styles.metricLbl}>{label}</Text>
    </View>
  );
}
function Badge({ status }: { status: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: getStatusBgColor(status) }]}>
      <Text style={[styles.badgeText, { color: getStatusColor(status) }]}>
        {getStatusLabel(status)}
      </Text>
    </View>
  );
}
function OrderCard({ order }: { order: Order }) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.cardTitle}>{order.order_id}</Text>
        <Badge status={order.status} />
      </View>
      <Text style={styles.muted}>
        {order.customer_name || "Customer"} •{" "}
        {order.service_name || order.service?.name || "-"}
      </Text>
      <Text style={styles.muted}>
        {date(order.created_at)} •{" "}
        {money(order.total_amount ?? order.total_price)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LaundryColors.background },
  header: {
    backgroundColor: "#FFF",
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: LaundryColors.inputBorder,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
  headerSub: { fontSize: 12, color: LaundryColors.textSecondary, marginTop: 2 },
  body: { padding: 16, paddingBottom: 30 },
  center: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 10,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metric: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    width: "48%",
    borderWidth: 1,
    borderColor: LaundryColors.cardBorder,
  },
  metricVal: {
    fontSize: 17,
    fontWeight: "800",
    color: LaundryColors.textPrimary,
    marginTop: 8,
  },
  metricLbl: { fontSize: 12, color: LaundryColors.textSecondary },
  section: {
    fontSize: 16,
    fontWeight: "800",
    color: LaundryColors.textPrimary,
    marginTop: 18,
    marginBottom: 10,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  action: {
    backgroundColor: LaundryColors.roleMitraIcon,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionText: { color: "#FFF", fontWeight: "700" },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: LaundryColors.cardBorder,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: LaundryColors.textPrimary,
  },
  muted: { fontSize: 12, color: LaundryColors.textSecondary, marginTop: 4 },
  mutedCenter: {
    fontSize: 13,
    color: LaundryColors.textSecondary,
    textAlign: "center",
  },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: "800" },
  error: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: LaundryColors.error, fontWeight: "600" },
  link: { color: LaundryColors.primary, fontWeight: "800", marginTop: 6 },
  empty: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  verify: {
    backgroundColor: LaundryColors.roleMitraBg,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  verifyText: { color: LaundryColors.roleMitraIcon, fontWeight: "800" },
  wait: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: LaundryColors.cardBorder,
  },
  waitTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: LaundryColors.textPrimary,
  },
});
