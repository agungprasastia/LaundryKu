import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  StatusBar,
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
import { VerificationGate, ErrorState } from "@/components/owner/roleComponents";

const money = (n?: number) => "Rp " + Number(n || 0).toLocaleString("id-ID");
const date = (v?: string) =>
  v ? new Date(v).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";
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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [loading, setLoading] = useState(isVerified);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<ownerService.OwnerReportSummary | null>(null);
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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const retry = () => {
    setRefreshing(true);
    load();
  };

  if (!isVerified) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Halo, {user?.full_name || "Mitra"} 👋</Text>
          <Text style={styles.headerSub}>LaundryKu Mitra</Text>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <VerificationGate />
        </ScrollView>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={LaundryColors.roleMitraIcon} />
        <Text style={styles.loadingText}>Memuat dashboard owner...</Text>
      </View>
    );
  }

  const totalOrders = summary?.total_orders ?? summary?.total_order ?? orders.length;
  const active = summary?.active_orders ?? orders.filter((order) => activeStatuses.includes(order.status)).length;
  const revenue = summary?.owner_revenue ?? summary?.owner_earning ?? summary?.total_owner_earning ?? summary?.total_revenue ?? orders.reduce((sum, order) => sum + Number(order.owner_earning || 0), 0);
  const available = (wallet as any)?.available_balance ?? wallet?.balance ?? 0;
  const pending = (wallet as any)?.pending_balance ?? 0;

  const quickActions = [
    {
      icon: "shirt" as const,
      label: "Layanan",
      color: LaundryColors.primary,
      bg: "#EBF5FF",
      onPress: () => router.push("/(owner)/services"),
    },
    {
      icon: "receipt" as const,
      label: "Pesanan",
      color: LaundryColors.success,
      bg: "#ECFDF5",
      onPress: () => router.push("/(owner)/orders"),
    },
    {
      icon: "wallet" as const,
      label: "Wallet",
      color: LaundryColors.warning,
      bg: "#FFF7ED",
      onPress: () => router.push("/(owner)/wallet"),
    },
    {
      icon: "person" as const,
      label: "Profil",
      color: LaundryColors.purple,
      bg: "#F5F3FF",
      onPress: () => router.push("/(owner)/profile"),
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={retry} colors={[LaundryColors.roleMitraIcon]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Ionicons name="business" size={24} color={LaundryColors.textWhite} />
              </View>
              <View>
                <Text style={styles.greeting}>Halo, {user?.full_name || "Mitra"} 👋</Text>
                <Text style={styles.subtitle}>Selamat datang di LaundryKu Mitra</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.notifButton}
              onPress={() => router.push("/(owner)/profile")}
            >
              <Ionicons name="notifications-outline" size={24} color={LaundryColors.textPrimary} />
              <View style={styles.notifBadge} />
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], paddingHorizontal: 20, paddingTop: 20 }}>
          {error ? <ErrorState message={error} onRetry={retry} /> : null}

          {/* METRICS */}
          <View style={styles.metricsWrapper}>
            <View style={styles.metricCardBig}>
              <View style={[styles.metricIconBg, { backgroundColor: LaundryColors.rolePelangganBg }]}>
                <Ionicons name="cash" size={24} color={LaundryColors.primary} />
              </View>
              <Text style={styles.metricLabelBig}>Total Pendapatan</Text>
              <Text style={styles.metricValueBig}>{money(revenue)}</Text>
            </View>
            <View style={styles.metricsGridRow}>
              <MetricBox title="Order Aktif" value={String(active)} icon="flash" color={LaundryColors.warning} bg="#FFF7ED" />
              <MetricBox title="Total Order" value={String(totalOrders)} icon="receipt" color={LaundryColors.success} bg="#ECFDF5" />
            </View>
            <View style={styles.metricsGridRow}>
              <MetricBox title="Available" value={money(available)} icon="wallet" color="#8B5CF6" bg="#F5F3FF" />
              <MetricBox title="Pending" value={money(pending)} icon="time" color="#F43F5E" bg="#FFE4E6" />
            </View>
          </View>

          {/* QUICK ACTIONS */}
          <Text style={styles.sectionTitle}>Aksi Cepat</Text>
          <View style={styles.quickActionsContainer}>
            {quickActions.map((action, index) => (
              <TouchableOpacity key={index} style={styles.actionItem} onPress={action.onPress}>
                <View style={[styles.actionIconContainer, { backgroundColor: action.bg }]}>
                  <Ionicons name={action.icon} size={28} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* RECENT ORDERS */}
          <Text style={styles.sectionTitle}>Order Terbaru</Text>
          {orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={LaundryColors.textMuted} />
              <Text style={styles.emptyTitle}>Belum ada order</Text>
              <Text style={styles.emptyText}>Order terbaru akan muncul di sini</Text>
            </View>
          ) : (
            orders.slice(0, 5).map((order) => <OrderCard key={order.order_id} order={order} onPress={() => router.push("/(owner)/orders")} />)
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function MetricBox({ title, value, icon, color, bg }: { title: string; value: string; icon: any; color: string; bg: string }) {
  return (
    <View style={styles.metricBox}>
      <View style={styles.metricBoxHeader}>
        <View style={[styles.metricIconSmBg, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
      </View>
      <Text style={styles.metricBoxValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.metricBoxTitle}>{title}</Text>
    </View>
  );
}

function Badge({ status }: { status: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: getStatusBgColor(status) }]}>
      <Text style={[styles.badgeText, { color: getStatusColor(status) }]}>{getStatusLabel(status)}</Text>
    </View>
  );
}

function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.orderCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.orderHeader}>
        <View style={styles.orderTitleContainer}>
          <Ionicons name="basket" size={20} color={LaundryColors.roleMitraIcon} />
          <Text style={styles.orderIdText} numberOfLines={1} ellipsizeMode="middle">{order.order_id}</Text>
        </View>
        <Badge status={order.status} />
      </View>
      <View style={styles.orderDivider} />
      <View style={styles.orderContent}>
        <Text style={styles.orderCustomer}>{order.customer_name || "Customer"}</Text>
        <Text style={styles.orderService}>{order.service_name || order.service?.name || "Layanan Reguler"}</Text>
        <View style={styles.orderMeta}>
          <Ionicons name="calendar-outline" size={14} color={LaundryColors.textSecondary} />
          <Text style={styles.orderDate}>{date(order.created_at)}</Text>
        </View>
      </View>
      <View style={styles.orderFooter}>
        <Text style={styles.orderPriceLabel}>Total Pembayaran</Text>
        <Text style={styles.orderPriceValue}>{money(order.total_amount ?? order.total_price)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LaundryColors.background },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LaundryColors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: LaundryColors.textSecondary,
    fontWeight: "500",
  },
  header: {
    backgroundColor: LaundryColors.backgroundWhite,
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
  
  headerContainer: {
    backgroundColor: LaundryColors.backgroundWhite,
    paddingTop: Platform.OS === "ios" ? 60 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: LaundryColors.inputBorder,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: LaundryColors.roleMitraIcon,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: {
    fontSize: 18,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: LaundryColors.textSecondary,
    marginTop: 2,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LaundryColors.background,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: LaundryColors.error,
    borderWidth: 1,
    borderColor: "#FFF",
  },

  body: { paddingBottom: 40 },

  metricsWrapper: {
    gap: 12,
    marginBottom: 24,
  },
  metricCardBig: {
    backgroundColor: LaundryColors.backgroundWhite,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  metricIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  metricLabelBig: {
    fontSize: 14,
    color: LaundryColors.textSecondary,
    fontWeight: "600",
  },
  metricValueBig: {
    fontSize: 26,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
    marginTop: 4,
  },
  metricsGridRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: LaundryColors.backgroundWhite,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  metricBoxHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  metricIconSmBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  metricBoxValue: {
    fontSize: 18,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
  metricBoxTitle: {
    fontSize: 12,
    color: LaundryColors.textSecondary,
    fontWeight: "500",
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
    marginBottom: 16,
  },

  quickActionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  actionItem: {
    alignItems: "center",
    width: "23%",
    gap: 8,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: LaundryColors.textPrimary,
    textAlign: "center",
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: LaundryColors.backgroundWhite,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: LaundryColors.textSecondary,
    marginTop: 4,
  },

  orderCard: {
    backgroundColor: LaundryColors.backgroundWhite,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  orderIdText: {
    fontSize: 15,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  orderDivider: {
    height: 1,
    backgroundColor: LaundryColors.inputBorder,
    marginVertical: 12,
  },
  orderContent: {
    marginBottom: 16,
  },
  orderCustomer: {
    fontSize: 16,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
  orderService: {
    fontSize: 14,
    color: LaundryColors.textSecondary,
    marginTop: 4,
  },
  orderMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  orderDate: {
    fontSize: 13,
    color: LaundryColors.textSecondary,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: LaundryColors.inputBorder,
  },
  orderPriceLabel: {
    fontSize: 13,
    color: LaundryColors.textSecondary,
    fontWeight: "600",
  },
  orderPriceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: LaundryColors.roleMitraIcon,
  },
});
