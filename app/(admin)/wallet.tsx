import React, { useState, useCallback } from "react";
import { Withdrawal } from '@/types/wallet';
import { TextStyle } from 'react-native';
import { formatMoney } from '@/utils/formatters';
import { useAdminWallet } from '@/hooks/useAdminWallet';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStyles } from '@/hooks/useAppStyles';
import { LaundrySpacing } from '@/constants/spacing';
import { LaundryTypography } from '@/constants/typography';
import { ThemeColors } from '@/constants/colors';
import Skeleton from '@/components/ui/Skeleton';
import InteractiveButton from '@/components/ui/InteractiveButton';
import {
  TabButton,
  PendingWithdrawalCard,
  TransactionCard,
  WithdrawalHistoryCard,
} from '@/components/admin/adminWalletComponents';
import {
  ProcessWithdrawalModal,
  AdminWithdrawModal,
} from '@/components/admin/AdminWalletModals';

// ─── Main Screen ────────────────────────────────────
export default function AdminWalletScreen() {
  const { isDarkMode, colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  type TabKey = "pending" | "transactions" | "withdrawals";

  const [activeTab, setActiveTab] = useState<TabKey>("pending");

  const {
    wallet,
    transactions,
    pendingWithdrawals,
    allWithdrawals,
    loading,
    refreshing,
    error,
    onRefresh,
    selectedWithdrawal,
    processModalOpen,
    processAction,
    processNotes,
    processing,
    setProcessNotes,
    openProcessModal,
    closeProcessModal,
    submitProcess,
    withdrawModalOpen,
    setWithdrawModalOpen,
    submittingWithdraw,
    withdrawMethod,
    setWithdrawMethod,
    withdrawForm,
    setWithdrawForm,
    closeWithdrawModal,
    submitAdminWithdraw,
  } = useAdminWallet();

  const availableBalance = Number(wallet?.available_balance ?? 0);
  const pendingBalance = Number(wallet?.pending_balance ?? 0);
  const totalBalance = Number(wallet?.balance ?? (availableBalance + pendingBalance));

  const handleTabPending = useCallback(() => setActiveTab("pending"), []);
  const handleTabTransactions = useCallback(() => setActiveTab("transactions"), []);
  const handleTabWithdrawals = useCallback(() => setActiveTab("withdrawals"), []);

  const handleApproveWithdrawal = useCallback((item: Withdrawal) => openProcessModal(item, "success"), [openProcessModal]);
  const handleRejectWithdrawal = useCallback((item: Withdrawal) => openProcessModal(item, "failed"), [openProcessModal]);

  // ─── Render ──────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, { padding: 20, paddingTop: 60 }]}>
        <Skeleton height={24} width="40%" style={{ marginBottom: 4 }} delay={0} />
        <Skeleton height={14} width="60%" style={{ marginBottom: 24 }} delay={100} />
        
        <View style={{ marginBottom: 32 }}>
          <Skeleton height={180} borderRadius={24} delay={200} />
        </View>
        
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          <Skeleton height={40} width="30%" borderRadius={12} delay={300} />
          <Skeleton height={40} width="30%" borderRadius={12} delay={400} />
          <Skeleton height={40} width="30%" borderRadius={12} delay={500} />
        </View>

        <Skeleton height={80} borderRadius={16} style={{ marginBottom: 12 }} delay={600} />
        <Skeleton height={80} borderRadius={16} style={{ marginBottom: 12 }} delay={700} />
        <Skeleton height={80} borderRadius={16} delay={800} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={LaundryColors.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[LaundryColors.primary]}
          />
        }
      >
        {/* ─── HEADER ─── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wallet Admin</Text>
          <Text style={styles.headerSubtitle}>Kelola keuangan platform</Text>
        </View>

        {/* Error Banner */}
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={LaundryColors.error} />
            <Text style={styles.errorBannerText}>{error}</Text>
            <InteractiveButton onPress={onRefresh}>
              <Text style={styles.retryText}>Coba Lagi</Text>
            </InteractiveButton>
          </View>
        ) : null}

        {/* ─── WALLET CARD ─── */}
        <View style={styles.walletCardWrapper}>
          <View style={styles.walletCard}>
            {/* Decorative circles */}
            <View style={styles.decoCircle1} />
            <View style={styles.decoCircle2} />

            <View style={styles.walletHeaderRow}>
              <Text style={styles.walletLabel}>Saldo Platform</Text>
              <View style={styles.walletIconBox}>
                <Ionicons name="wallet" size={22} color={LaundryColors.textWhite} />
              </View>
            </View>
            <Text style={styles.walletValue}>{formatMoney(totalBalance)}</Text>

            <View style={styles.walletDivider} />

            <View style={styles.walletFooterRow}>
              <View>
                <Text style={styles.walletMetaLabel}>Tersedia</Text>
                <Text style={styles.walletMetaValue}>{formatMoney(availableBalance)}</Text>
              </View>
              <InteractiveButton
                style={styles.withdrawBtn}
                onPress={() => setWithdrawModalOpen(true)}
              >
                <Ionicons name="cash-outline" size={18} color={LaundryColors.primary} />
                <Text style={styles.withdrawBtnText}>Tarik Saldo</Text>
              </InteractiveButton>
            </View>
          </View>
        </View>

        {/* ─── TABS ─── */}
        <View style={styles.tabsContainer}>
          <TabButton
            label="Pending"
            active={activeTab === "pending"}
            count={pendingWithdrawals.length}
            onPress={handleTabPending}
          />
          <TabButton
            label="Transaksi"
            active={activeTab === "transactions"}
            onPress={handleTabTransactions}
          />
          <TabButton
            label="Semua Penarikan"
            active={activeTab === "withdrawals"}
            onPress={handleTabWithdrawals}
          />
        </View>

        {/* ─── TAB CONTENT ─── */}
        <View style={styles.tabContent}>
          {activeTab === "pending" && (
            <>
              {pendingWithdrawals.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-circle-outline" size={48} color={LaundryColors.success} />
                  <Text style={styles.emptyTitle}>Tidak Ada Pending</Text>
                  <Text style={styles.emptySubtitle}>
                    Semua permintaan penarikan sudah diproses
                  </Text>
                </View>
              ) : (
                pendingWithdrawals.map((item) => (
                  <PendingWithdrawalCard
                    key={item.withdraw_id}
                    item={item}
                    onApprove={() => handleApproveWithdrawal(item)}
                    onReject={() => handleRejectWithdrawal(item)}
                  />
                ))
              )}
            </>
          )}

          {activeTab === "transactions" && (
            <>
              {transactions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="receipt-outline" size={48} color={LaundryColors.textMuted} />
                  <Text style={styles.emptyTitle}>Belum Ada Transaksi</Text>
                  <Text style={styles.emptySubtitle}>
                    Transaksi platform akan muncul di sini
                  </Text>
                </View>
              ) : (
                transactions.slice(0, 20).map((item) => (
                  <TransactionCard key={item.transaction_id} item={item} />
                ))
              )}
            </>
          )}

          {activeTab === "withdrawals" && (
            <>
              {allWithdrawals.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="card-outline" size={48} color={LaundryColors.textMuted} />
                  <Text style={styles.emptyTitle}>Belum Ada Penarikan</Text>
                  <Text style={styles.emptySubtitle}>
                    Riwayat penarikan akan muncul di sini
                  </Text>
                </View>
              ) : (
                allWithdrawals.map((item) => (
                  <WithdrawalHistoryCard key={item.withdraw_id} item={item} />
                ))
              )}
            </>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ─── MODALS ─── */}
      <ProcessWithdrawalModal
        visible={processModalOpen}
        action={processAction}
        withdrawal={selectedWithdrawal}
        notes={processNotes}
        setNotes={setProcessNotes}
        processing={processing}
        onClose={closeProcessModal}
        onSubmit={submitProcess}
      />

      <AdminWithdrawModal
        visible={withdrawModalOpen}
        availableBalance={availableBalance}
        withdrawForm={withdrawForm}
        setWithdrawForm={setWithdrawForm}
        withdrawMethod={withdrawMethod}
        setWithdrawMethod={setWithdrawMethod}
        submittingWithdraw={submittingWithdraw}
        onClose={closeWithdrawModal}
        onSubmit={submitAdminWithdraw}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────
