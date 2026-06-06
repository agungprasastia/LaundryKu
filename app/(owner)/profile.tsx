import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { crossAlert } from "@/utils/crossAlert";
import { useRouter } from "expo-router";
import { LaundryColors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import * as notificationService from "@/services/notificationService";
import { Notification } from "@/types/notification";
const date = (v?: string) => (v ? new Date(v).toLocaleString("id-ID") : "-");
const verified = (v: any) => v === true || v === 1;
const em = (e: any) =>
  e?.response?.data?.message || e?.message || "Gagal memuat notifikasi";
export default function OwnerProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [items, setItems] = useState<Notification[]>([]),
    [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setError("");
      const r = await notificationService.getNotifications();
      setItems(r.success && Array.isArray(r.data) ? r.data : []);
    } catch (e: any) {
      setError(em(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const out = () =>
    crossAlert("Logout", "Yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  const read = async (n: Notification) => {
    try {
      await notificationService.markAsRead(n.notification_id);
      load();
    } catch (e: any) {
      crossAlert("Error", em(e));
    }
  };
  const latLng =
    user?.lat != null && user?.lng != null
      ? String(user.lat) + ", " + String(user.lng)
      : "-";
  return (
    <View style={s.c}>
      <View style={s.h}>
        <Text style={s.ht}>Profil</Text>
        <Text style={s.hs}>Owner account</Text>
      </View>
      <ScrollView
        contentContainerStyle={s.body}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        <View style={s.card}>
          <View style={s.avatar}>
            <Ionicons name="person" size={34} color="#FFF" />
          </View>
          <Text style={s.name}>{user?.full_name || "Mitra"}</Text>
          <Text style={s.muted}>{user?.email || "-"}</Text>
          <Badge
            text={
              verified(user?.is_verified) ? "Verified" : "Menunggu verifikasi"
            }
            ok={verified(user?.is_verified)}
          />
          <Info k="Role" v={user?.role} />
          <Info k="Address" v={user?.address || "-"} />
          <Info k="Lat/Lng" v={latLng} />
          <TouchableOpacity style={s.logout} onPress={out}>
            <Ionicons
              name="log-out-outline"
              size={18}
              color={LaundryColors.error}
            />
            <Text style={s.logoutT}>Keluar</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.sec}>Notifications</Text>
        {loading ? (
          <ActivityIndicator color={LaundryColors.roleMitraIcon} />
        ) : error ? (
          <View style={s.err}>
            <Text style={s.errT}>{error}</Text>
            <TouchableOpacity onPress={load}>
              <Text style={s.link}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : items.length === 0 ? (
          <View style={s.card}>
            <Text style={s.muted}>Belum ada notifikasi.</Text>
          </View>
        ) : (
          items.map((n) => (
            <TouchableOpacity
              key={n.notification_id}
              style={[s.card, !n.is_read && s.unread]}
              onPress={() => read(n)}
            >
              <View style={s.row}>
                <Text style={s.title}>{n.title || n.type || "Notifikasi"}</Text>
                <Text style={s.small}>{n.is_read ? "Read" : "Unread"}</Text>
              </View>
              <Text style={s.muted}>{n.body || n.message || "-"}</Text>
              <Text style={s.small}>{date(n.created_at)}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
function Badge({ text, ok }: any) {
  return (
    <View
      style={[
        s.badge,
        { backgroundColor: ok ? LaundryColors.roleMitraBg : "#FFF7ED" },
      ]}
    >
      <Text
        style={{
          color: ok ? LaundryColors.roleMitraIcon : LaundryColors.roleKurirIcon,
          fontWeight: "800",
          fontSize: 11,
        }}
      >
        {text}
      </Text>
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
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: LaundryColors.roleMitraIcon,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "900",
    color: LaundryColors.textPrimary,
    textAlign: "center",
    marginTop: 10,
  },
  muted: { fontSize: 12, color: LaundryColors.textSecondary, marginTop: 4 },
  badge: {
    alignSelf: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    marginTop: 10,
  },
  info: { marginTop: 10 },
  k: { fontSize: 11, fontWeight: "800", color: LaundryColors.textMuted },
  v: { fontSize: 14, fontWeight: "700", color: LaundryColors.textPrimary },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 14,
    padding: 13,
    marginTop: 16,
  },
  logoutT: { color: LaundryColors.error, fontWeight: "800" },
  sec: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
    color: LaundryColors.textPrimary,
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  title: { fontSize: 15, fontWeight: "800", color: LaundryColors.textPrimary },
  small: { fontSize: 11, color: LaundryColors.textMuted, marginTop: 4 },
  unread: {
    borderColor: LaundryColors.roleMitraIcon,
    backgroundColor: "#F0FDF4",
  },
  err: {
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  errT: { color: LaundryColors.error, fontWeight: "800" },
  link: { color: LaundryColors.primary, fontWeight: "800", paddingTop: 6 },
});
