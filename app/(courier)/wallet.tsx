import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import * as walletService from "@/services/walletService";
import { LaundryColors } from "@/constants/colors";
import { Wallet, WalletTransaction, Withdrawal } from "@/types/wallet";
import {
  CourierScreen,
  EmptyState,
  ErrorState,
  formatDate,
  formatMoney,
  getErrorMessage,
  InfoRow,
  isVerified,
  LoadingState,
  VerificationGate,
  courierStyles,
} from "./_components";

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
      />
    ),
    [loadWallet, refreshing],
  );
  const available = wallet?.available_balance ?? wallet?.balance ?? 0;
  const pending = wallet?.pending_balance ?? 0;

  const submitWithdraw = async () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0)
      return crossAlert("Validasi", "amount wajib angka > 0");
    if (amount > available)
      return crossAlert(
        "Validasi",
        "amount tidak boleh lebih besar dari available_balance",
      );

    const payload =
      method === "bank"
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

    if (
      method === "bank" &&
      (!payload.bank_name || !payload.bank_account_number)
    )
      return crossAlert("Validasi", "Isi bank_name dan bank_account_number");
    if (
      method === "ewallet" &&
      (!(payload as any).e_wallet_provider || !(payload as any).e_wallet_number)
    )
      return crossAlert(
        "Validasi",
        "Isi e_wallet_provider dan e_wallet_number",
      );

    setSubmitting(true);
    try {
      await walletService.requestWithdraw(payload as any);
      crossAlert("Berhasil", "Withdraw diajukan");
      setModalOpen(false);
      setForm(emptyForm);
      await loadWallet();
    } catch (err) {
      crossAlert("Error", getErrorMessage(err, "Gagal request withdraw"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!verified)
    return (
      <CourierScreen title="Wallet" subtitle="Saldo dan withdraw">
        <VerificationGate />
      </CourierScreen>
    );
  if (loading)
    return (
      <CourierScreen title="Wallet" subtitle="Saldo dan withdraw">
        <LoadingState text="Memuat wallet..." />
      </CourierScreen>
    );

  return (
    <CourierScreen
      title="Wallet"
      subtitle="Saldo dan withdraw"
      refreshControl={refreshControl}
    >
      {error ? <ErrorState message={error} onRetry={loadWallet} /> : null}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available balance</Text>
        <Text style={styles.balanceValue}>{formatMoney(available)}</Text>
        <Text style={styles.balanceMeta}>Pending: {formatMoney(pending)}</Text>
        <TouchableOpacity
          style={styles.withdrawButton}
          onPress={() => setModalOpen(true)}
        >
          <Text style={styles.withdrawButtonText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      <Text style={courierStyles.sectionTitle}>Transactions</Text>
      {transactions.length === 0 ? (
        <EmptyState title="Belum ada transaksi" />
      ) : (
        transactions.map((item) => (
          <View key={item.transaction_id} style={courierStyles.card}>
            <InfoRow
              label={`${item.type} ${formatMoney(item.amount)}`}
              value={item.description || "-"}
            />
            <Text style={courierStyles.muted}>
              {formatDate(item.created_at)}
            </Text>
          </View>
        ))
      )}

      <Text style={courierStyles.sectionTitle}>Withdrawals</Text>
      {withdrawals.length === 0 ? (
        <EmptyState title="Belum ada withdrawal" />
      ) : (
        withdrawals.map((item) => (
          <View key={item.withdraw_id} style={courierStyles.card}>
            <InfoRow label="Amount" value={formatMoney(item.amount)} />
            <InfoRow label="Status" value={item.status} />
            <Text style={courierStyles.muted}>
              {item.bank_name || item.e_wallet_provider || "-"} •{" "}
              {item.bank_account_number ||
                item.e_wallet_number ||
                item.account_number ||
                ""}
            </Text>
          </View>
        ))
      )}

      <WithdrawModal
        visible={modalOpen}
        method={method}
        form={form}
        submitting={submitting}
        onMethodChange={setMethod}
        onFormChange={setForm}
        onClose={() => setModalOpen(false)}
        onSubmit={submitWithdraw}
      />
    </CourierScreen>
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
}: any) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Request Withdraw</Text>
          <ScrollView>
            <FormInput
              label="amount"
              value={form.amount}
              keyboardType="numeric"
              onChangeText={(amount) => onFormChange({ ...form, amount })}
            />
            <View style={styles.methodRow}>
              <Choice
                active={method === "bank"}
                text="Bank"
                onPress={() => onMethodChange("bank")}
              />
              <Choice
                active={method === "ewallet"}
                text="E-wallet"
                onPress={() => onMethodChange("ewallet")}
              />
            </View>
            {method === "bank" ? (
              <>
                <FormInput
                  label="bank_name"
                  value={form.bank_name}
                  onChangeText={(bank_name) =>
                    onFormChange({ ...form, bank_name })
                  }
                />
                <FormInput
                  label="bank_account_number"
                  value={form.bank_account_number}
                  onChangeText={(bank_account_number) =>
                    onFormChange({ ...form, bank_account_number })
                  }
                />
              </>
            ) : (
              <>
                <FormInput
                  label="e_wallet_provider"
                  value={form.e_wallet_provider}
                  onChangeText={(e_wallet_provider) =>
                    onFormChange({ ...form, e_wallet_provider })
                  }
                />
                <FormInput
                  label="e_wallet_number"
                  value={form.e_wallet_number}
                  onChangeText={(e_wallet_number) =>
                    onFormChange({ ...form, e_wallet_number })
                  }
                />
              </>
            )}
            <TouchableOpacity
              disabled={submitting}
              style={[
                courierStyles.primaryButton,
                submitting && courierStyles.disabled,
              ]}
              onPress={onSubmit}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={courierStyles.primaryButtonText}>
                  Submit Withdraw
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={courierStyles.link}>Batal</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Choice({
  active,
  text,
  onPress,
}: {
  active: boolean;
  text: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.choice, active && styles.choiceActive]}
      onPress={onPress}
    >
      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
        {text}
      </Text>
    </TouchableOpacity>
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
    backgroundColor: LaundryColors.roleKurirIcon,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },
  balanceLabel: { fontSize: 12, color: "#FFEDD5", fontWeight: "800" },
  balanceValue: {
    fontSize: 28,
    color: "#FFF",
    fontWeight: "900",
    marginVertical: 6,
  },
  balanceMeta: { fontSize: 12, color: "#FFEDD5" },
  withdrawButton: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    marginTop: 14,
  },
  withdrawButtonText: { color: LaundryColors.roleKurirIcon, fontWeight: "900" },
  overlay: {
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
  },
  methodRow: { flexDirection: "row", gap: 8, marginVertical: 10 },
  choice: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 11,
    alignItems: "center",
    borderWidth: 1,
    borderColor: LaundryColors.cardBorder,
  },
  choiceActive: {
    backgroundColor: LaundryColors.roleKurirBg,
    borderColor: LaundryColors.roleKurirIcon,
  },
  choiceText: { fontWeight: "800", color: LaundryColors.textSecondary },
  choiceTextActive: { color: LaundryColors.roleKurirIcon },
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
