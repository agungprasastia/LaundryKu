import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import * as walletService from "@/services/walletService";
import { LaundryColors } from "@/constants/colors";
import { Wallet, WalletTransaction, Withdrawal, WithdrawPayload } from "@/types/wallet";
import {
  CourierScreen,
  EmptyState,
  ErrorState,
  formatDate,
  formatMoney,
  getErrorMessage,
  isVerified,
  LoadingState,
  PrimaryButton,
  VerificationGate,
} from "@/components/courier/roleComponents";

type Method = "bank" | "ewallet";
const emptyForm = {
  amount: "",
  bank_name: "",
  bank_account_number: "",
  e_wallet_provider: "",
  e_wallet_number: "",
};

export default function CourierWalletScreen() {
  const { user } = useAuth();
  const verified = isVerified(user?.is_verified);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState<Method>("bank");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const loadWallet = useCallback(async () => {
    if (!verified) {
      setLoading(false);
      return;
    }
    try {
      setError("");
      const [walletRes, txRes, wdRes] = await Promise.allSettled([
        walletService.getMyWallet(),
        walletService.getMyTransactions(),
        walletService.getMyWithdrawals(),
      ]);
      if (walletRes.status === "fulfilled" && walletRes.value.success)
        setWallet(walletRes.value.data || null);
      if (txRes.status === "fulfilled" && txRes.value.success)
        setTransactions(
          Array.isArray(txRes.value.data) ? txRes.value.data : [],
        );
      if (wdRes.status === "fulfilled" && wdRes.value.success)
        setWithdrawals(Array.isArray(wdRes.value.data) ? wdRes.value.data : []);
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

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          loadWallet();
        }}
        colors={[LaundryColors.roleKurirIcon]}
      />
    ),
    [loadWallet, refreshing],
  );

  const available = wallet?.available_balance ?? wallet?.balance ?? 0;
  const pending = wallet?.pending_balance ?? 0;

  const closeWithdrawModal = () => {
    setModalOpen(false);
    setSubmitting(false);
    setMethod("bank");
    setForm(emptyForm);
  };

  const submitWithdraw = async () => {
    const amount = Number(form.amount.replace(/\./g, ""));
    
    if (!amount || amount <= 0)
      return crossAlert("Validasi", "Nominal penarikan wajib lebih dari 0");
    if (amount > available)
      return crossAlert("Validasi", "Nominal tidak boleh melebihi saldo tersedia");

    const hasBankInfo = !!form.bank_name.trim() && !!form.bank_account_number.trim();
    const hasEWalletInfo = !!form.e_wallet_provider.trim() && !!form.e_wallet_number.trim();

    if (method === "bank" && !hasBankInfo) {
      return crossAlert("Validasi", "Harap isi nama bank dan nomor rekening");
    }
    if (method === "ewallet" && !hasEWalletInfo) {
      return crossAlert("Validasi", "Harap isi provider e-wallet dan nomornya");
    }

    const payload: WithdrawPayload = method === "bank"
      ? {
          amount,
          bank_name: form.bank_name.trim(),
          bank_account_number: form.bank_account_number.trim(),
        }
      : {
          amount,
          e_wallet_provider: form.e_wallet_provider.trim(),
          e_wallet_number: form.e_wallet_number.trim(),
        };

    setSubmitting(true);
    try {
      await walletService.requestWithdraw(payload);
      crossAlert("Berhasil", "Penarikan saldo berhasil diajukan");
      closeWithdrawModal();
      await loadWallet();
    } catch (err) {
      crossAlert("Error", getErrorMessage(err, "Gagal mengajukan penarikan"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!verified)
    return (
      <CourierScreen title="Wallet Kurir" subtitle="Kelola komisi pengiriman Anda">
        <VerificationGate />
      </CourierScreen>
    );

  if (loading)
    return (
      <CourierScreen title="Wallet Kurir" subtitle="Kelola komisi pengiriman Anda">
        <LoadingState text="Memuat informasi wallet..." />
      </CourierScreen>
    );

  return (
    <CourierScreen
      title="Wallet Kurir"
      subtitle="Kelola komisi pengiriman Anda"
      refreshControl={refreshControl}
    >
      {error ? <ErrorState message={error} onRetry={loadWallet} /> : null}

      {/* WALLET CARD */}
      <View style={styles.walletCardWrapper}>
        <View style={styles.walletCard}>
          <View style={styles.walletHeaderRow}>
            <Text style={styles.walletLabel}>Saldo Tersedia</Text>
            <Ionicons name="wallet" size={24} color="#FFEDD5" />
          </View>
          <Text style={styles.walletValue}>{formatMoney(available)}</Text>
          
          <View style={styles.walletDivider} />
          
          <View style={styles.walletFooterRow}>
            <View>
              <Text style={styles.walletMetaLabel}>Pending</Text>
              <Text style={styles.walletMetaValue}>{formatMoney(pending)}</Text>
            </View>
            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={() => setModalOpen(true)}
              activeOpacity={0.9}
            >
              <Ionicons name="cash-outline" size={18} color={LaundryColors.roleKurirIcon} />
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

      <WithdrawModal
        visible={modalOpen}
        method={method}
        form={form}
        submitting={submitting}
        onMethodChange={setMethod}
        onFormChange={setForm}
        onClose={closeWithdrawModal}
        onSubmit={submitWithdraw}
        availableBalance={available}
      />
    </CourierScreen>
  );
}

function TransactionCard({ item }: { item: WalletTransaction }) {
  const isIncome = item.type === "credit" || item.amount > 0;
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
      <View style={[styles.listIconBox, { backgroundColor: LaundryColors.roleKurirBg }]}>
        <Ionicons name="card" size={18} color={LaundryColors.warning} />
      </View>
      <View style={styles.listContentBox}>
        <Text style={styles.listTitle} numberOfLines={1}>
          Penarikan Saldo
        </Text>
        <Text style={styles.listMeta}>
          {item.bank_name ? `${item.bank_name} - ${item.bank_account_number || ""}` : item.e_wallet_provider ? `${item.e_wallet_provider} - ${item.e_wallet_number || ""}` : "-"}
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

function WithdrawModal({
  visible,
  method,
  form,
  submitting,
  onMethodChange,
  onFormChange,
  onClose,
  onSubmit,
  availableBalance,
}: any) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeaderRow}>
            <Text style={styles.sheetTitle}>Tarik Saldo</Text>
            <TouchableOpacity onPress={onClose}>
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
              onChangeText={(amount) => onFormChange({ ...form, amount })}
              placeholder="Minimal Rp 50.000"
            />

            <Text style={styles.inputLabel}>Pilih Metode Penarikan</Text>
            <View style={styles.methodTabsRow}>
              <TouchableOpacity 
                style={[styles.methodTab, method === "bank" && styles.methodTabActive]} 
                onPress={() => onMethodChange("bank")}
                activeOpacity={0.8}
              >
                <Ionicons name="business" size={18} color={method === "bank" ? LaundryColors.roleKurirIcon : LaundryColors.textSecondary} />
                <Text style={[styles.methodTabText, method === "bank" && styles.methodTabTextActive]}>Transfer Bank</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.methodTab, method === "ewallet" && styles.methodTabActive]} 
                onPress={() => onMethodChange("ewallet")}
                activeOpacity={0.8}
              >
                <Ionicons name="phone-portrait" size={18} color={method === "ewallet" ? LaundryColors.roleKurirIcon : LaundryColors.textSecondary} />
                <Text style={[styles.methodTabText, method === "ewallet" && styles.methodTabTextActive]}>E-Wallet</Text>
              </TouchableOpacity>
            </View>

            {method === "bank" ? (
              <View style={styles.methodContentBox}>
                <FormInput
                  label="Nama Bank"
                  value={form.bank_name}
                  onChangeText={(bank_name) => onFormChange({ ...form, bank_name })}
                  placeholder="Misal: BCA / Mandiri / BNI"
                />
                <FormInput
                  label="Nomor Rekening"
                  value={form.bank_account_number}
                  onChangeText={(bank_account_number) =>
                    onFormChange({ ...form, bank_account_number })
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
                    onFormChange({ ...form, e_wallet_provider })
                  }
                  placeholder="Misal: GoPay / OVO / DANA"
                />
                <FormInput
                  label="Nomor HP / E-Wallet"
                  value={form.e_wallet_number}
                  onChangeText={(e_wallet_number) =>
                    onFormChange({ ...form, e_wallet_number })
                  }
                  placeholder="0812xxxxxx"
                  keyboardType="numeric"
                />
              </View>
            )}

            <View style={{ marginTop: 16 }}>
              <PrimaryButton text={submitting ? "Memproses..." : "Ajukan Penarikan"} onPress={onSubmit} disabled={submitting} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
    shadowColor: LaundryColors.roleKurirIcon,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 8,
  },
  walletCard: {
    backgroundColor: LaundryColors.roleKurirIcon,
    borderRadius: 24,
    padding: 24,
    overflow: "hidden",
  },
  walletHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletLabel: { fontSize: 14, color: LaundryColors.walletCourierLightText, fontWeight: "600" },
  walletValue: {
    fontSize: 34,
    fontWeight: "700",
    color: LaundryColors.textWhite,
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
  walletMetaValue: { fontSize: 16, color: LaundryColors.textWhite, fontWeight: "700" },
  withdrawBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LaundryColors.backgroundWhite,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
    gap: 6,
  },
  withdrawBtnText: { color: LaundryColors.roleKurirIcon, fontWeight: "700", fontSize: 14 },
  
  listItemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LaundryColors.backgroundWhite,
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
    backgroundColor: LaundryColors.roleKurirBg,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FFEDD5",
    marginBottom: 20,
    alignItems: "center",
  },
  withdrawAvailableLabel: { fontSize: 13, color: LaundryColors.walletCourierDarkLabel, fontWeight: "600" },
  withdrawAvailableValue: { fontSize: 24, color: LaundryColors.walletCourierDarkValue, fontWeight: "700", marginTop: 4 },

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
    backgroundColor: LaundryColors.surfaceSlate,
  },
  methodTabActive: {
    borderColor: LaundryColors.roleKurirIcon,
    backgroundColor: LaundryColors.roleKurirBg,
  },
  methodTabText: { fontSize: 13, fontWeight: "700", color: LaundryColors.textSecondary },
  methodTabTextActive: { color: LaundryColors.roleKurirIcon },
  
  methodContentBox: {
    backgroundColor: LaundryColors.surfaceSlate,
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
    backgroundColor: LaundryColors.backgroundWhite,
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
