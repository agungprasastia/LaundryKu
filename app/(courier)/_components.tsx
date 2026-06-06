import React from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControlProps,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LaundryColors } from "@/constants/colors";

export const isVerified = (value: unknown) => value === true || value === 1;
export const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;
export const formatMoney = (value?: number | null) =>
  value == null ? "-" : `Rp ${Number(value).toLocaleString("id-ID")}`;
export const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString("id-ID") : "-";

export function CourierScreen({
  title,
  subtitle,
  children,
  refreshControl,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function LoadingState({ text }: { text: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={LaundryColors.roleKurirIcon} />
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.errorCard}>
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity onPress={onRetry}>
        <Text style={styles.link}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

export function EmptyState({
  title,
  message,
  icon = "file-tray-outline",
}: {
  title: string;
  message?: string;
  icon?: any;
}) {
  return (
    <View style={styles.cardCenter}>
      <Ionicons name={icon} size={36} color={LaundryColors.textMuted} />
      <Text style={styles.cardTitle}>{title}</Text>
      {message ? <Text style={styles.mutedCenter}>{message}</Text> : null}
    </View>
  );
}

export function VerificationGate() {
  return (
    <View style={styles.cardCenter}>
      <Ionicons
        name="time-outline"
        size={36}
        color={LaundryColors.roleKurirIcon}
      />
      <Text style={styles.cardTitle}>
        Akun kurir Anda menunggu verifikasi admin
      </Text>
      <Text style={styles.mutedCenter}>
        Fitur ini akan aktif setelah verifikasi.
      </Text>
    </View>
  );
}

export function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value ?? "-"}</Text>
    </View>
  );
}

export function PrimaryButton({
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
      style={[styles.primaryButton, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Text style={styles.primaryButtonText}>{text}</Text>
    </TouchableOpacity>
  );
}

export function StatusPill({
  text,
  accent,
}: {
  text: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.badge, accent && styles.badgeAccent]}>
      <Text style={[styles.badgeText, accent && styles.badgeTextAccent]}>
        {text}
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
    fontWeight: "800",
    color: LaundryColors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: LaundryColors.textSecondary,
    marginTop: 2,
  },
  body: { padding: 16, paddingBottom: 32 },
  center: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 10,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LaundryColors.cardBorder,
  },
  cardCenter: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: LaundryColors.cardBorder,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: LaundryColors.textPrimary,
    textAlign: "center",
  },
  muted: { fontSize: 12, color: LaundryColors.textSecondary, marginTop: 4 },
  mutedCenter: {
    fontSize: 13,
    color: LaundryColors.textSecondary,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: LaundryColors.textPrimary,
    marginTop: 16,
    marginBottom: 10,
  },
  infoRow: { marginTop: 8 },
  infoLabel: {
    fontSize: 11,
    color: LaundryColors.textMuted,
    fontWeight: "800",
  },
  infoValue: {
    fontSize: 14,
    color: LaundryColors.textPrimary,
    fontWeight: "700",
    marginTop: 2,
  },
  primaryButton: {
    backgroundColor: LaundryColors.roleKurirIcon,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    marginTop: 12,
  },
  primaryButtonText: { color: "#FFF", fontWeight: "800" },
  errorCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: { color: LaundryColors.error, fontWeight: "800" },
  link: { color: LaundryColors.primary, fontWeight: "800", marginTop: 6 },
  badge: {
    backgroundColor: "#F1F5F9",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  badgeAccent: { backgroundColor: LaundryColors.roleKurirBg },
  badgeText: {
    color: LaundryColors.textSecondary,
    fontWeight: "900",
    fontSize: 11,
  },
  badgeTextAccent: { color: LaundryColors.roleKurirIcon },
  disabled: { opacity: 0.6 },
});

export const courierStyles = styles;
