import React from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatMoney, formatDate } from '@/utils/formatters';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStyles } from '@/hooks/useAppStyles';
import InteractiveButton from '@/components/ui/InteractiveButton';
import { Withdrawal } from "@/types/wallet";
import { DetailRow } from "./adminWalletComponents";
import { LaundrySpacing } from '@/constants/spacing';
import { LaundryTypography } from '@/constants/typography';
import { ThemeColors } from '@/constants/colors';

// ─── Process Withdrawal Modal ───────────────────────

export const ProcessWithdrawalModal = React.memo(function ProcessWithdrawalModal({
  visible,
  action,
  withdrawal,
  notes,
  setNotes,
  processing,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  action: "success" | "failed" | null;
  withdrawal: Withdrawal | null;
  notes: string;
  setNotes: (text: string) => void;
  processing: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeaderRow}>
            <Text style={styles.sheetTitle}>
              {action === "success" ? "Setujui Penarikan" : "Tolak Penarikan"}
            </Text>
            <InteractiveButton onPress={onClose}>
              <Ionicons name="close-circle" size={28} color={LaundryColors.textMuted} />
            </InteractiveButton>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
          >
            {withdrawal && (
              <>
                {/* Detail Info */}
                <View style={styles.detailBox}>
                  <DetailRow label="Nama" value={withdrawal.full_name || "-"} />
                  <DetailRow label="Email" value={withdrawal.email || "-"} />
                  <DetailRow label="Nominal" value={formatMoney(withdrawal.amount)} highlight />
                  {withdrawal.bank_name ? (
                    <>
                      <DetailRow label="Bank" value={withdrawal.bank_name} />
                      <DetailRow
                        label="No. Rekening"
                        value={withdrawal.bank_account_number || withdrawal.account_number || "-"}
                      />
                      {withdrawal.account_holder ? (
                        <DetailRow label="Atas Nama" value={withdrawal.account_holder} />
                      ) : null}
                    </>
                  ) : withdrawal.e_wallet_provider ? (
                    <>
                      <DetailRow label="E-Wallet" value={withdrawal.e_wallet_provider} />
                      <DetailRow
                        label="Nomor"
                        value={withdrawal.e_wallet_number || "-"}
                      />
                    </>
                  ) : null}
                  <DetailRow label="Tanggal" value={formatDate(withdrawal.created_at)} />
                </View>

                {/* Notes input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Catatan (opsional)</Text>
                  <TextInput
                    style={styles.notesInput}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder={
                      action === "success"
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
                  <InteractiveButton
                    style={styles.cancelBtn}
                    onPress={onClose}
                  >
                    <Text style={styles.cancelBtnText}>Batal</Text>
                  </InteractiveButton>
                  <InteractiveButton
                    style={[
                      styles.confirmBtn,
                      action === "failed" && styles.confirmBtnReject,
                    ]}
                    onPress={onSubmit}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator size="small" color={LaundryColors.textWhite} />
                    ) : (
                      <>
                        <Ionicons
                          name={action === "success" ? "checkmark-circle" : "close-circle"}
                          size={18}
                          color={LaundryColors.textWhite}
                        />
                        <Text style={styles.confirmBtnText}>
                          {action === "success" ? "Setujui" : "Tolak"}
                        </Text>
                      </>
                    )}
                  </InteractiveButton>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

// ─── Admin Withdraw Modal ─────────────────────────

export const AdminWithdrawModal = React.memo(function AdminWithdrawModal({
  visible,
  availableBalance,
  withdrawForm,
  setWithdrawForm,
  withdrawMethod,
  setWithdrawMethod,
  submittingWithdraw,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  availableBalance: number;
  withdrawForm: { amount: string; bank_account_number: string; bank_name: string; e_wallet_number: string; e_wallet_provider: string; };
  setWithdrawForm: React.Dispatch<React.SetStateAction<{ amount: string; bank_account_number: string; bank_name: string; e_wallet_number: string; e_wallet_provider: string; }>>;
  withdrawMethod: "bank" | "ewallet";
  setWithdrawMethod: (method: "bank" | "ewallet") => void;
  submittingWithdraw: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeaderRow}>
            <Text style={styles.sheetTitle}>Tarik Saldo</Text>
            <InteractiveButton onPress={onClose}>
              <Ionicons name="close-circle" size={28} color={LaundryColors.textMuted} />
            </InteractiveButton>
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
              <InteractiveButton
                style={[styles.methodTab, withdrawMethod === "bank" && styles.methodTabActive]}
                onPress={() => setWithdrawMethod("bank")}
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
              </InteractiveButton>
              <InteractiveButton
                style={[styles.methodTab, withdrawMethod === "ewallet" && styles.methodTabActive]}
                onPress={() => setWithdrawMethod("ewallet")}
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
              </InteractiveButton>
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
            <InteractiveButton
              style={[styles.submitWithdrawBtn, submittingWithdraw && { opacity: 0.7 }]}
              onPress={onSubmit}
              disabled={submittingWithdraw}
            >
              {submittingWithdraw ? (
                <ActivityIndicator size="small" color={LaundryColors.textWhite} />
              ) : (
                <Text style={styles.submitWithdrawBtnText}>Ajukan Penarikan</Text>
              )}
            </InteractiveButton>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

const createStyles = (LaundryColors: ThemeColors) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: LaundryColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: LaundrySpacing.spacing.xl,
    maxHeight: "92%",
  },
  sheetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: LaundryTypography.size.xl,
    fontWeight: LaundryTypography.weight.bold,
    color: LaundryColors.textPrimary,
  },
  detailBox: {
    backgroundColor: LaundryColors.cardBg,
    borderRadius: LaundrySpacing.radius.xl,
    padding: LaundrySpacing.spacing.base,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: LaundryTypography.size.base,
    color: LaundryColors.textPrimary,
    fontWeight: LaundryTypography.weight.bold,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: LaundryColors.cardBg,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    borderRadius: LaundrySpacing.radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: LaundryTypography.size.base,
    color: LaundryColors.textPrimary,
    textAlignVertical: "top",
    minHeight: 80,
  },
  actionBtnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: LaundrySpacing.radius.lg,
    borderWidth: 1.5,
    borderColor: LaundryColors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: LaundryTypography.size.base,
    fontWeight: LaundryTypography.weight.bold,
    color: LaundryColors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: LaundrySpacing.radius.lg,
    backgroundColor: LaundryColors.success,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  confirmBtnReject: {
    backgroundColor: LaundryColors.error,
  },
  confirmBtnText: {
    fontSize: LaundryTypography.size.base,
    fontWeight: LaundryTypography.weight.bold,
    color: LaundryColors.textWhite,
  },
  withdrawAvailableBox: {
    backgroundColor: LaundryColors.cardSelected,
    padding: LaundrySpacing.spacing.base,
    borderRadius: LaundrySpacing.radius.xl,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 20,
    alignItems: "center",
  },
  withdrawAvailableLabel: {
    fontSize: LaundryTypography.size.base,
    color: "#1E40AF",
    fontWeight: LaundryTypography.weight.semibold,
  },
  withdrawAvailableValue: {
    fontSize: LaundryTypography.size.xxl,
    color: "#1E3A8A",
    fontWeight: LaundryTypography.weight.bold,
    marginTop: 4,
  },
  withdrawInput: {
    backgroundColor: LaundryColors.cardBg,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    borderRadius: LaundrySpacing.radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: LaundryTypography.size.md,
    fontWeight: LaundryTypography.weight.semibold,
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
    borderRadius: LaundrySpacing.radius.lg,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    backgroundColor: LaundryColors.surfaceSlate,
  },
  methodTabActive: {
    borderColor: LaundryColors.primary,
    backgroundColor: LaundryColors.cardSelected,
  },
  methodTabText: {
    fontSize: LaundryTypography.size.base,
    fontWeight: LaundryTypography.weight.bold,
    color: LaundryColors.textSecondary,
  },
  methodTabTextActive: {
    color: LaundryColors.primary,
  },
  methodContentBox: {
    backgroundColor: LaundryColors.surfaceSlate,
    padding: LaundrySpacing.spacing.base,
    borderRadius: LaundrySpacing.radius.xl,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    marginBottom: 16,
  },
  submitWithdrawBtn: {
    backgroundColor: LaundryColors.primary,
    borderRadius: LaundrySpacing.radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitWithdrawBtnText: {
    fontSize: LaundryTypography.size.md,
    fontWeight: LaundryTypography.weight.bold,
    color: LaundryColors.textWhite,
  },
});
