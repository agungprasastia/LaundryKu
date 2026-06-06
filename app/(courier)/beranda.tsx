import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { crossAlert } from "@/utils/crossAlert";
import { LaundryColors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import * as courierService from "@/services/courierService";
import * as walletService from "@/services/walletService";
import { CourierEarnings, CourierTask } from "@/types/order";
import { Wallet } from "@/types/wallet";
import {
  CourierScreen,
  EmptyState,
  ErrorState,
  formatMoney,
  getErrorMessage,
  InfoRow,
  isVerified,
  LoadingState,
  PrimaryButton,
  StatusPill,
  VerificationGate,
  courierStyles,
} from "./_components";

export default function CourierBerandaScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const verified = isVerified(user?.is_verified);
  const [tasks, setTasks] = useState<CourierTask[]>([]);
  const [earnings, setEarnings] = useState<CourierEarnings | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!verified) {
      setLoading(false);
      return;
    }

    try {
      setError("");
      const [taskRes, earningRes, walletRes] = await Promise.allSettled([
        courierService.getMyTasks(),
        courierService.getMyEarnings(),
        walletService.getMyWallet(),
      ]);

      if (taskRes.status === "fulfilled" && taskRes.value.success) {
        setTasks(Array.isArray(taskRes.value.data) ? taskRes.value.data : []);
      }
      if (earningRes.status === "fulfilled" && earningRes.value.success) {
        setEarnings(earningRes.value.data || null);
      }
      if (walletRes.status === "fulfilled" && walletRes.value.success) {
        setWallet(walletRes.value.data || null);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat beranda kurir"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [verified]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const activeTask = tasks[0];
  const availableBalance = wallet?.available_balance ?? wallet?.balance ?? 0;
  const pendingBalance = wallet?.pending_balance ?? 0;

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadDashboard();
        }}
      />
    ),
    [loadDashboard, refreshing],
  );

  const updateLocation = async () => {
    if (tasks.length === 0) {
      crossAlert("Info", "Tidak ada tugas aktif untuk update lokasi.");
      return;
    }

    const targetTask = tasks[0];
    setUpdatingLocation(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        crossAlert(
          "Izin Lokasi",
          "Izin lokasi diperlukan untuk update lokasi kurir.",
        );
        return;
      }

      const current = await Location.getCurrentPositionAsync({});
      await courierService.updateMyLocation({
        assignment_id: targetTask.assignment_id,
        lat: current.coords.latitude,
        lng: current.coords.longitude,
      });
      crossAlert("Berhasil", "Lokasi kurir berhasil diperbarui.");
    } catch (err) {
      crossAlert("Error", getErrorMessage(err, "Gagal update lokasi"));
    } finally {
      setUpdatingLocation(false);
    }
  };

  if (!verified) {
    return (
      <CourierScreen
        title={`Halo, ${user?.full_name || "Kurir"}`}
        subtitle="LaundryKu Kurir"
      >
        <VerificationGate />
      </CourierScreen>
    );
  }

  if (loading) {
    return (
      <CourierScreen
        title={`Halo, ${user?.full_name || "Kurir"}`}
        subtitle="LaundryKu Kurir"
      >
        <LoadingState text="Memuat beranda kurir..." />
      </CourierScreen>
    );
  }

  return (
    <CourierScreen
      title={`Halo, ${user?.full_name || "Kurir"}`}
      subtitle="LaundryKu Kurir"
      refreshControl={refreshControl}
    >
      {error ? <ErrorState message={error} onRetry={loadDashboard} /> : null}

      <View style={styles.grid}>
        <Metric label="Active Task" value={String(tasks.length)} />
        <Metric
          label="Total Earnings"
          value={formatMoney(earnings?.total_earnings ?? 0)}
        />
        <Metric label="Available" value={formatMoney(availableBalance)} />
        <Metric label="Pending" value={formatMoney(pendingBalance)} />
      </View>

      <Text style={courierStyles.sectionTitle}>Quick Action</Text>
      <View style={styles.actions}>
        <ActionButton
          text="Lihat Tugas"
          onPress={() => router.push("/(courier)/tasks")}
        />
        <ActionButton
          text="Update Lokasi"
          onPress={updateLocation}
          disabled={updatingLocation}
        />
        <ActionButton
          text="Pendapatan"
          onPress={() => router.push("/(courier)/earnings")}
        />
        <ActionButton
          text="Wallet"
          onPress={() => router.push("/(courier)/wallet")}
        />
      </View>

      <Text style={courierStyles.sectionTitle}>Tugas Aktif</Text>
      {activeTask ? (
        <TaskPreview task={activeTask} />
      ) : (
        <EmptyState
          title="Belum ada tugas aktif"
          message="Tugas pickup atau delivery akan muncul di sini."
          icon="bicycle-outline"
        />
      )}
    </CourierScreen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ActionButton({
  text,
  onPress,
  disabled,
}: {
  text: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.action, disabled && courierStyles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.actionText}>{text}</Text>
    </TouchableOpacity>
  );
}

function TaskPreview({ task }: { task: CourierTask }) {
  return (
    <View style={courierStyles.card}>
      <View style={courierStyles.row}>
        <Text style={styles.taskTitle}>{task.assignment_id}</Text>
        <StatusPill text={task.type || task.status || "-"} accent />
      </View>
      <InfoRow label="Order" value={task.order_id} />
      <InfoRow label="Customer" value={task.customer_name || "-"} />
      <InfoRow label="Service" value={task.service_name || "-"} />
      <InfoRow label="Pickup" value={task.pickup_address || "-"} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metric: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    width: "48%",
    borderWidth: 1,
    borderColor: LaundryColors.cardBorder,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: "900",
    color: LaundryColors.textPrimary,
  },
  metricLabel: {
    fontSize: 12,
    color: LaundryColors.textSecondary,
    marginTop: 4,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  action: {
    backgroundColor: LaundryColors.roleKurirIcon,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  actionText: { color: "#FFF", fontWeight: "800" },
  taskTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: LaundryColors.textPrimary,
    flex: 1,
  },
});
