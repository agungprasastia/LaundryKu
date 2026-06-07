import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { crossAlert } from "@/utils/crossAlert";
import * as walletService from "@/services/walletService";
import { useAuth } from "@/contexts/AuthContext";
import { Wallet, WalletTransaction, Withdrawal, WithdrawPayload } from "@/types/wallet";
import { LaundryColors } from "@/constants/colors";
import {
  EmptyState,
  ErrorState,
  formatDate,
  formatMoney,
  getErrorMessage,
  isVerified,
  LoadingState,
  OwnerScreen,
  VerificationGate,
  PrimaryButton,
} from "@/components/owner/roleComponents";

type WithdrawForm = {
  amount: string;
  bank_account_number: string;
  bank_name: string;
  e_wallet_number: string;
  e_wallet_provider: string;
};

const emptyForm: WithdrawForm = {
  amount: "",
  bank_account_number: "",
  bank_name: "",
  e_wallet_number: "",
  e_wallet_provider: "",
};

export default function OwnerWalletScreen() {
  const { user } = useAuth();
  const verified = isVerified(user?.is_verified);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<WithdrawForm>(emptyForm);
  const [withdrawMethod, setWithdrawMethod] = useState<"bank" | "ewallet">("bank");

  const loadWallet = useCallback(async () => {
    if (!verified) {
      setLoading(false);
      return;
    }

    try {
      setError("");
      const [walletResult, transactionResult, withdrawalResult] =
        await Promise.allSettled([
          walletService.getMyWallet(),
          walletService.getMyTransactions(),
          walletService.getMyWithdrawals(),
        ]);

      if (walletResult.status === "fulfilled" && walletResult.value.success) {
        setWallet(walletResult.value.data || null);
      }
      if (
        transactionResult.status === "fulfilled" &&
        transactionResult.value.success
      ) {
        setTransactions(
          Array.isArray(transactionResult.value.data)
            ? transactionResult.value.data
            : [],
        );
      }
      if (
        withdrawalResult.status === "fulfilled" &&
        withdrawalResult.value.success
      ) {
        setWithdrawals(
          Array.isArray(withdrawalResult.value.data)
            ? withdrawalResult.value.data
            : [],
        );
      }
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat wallet"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [verified]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const availableBalance = Number(
    wallet?.available_balance ?? wallet?.balance ?? 0,
  );
  const pendingBalance = Number(wallet?.pending_balance ?? 0);

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        loadWallet();
      }}
      colors={[LaundryColors.roleMitraIcon]}
    />
  );

  const closeWithdrawModal = () => {
    setWithdrawModalOpen(false);
    setSubmitting(false);
    setForm(emptyForm);
    setWithdrawMethod("bank");
  };

  const submitWithdraw = async () => {
    const amount = Number(form.amount);
    const bankName = form.bank_name.trim();
    const bankAccountNumber = form.bank_account_number.trim();
    const eWalletProvider = form.e_wallet_provider.trim();
    const eWalletNumber = form.e_wallet_number.trim();
    const hasBankInfo = !!bankAccountNumber && !!bankName;
    const hasEWalletInfo = !!eWalletNumber && !!eWalletProvider;

    if (!amount || amount <= 0)
      return crossAlert("Validasi", "Nominal withdraw wajib angka lebih dari 0");
    if (amount > availableBalance)
      return crossAlert(
        "Validasi",
        "Nominal tidak boleh melebihi saldo yang tersedia",
      );
    
    if (withdrawMethod === "bank" && !hasBankInfo) {
      return crossAlert("Validasi", "Harap isi nama bank dan nomor rekening");
    }
    if (withdrawMethod === "ewallet" && !hasEWalletInfo) {
      return crossAlert("Validasi", "Harap isi provider e-wallet dan nomornya");
    }

    const payload: WithdrawPayload = withdrawMethod === "bank"
      ? {
          amount,
          bank_account_number: bankAccountNumber,
          bank_name: bankName,
        }
      : {
          amount,
          e_wallet_number: eWalletNumber,
          e_wallet_provider: eWalletProvider,
        };

    setSubmitting(true);
    try {
      await walletService.requestWithdraw(payload);
      crossAlert("Berhasil", "Withdraw diajukan");
      closeWithdrawModal();
      loadWallet();
    } catch (err) {
      crossAlert("Error", getErrorMessage(err, "Gagal memproses penarikan"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!verified) {
    return (
      <OwnerScreen title="Wallet Mitra" subtitle="Kelola penghasilan Anda">
        <VerificationGate />
      </OwnerScreen>
    );
  }

  if (loading) {
    return (
      <OwnerScreen title="Wallet Mitra" subtitle="Kelola penghasilan Anda">
        <LoadingState text="Memuat informasi wallet..." />
      </OwnerScreen>
    );
  }

  return (
    <OwnerScreen
      title="Wallet Mitra"
      subtitle="Kelola penghasilan Anda"
      refreshControl={refreshControl}
    >
      {error ? <ErrorState message={error} onRetry={loadWallet} /> : null}

      {/* WALLET CARD */}
      <View style={styles.walletCardWrapper}>
        <View style={styles.walletCard}>
          <View style={styles.walletHeaderRow}>
            <Text style={styles.walletLabel}>Saldo Tersedia</Text>
            <Ionicons name="wallet" size={24} color="#D1FAE5" />
          </View>
          <Text style={styles.walletValue}>{formatMoney(availableBalance)}</Text>
          
          <View style={styles.walletDivider} />
          
          <View style={styles.walletFooterRow}>
            <View>
              <Text style={styles.walletMetaLabel}>Pending</Text>
              <Text style={styles.walletMetaValue}>{formatMoney(pendingBalance)}</Text>
            </View>
            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={() => setWithdrawModalOpen(true)}
              activeOpacity={0.9}
            >
              <Ionicons name="cash-outline" size={18} color={LaundryColors.roleMitraIcon} />
              <Text style={styles.withdrawBtnText}>Tarik Saldo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Text style={styles.sectionHeading}>Riwayat Transaksi</Text>
      {transactions.length === 0 ? (
        <EmptyState title="Belum ada transaksi" icon="receipt-outline" />
      ) : (
        transactions.slice(0, 10).map((item) => (
          <TransactionCard key={item.transaction_id} item={item} />
        ))
      )}

      <Text style={styles.sectionHeading}>Riwayat Penarikan</Text>
      {withdrawals.length === 0 ? (
        <EmptyState title="Belum ada penarikan" icon="card-outline" />
      ) : (
        withdrawals.map((item) => (
          <WithdrawalCard key={item.withdraw_id} item={item} />
        ))
      )}

      {/* WITHDRAW MODAL */}
      <Modal visible={withdrawModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Tarik Saldo</Text>
              <TouchableOpacity onPress={closeWithdrawModal}>
                <Ionicons name="close-circle" size={28} color={LaundryColors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
              <View style={styles.withdrawAvailableBox}>
                <Text style={styles.withdrawAvailableLabel}>Saldo yang bisa ditarik</Text>
                <Text style={styles.withdrawAvailableValue}>{formatMoney(availableBalance)}</Text>
              </View>

              <FormInput
                label="Nominal Penarikan (Rp)"
                value={form.amount}
                keyboardType="numeric"
                onChangeText={(amount) => setForm({ ...form, amount })}
                placeholder="Minimal Rp 50.000"
              />

              <Text style={styles.inputLabel}>Pilih Metode Penarikan</Text>
              <View style={styles.methodTabsRow}>
                <TouchableOpacity 
                  style={[styles.methodTab, withdrawMethod === "bank" && styles.methodTabActive]} 
                  onPress={() => setWithdrawMethod("bank")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="business" size={18} color={withdrawMethod === "bank" ? LaundryColors.roleMitraIcon : LaundryColors.textSecondary} />
                  <Text style={[styles.methodTabText, withdrawMethod === "bank" && styles.methodTabTextActive]}>Transfer Bank</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.methodTab, withdrawMethod === "ewallet" && styles.methodTabActive]} 
                  onPress={() => setWithdrawMethod("ewallet")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="phone-portrait" size={18} color={withdrawMethod === "ewallet" ? LaundryColors.roleMitraIcon : LaundryColors.textSecondary} />
                  <Text style={[styles.methodTabText, withdrawMethod === "ewallet" && styles.methodTabTextActive]}>E-Wallet</Text>
                </TouchableOpacity>
              </View>

              {withdrawMethod === "bank" ? (
                <View style={styles.methodContentBox}>
                  <FormInput
                    label="Nama Bank"
                    value={form.bank_name}
                    onChangeText={(bank_name) => setForm({ ...form, bank_name })}
                    placeholder="Misal: BCA / Mandiri / BNI"
                  />
                  <FormInput
                    label="Nomor Rekening"
                    value={form.bank_account_number}
                    onChangeText={(bank_account_number) =>
                      setForm({ ...form, bank_account_number })
                    }
                    placeholder="Masukkan nomor rekening"
                    keyboardType="numeric"
                  />
                </View>
              ) : (
                <View style={styles.methodContentBox}>
                  <FormInput
                    label="Provider E-Wallet"
                    value={form.e_wallet_provider}
                    onChangeText={(e_wallet_provider) =>
                      setForm({ ...form, e_wallet_provider })
                    }
                    placeholder="Misal: GoPay / OVO / DANA"
                  />
                  <FormInput
                    label="Nomor HP / E-Wallet"
                    value={form.e_wallet_number}
                    onChangeText={(e_wallet_number) =>
                      setForm({ ...form, e_wallet_number })
                    }
                    placeholder="0812xxxxxx"
                    keyboardType="numeric"
                  />
                </View>
              )}

              <View style={{ marginTop: 16 }}>
                <PrimaryButton text={submitting ? "Memproses..." : "Ajukan Penarikan"} onPress={submitWithdraw} disabled={submitting} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </OwnerScreen>
  );
}

function TransactionCard({ item }: { item: WalletTransaction }) {
  const isIncome = item.type.toLowerCase() === "income" || item.amount > 0;
  return (
    <View style={styles.listItemCard}>
      <View style={[styles.listIconBox, { backgroundColor: isIncome ? "#ECFDF5" : "#FEF2F2" }]}>
        <Ionicons name={isIncome ? "arrow-down" : "arrow-up"} size={18} color={isIncome ? "#10B981" : LaundryColors.error} />
      </View>
      <View style={styles.listContentBox}>
        <Text style={styles.listTitle} numberOfLines={1}>
          {item.description || (isIncome ? "Pemasukan" : "Pengeluaran")}
        </Text>
        <Text style={styles.listMeta}>{formatDate(item.created_at)}</Text>
      </View>
      <Text style={[styles.listAmount, { color: isIncome ? "#10B981" : LaundryColors.error }]}>
        {isIncome ? "+" : ""}{formatMoney(item.amount)}
      </Text>
    </View>
  );
}

function WithdrawalCard({ item }: { item: Withdrawal }) {
  let statusColor = LaundryColors.textSecondary;
  let statusBg = "#F1F5F9";
  
  if (item.status === "success" || item.status === "approved") {
    statusColor = "#10B981";
    statusBg = "#ECFDF5";
  } else if (item.status === "pending") {
    statusColor = "#F59E0B";
    statusBg = "#FEF3C7";
  } else if (item.status === "failed" || item.status === "rejected") {
    statusColor = LaundryColors.error;
    statusBg = "#FEF2F2";
  }

  return (
    <View style={styles.listItemCard}>
      <View style={[styles.listIconBox, { backgroundColor: "#F5F3FF" }]}>
        <Ionicons name="card" size={18} color="#8B5CF6" />
      </View>
      <View style={styles.listContentBox}>
        <Text style={styles.listTitle} numberOfLines={1}>
          Penarikan Saldo
        </Text>
        <Text style={styles.listMeta}>
          {item.bank_name ? `${item.bank_name} - ${item.account_number}` : item.e_wallet_provider ? `${item.e_wallet_provider} - ${item.account_number}` : "-"}
        </Text>
        <Text style={styles.listMeta}>{formatDate(item.created_at)}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={[styles.listAmount, { color: LaundryColors.textPrimary }]}>
          {formatMoney(item.amount)}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusPillText, { color: statusColor }]}>{item.status}</Text>
        </View>
      </View>
    </View>
  );
}

function FormInput(props: {
  label: string;
  value: string;
  keyboardType?: "default" | "numeric";
  placeholder?: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{props.label}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        keyboardType={props.keyboardType || "default"}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={LaundryColors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeading: { fontSize: 16, fontWeight: "700", color: LaundryColors.textPrimary, marginTop: 24, marginBottom: 12 },
  
  walletCardWrapper: {
    shadowColor: LaundryColors.roleMitraIcon,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 8,
  },
  walletCard: {
    backgroundColor: LaundryColors.roleMitraIcon,
    borderRadius: 24,
    padding: 24,
    overflow: "hidden",
  },
  walletHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletLabel: { fontSize: 14, color: "#D1FAE5", fontWeight: "600" },
  walletValue: {
    fontSize: 34,
    fontWeight: "700",
    color: "#FFF",
    marginTop: 8,
    marginBottom: 20,
  },
  walletDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.2)", marginBottom: 16 },
  walletFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletMetaLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  walletMetaValue: { fontSize: 16, color: "#FFF", fontWeight: "700" },
  withdrawBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
    gap: 6,
  },
  withdrawBtnText: { color: LaundryColors.roleMitraIcon, fontWeight: "700", fontSize: 14 },
  
  listItemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  listIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  listContentBox: { flex: 1, paddingRight: 8 },
  listTitle: { fontSize: 15, fontWeight: "700", color: LaundryColors.textPrimary },
  listMeta: { fontSize: 12, color: LaundryColors.textSecondary, marginTop: 4 },
  listAmount: { fontSize: 16, fontWeight: "700" },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
  statusPillText: { fontSize: 10, fontWeight: "700" },

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
  
  withdrawAvailableBox: {
    backgroundColor: "#ECFDF5",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    marginBottom: 20,
    alignItems: "center",
  },
  withdrawAvailableLabel: { fontSize: 13, color: "#065F46", fontWeight: "600" },
  withdrawAvailableValue: { fontSize: 24, color: "#064E3B", fontWeight: "700", marginTop: 4 },

  methodTabsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
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
    backgroundColor: "#F8FAFC",
  },
  methodTabActive: {
    borderColor: LaundryColors.roleMitraIcon,
    backgroundColor: LaundryColors.roleMitraBg,
  },
  methodTabText: { fontSize: 13, fontWeight: "700", color: LaundryColors.textSecondary },
  methodTabTextActive: { color: LaundryColors.roleMitraIcon },
  
  methodContentBox: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    marginBottom: 16,
  },

  inputGroup: { marginBottom: 16 },
  inputLabel: {
    fontSize: 13,
    color: LaundryColors.textPrimary,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "600",
    color: LaundryColors.textPrimary,
  },
});
