import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, Text, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import * as courierService from "@/services/courierService";
import { CourierEarnings } from "@/types/order";
import {
  CourierScreen,
  EmptyState,
  ErrorState,
  formatMoney,
  getErrorMessage,
  InfoRow,
  isVerified,
  LoadingState,
  VerificationGate,
  courierStyles,
} from "./_components";

export default function CourierEarningsScreen() {
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
      />
    ),
    [loadEarnings, refreshing],
  );

  if (!verified)
    return (
      <CourierScreen title="Pendapatan" subtitle="Earnings kurir">
        <VerificationGate />
      </CourierScreen>
    );
  if (loading)
    return (
      <CourierScreen title="Pendapatan" subtitle="Earnings kurir">
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
      title="Pendapatan"
      subtitle="Earnings kurir"
      refreshControl={refreshControl}
    >
      {error ? <ErrorState message={error} onRetry={loadEarnings} /> : null}
      <View style={courierStyles.card}>
        <InfoRow
          label="Total earnings"
          value={formatMoney(earnings?.total_earnings ?? 0)}
        />
        <InfoRow
          label="Bulan ini"
          value={formatMoney(earnings?.this_month ?? 0)}
        />
        <InfoRow label="Hari ini" value={formatMoney(earnings?.today ?? 0)} />
        <InfoRow
          label="Task selesai"
          value={String(earnings?.completed_tasks ?? 0)}
        />
      </View>

      <Text style={courierStyles.sectionTitle}>Earning per Task</Text>
      {taskEarnings.length === 0 ? (
        <EmptyState
          title="Belum ada detail earning"
          message="Backend belum mengirim list earning per task/order."
          icon="cash-outline"
        />
      ) : (
        taskEarnings.map((item, index) => (
          <View
            key={item.assignment_id || item.order_id || index}
            style={courierStyles.card}
          >
            <InfoRow label="Order" value={item.order_id || "-"} />
            <InfoRow
              label="Amount"
              value={formatMoney(
                item.amount ?? item.earning ?? item.courier_earning,
              )}
            />
          </View>
        ))
      )}
    </CourierScreen>
  );
}


