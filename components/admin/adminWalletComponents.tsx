import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatMoney, formatDate } from '@/utils/formatters';
import { statusLabel, statusColor } from '@/utils/helpers';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStyles } from '@/hooks/useAppStyles';
import InteractiveButton from '@/components/ui/InteractiveButton';
import { WalletTransaction, Withdrawal } from "@/types/wallet";
import { LaundrySpacing } from '@/constants/spacing';
import { LaundryTypography } from '@/constants/typography';
import { ThemeColors } from '@/constants/colors';

// ─── Tab Button ─────────────────────────────────────
export const TabButton = React.memo(function TabButton({
  label,
  active,
  count,
  onPress,
}: {
  label: string;
  active: boolean;
  count?: number;
  onPress: () => void;
}) {
  const styles = useAppStyles(createStyles);
  return (
    <InteractiveButton
      style={[styles.tabBtn, active && styles.tabBtnActive]}
      onPress={onPress}
      scaleTo={0.92}
      hapticFeedback={true}
    >
      <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
        {label}
      </Text>
      {count != null && count > 0 ? (
        <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
          <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>
            {count}
          </Text>
        </View>
      ) : null}
    </InteractiveButton>
  );
});

// ─── Sub-components ─────────────────────────────────

export const DetailRow = React.memo(function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  const styles = useAppStyles(createStyles);
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[styles.detailValue, highlight && styles.detailValueHighlight]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
});

export const PendingWithdrawalCard = React.memo(function PendingWithdrawalCard({
  item,
  onApprove,
  onReject,
}: {
  item: Withdrawal;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  const dest = item.bank_name
    ? `${item.bank_name} • ${item.bank_account_number || item.account_number || ""}`
    : item.e_wallet_provider
      ? `${item.e_wallet_provider} • ${item.e_wallet_number || ""}`
      : "-";

  return (
    <View style={styles.pendingCard}>
      <View style={styles.pendingCardHeader}>
        <View style={styles.pendingAvatarBox}>
          <Ionicons name="person" size={18} color={LaundryColors.primary} />
        </View>
        <View style={styles.pendingInfoBox}>
          <Text style={styles.pendingName} numberOfLines={1}>
            {item.full_name || item.email || "User"}
          </Text>
          <Text style={styles.pendingDest} numberOfLines={1}>
            {dest}
          </Text>
          <Text style={styles.pendingDate}>{formatDate(item.created_at)}</Text>
        </View>
        <Text style={styles.pendingAmount}>{formatMoney(item.amount)}</Text>
      </View>

      <View style={styles.pendingCardActions}>
        <InteractiveButton
          style={styles.rejectActionBtn}
          onPress={onReject}
        >
          <Ionicons name="close" size={16} color={LaundryColors.error} />
          <Text style={styles.rejectActionText}>Tolak</Text>
        </InteractiveButton>
        <InteractiveButton
          style={styles.approveActionBtn}
          onPress={onApprove}
        >
          <Ionicons name="checkmark" size={16} color={LaundryColors.textWhite} />
          <Text style={styles.approveActionText}>Setujui</Text>
        </InteractiveButton>
      </View>
    </View>
  );
});

export const TransactionCard = React.memo(function TransactionCard({ item }: { item: WalletTransaction }) {
  const { isDarkMode, colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  const isCredit = item.type === "credit" || item.amount > 0;
  return (
    <View style={styles.listItemCard}>
      <View
        style={[
          styles.listIconBox,
          { backgroundColor: isCredit ? (isDarkMode ? '#064E3B' : '#ECFDF5') : LaundryColors.errorBg },
        ]}
      >
        <Ionicons
          name={isCredit ? "arrow-down" : "arrow-up"}
          size={18}
          color={isCredit ? "#10B981" : LaundryColors.error}
        />
      </View>
      <View style={styles.listContentBox}>
        <Text style={styles.listTitle} numberOfLines={1}>
          {item.description || (isCredit ? "Pemasukan" : "Pengeluaran")}
        </Text>
        <Text style={styles.listMeta}>{formatDate(item.created_at)}</Text>
      </View>
      <Text
        style={[
          styles.listAmount,
          { color: isCredit ? "#10B981" : LaundryColors.error },
        ]}
      >
        {isCredit ? "+" : ""}
        {formatMoney(item.amount)}
      </Text>
    </View>
  );
});

export const WithdrawalHistoryCard = React.memo(function WithdrawalHistoryCard({ item }: { item: Withdrawal }) {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  const sc = statusColor(item.status);
  const dest = item.bank_name
    ? `${item.bank_name} • ${item.bank_account_number || item.account_number || ""}`
    : item.e_wallet_provider
      ? `${item.e_wallet_provider} • ${item.e_wallet_number || ""}`
      : "-";

  return (
    <View style={styles.listItemCard}>
      <View style={[styles.listIconBox, { backgroundColor: "#EBF5FF" }]}>
        <Ionicons name="card" size={18} color={LaundryColors.primary} />
      </View>
      <View style={styles.listContentBox}>
        <Text style={styles.listTitle} numberOfLines={1}>
          {item.full_name || "User"}
        </Text>
        <Text style={styles.listMeta} numberOfLines={1}>{dest}</Text>
        <Text style={styles.listMeta}>{formatDate(item.created_at)}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.listAmount}>{formatMoney(item.amount)}</Text>
        <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusPillText, { color: sc.text }]}>
            {statusLabel(item.status)}
          </Text>
        </View>
      </View>
    </View>
  );
});

