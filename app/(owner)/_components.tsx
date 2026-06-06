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

export const formatMoney = (value?: number | null) => {
  if (value == null) return "-";
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
};

export const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID");
};

export const isVerified = (value: unknown) => value === true || value === 1;

export const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

type ScreenProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
};

export function OwnerScreen({
  title,
  subtitle,
  children,
  refreshControl,
}: ScreenProps) {
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
      <ActivityIndicator size="large" color={LaundryColors.roleMitraIcon} />
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
      <TouchableOpacity onPress={onRetry} activeOpacity={0.8}>
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
        color={LaundryColors.roleMitraIcon}
      />
      <Text style={styles.cardTitle}>Menunggu verifikasi admin</Text>
      <Text style={styles.mutedCenter}>
        Akun owner Anda belum diverifikasi admin. Fitur ini akan aktif setelah
        verifikasi.
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

export function SecondaryButton({
  text,
  onPress,
}: {
  text: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.secondaryButton}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={styles.secondaryButtonText}>{text}</Text>
    </TouchableOpacity>
  );
}

export function DangerButton({
  text,
  onPress,
}: {
  text: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.dangerButton}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={styles.dangerButtonText}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LaundryColors.background },
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
    backgroundColor: LaundryColors.cardBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LaundryColors.cardBorder,
  },
  cardCenter: {
    backgroundColor: LaundryColors.cardBg,
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
    backgroundColor: LaundryColors.roleMitraIcon,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    marginTop: 12,
  },
  primaryButtonText: { color: LaundryColors.textWhite, fontWeight: "800" },
  secondaryButton: {
    backgroundColor: LaundryColors.roleMitraBg,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: LaundryColors.roleMitraIcon,
    fontWeight: "800",
  },
  dangerButton: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  dangerButtonText: { color: LaundryColors.error, fontWeight: "800" },
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
  disabled: { opacity: 0.6 },
});

export const ownerStyles = styles;