const createStyles = (LaundryColors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LaundryColors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LaundryColors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: LaundryTypography.size.base,
    color: LaundryColors.textSecondary,
    fontWeight: LaundryTypography.weight.medium as TextStyle['fontWeight'],
  },
  header: {
    backgroundColor: LaundryColors.cardBg,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: LaundryColors.inputBorder,
  },
  headerTitle: {
    fontSize: LaundryTypography.size.lg,
    fontWeight: LaundryTypography.weight.bold as TextStyle['fontWeight'],
    color: LaundryColors.textPrimary,
  },
  headerSubtitle: {
    fontSize: LaundryTypography.size.sm,
    color: LaundryColors.textSecondary,
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: LaundryColors.errorBg,
    marginHorizontal: LaundrySpacing.spacing.lg,
    marginTop: 12,
    borderRadius: LaundrySpacing.radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: LaundryColors.errorBorder,
  },
  errorBannerText: {
    flex: 1,
    fontSize: LaundryTypography.size.sm,
    color: LaundryColors.error,
    fontWeight: LaundryTypography.weight.medium as TextStyle['fontWeight'],
  },
  retryText: {
    fontSize: LaundryTypography.size.sm,
    color: LaundryColors.primary,
    fontWeight: LaundryTypography.weight.bold as TextStyle['fontWeight'],
  },
  walletCardWrapper: {
    marginHorizontal: LaundrySpacing.spacing.lg,
    marginTop: 16,
    shadowColor: LaundryColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  walletCard: {
    borderRadius: LaundrySpacing.radius.xxl,
    padding: LaundrySpacing.spacing.xl,
    overflow: "hidden",
    backgroundColor: LaundryColors.primary,
  },
  decoCircle1: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 9999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  decoCircle2: {
    position: "absolute",
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 9999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  walletHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletLabel: {
    fontSize: LaundryTypography.size.base,
    color: "rgba(255,255,255,0.8)",
    fontWeight: LaundryTypography.weight.semibold as TextStyle['fontWeight'],
  },
  walletIconBox: {
    width: 40,
    height: 40,
    borderRadius: LaundrySpacing.radius.lg,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  walletValue: {
    fontSize: LaundryTypography.size.display,
    fontWeight: LaundryTypography.weight.bold as TextStyle['fontWeight'],
    color: LaundryColors.textWhite,
    marginTop: 8,
    marginBottom: 20,
  },
  walletDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 16,
  },
  walletFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletMetaLabel: {
    fontSize: LaundryTypography.size.sm,
    color: "rgba(255,255,255,0.6)",
    fontWeight: LaundryTypography.weight.medium as TextStyle['fontWeight'],
  },
  walletMetaValue: {
    fontSize: LaundryTypography.size.md,
    color: LaundryColors.textWhite,
    fontWeight: LaundryTypography.weight.bold as TextStyle['fontWeight'],
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: LaundrySpacing.spacing.lg,
    marginTop: 24,
    backgroundColor: LaundryColors.cardBg,
    borderRadius: LaundrySpacing.radius.xl,
    padding: 4,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  tabContent: {
    marginHorizontal: LaundrySpacing.spacing.lg,
    marginTop: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: LaundryTypography.size.md,
    fontWeight: LaundryTypography.weight.bold as TextStyle['fontWeight'],
    color: LaundryColors.textPrimary,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: LaundryTypography.size.base,
    color: LaundryColors.textSecondary,
    textAlign: "center",
  },
  withdrawBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LaundryColors.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
    gap: 6,
  },
  withdrawBtnText: {
    color: LaundryColors.primary,
    fontWeight: LaundryTypography.weight.bold as TextStyle['fontWeight'],
    fontSize: LaundryTypography.size.base,
  },
});
