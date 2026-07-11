import React from "react";
import { ThemeColors } from '@/constants/colors';
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
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStyles } from '@/hooks/useAppStyles';
import { getErrorMessage } from '@/utils/helpers';
import { formatMoney as baseFormatMoney, formatDate as baseFormatDate } from '@/utils/formatters';

export const isVerified = (value: unknown) => value === true || value === 1;
export { getErrorMessage };

export const formatMoney = (value?: number | null) =>
  value == null ? "-" : baseFormatMoney(value);

export const formatDate = (value?: string | null) =>
  value ? baseFormatDate(value) : "-";

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
  const styles = useAppStyles(createStyles);
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
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={LaundryColors.roleKurirIcon} />
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
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
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
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  return (
    <View style={styles.emptyCard}>
      <Ionicons name={icon} size={40} color={LaundryColors.textMuted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
    </View>
  );
}

export function VerificationGate() {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  return (
    <View style={styles.emptyCard}>
      <Ionicons
        name="time-outline"
        size={48}
        color={LaundryColors.roleKurirIcon}
      />
      <Text style={styles.emptyTitle}>
        Akun kurir Anda menunggu verifikasi admin
      </Text>
      <Text style={styles.emptyMessage}>
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
  const styles = useAppStyles(createStyles);
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
  const styles = useAppStyles(createStyles);
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
  const styles = useAppStyles(createStyles);
  return (
    <View style={[styles.badge, accent && styles.badgeAccent]}>
      <Text style={[styles.badgeText, accent && styles.badgeTextAccent]}>
        {text}
      </Text>
    </View>
  );
}

const createStyles = (LaundryColors: ThemeColors) => StyleSheet.create({
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
    backgroundColor: LaundryColors.errorBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LaundryColors.errorBorder,
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
    backgroundColor: LaundryColors.backgroundWhite,
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
    backgroundColor: LaundryColors.backgroundWhite,
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
    backgroundColor: LaundryColors.roleKurirIcon,
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
  link: { color: LaundryColors.primary, fontWeight: "700", marginTop: 6 },
  badge: {
    backgroundColor: LaundryColors.surfaceGray,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  badgeAccent: { backgroundColor: LaundryColors.roleKurirBg },
  badgeText: {
    color: LaundryColors.textSecondary,
    fontWeight: "700",
    fontSize: 11,
  },
  badgeTextAccent: { color: LaundryColors.roleKurirIcon },
  disabled: { opacity: 0.6 },
});

export const courierStyles = createStyles;
