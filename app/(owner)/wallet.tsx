import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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
  ownerStyles,
} from "./_components";

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
    />
  );

  const submitWithdraw = async () => {
    const amount = Number(form.amount);
    const hasBankInfo = !!form.bank_account_number && !!form.bank_name;
    const hasEWalletInfo = !!form.e_wallet_number && !!form.e_wallet_provider;

    if (!amount || amount <= 0)
      return crossAlert("Validasi", "amount wajib angka > 0");
    if (amount > availableBalance)
      return crossAlert(
        "Validasi",
        "amount tidak boleh lebih dari available_balance",
      );
    if (!hasBankInfo && !hasEWalletInfo)
      return crossAlert("Validasi", "Isi info bank atau e-wallet");

    const payload: WithdrawPayload = hasBankInfo
      ? {
          amount,
          bank_account_number: form.bank_account_number,
          bank_name: form.bank_name,
        }
      : {
          amount,
          e_wallet_number: form.e_wallet_number,
          e_wallet_provider: form.e_wallet_provider,
        };

    setSubmitting(true);
    try {
      await walletService.requestWithdraw(payload);
      crossAlert("Berhasil", "Withdraw diajukan");
      setWithdrawModalOpen(false);
      setForm(emptyForm);
      loadWallet();
    } catch (err) {
      crossAlert("Error", getErrorMessage(err, "Gagal withdraw"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!verified) {
    return (
      <OwnerScreen title="Wallet" subtitle="Balance, transaksi, withdraw">
        <VerificationGate />
      </OwnerScreen>
    );
  }

  if (loading) {
    return (
      <OwnerScreen title="Wallet" subtitle="Balance, transaksi, withdraw">
        <LoadingState text="Memuat wallet..." />
      </OwnerScreen>
    );
  }

  return (
    <OwnerScreen
      title="Wallet"
      subtitle="Balance, transaksi, withdraw"
      refreshControl={refreshControl}
    >
      {error ? <ErrorState message={error} onRetry={loadWallet} /> : null}

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available balance</Text>
        <Text style={styles.balanceValue}>{formatMoney(availableBalance)}</Text>
        <Text style={styles.balanceMeta}>
          Pending: {formatMoney(pendingBalance)} • Total:{" "}
          {formatMoney(availableBalance + pendingBalance)}
        </Text>
        <TouchableOpacity
          style={styles.withdrawButton}
          onPress={() => setWithdrawModalOpen(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.withdrawButtonText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      <Text style={ownerStyles.sectionTitle}>Transaksi</Text>
      {transactions.length === 0 ? (
        <EmptyState title="Belum ada transaksi" />
      ) : (
        transactions.map((item) => (
          <TransactionCard key={item.transaction_id} item={item} />
        ))
      )}

      <Text style={ownerStyles.sectionTitle}>Withdrawal History</Text>
      {withdrawals.length === 0 ? (
        <EmptyState title="Belum ada withdrawal" />
      ) : (
        withdrawals.map((item) => (
          <WithdrawalCard key={item.withdraw_id} item={item} />
        ))
      )}

      <WithdrawModal
        visible={withdrawModalOpen}
        form={form}
        submitting={submitting}
        onChange={setForm}
        onClose={() => setWithdrawModalOpen(false)}
        onSubmit={submitWithdraw}
      />
    </OwnerScreen>
  );
}

function TransactionCard({ item }: { item: WalletTransaction }) {
  return (
    <View style={ownerStyles.card}>
      <Text style={styles.itemTitle}>
        {item.type.toUpperCase()} {formatMoney(item.amount)}
      </Text>
      <Text style={ownerStyles.muted}>
        {item.description || "-"} • {formatDate(item.created_at)}
      </Text>
    </View>
  );
}

function WithdrawalCard({ item }: { item: Withdrawal }) {
  return (
    <View style={ownerStyles.card}>
      <Text style={styles.itemTitle}>
        {formatMoney(item.amount)} • {item.status}
      </Text>
      <Text style={ownerStyles.muted}>
        {item.bank_name || "-"} {item.account_number || ""} •{" "}
        {formatDate(item.created_at)}
      </Text>
    </View>
  );
}

function WithdrawModal({
  visible,
  form,
  submitting,
  onChange,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  form: WithdrawForm;
  submitting: boolean;
  onChange: (form: WithdrawForm) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Request Withdraw</Text>
          <ScrollView>
            <FormInput
              label="amount"
              value={form.amount}
              keyboardType="numeric"
              onChangeText={(amount) => onChange({ ...form, amount })}
            />
            <Text style={ownerStyles.sectionTitle}>Bank</Text>
            <FormInput
              label="bank_account_number"
              value={form.bank_account_number}
              onChangeText={(bank_account_number) =>
                onChange({ ...form, bank_account_number })
              }
            />
            <FormInput
              label="bank_name"
              value={form.bank_name}
              onChangeText={(bank_name) => onChange({ ...form, bank_name })}
            />
            <Text style={ownerStyles.sectionTitle}>E-wallet</Text>
            <FormInput
              label="e_wallet_number"
              value={form.e_wallet_number}
              onChangeText={(e_wallet_number) =>
                onChange({ ...form, e_wallet_number })
              }
            />
            <FormInput
              label="e_wallet_provider"
              value={form.e_wallet_provider}
              onChangeText={(e_wallet_provider) =>
                onChange({ ...form, e_wallet_provider })
              }
            />
            <TouchableOpacity
              disabled={submitting}
              style={[
                ownerStyles.primaryButton,
                submitting && ownerStyles.disabled,
              ]}
              onPress={onSubmit}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={ownerStyles.primaryButtonText}>
                  Submit Withdraw
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={ownerStyles.link}>Batal</Text>
            </TouchableOpacity>
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: LaundryColors.roleMitraIcon,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },
  balanceLabel: { fontSize: 12, color: "#D1FAE5", fontWeight: "700" },
  balanceValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFF",
    marginVertical: 6,
  },
  balanceMeta: { fontSize: 12, color: "#D1FAE5" },
  withdrawButton: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    marginTop: 14,
  },
  withdrawButtonText: { color: LaundryColors.roleMitraIcon, fontWeight: "900" },
  itemTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: LaundryColors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: LaundryColors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
    maxHeight: "88%",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: LaundryColors.textPrimary,
    marginBottom: 8,
  },
  inputGroup: { marginTop: 8 },
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: LaundryColors.textSecondary,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    borderRadius: 12,
    padding: 11,
    marginTop: 5,
  },
  cancelButton: { padding: 12, alignItems: "center" },
});

