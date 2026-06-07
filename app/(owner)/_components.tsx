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
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={refreshControl}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? (
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
        {children}
      </ScrollView>
    </View>
  );
}

export function LoadingState({ text }: { text: string }) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={LaundryColors.roleMitraIcon} />
      <Text style={styles.loadingText}>{text}</Text>
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
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle" size={20} color={LaundryColors.error} />
      <View style={{ flex: 1 }}>
        <Text style={styles.errorBannerText}>{message}</Text>
        <TouchableOpacity onPress={onRetry} activeOpacity={0.8} style={{ marginTop: 4 }}>
          <Text style={styles.retryText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
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
    <View style={styles.emptyCard}>
      <Ionicons name={icon} size={40} color={LaundryColors.textMuted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
    </View>
  );
}

export function VerificationGate() {
  return (
    <View style={styles.emptyCard}>
      <Ionicons
        name="time-outline"
        size={48}
        color={LaundryColors.roleMitraIcon}
      />
      <Text style={styles.emptyTitle}>Menunggu verifikasi admin</Text>
      <Text style={styles.emptyMessage}>
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
    paddingTop: Platform.OS === "ios" ? 20 : 10,
    paddingBottom: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: LaundryColors.textSecondary,
    marginTop: 2,
  },
  body: { padding: 20, paddingBottom: 40, paddingTop: Platform.OS === "ios" ? 40 : 20 },
  
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LaundryColors.background,
    gap: 12,
    padding: 32,
  },
  loadingText: {
    fontSize: 14,
    color: LaundryColors.textSecondary,
    fontWeight: "500",
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorBannerText: {
    fontSize: 13,
    color: LaundryColors.error,
    fontWeight: "600",
    lineHeight: 18,
  },
  retryText: {
    fontSize: 13,
    color: LaundryColors.primary,
    fontWeight: "700",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    marginVertical: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 13,
    color: LaundryColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  card: {
    backgroundColor: LaundryColors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LaundryColors.cardBorder,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
    marginTop: 16,
    marginBottom: 10,
  },
  infoRow: { marginTop: 8 },
  infoLabel: {
    fontSize: 11,
    color: LaundryColors.textMuted,
    fontWeight: "700",
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 12,
  },
  primaryButtonText: {
    color: LaundryColors.textWhite,
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: LaundryColors.roleMitraBg,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: LaundryColors.roleMitraIcon,
    fontSize: 13,
    fontWeight: "700",
  },
  dangerButton: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  dangerButtonText: {
    color: LaundryColors.error,
    fontSize: 13,
    fontWeight: "700",
  },
  link: { color: LaundryColors.primary, fontWeight: "700", marginTop: 6 },
  disabled: { opacity: 0.6 },
});

export const ownerStyles = styles;
