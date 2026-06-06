import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Location from "expo-location";
import { crossAlert } from "@/utils/crossAlert";
import { LaundryColors } from "@/constants/colors";
import {
  getStatusBgColor,
  getStatusColor,
  getStatusLabel,
} from "@/constants/orderStatus";
import { useAuth } from "@/contexts/AuthContext";
import * as courierService from "@/services/courierService";
import { CourierTask } from "@/types/order";
import {
  CourierScreen,
  EmptyState,
  ErrorState,
  formatDate,
  getErrorMessage,
  InfoRow,
  isVerified,
  LoadingState,
  PrimaryButton,
  StatusPill,
  VerificationGate,
  courierStyles,
} from "./_components";

type Tab = "active" | "history";

export default function CourierTasksScreen() {
  const { user } = useAuth();
  const verified = isVerified(user?.is_verified);
  const [tab, setTab] = useState<Tab>("active");
  const [activeTasks, setActiveTasks] = useState<CourierTask[]>([]);
  const [historyTasks, setHistoryTasks] = useState<CourierTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<CourierTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadTasks = useCallback(async () => {
    if (!verified) {
      setLoading(false);
      return;
    }

    try {
      setError("");
      const [activeRes, historyRes] = await Promise.allSettled([
        courierService.getMyTasks(),
        courierService.getMyTasksHistory(),
      ]);
      if (activeRes.status === "fulfilled" && activeRes.value.success) {
        setActiveTasks(
          Array.isArray(activeRes.value.data) ? activeRes.value.data : [],
        );
      }
      if (historyRes.status === "fulfilled" && historyRes.value.success) {
        setHistoryTasks(
          Array.isArray(historyRes.value.data) ? historyRes.value.data : [],
        );
      }
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat tugas kurir"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [verified]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadTasks();
        }}
      />
    ),
    [loadTasks, refreshing],
  );

  const tasks = tab === "active" ? activeTasks : historyTasks;

  const updateStatus = async (task: CourierTask, status: string) => {
    setSubmitting(true);
    try {
      await courierService.updateTaskStatus(task.assignment_id, { status });
      crossAlert("Berhasil", "Status tugas berhasil diperbarui.");
      setSelectedTask(null);
      await loadTasks();
    } catch (err) {
      crossAlert("Error", getErrorMessage(err, "Gagal update status tugas"));
    } finally {
      setSubmitting(false);
    }
  };

  const updateLocation = async (task: CourierTask) => {
    setSubmitting(true);
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
        assignment_id: task.assignment_id,
        lat: current.coords.latitude,
        lng: current.coords.longitude,
      });
      crossAlert("Berhasil", "Lokasi berhasil diperbarui.");
    } catch (err) {
      crossAlert("Error", getErrorMessage(err, "Gagal update lokasi"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!verified) {
    return (
      <CourierScreen title="Tugas" subtitle="Pickup dan delivery">
        <VerificationGate />
      </CourierScreen>
    );
  }

  if (loading) {
    return (
      <CourierScreen title="Tugas" subtitle="Pickup dan delivery">
        <LoadingState text="Memuat tugas..." />
      </CourierScreen>
    );
  }

  return (
    <CourierScreen
      title="Tugas"
      subtitle="Pickup dan delivery"
      refreshControl={refreshControl}
    >
      {error ? <ErrorState message={error} onRetry={loadTasks} /> : null}
      <View style={styles.tabs}>
        <TabButton
          active={tab === "active"}
          text={`Tugas Aktif (${activeTasks.length})`}
          onPress={() => setTab("active")}
        />
        <TabButton
          active={tab === "history"}
          text={`Riwayat (${historyTasks.length})`}
          onPress={() => setTab("history")}
        />
      </View>

      {tasks.length === 0 ? (
        <EmptyState
          title={
            tab === "active" ? "Belum ada tugas aktif" : "Belum ada riwayat"
          }
          icon="list-outline"
        />
      ) : (
        tasks.map((task) => (
          <TaskCard
            key={task.assignment_id}
            task={task}
            onPress={() => setSelectedTask(task)}
          />
        ))
      )}

      <TaskDetailModal
        task={selectedTask}
        submitting={submitting}
        onClose={() => setSelectedTask(null)}
        onUpdateStatus={updateStatus}
        onUpdateLocation={updateLocation}
      />
    </CourierScreen>
  );
}

function TabButton({
  active,
  text,
  onPress,
}: {
  active: boolean;
  text: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
}

function TaskCard({
  task,
  onPress,
}: {
  task: CourierTask;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={courierStyles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={courierStyles.row}>
        <Text style={styles.title}>{task.assignment_id}</Text>
        <StatusPill
          text={task.type || task.current_phase || task.status || "-"}
          accent
        />
      </View>
      <InfoRow label="Order" value={task.order_id} />
      <InfoRow label="Customer" value={task.customer_name || "-"} />
      <InfoRow label="Pickup" value={task.pickup_address || "-"} />
      <InfoRow label="Status" value={task.order_status || task.status || "-"} />
      <Text style={courierStyles.muted}>
        Dibuat {formatDate(task.created_at)} • Update{" "}
        {formatDate(task.updated_at)}
      </Text>
    </TouchableOpacity>
  );
}

function TaskDetailModal({
  task,
  submitting,
  onClose,
  onUpdateStatus,
  onUpdateLocation,
}: {
  task: CourierTask | null;
  submitting: boolean;
  onClose: () => void;
  onUpdateStatus: (task: CourierTask, status: string) => void;
  onUpdateLocation: (task: CourierTask) => void;
}) {
  if (!task) return null;
  const actions = getTaskActions(task);

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={courierStyles.row}>
            <Text style={styles.sheetTitle}>Detail Tugas</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={courierStyles.link}>Tutup</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={styles.title}>{task.assignment_id}</Text>
            <StatusBadge status={task.order_status || task.status} />
            <InfoRow label="Order" value={task.order_id} />
            <InfoRow
              label="Current phase"
              value={task.current_phase || task.type || "-"}
            />
            <InfoRow label="Pickup status" value={task.pickup_status || "-"} />
            <InfoRow
              label="Delivery status"
              value={task.delivery_status || "-"}
            />
            <InfoRow label="Customer" value={task.customer_name || "-"} />
            <InfoRow label="Service" value={task.service_name || "-"} />
            <InfoRow
              label="Pickup address"
              value={task.pickup_address || "-"}
            />
            <InfoRow
              label="Delivery address"
              value={task.delivery_address || "-"}
            />
            <PrimaryButton
              text="Update Lokasi Saya"
              onPress={() => onUpdateLocation(task)}
              disabled={submitting}
            />
            {actions.length === 0 ? (
              <Text style={courierStyles.muted}>
                Tidak ada action untuk status ini.
              </Text>
            ) : (
              actions.map((action) => (
                <PrimaryButton
                  key={action.status}
                  text={action.label}
                  onPress={() => onUpdateStatus(task, action.status)}
                  disabled={submitting}
                />
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function getTaskActions(task: CourierTask) {
  const status = task.order_status || task.status;
  const phase = task.current_phase || task.type;
  const pickup = task.pickup_status;
  const delivery = task.delivery_status;

  if (status === "DELIVERY_ON_THE_WAY" || delivery === "DELIVERY_ON_THE_WAY")
    return [{ label: "Laundry Sudah Diterima Customer", status: "DELIVERED" }];
  if (status === "DELIVERED" || delivery === "DELIVERED")
    return [{ label: "Selesaikan Tugas", status: "DONE" }];
  if (status === "READY_FOR_DELIVERY" || phase === "delivery")
    return [{ label: "Mulai Delivery", status: "DELIVERY_ON_THE_WAY" }];
  if (status === "PICKUP_ON_THE_WAY" || pickup === "PICKUP_ON_THE_WAY")
    return [{ label: "Laundry Sudah Diambil", status: "LAUNDRY_PICKED" }];
  if (phase === "pickup" || !pickup)
    return [{ label: "Mulai Pickup", status: "PICKUP_ON_THE_WAY" }];
  return [];
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return <StatusPill text="-" />;
  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: getStatusBgColor(status) },
      ]}
    >
      <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
        {getStatusLabel(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12 },
  tabActive: { backgroundColor: LaundryColors.roleKurirBg },
  tabText: {
    fontSize: 13,
    fontWeight: "800",
    color: LaundryColors.textSecondary,
  },
  tabTextActive: { color: LaundryColors.roleKurirIcon },
  title: {
    fontSize: 15,
    fontWeight: "900",
    color: LaundryColors.textPrimary,
    flex: 1,
  },
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
  sheetTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: LaundryColors.textPrimary,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  statusText: { fontSize: 11, fontWeight: "900" },
});
