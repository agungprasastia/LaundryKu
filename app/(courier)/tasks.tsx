import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
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
import TrackingMap from "@/components/TrackingMap";
import {
  CourierScreen,
  EmptyState,
  ErrorState,
  formatDate,
  getErrorMessage,
  isVerified,
  LoadingState,
  PrimaryButton,
  VerificationGate,
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
  const [autoTaskId, setAutoTaskId] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const autoInterval = useRef<ReturnType<typeof setInterval> | null>(null);
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

  const stopAutoLocation = useCallback(() => {
    if (autoInterval.current) clearInterval(autoInterval.current);
    autoInterval.current = null;
    setAutoTaskId(null);
  }, []);

  useEffect(() => stopAutoLocation, [stopAutoLocation]);

  useEffect(() => {
    if (autoTaskId && !activeTasks.some((task) => task.assignment_id === autoTaskId)) {
      stopAutoLocation();
    }
  }, [activeTasks, autoTaskId, stopAutoLocation]);

  const sendLocation = useCallback(async (task: CourierTask, silent = false) => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      if (!silent) crossAlert("Izin Lokasi", "Izin lokasi diperlukan untuk update posisi kurir.");
      return false;
    }
    const current = await Location.getCurrentPositionAsync({});
    const payload = {
      assignment_id: task.assignment_id,
      lat: current.coords.latitude,
      lng: current.coords.longitude,
    };
    await courierService.updateMyLocation(payload);
    setCurrentLocation({ lat: payload.lat, lng: payload.lng });
    if (!silent) crossAlert("Berhasil", "Lokasi berhasil diperbarui.");
    return true;
  }, []);

  const startAutoLocation = async (task: CourierTask) => {
    if (activeTasks.length === 0) {
      crossAlert("Info", "Tidak ada tugas aktif untuk update lokasi.");
      return;
    }
    setSubmitting(true);
    try {
      const ok = await sendLocation(task);
      if (!ok) return;
      if (autoInterval.current) clearInterval(autoInterval.current);
      setAutoTaskId(task.assignment_id);
      autoInterval.current = setInterval(async () => {
        try {
          await sendLocation(task, true);
        } catch (err) {
          console.warn("Auto location update failed:", err);
        }
      }, 12000);
    } catch (err) {
      crossAlert("Error", getErrorMessage(err, "Gagal mengaktifkan auto-update lokasi"));
    } finally {
      setSubmitting(false);
    }
  };

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadTasks();
        }}
        colors={[LaundryColors.roleKurirIcon]}
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
      await sendLocation(task);
    } catch (err) {
      crossAlert("Error", getErrorMessage(err, "Gagal update lokasi"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!verified) {
    return (
      <CourierScreen title="Tugas Anda" subtitle="Pickup dan delivery order">
        <VerificationGate />
      </CourierScreen>
    );
  }

  if (loading) {
    return (
      <CourierScreen title="Tugas Anda" subtitle="Pickup dan delivery order">
        <LoadingState text="Memuat daftar tugas..." />
      </CourierScreen>
    );
  }

  return (
    <CourierScreen
      title="Tugas Anda"
      subtitle="Pickup dan delivery order"
      refreshControl={refreshControl}
    >
      {error ? <ErrorState message={error} onRetry={loadTasks} /> : null}
      
      <View style={styles.tabsContainer}>
        <TabButton
          active={tab === "active"}
          text={`Tugas Aktif (${activeTasks.length})`}
          icon="bicycle"
          onPress={() => setTab("active")}
        />
        <TabButton
          active={tab === "history"}
          text={`Riwayat (${historyTasks.length})`}
          icon="time"
          onPress={() => setTab("history")}
        />
      </View>

      {tasks.length === 0 ? (
        <EmptyState
          title={tab === "active" ? "Belum ada tugas aktif" : "Belum ada riwayat tugas"}
          message={tab === "active" ? "Anda akan menerima notifikasi jika ada tugas baru" : "Tugas yang selesai akan muncul di sini"}
          icon={tab === "active" ? "bicycle-outline" : "time-outline"}
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
        onStartAutoLocation={startAutoLocation}
        onStopAutoLocation={stopAutoLocation}
        autoTaskId={autoTaskId}
        currentLocation={currentLocation}
      />
    </CourierScreen>
  );
}

function TabButton({
  active,
  text,
  icon,
  onPress,
}: {
  active: boolean;
  text: string;
  icon: any;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.tabButton, active && styles.tabButtonActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={18} color={active ? LaundryColors.roleKurirIcon : LaundryColors.textSecondary} />
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
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
  const isPickup = task.type === "pickup" || task.current_phase === "pickup";
  
  return (
    <TouchableOpacity
      style={styles.taskCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.taskCardHeader}>
        <View style={styles.taskTitleRow}>
          <View style={[styles.typeIconBox, { backgroundColor: isPickup ? "#FEF3C7" : "#EBF5FF" }]}>
            <Ionicons name={isPickup ? "arrow-up" : "arrow-down"} size={16} color={isPickup ? "#D97706" : "#2563EB"} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.taskTitle} numberOfLines={1} ellipsizeMode="middle">{task.assignment_id}</Text>
            <Text style={styles.taskSubtitle} numberOfLines={1} ellipsizeMode="middle">Order: {task.order_id}</Text>
          </View>
        </View>
        <StatusBadge status={task.order_status || task.status} />
      </View>

      <View style={styles.taskCardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color={LaundryColors.textSecondary} />
          <Text style={styles.infoValue}>{task.customer_name || "Customer"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={LaundryColors.textSecondary} />
          <Text style={styles.infoValue} numberOfLines={2}>
            {isPickup ? (task.pickup_address || "Alamat tidak tersedia") : (task.delivery_address || task.pickup_address || "Alamat tidak tersedia")}
          </Text>
        </View>
      </View>

      <View style={styles.taskCardFooter}>
        <Text style={styles.taskDateText}>
          Tugas Dibuat: {formatDate(task.created_at)}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={LaundryColors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function TaskDetailModal({
  task,
  submitting,
  onClose,
  onUpdateStatus,
  onUpdateLocation,
  onStartAutoLocation,
  onStopAutoLocation,
  autoTaskId,
  currentLocation,
}: {
  task: CourierTask | null;
  submitting: boolean;
  onClose: () => void;
  onUpdateStatus: (task: CourierTask, status: string) => void;
  onUpdateLocation: (task: CourierTask) => void;
  onStartAutoLocation: (task: CourierTask) => void;
  onStopAutoLocation: () => void;
  autoTaskId: string | null;
  currentLocation: { lat: number; lng: number } | null;
}) {
  if (!task) return null;
  const actions = getTaskActions(task);
  const isPickup = task.type === "pickup" || task.current_phase === "pickup";

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Detail Tugas</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={LaundryColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            <View style={styles.detailCard}>
              <View style={styles.taskTitleRow}>
                <View style={[styles.typeIconBox, { backgroundColor: isPickup ? "#FEF3C7" : "#EBF5FF" }]}>
                  <Ionicons name={isPickup ? "arrow-up" : "arrow-down"} size={20} color={isPickup ? "#D97706" : "#2563EB"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitleBig}>{task.assignment_id}</Text>
                  <Text style={styles.taskTypeBig}>{isPickup ? "PICKUP" : "DELIVERY"}</Text>
                </View>
                <StatusBadge status={task.order_status || task.status} />
              </View>
            </View>

            <View style={styles.detailBox}>
              <DetailRow label="Order ID" value={task.order_id} />
              <DetailRow label="Customer" value={task.customer_name || "-"} />
              <DetailRow label="Layanan" value={task.service_name || "-"} />
              <DetailRow label="Alamat Pickup" value={task.pickup_address || "-"} />
              <DetailRow label="Alamat Delivery" value={task.delivery_address || "-"} />
            </View>

            <View style={styles.locationControlsBox}>
              <Text style={styles.locationControlsTitle}>Kontrol Lokasi</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity 
                  style={[styles.locationBtn, { flex: 1, backgroundColor: LaundryColors.roleKurirBg }]} 
                  onPress={() => onUpdateLocation(task)}
                  disabled={submitting}
                >
                  <Ionicons name="locate" size={18} color={LaundryColors.roleKurirIcon} />
                  <Text style={styles.locationBtnText}>Update Sekali</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.locationBtn, { flex: 1, backgroundColor: autoTaskId === task.assignment_id ? "#FEE2E2" : "#ECFDF5" }]} 
                  onPress={() => autoTaskId === task.assignment_id ? onStopAutoLocation() : onStartAutoLocation(task)}
                  disabled={submitting}
                >
                  <Ionicons name={autoTaskId === task.assignment_id ? "stop-circle" : "radio"} size={18} color={autoTaskId === task.assignment_id ? "#EF4444" : "#10B981"} />
                  <Text style={[styles.locationBtnText, { color: autoTaskId === task.assignment_id ? "#EF4444" : "#10B981" }]}>
                    {autoTaskId === task.assignment_id ? "Stop Auto" : "Auto Update"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.mapContainer}>
              <Text style={styles.mapTitle}>Live Location</Text>
              <View style={styles.mapWrapper}>
                <TrackingMap
                  courierLat={currentLocation?.lat}
                  courierLng={currentLocation?.lng}
                  pickupLat={task.pickup_lat}
                  pickupLng={task.pickup_lng}
                  ownerLat={task.owner_lat}
                  ownerLng={task.owner_lng}
                  height={200}
                  showRouteLine
                />
              </View>
            </View>

            <View style={styles.actionSection}>
              {actions.length === 0 ? (
                <View style={styles.noActionBox}>
                  <Ionicons name="checkmark-done-circle-outline" size={24} color={LaundryColors.textSecondary} />
                  <Text style={styles.noActionText}>Tidak ada aksi tambahan untuk status ini</Text>
                </View>
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
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function getTaskActions(task: CourierTask) {
  const phase = task.current_phase || task.type;
  const pickup = task.pickup_status ?? (phase === "pickup" ? task.status : undefined);
  const delivery = task.delivery_status ?? (phase === "delivery" ? task.status : undefined);

  if (phase === "pickup") {
    if (!pickup) return [{ label: "Mulai Pickup", status: "PICKUP_ON_THE_WAY" }];
    if (pickup === "PICKUP_ON_THE_WAY") return [{ label: "Laundry Sudah Diambil", status: "LAUNDRY_PICKED" }];
    return [];
  }

  if (phase === "delivery") {
    if (!delivery) return [{ label: "Mulai Delivery", status: "DELIVERY_ON_THE_WAY" }];
    if (delivery === "DELIVERY_ON_THE_WAY") return [{ label: "Laundry Sudah Diterima Customer", status: "DELIVERED" }];
    if (delivery === "DELIVERED") return [{ label: "Selesaikan Tugas", status: "DONE" }];
    return [];
  }

  return [];
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  return (
    <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(status) }]}>
      <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
        {getStatusLabel(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: LaundryColors.textSecondary,
  },
  tabButtonTextActive: {
    color: LaundryColors.roleKurirIcon,
    fontWeight: "700",
  },

  taskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    overflow: "hidden",
  },
  taskCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: LaundryColors.inputBorder,
  },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  typeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
  taskSubtitle: {
    fontSize: 11,
    color: LaundryColors.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  
  taskCardBody: {
    padding: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: LaundryColors.textPrimary,
    fontWeight: "500",
    lineHeight: 18,
  },

  taskCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: LaundryColors.inputBorder,
  },
  taskDateText: {
    fontSize: 11,
    color: LaundryColors.textMuted,
    fontWeight: "500",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: LaundryColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "92%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  detailCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  taskTitleBig: {
    fontSize: 18,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
  taskTypeBig: {
    fontSize: 12,
    fontWeight: "700",
    color: LaundryColors.textSecondary,
    marginTop: 2,
  },

  detailBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: LaundryColors.textSecondary,
    fontWeight: "600",
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    color: LaundryColors.textPrimary,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },

  locationControlsBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    marginBottom: 16,
  },
  locationControlsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
    marginBottom: 12,
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  locationBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: LaundryColors.roleKurirIcon,
  },

  mapContainer: {
    marginBottom: 24,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
    marginBottom: 12,
  },
  mapWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },

  actionSection: {
    marginTop: 8,
  },
  noActionBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  noActionText: {
    fontSize: 13,
    color: LaundryColors.textSecondary,
    fontWeight: "600",
  },
});
