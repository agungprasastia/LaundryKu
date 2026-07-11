import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getStatusBgColor,
  getStatusColor,
  getStatusLabel,
} from "@/constants/orderStatus";
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStyles } from '@/hooks/useAppStyles';
import InteractiveButton from '@/components/ui/InteractiveButton';
import { Order } from "@/types/order";
import { ThemeColors } from '@/constants/colors';

const money = (n?: number) => "Rp " + Number(n || 0).toLocaleString("id-ID");
const date = (v?: string) =>
  v ? new Date(v).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

export const MetricBox = React.memo(function MetricBox({ title, value, icon, color, bg }: { title: string; value: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }) {
  const styles = useAppStyles(createStyles);
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
});

export const Badge = React.memo(function Badge({ status }: { status: string }) {
  const styles = useAppStyles(createStyles);
  return (
    <View style={[styles.badge, { backgroundColor: getStatusBgColor(status) }]}>
      <Text style={[styles.badgeText, { color: getStatusColor(status) }]}>{getStatusLabel(status)}</Text>
    </View>
  );
});

export const OrderCard = React.memo(function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  return (
    <InteractiveButton style={styles.orderCard} onPress={onPress}>
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
          <Ionicons name="time-outline" size={14} color={LaundryColors.textSecondary} />
          <Text style={styles.orderDate}>Dibuat: {date(order.created_at)}</Text>
        </View>
        {order.pickup_scheduled_at ? (
          <View style={[styles.orderMeta, { marginTop: 4 }]}>
            <Ionicons name="calendar-outline" size={14} color={LaundryColors.roleMitraIcon} />
            <Text style={[styles.orderDate, { color: LaundryColors.roleMitraIcon, fontWeight: "600" }]}>
              Pickup: {date(order.pickup_scheduled_at)}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.orderFooter}>
        <Text style={styles.orderPriceLabel}>Total Pembayaran</Text>
        <Text style={styles.orderPriceValue}>{money(order.total_amount ?? order.total_price)}</Text>
      </View>
    </InteractiveButton>
  );
});

const createStyles = (LaundryColors: ThemeColors) => StyleSheet.create({
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
    borderRadius: 12,
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
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: "700" },
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
    fontSize: 16,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
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
    fontSize: 14,
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
    fontSize: 14,
    color: LaundryColors.textSecondary,
    fontWeight: "600",
  },
  orderPriceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: LaundryColors.roleMitraIcon,
  },
});
