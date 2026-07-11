import React, { useEffect, useState, useRef } from "react";
import {
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  ScrollView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { crossAlert } from "@/utils/crossAlert";
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStyles } from '@/hooks/useAppStyles';
import { useAuth } from "@/contexts/AuthContext";
import * as courierService from "@/services/courierService";
import * as walletService from "@/services/walletService";
import { CourierTask } from "@/types/order";
import { ThemeColors } from "@/constants/colors";
import {
  ErrorState,
  formatMoney,
  getErrorMessage,
  isVerified,
  VerificationGate,
} from "@/components/courier/roleComponents";
import { getStatusBgColor, getStatusColor, getStatusLabel } from "@/constants/orderStatus";
import { useQuery } from '@tanstack/react-query';

export default function CourierBerandaScreen() {
  const { isDarkMode, colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  const router = useRouter();
  const { user } = useAuth();
  const verified = isVerified(user?.is_verified);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [refreshing, setRefreshing] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);

  const {
    data: tasks = [],
    isLoading: isLoadingTasks,
    error: tasksError,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ['courier', 'tasks'],
    queryFn: async () => {
      const response = await courierService.getMyTasks();
      if (!response.success) throw new Error(response.message || 'Gagal memuat tugas');
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: verified,
  });

  const {
    data: earnings = null,
    isLoading: isLoadingEarnings,
    error: earningsError,
    refetch: refetchEarnings,
  } = useQuery({
    queryKey: ['courier', 'earnings'],
    queryFn: async () => {
      const response = await courierService.getMyEarnings();
      if (!response.success) throw new Error(response.message || 'Gagal memuat pendapatan');
      return response.data;
    },
    enabled: verified,
  });

  const {
    data: wallet = null,
    isLoading: isLoadingWallet,
    error: walletError,
    refetch: refetchWallet,
  } = useQuery({
    queryKey: ['courier', 'wallet'],
    queryFn: async () => {
      const response = await walletService.getMyWallet();
      if (!response.success) throw new Error(response.message || 'Gagal memuat dompet');
      return response.data;
    },
    enabled: verified,
  });

  const loading = verified && (isLoadingTasks || isLoadingEarnings || isLoadingWallet);
  const error = (tasksError || earningsError || walletError) ? "Gagal memuat beranda kurir" : "";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const activeTask = tasks[0];
  const availableBalance = wallet?.available_balance ?? wallet?.balance ?? 0;
  const pendingBalance = wallet?.pending_balance ?? 0;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchTasks(), refetchEarnings(), refetchWallet()]);
    setRefreshing(false);
  };

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[LaundryColors.roleKurirIcon]}
    />
  );

  const updateLocation = async () => {
    if (tasks.length === 0) {
      crossAlert("Info", "Tidak ada tugas aktif untuk update lokasi.");
      return;
    }

    if (tasks.length > 1) {
      crossAlert("Pilih Tugas", "Ada lebih dari satu tugas aktif. Buka halaman Tugas lalu pilih tugas yang ingin diupdate.");
      router.push("/(courier)/tasks");
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

  const quickActions = [
    {
      icon: "bicycle" as const,
      label: "Tugas",
      color: LaundryColors.amber,
      bg: "#FEF3C7",
      onPress: () => router.push("/(courier)/tasks"),
    },
    {
      icon: "location" as const,
      label: "Lokasi",
      color: LaundryColors.error,
      bg: "#FEE2E2",
      onPress: updateLocation,
    },
    {
      icon: "stats-chart" as const,
      label: "Pendapatan",
      color: LaundryColors.success,
      bg: LaundryColors.roleMitraBg,
      onPress: () => router.push("/(courier)/earnings"),
    },
    {
      icon: "wallet" as const,
      label: "Wallet",
      color: LaundryColors.purple,
      bg: LaundryColors.surfacePurple,
      onPress: () => router.push("/(courier)/wallet"),
    },
  ];

  if (!verified) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Halo, {user?.full_name || "Kurir"} 👋</Text>
          <Text style={styles.headerSub}>LaundryKu Kurir</Text>
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
        <ActivityIndicator size="large" color={LaundryColors.roleKurirIcon} />
        <Text style={styles.loadingText}>Memuat beranda kurir...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={LaundryColors.backgroundWhite} />
      
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Ionicons name="bicycle" size={24} color={LaundryColors.textWhite} />
              </View>
              <View>
                <Text style={styles.greeting}>Halo, {user?.full_name || "Kurir"} 👋</Text>
                <Text style={styles.subtitle}>Selamat datang di LaundryKu Kurir</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.notifButton}
              onPress={() => router.push("/(courier)/profile")}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications-outline" size={24} color={LaundryColors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], paddingHorizontal: 20, paddingTop: 20 }}>
          {error ? <ErrorState message={error} onRetry={onRefresh} /> : null}

          {/* METRICS */}
          <View style={styles.metricsWrapper}>
            <View style={styles.metricCardBig}>
              <View style={[styles.metricIconBg, { backgroundColor: LaundryColors.roleKurirBg }]}>
                <Ionicons name="cash" size={24} color={LaundryColors.warning} />
              </View>
              <Text style={styles.metricLabelBig}>Total Pendapatan</Text>
              <Text style={styles.metricValueBig}>{formatMoney(earnings?.total_earnings ?? 0)}</Text>
            </View>
            <View style={styles.metricsGridRow}>
              <MetricBox title="Tugas Aktif" value={String(tasks.length)} icon="bicycle" color={LaundryColors.primary} bg={LaundryColors.rolePelangganBg} />
              <MetricBox title="Tugas Selesai" value={String(earnings?.completed_tasks ?? 0)} icon="checkmark-circle" color={LaundryColors.success} bg={LaundryColors.roleMitraBg} />
            </View>
            <View style={styles.metricsGridRow}>
              <MetricBox title="Available" value={formatMoney(availableBalance)} icon="wallet" color={LaundryColors.purple} bg={LaundryColors.surfacePurple} />
              <MetricBox title="Pending" value={formatMoney(pendingBalance)} icon="time" color="#F43F5E" bg="#FFE4E6" />
            </View>
          </View>

          {/* QUICK ACTIONS */}
          <Text style={styles.sectionTitle}>Aksi Cepat</Text>
          <View style={styles.quickActionsContainer}>
            {quickActions.map((action, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.actionItem, (action.label === "Lokasi" && updatingLocation) && { opacity: 0.5 }]} 
                onPress={action.onPress}
                disabled={action.label === "Lokasi" && updatingLocation}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: action.bg }]}>
                  {action.label === "Lokasi" && updatingLocation ? (
                     <ActivityIndicator size="small" color={action.color} />
                  ) : (
                     <Ionicons name={action.icon} size={28} color={action.color} />
                  )}
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ACTIVE TASK */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Tugas Aktif</Text>
            {tasks.length > 0 && (
              <TouchableOpacity onPress={() => router.push("/(courier)/tasks")}>
                <Text style={styles.seeAllText}>Lihat Semua</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {activeTask ? (
              <TaskPreview task={activeTask} onPress={() => router.push("/(courier)/tasks")} />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="bicycle-outline" size={48} color={LaundryColors.textMuted} />
              <Text style={styles.emptyTitle}>Belum ada tugas aktif</Text>
              <Text style={styles.emptyText}>Tugas pickup atau delivery akan muncul di sini.</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function MetricBox({ title, value, icon, color, bg }: { title: string; value: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }) {
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
}

function TaskPreview({ task, onPress }: { task: CourierTask; onPress: () => void }) {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  return (
    <TouchableOpacity style={styles.taskCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleContainer}>
          <Ionicons name={task.type === "pickup" ? "arrow-up-circle" : "arrow-down-circle"} size={22} color={LaundryColors.roleKurirIcon} />
          <Text style={styles.taskIdText} numberOfLines={1} ellipsizeMode="middle">{task.assignment_id}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: getStatusBgColor(task.status) }]}>
          <Text style={[styles.badgeText, { color: getStatusColor(task.status) }]}>{getStatusLabel(task.status)}</Text>
        </View>
      </View>
      
      <View style={styles.taskDivider} />
      
      <View style={styles.taskContent}>
        <Text style={styles.taskCustomer}>{task.customer_name || "Customer"}</Text>
        <Text style={styles.taskService}>{task.service_name || "Layanan Reguler"}</Text>
        <View style={styles.taskMeta}>
          <Ionicons name="location-outline" size={16} color={LaundryColors.textSecondary} />
          <Text style={styles.taskAddress} numberOfLines={2}>
            {task.type === "pickup" ? (task.pickup_address || "Alamat tidak tersedia") : (task.delivery_address || task.pickup_address || "Alamat tidak tersedia")}
          </Text>
        </View>
      </View>
      
      <View style={styles.taskFooter}>
        <Text style={styles.taskOrderId}>Order: {task.order_id}</Text>
        <View style={[styles.typeBadge, { backgroundColor: task.type === "pickup" ? "#FEF3C7" : LaundryColors.rolePelangganBg }]}>
          <Text style={[styles.typeBadgeText, { color: task.type === "pickup" ? "#D97706" : LaundryColors.primary }]}>{task.type === "pickup" ? "PICKUP" : "DELIVERY"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (LaundryColors: ThemeColors) => StyleSheet.create({
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
    backgroundColor: LaundryColors.roleKurirIcon,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: {
    fontSize: 18,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
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
    fontSize: 24,
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

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "700",
    color: LaundryColors.roleKurirIcon,
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
    textAlign: "center",
    paddingHorizontal: 20,
  },

  taskCard: {
    backgroundColor: LaundryColors.backgroundWhite,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  taskIdText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  taskDivider: {
    height: 1,
    backgroundColor: LaundryColors.inputBorder,
    marginVertical: 12,
  },
  taskContent: {
    marginBottom: 4,
  },
  taskCustomer: {
    fontSize: 16,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
  taskService: {
    fontSize: 14,
    color: LaundryColors.textSecondary,
    marginTop: 2,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 8,
  },
  taskAddress: {
    flex: 1,
    fontSize: 14,
    color: LaundryColors.textSecondary,
    lineHeight: 18,
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: LaundryColors.inputBorder,
  },
  taskOrderId: {
    fontSize: 12,
    color: LaundryColors.textMuted,
    fontWeight: "600",
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
