import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { crossAlert } from "@/utils/crossAlert";
import * as adminService from "@/services/adminService";
import { Wallet, WalletTransaction, Withdrawal, WithdrawalStatus, WithdrawPayload } from "@/types/wallet";
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStyles } from '@/hooks/useAppStyles';



// ─── Helpers ────────────────────────────────────────
function formatMoney(amount: number | undefined | null): string {
  const n = Number(amount ?? 0);
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
  const { isDarkMode, colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
    const axiosErr = err as { response?: { data?: { message?: string } } };
    return axiosErr.response?.data?.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

function statusLabel(status: WithdrawalStatus): string {
  const map: Record<string, string> = {
    pending: "Menunggu",
    approved: "Disetujui",
    success: "Berhasil",
    rejected: "Ditolak",
    failed: "Gagal",
  };
  return map[status] || status;
}

function statusColor(status: WithdrawalStatus): { text: string; bg: string } {
  if (status === "success" || status === "approved")
    return { text: "#10B981", bg: "#ECFDF5" };
  if (status === "pending") return { text: "#F59E0B", bg: "#FEF3C7" };
  if (status === "failed" || status === "rejected")
    return { text: "#EF4444", bg: "#FEF2F2" };
  return { text: "#94A3B8", bg: "#F1F5F9" };
}

// ─── Tab Button ─────────────────────────────────────
type TabKey = "pending" | "transactions" | "withdrawals";

function TabButton({
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
  const { isDarkMode, colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  return (
    <TouchableOpacity
      style={[styles.tabBtn, active && styles.tabBtnActive]}
      onPress={onPress}
      activeOpacity={0.7}
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
    </TouchableOpacity>
  );
}

// ─── Main Screen ────────────────────────────────────
export default function AdminWalletScreen() {
  const { isDarkMode, colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Withdrawal[]>([]);
  const [allWithdrawals, setAllWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState<TabKey>("pending");

  // Process withdrawal modal
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [processAction, setProcessAction] = useState<"success" | "failed">("success");
  const [processNotes, setProcessNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  // Admin withdraw modal
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<"bank" | "ewallet">("bank");
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    bank_account_number: "",
    bank_name: "",
    e_wallet_number: "",
    e_wallet_provider: "",
  });

  const loadData = useCallback(async () => {
    try {
      setError("");
      const [walletRes, txRes, pendingRes, allRes] = await Promise.allSettled([
        adminService.getAdminWallet(),
        adminService.getAdminTransactions(),
        adminService.getPendingWithdrawals(),
        adminService.getAllWithdrawals(),
      ]);

      if (walletRes.status === "fulfilled" && walletRes.value.success) {
        setWallet(walletRes.value.data || null);
      }
      if (txRes.status === "fulfilled" && txRes.value.success) {
        setTransactions(
          Array.isArray(txRes.value.data) ? txRes.value.data : []
        );
      }
      if (pendingRes.status === "fulfilled" && pendingRes.value.success) {
        setPendingWithdrawals(
          Array.isArray(pendingRes.value.data) ? pendingRes.value.data : []
        );
      }
      if (allRes.status === "fulfilled" && allRes.value.success) {
        setAllWithdrawals(
          Array.isArray(allRes.value.data) ? allRes.value.data : []
        );
      }
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat data wallet"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const availableBalance = Number(wallet?.available_balance ?? 0);
  const pendingBalance = Number(wallet?.pending_balance ?? 0);
  const totalBalance = Number(wallet?.balance ?? (availableBalance + pendingBalance));

  // ─── Process Withdrawal ──────────────────────────
  const openProcessModal = (item: Withdrawal, action: "success" | "failed") => {
    setSelectedWithdrawal(item);
    setProcessAction(action);
    setProcessNotes("");
    setProcessModalOpen(true);
  };

  const closeProcessModal = () => {
    setProcessModalOpen(false);
    setSelectedWithdrawal(null);
    setProcessNotes("");
    setProcessing(false);
  };

  const submitProcess = async () => {
    if (!selectedWithdrawal) return;
    setProcessing(true);
    try {
      await adminService.processWithdrawal(selectedWithdrawal.withdraw_id, {
        status: processAction,
        note: processNotes.trim() || undefined,
      });
      crossAlert(
        "Berhasil",
        processAction === "success"
          ? "Penarikan telah disetujui"
          : "Penarikan telah ditolak"
      );
      closeProcessModal();
      loadData();
    } catch (err) {
      crossAlert("Error", getErrorMessage(err, "Gagal memproses penarikan"));
    } finally {
      setProcessing(false);
    }
  };

  // ─── Admin Withdraw ──────────────────────────────
  const closeWithdrawModal = () => {
    setWithdrawModalOpen(false);
    setSubmittingWithdraw(false);
    setWithdrawForm({
      amount: "",
      bank_account_number: "",
      bank_name: "",
      e_wallet_number: "",
      e_wallet_provider: "",
    });
    setWithdrawMethod("bank");
  };

  const submitAdminWithdraw = async () => {
    const amount = Number(withdrawForm.amount.replace(/\./g, ""));
    const bankName = withdrawForm.bank_name.trim();
    const bankAccountNumber = withdrawForm.bank_account_number.trim();
    const eWalletProvider = withdrawForm.e_wallet_provider.trim();
    const eWalletNumber = withdrawForm.e_wallet_number.trim();

    if (!amount || amount <= 0)
      return crossAlert("Validasi", "Nominal withdraw wajib angka lebih dari 0");
    if (amount > availableBalance)
      return crossAlert("Validasi", "Nominal tidak boleh melebihi saldo yang tersedia");

    if (withdrawMethod === "bank" && (!bankAccountNumber || !bankName)) {
      return crossAlert("Validasi", "Harap isi nama bank dan nomor rekening");
    }
    if (withdrawMethod === "ewallet" && (!eWalletNumber || !eWalletProvider)) {
      return crossAlert("Validasi", "Harap isi provider e-wallet dan nomornya");
    }

    const payload: WithdrawPayload =
      withdrawMethod === "bank"
        ? { amount, bank_account_number: bankAccountNumber, bank_name: bankName }
        : { amount, e_wallet_number: eWalletNumber, e_wallet_provider: eWalletProvider };

    setSubmittingWithdraw(true);
    try {
      await adminService.requestAdminWithdraw(payload);
      crossAlert("Berhasil", "Permintaan penarikan berhasil diajukan");
      closeWithdrawModal();
      loadData();
    } catch (err) {
      crossAlert("Error", getErrorMessage(err, "Gagal memproses penarikan"));
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  // ─── Render ──────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={LaundryColors.primary} />
        <Text style={styles.loadingText}>Memuat wallet admin...</Text>
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
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
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
            <TouchableOpacity onPress={() => { setRefreshing(true); loadData(); }}>
              <Text style={styles.retryText}>Coba Lagi</Text>
            </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.withdrawBtn}
                onPress={() => setWithdrawModalOpen(true)}
                activeOpacity={0.9}
              >
                <Ionicons name="cash-outline" size={18} color={LaundryColors.primary} />
                <Text style={styles.withdrawBtnText}>Tarik Saldo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.walletPendingRow}>
              <Text style={styles.walletMetaLabel}>Pending</Text>
              <Text style={styles.walletMetaValue}>{formatMoney(pendingBalance)}</Text>
            </View>
          </View>
        </View>

        {/* ─── TABS ─── */}
        <View style={styles.tabsContainer}>
          <TabButton
            label="Pending"
            active={activeTab === "pending"}
            count={pendingWithdrawals.length}
            onPress={() => setActiveTab("pending")}
          />
          <TabButton
            label="Transaksi"
            active={activeTab === "transactions"}
            onPress={() => setActiveTab("transactions")}
          />
          <TabButton
            label="Semua Penarikan"
            active={activeTab === "withdrawals"}
            onPress={() => setActiveTab("withdrawals")}
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
                    onApprove={() => openProcessModal(item, "success")}
                    onReject={() => openProcessModal(item, "failed")}
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

      {/* ─── PROCESS WITHDRAWAL MODAL ─── */}
      <Modal visible={processModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>
                {processAction === "success" ? "Setujui Penarikan" : "Tolak Penarikan"}
              </Text>
              <TouchableOpacity onPress={closeProcessModal}>
                <Ionicons name="close-circle" size={28} color={LaundryColors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
            >
              {selectedWithdrawal && (
                <>
                  {/* Detail Info */}
                  <View style={styles.detailBox}>
                    <DetailRow label="Nama" value={selectedWithdrawal.full_name || "-"} />
                    <DetailRow label="Email" value={selectedWithdrawal.email || "-"} />
                    <DetailRow label="Nominal" value={formatMoney(selectedWithdrawal.amount)} highlight />
                    {selectedWithdrawal.bank_name ? (
                      <>
                        <DetailRow label="Bank" value={selectedWithdrawal.bank_name} />
                        <DetailRow
                          label="No. Rekening"
                          value={selectedWithdrawal.bank_account_number || selectedWithdrawal.account_number || "-"}
                        />
                        {selectedWithdrawal.account_holder ? (
                          <DetailRow label="Atas Nama" value={selectedWithdrawal.account_holder} />
                        ) : null}
                      </>
                    ) : selectedWithdrawal.e_wallet_provider ? (
                      <>
                        <DetailRow label="E-Wallet" value={selectedWithdrawal.e_wallet_provider} />
                        <DetailRow
                          label="Nomor"
                          value={selectedWithdrawal.e_wallet_number || "-"}
                        />
                      </>
                    ) : null}
                    <DetailRow label="Tanggal" value={formatDate(selectedWithdrawal.created_at)} />
                  </View>

                  {/* Notes input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Catatan (opsional)</Text>
                    <TextInput
                      style={styles.notesInput}
                      value={processNotes}
                      onChangeText={setProcessNotes}
                      placeholder={
                        processAction === "success"
                          ? "Catatan persetujuan..."
                          : "Alasan penolakan..."
                      }
                      placeholderTextColor={LaundryColors.textMuted}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  {/* Action buttons */}
                  <View style={styles.actionBtnRow}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={closeProcessModal}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelBtnText}>Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.confirmBtn,
                        processAction === "failed" && styles.confirmBtnReject,
                      ]}
                      onPress={submitProcess}
                      disabled={processing}
                      activeOpacity={0.8}
                    >
                      {processing ? (
                        <ActivityIndicator size="small" color={LaundryColors.textWhite} />
                      ) : (
                        <>
                          <Ionicons
                            name={processAction === "success" ? "checkmark-circle" : "close-circle"}
                            size={18}
                            color={LaundryColors.textWhite}
                          />
                          <Text style={styles.confirmBtnText}>
                            {processAction === "success" ? "Setujui" : "Tolak"}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── ADMIN WITHDRAW MODAL ─── */}
      <Modal visible={withdrawModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Tarik Saldo</Text>
              <TouchableOpacity onPress={closeWithdrawModal}>
                <Ionicons name="close-circle" size={28} color={LaundryColors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Available balance info */}
              <View style={styles.withdrawAvailableBox}>
                <Text style={styles.withdrawAvailableLabel}>Saldo yang bisa ditarik</Text>
                <Text style={styles.withdrawAvailableValue}>{formatMoney(availableBalance)}</Text>
              </View>

              {/* Amount input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nominal Penarikan (Rp)</Text>
                <TextInput
                  style={styles.withdrawInput}
                  value={withdrawForm.amount}
                  keyboardType="numeric"
                  onChangeText={(amount) => setWithdrawForm({ ...withdrawForm, amount })}
                  placeholder="Minimal Rp 50.000"
                  placeholderTextColor={LaundryColors.textMuted}
                />
              </View>

              {/* Method toggle */}
              <Text style={styles.inputLabel}>Pilih Metode Penarikan</Text>
              <View style={styles.methodTabsRow}>
                <TouchableOpacity
                  style={[styles.methodTab, withdrawMethod === "bank" && styles.methodTabActive]}
                  onPress={() => setWithdrawMethod("bank")}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="business"
                    size={18}
                    color={withdrawMethod === "bank" ? LaundryColors.primary : LaundryColors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.methodTabText,
                      withdrawMethod === "bank" && styles.methodTabTextActive,
                    ]}
                  >
                    Transfer Bank
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodTab, withdrawMethod === "ewallet" && styles.methodTabActive]}
                  onPress={() => setWithdrawMethod("ewallet")}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="phone-portrait"
                    size={18}
                    color={withdrawMethod === "ewallet" ? LaundryColors.primary : LaundryColors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.methodTabText,
                      withdrawMethod === "ewallet" && styles.methodTabTextActive,
                    ]}
                  >
                    E-Wallet
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Method fields */}
              {withdrawMethod === "bank" ? (
                <View style={styles.methodContentBox}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nama Bank</Text>
                    <TextInput
                      style={styles.withdrawInput}
                      value={withdrawForm.bank_name}
                      onChangeText={(bank_name) => setWithdrawForm({ ...withdrawForm, bank_name })}
                      placeholder="Misal: BCA / Mandiri / BNI"
                      placeholderTextColor={LaundryColors.textMuted}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nomor Rekening</Text>
                    <TextInput
                      style={styles.withdrawInput}
                      value={withdrawForm.bank_account_number}
                      onChangeText={(bank_account_number) =>
                        setWithdrawForm({ ...withdrawForm, bank_account_number })
                      }
                      placeholder="Masukkan nomor rekening"
                      placeholderTextColor={LaundryColors.textMuted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.methodContentBox}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Provider E-Wallet</Text>
                    <TextInput
                      style={styles.withdrawInput}
                      value={withdrawForm.e_wallet_provider}
                      onChangeText={(e_wallet_provider) =>
                        setWithdrawForm({ ...withdrawForm, e_wallet_provider })
                      }
                      placeholder="Misal: GoPay / OVO / DANA"
                      placeholderTextColor={LaundryColors.textMuted}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nomor HP / E-Wallet</Text>
                    <TextInput
                      style={styles.withdrawInput}
                      value={withdrawForm.e_wallet_number}
                      onChangeText={(e_wallet_number) =>
                        setWithdrawForm({ ...withdrawForm, e_wallet_number })
                      }
                      placeholder="0812xxxxxx"
                      placeholderTextColor={LaundryColors.textMuted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              )}

              {/* Submit button */}
              <TouchableOpacity
                style={[styles.submitWithdrawBtn, submittingWithdraw && { opacity: 0.7 }]}
                onPress={submitAdminWithdraw}
                disabled={submittingWithdraw}
                activeOpacity={0.8}
              >
                {submittingWithdraw ? (
                  <ActivityIndicator size="small" color={LaundryColors.textWhite} />
                ) : (
                  <Text style={styles.submitWithdrawBtnText}>Ajukan Penarikan</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Sub-components ─────────────────────────────────

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  const { isDarkMode, colors: LaundryColors } = useTheme();
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
}

function PendingWithdrawalCard({
  item,
  onApprove,
  onReject,
}: {
  item: Withdrawal;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { isDarkMode, colors: LaundryColors } = useTheme();
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
        <TouchableOpacity
          style={styles.rejectActionBtn}
          onPress={onReject}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={16} color={LaundryColors.error} />
          <Text style={styles.rejectActionText}>Tolak</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.approveActionBtn}
          onPress={onApprove}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark" size={16} color={LaundryColors.textWhite} />
          <Text style={styles.approveActionText}>Setujui</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TransactionCard({ item }: { item: WalletTransaction }) {
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
}

function WithdrawalHistoryCard({ item }: { item: Withdrawal }) {
  const { isDarkMode, colors: LaundryColors } = useTheme();
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
}

// ─── Styles ─────────────────────────────────────────

const createStyles = (LaundryColors: any) => StyleSheet.create({
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
    fontSize: 14,
    color: LaundryColors.textSecondary,
    fontWeight: "500",
  },

  /* Header */
  header: {
    backgroundColor: LaundryColors.cardBg,
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
  headerSubtitle: {
    fontSize: 12,
    color: LaundryColors.textSecondary,
    marginTop: 2,
  },

  /* Error */
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: LaundryColors.errorBg,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: LaundryColors.errorBorder,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: LaundryColors.error,
    fontWeight: "500",
  },
  retryText: {
    fontSize: 12,
    color: LaundryColors.primary,
    fontWeight: "700",
  },

  /* Wallet Card */
  walletCardWrapper: {
    marginHorizontal: 20,
    marginTop: 16,
    shadowColor: LaundryColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  walletCard: {
    borderRadius: 24,
    padding: 24,
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
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },
  walletIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  walletValue: {
    fontSize: 32,
    fontWeight: "700",
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
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  walletMetaValue: {
    fontSize: 16,
    color: LaundryColors.textWhite,
    fontWeight: "700",
    marginTop: 2,
  },

  /* Tabs */
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: LaundryColors.cardBg,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: LaundryColors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: LaundryColors.textSecondary,
  },
  tabBtnTextActive: {
    color: LaundryColors.textWhite,
  },
  tabBadge: {
    backgroundColor: LaundryColors.errorBg,
    borderRadius: 12,
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
    fontWeight: "700",
    color: LaundryColors.error,
  },
  tabBadgeTextActive: {
    color: LaundryColors.textWhite,
  },

  /* Tab Content */
  tabContent: {
    marginHorizontal: 20,
    marginTop: 16,
  },

  /* Empty State */
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: LaundryColors.textSecondary,
    textAlign: "center",
  },

  /* Pending Withdrawal Card */
  pendingCard: {
    backgroundColor: LaundryColors.cardBg,
    borderRadius: 16,
    padding: 16,
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
    borderRadius: 16,
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
    fontSize: 16,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
  pendingDest: {
    fontSize: 12,
    color: LaundryColors.textSecondary,
    marginTop: 2,
  },
  pendingDate: {
    fontSize: 12,
    color: LaundryColors.textMuted,
    marginTop: 2,
  },
  pendingAmount: {
    fontSize: 16,
    fontWeight: "800",
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
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: LaundryColors.errorBorder,
    backgroundColor: LaundryColors.errorBg,
  },
  rejectActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: LaundryColors.error,
  },
  approveActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: LaundryColors.success,
  },
  approveActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: LaundryColors.textWhite,
  },

  /* List item (transactions & withdrawal history) */
  listItemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LaundryColors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  listIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  listContentBox: {
    flex: 1,
    paddingRight: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
  listMeta: {
    fontSize: 12,
    color: LaundryColors.textSecondary,
    marginTop: 4,
  },
  listAmount: {
    fontSize: 16,
    fontWeight: "700",
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
    fontWeight: "700",
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: LaundryColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "92%",
  },
  sheetHeaderRow: {
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

  /* Detail box in modal */
  detailBox: {
    backgroundColor: LaundryColors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
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
    fontSize: 14,
    color: LaundryColors.textSecondary,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: LaundryColors.textPrimary,
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },
  detailValueHighlight: {
    fontSize: 16,
    fontWeight: "800",
    color: LaundryColors.primary,
  },

  /* Form */
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: LaundryColors.textPrimary,
    fontWeight: "700",
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: LaundryColors.cardBg,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: LaundryColors.textPrimary,
    textAlignVertical: "top",
    minHeight: 80,
  },

  /* Action buttons in modal */
  actionBtnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: LaundryColors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: LaundryColors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: LaundryColors.success,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  confirmBtnReject: {
    backgroundColor: LaundryColors.error,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: LaundryColors.textWhite,
  },

  /* Wallet Card extras */
  walletPendingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
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
    fontWeight: "700",
    fontSize: 14,
  },

  /* Withdraw Modal */
  withdrawAvailableBox: {
    backgroundColor: LaundryColors.cardSelected,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 20,
    alignItems: "center",
  },
  withdrawAvailableLabel: {
    fontSize: 14,
    color: "#1E40AF",
    fontWeight: "600",
  },
  withdrawAvailableValue: {
    fontSize: 24,
    color: "#1E3A8A",
    fontWeight: "700",
    marginTop: 4,
  },
  withdrawInput: {
    backgroundColor: LaundryColors.cardBg,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: "600",
    color: LaundryColors.textPrimary,
  },
  methodTabsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  methodTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    backgroundColor: LaundryColors.surfaceSlate,
  },
  methodTabActive: {
    borderColor: LaundryColors.primary,
    backgroundColor: LaundryColors.cardSelected,
  },
  methodTabText: {
    fontSize: 14,
    fontWeight: "700",
    color: LaundryColors.textSecondary,
  },
  methodTabTextActive: {
    color: LaundryColors.primary,
  },
  methodContentBox: {
    backgroundColor: LaundryColors.surfaceSlate,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    marginBottom: 16,
  },
  submitWithdrawBtn: {
    backgroundColor: LaundryColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitWithdrawBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: LaundryColors.textWhite,
  },
});
