import { ThemeColors } from '@/constants/colors';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStyles } from '@/hooks/useAppStyles';
import { useAuth } from "@/contexts/AuthContext";
import * as courierService from "@/services/courierService";
import { CourierEarnings } from "@/types/order";
import {
  CourierScreen,
  EmptyState,
  ErrorState,
  formatMoney,
  getErrorMessage,
  isVerified,
  LoadingState,
  VerificationGate,
} from "@/components/courier/roleComponents";

export default function CourierEarningsScreen() {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  const { user } = useAuth();
  const verified = isVerified(user?.is_verified);
  const [earnings, setEarnings] = useState<CourierEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadEarnings = useCallback(async () => {
    if (!verified) {
      setLoading(false);
      return;
    }
    try {
      setError("");
      const response = await courierService.getMyEarnings();
      setEarnings(response.success ? response.data || null : null);
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat pendapatan"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [verified]);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadEarnings();
        }}
        colors={[LaundryColors.roleKurirIcon]}
      />
    ),
    [loadEarnings, refreshing],
  );

  if (!verified)
    return (
      <CourierScreen title="Pendapatan Anda" subtitle="Rincian komisi pengiriman">
        <VerificationGate />
      </CourierScreen>
    );

  if (loading)
    return (
      <CourierScreen title="Pendapatan Anda" subtitle="Rincian komisi pengiriman">
        <LoadingState text="Memuat pendapatan..." />
      </CourierScreen>
    );

  const taskEarnings = Array.isArray(earnings?.items)
    ? earnings.items
    : Array.isArray(earnings?.tasks)
      ? earnings.tasks
      : [];

  return (
    <CourierScreen
      title="Pendapatan Anda"
      subtitle="Rincian komisi pengiriman"
      refreshControl={refreshControl}
    >
      {error ? <ErrorState message={error} onRetry={loadEarnings} /> : null}
      
      {/* TOTAL EARNINGS CARD */}
      <View style={styles.totalEarningsCard}>
        <View style={styles.totalCardHeader}>
          <Text style={styles.totalCardLabel}>Total Pendapatan</Text>
          <Ionicons name="cash" size={24} color="#D1FAE5" />
        </View>
        <Text style={styles.totalCardValue}>{formatMoney(earnings?.total_earnings ?? 0)}</Text>
        <View style={styles.totalCardFooter}>
          <Text style={styles.totalCardFooterText}>Akumulasi komisi seluruh waktu</Text>
        </View>
      </View>

      {/* STATS GRID */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <View style={[styles.statIconBox, { backgroundColor: LaundryColors.roleMitraBg }]}>
            <Ionicons name="today" size={18} color={LaundryColors.success} />
          </View>
          <Text style={styles.statValue}>{formatMoney(earnings?.today ?? 0)}</Text>
          <Text style={styles.statLabel}>Hari Ini</Text>
        </View>
        
        <View style={styles.statBox}>
          <View style={[styles.statIconBox, { backgroundColor: LaundryColors.rolePelangganBg }]}>
            <Ionicons name="calendar" size={18} color={LaundryColors.primary} />
          </View>
          <Text style={styles.statValue}>{formatMoney(earnings?.this_month ?? 0)}</Text>
          <Text style={styles.statLabel}>Bulan Ini</Text>
        </View>
        
        <View style={styles.statBox}>
          <View style={[styles.statIconBox, { backgroundColor: "#FEF3C7" }]}>
            <Ionicons name="checkmark-done-circle" size={18} color="#D97706" />
          </View>
          <Text style={styles.statValue}>{earnings?.completed_tasks ?? 0}</Text>
          <Text style={styles.statLabel}>Tugas Selesai</Text>
        </View>
      </View>

      <Text style={styles.sectionHeading}>Riwayat Pendapatan</Text>
      
      <View style={styles.historyContainer}>
        {taskEarnings.length === 0 ? (
          <EmptyState
            title="Belum ada riwayat pendapatan"
            message="Pendapatan dari tugas pengiriman akan muncul di sini setelah tugas selesai."
            icon="wallet-outline"
          />
        ) : (
          taskEarnings.map((item, index) => {
            const amount = item.amount ?? item.earning ?? item.courier_earning ?? 0;
            return (
              <View
                key={item.assignment_id || item.order_id || index}
                style={styles.historyItem}
              >
                <View style={styles.historyIconBox}>
                  <Ionicons name="bicycle" size={20} color={LaundryColors.roleKurirIcon} />
                </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyTitle}>Komisi Pengiriman</Text>
                  <Text style={styles.historyOrder}>Order: {item.order_id || "-"}</Text>
                </View>
                <View style={styles.historyAmountBox}>
                  <Text style={styles.historyAmount}>+{formatMoney(amount)}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </CourierScreen>
  );
}

const createStyles = (LaundryColors: ThemeColors) => StyleSheet.create({
  totalEarningsCard: {
    backgroundColor: LaundryColors.roleKurirIcon,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: LaundryColors.roleKurirIcon,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  totalCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalCardLabel: {
    fontSize: 14,
    color: LaundryColors.walletOwnerLightText,
    fontWeight: "600",
  },
  totalCardValue: {
    fontSize: 32,
    fontWeight: "700",
    color: LaundryColors.textWhite,
    marginTop: 8,
    marginBottom: 20,
  },
  totalCardFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingTop: 16,
  },
  totalCardFooterText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },

  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: LaundryColors.backgroundWhite,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: LaundryColors.textSecondary,
    fontWeight: "500",
    marginTop: 4,
  },

  sectionHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
    marginBottom: 16,
  },
  
  historyContainer: {
    backgroundColor: LaundryColors.backgroundWhite,
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  historyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: LaundryColors.surfaceSlate,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
  historyOrder: {
    fontSize: 12,
    color: LaundryColors.textSecondary,
    marginTop: 4,
  },
  historyAmountBox: {
    backgroundColor: LaundryColors.roleMitraBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: LaundryColors.success,
  },
});