// ─── Styles ─────────────────────────────────────────

const createStyles = (LaundryColors: ThemeColors) => StyleSheet.create({
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: LaundrySpacing.radius.lg,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: LaundryColors.primary,
  },
  tabBtnText: {
    fontSize: LaundryTypography.size.sm,
    fontWeight: LaundryTypography.weight.bold,
    color: LaundryColors.textSecondary,
  },
  tabBtnTextActive: {
    color: LaundryColors.textWhite,
  },
  tabBadge: {
    backgroundColor: LaundryColors.errorBg,
    borderRadius: LaundrySpacing.radius.lg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  tabBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: LaundryTypography.weight.bold,
    color: LaundryColors.error,
  },
  tabBadgeTextActive: {
    color: LaundryColors.textWhite,
  },
  pendingCard: {
    backgroundColor: LaundryColors.cardBg,
    borderRadius: LaundrySpacing.radius.xl,
    padding: LaundrySpacing.spacing.base,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  pendingCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  pendingAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: LaundrySpacing.radius.xl,
    backgroundColor: LaundryColors.cardSelected,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  pendingInfoBox: {
    flex: 1,
    paddingRight: 8,
  },
  pendingName: {
    fontSize: LaundryTypography.size.md,
    fontWeight: LaundryTypography.weight.bold,
    color: LaundryColors.textPrimary,
  },
  pendingDest: {
    fontSize: LaundryTypography.size.sm,
    color: LaundryColors.textSecondary,
    marginTop: 2,
  },
  pendingDate: {
    fontSize: LaundryTypography.size.sm,
    color: LaundryColors.textMuted,
    marginTop: 2,
  },
  pendingAmount: {
    fontSize: LaundryTypography.size.md,
    fontWeight: LaundryTypography.weight.bold,
    color: LaundryColors.textPrimary,
  },
  pendingCardActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: LaundryColors.inputBorder,
  },
  rejectActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: LaundrySpacing.radius.lg,
    borderWidth: 1.5,
    borderColor: LaundryColors.errorBorder,
    backgroundColor: LaundryColors.errorBg,
  },
  rejectActionText: {
    fontSize: LaundryTypography.size.base,
    fontWeight: LaundryTypography.weight.bold,
    color: LaundryColors.error,
  },
  approveActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: LaundrySpacing.radius.lg,
    backgroundColor: LaundryColors.success,
  },
  approveActionText: {
    fontSize: LaundryTypography.size.base,
    fontWeight: LaundryTypography.weight.bold,
    color: LaundryColors.textWhite,
  },
  listItemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LaundryColors.cardBg,
    borderRadius: LaundrySpacing.radius.xl,
    padding: LaundrySpacing.spacing.base,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  listIconBox: {
    width: 44,
    height: 44,
    borderRadius: LaundrySpacing.radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  listContentBox: {
    flex: 1,
    paddingRight: 8,
  },
  listTitle: {
    fontSize: LaundryTypography.size.md,
    fontWeight: LaundryTypography.weight.bold,
    color: LaundryColors.textPrimary,
  },
  listMeta: {
    fontSize: LaundryTypography.size.sm,
    color: LaundryColors.textSecondary,
    marginTop: 4,
  },
  listAmount: {
    fontSize: LaundryTypography.size.md,
    fontWeight: LaundryTypography.weight.bold,
    color: LaundryColors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: LaundryTypography.weight.bold,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: LaundryColors.inputBorder,
  },
  detailLabel: {
    fontSize: LaundryTypography.size.base,
    color: LaundryColors.textSecondary,
    fontWeight: LaundryTypography.weight.medium,
  },
  detailValue: {
    fontSize: LaundryTypography.size.base,
    color: LaundryColors.textPrimary,
    fontWeight: LaundryTypography.weight.semibold,
    maxWidth: "60%",
    textAlign: "right",
  },
  detailValueHighlight: {
    fontSize: LaundryTypography.size.md,
    fontWeight: LaundryTypography.weight.bold,
    color: LaundryColors.primary,
  },
});
