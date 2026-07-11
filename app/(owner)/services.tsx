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
import * as serviceService from "@/services/serviceService";
import { useAuth } from "@/contexts/AuthContext";
import { LaundryService } from "@/types/service";
import { ThemeColors } from "@/constants/colors";
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStyles } from '@/hooks/useAppStyles';
import {
  EmptyState,
  ErrorState,
  formatDate,
  formatMoney,
  getErrorMessage,
  isVerified,
  LoadingState,
  OwnerScreen,
  PrimaryButton,
  VerificationGate,
  ownerStyles,
} from "@/components/owner/roleComponents";

type ServiceForm = {
  service_id: string;
  name: string;
  description: string;
  price_per_kg_owner: string;
  is_active: boolean;
};

const emptyForm: ServiceForm = {
  service_id: "",
  name: "",
  description: "",
  price_per_kg_owner: "",
  is_active: true,
};

export default function OwnerServicesScreen() {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  const { user } = useAuth();
  const verified = isVerified(user?.is_verified);
  const [services, setServices] = useState<LaundryService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<LaundryService | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadServices = useCallback(async () => {
    if (!verified) {
      setLoading(false);
      return;
    }
    try {
      setError("");
      const response = await serviceService.getServices();
      setServices(
        response.success && Array.isArray(response.data) ? response.data : [],
      );
    } catch (err) {
      setError(getErrorMessage(err, "Gagal memuat layanan"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [verified]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        loadServices();
      }}
      colors={[LaundryColors.roleMitraIcon]}
    />
  );

  const openCreateModal = () => {
    setEditingService(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (service: LaundryService) => {
    setEditingService(service);
    setForm({
      service_id: service.service_id,
      name: service.name || "",
      description: service.description || "",
      price_per_kg_owner: String(service.price_per_kg_owner ?? ""),
      is_active: service.is_active !== false && service.is_active !== 0,
    });
    setModalOpen(true);
  };

  const closeServiceModal = () => {
    setModalOpen(false);
    setEditingService(null);
    setForm(emptyForm);
    setSubmitting(false);
  };

  const saveService = async () => {
    const price = Number(form.price_per_kg_owner);

    if (!editingService && !form.service_id.trim())
      return crossAlert("Validasi", "ID Layanan wajib diisi");
    if (!form.name.trim()) return crossAlert("Validasi", "Nama layanan wajib diisi");
    if (!price || price <= 0)
      return crossAlert("Validasi", "Harga owner per kg wajib angka > 0");

    setSubmitting(true);
    try {
      if (editingService) {
        await serviceService.updateService(editingService.service_id, {
          name: form.name.trim(),
          description: form.description.trim(),
          price_per_kg_owner: price,
        });
      } else {
        await serviceService.createService({
          service_id: form.service_id.trim(),
          name: form.name.trim(),
          description: form.description.trim(),
          price_per_kg_owner: price,
        });
      }

      crossAlert(
        "Berhasil",
        editingService ? "Layanan diperbarui" : "Layanan dibuat",
      );
      closeServiceModal();
      loadServices();
    } catch (err) {
      crossAlert("Error", getErrorMessage(err, "Gagal menyimpan layanan"));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeactivate = (service: LaundryService) => {
    crossAlert(
      "Nonaktifkan Layanan",
      `Apakah Anda yakin ingin menonaktifkan layanan "${service.name}"? Layanan ini tidak akan bisa dipilih lagi oleh customer.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Nonaktifkan",
          style: "destructive",
          onPress: async () => {
            try {
              await serviceService.deleteService(service.service_id);
              crossAlert("Berhasil", "Layanan dinonaktifkan");
              loadServices();
            } catch (err) {
              crossAlert(
                "Error",
                getErrorMessage(err, "Gagal menonaktifkan layanan"),
              );
            }
          },
        },
      ],
    );
  };

  if (!verified) {
    return (
      <OwnerScreen title="Kelola Layanan" subtitle="Daftar layanan laundry Anda">
        <VerificationGate />
      </OwnerScreen>
    );
  }

  if (loading) {
    return (
      <OwnerScreen title="Kelola Layanan" subtitle="Daftar layanan laundry Anda">
        <LoadingState text="Memuat layanan..." />
      </OwnerScreen>
    );
  }

  return (
    <OwnerScreen
      title="Kelola Layanan"
      subtitle="Daftar layanan laundry Anda"
      refreshControl={refreshControl}
    >
      <View style={styles.toolbar}>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{services.length} Layanan</Text>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={openCreateModal} activeOpacity={0.8}>
          <Ionicons name="add" size={20} color={LaundryColors.textWhite} />
          <Text style={styles.createButtonText}>Tambah</Text>
        </TouchableOpacity>
      </View>

      {error ? <ErrorState message={error} onRetry={loadServices} /> : null}
      
      {services.length === 0 ? (
        <EmptyState
          title="Belum ada layanan"
          message="Buat layanan pertama Anda untuk mulai menerima order dari customer."
          icon="shirt-outline"
        />
      ) : (
        services.map((service) => (
          <ServiceCard
            key={service.service_id}
            service={service}
            onEdit={() => openEditModal(service)}
            onDeactivate={() => confirmDeactivate(service)}
          />
        ))
      )}

      <ServiceModal
        visible={modalOpen}
        form={form}
        editing={!!editingService}
        submitting={submitting}
        onChange={setForm}
        onClose={closeServiceModal}
        onSubmit={saveService}
      />
    </OwnerScreen>
  );
}

function ServiceCard({
  service,
  onEdit,
  onDeactivate,
}: {
  service: LaundryService;
  onEdit: () => void;
  onDeactivate: () => void;
}) {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  const sharedOwnerStyles = useAppStyles(ownerStyles);
  const active = service.is_active !== false && service.is_active !== 0;

  return (
    <View style={styles.card}>
      <View style={sharedOwnerStyles.row}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          <View style={[styles.iconWrapper, { backgroundColor: active ? "#EBF5FF" : "#F1F5F9" }]}>
            <Ionicons name="shirt" size={20} color={active ? "#2563EB" : LaundryColors.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceName} numberOfLines={1}>{service.name}</Text>
            <Text style={styles.serviceId}>{service.service_id}</Text>
          </View>
        </View>
        <StatusBadge active={active} />
      </View>
      
      <Text style={styles.descriptionText} numberOfLines={2}>
        {service.description || "Tidak ada deskripsi."}
      </Text>
      
      <View style={styles.pricingContainer}>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Harga Owner / Kg</Text>
          <Text style={styles.priceValue}>{formatMoney(service.price_per_kg_owner ?? service.price_per_kg)}</Text>
        </View>
        <View style={styles.priceDivider} />
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Harga Customer / Kg</Text>
          <Text style={[styles.priceValue, { color: LaundryColors.primary }]}>{formatMoney(service.price_per_kg_customer)}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>Dibuat {formatDate(service.created_at)}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
            <Ionicons name="create-outline" size={16} color={LaundryColors.roleMitraIcon} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          {active && (
            <TouchableOpacity style={styles.deleteBtn} onPress={onDeactivate}>
              <Ionicons name="trash-outline" size={16} color={LaundryColors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  return (
    <View style={[styles.badge, { backgroundColor: active ? "#ECFDF5" : "#FEF2F2" }]}>
      <Text style={[styles.badgeText, { color: active ? "#10B981" : LaundryColors.error }]}>
        {active ? "AKTIF" : "NONAKTIF"}
      </Text>
    </View>
  );
}

function ServiceModal({
  visible,
  form,
  editing,
  submitting,
  onChange,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  form: ServiceForm;
  editing: boolean;
  submitting: boolean;
  onChange: (form: ServiceForm) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {editing ? "Edit Layanan" : "Tambah Layanan Baru"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={LaundryColors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            <FormInput
              label="ID Layanan (Unik)"
              value={form.service_id}
              disabled={editing}
              onChangeText={(service_id) => onChange({ ...form, service_id })}
              placeholder="Misal: CUCI_KILAT"
            />
            <FormInput
              label="Nama Layanan"
              value={form.name}
              onChangeText={(name) => onChange({ ...form, name })}
              placeholder="Misal: Cuci Kering Kilat"
            />
            <FormInput
              label="Deskripsi"
              value={form.description}
              onChangeText={(description) => onChange({ ...form, description })}
              placeholder="Misal: Selesai dalam 1 hari"
              multiline
            />
            <FormInput
              label="Harga Owner per Kg (Rp)"
              value={form.price_per_kg_owner}
              keyboardType="numeric"
              onChangeText={(price_per_kg_owner) =>
                onChange({ ...form, price_per_kg_owner })
              }
              placeholder="Misal: 5000"
            />
            <View style={{ marginTop: 12 }}>
              <PrimaryButton 
                text={submitting ? "Menyimpan..." : "Simpan Layanan"} 
                onPress={onSubmit} 
                disabled={submitting} 
              />
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
  disabled?: boolean;
  keyboardType?: "default" | "numeric";
  placeholder?: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
}) {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{props.label}</Text>
      <TextInput
        style={[
          styles.input, 
          props.disabled && styles.inputDisabled,
          props.multiline && { minHeight: 80, textAlignVertical: 'top' }
        ]}
        value={props.value}
        editable={!props.disabled}
        keyboardType={props.keyboardType || "default"}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={LaundryColors.textMuted}
        multiline={props.multiline}
      />
    </View>
  );
}

const createStyles = (LaundryColors: ThemeColors) => StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  countBadge: {
    backgroundColor: LaundryColors.surfaceGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countText: { color: LaundryColors.textSecondary, fontWeight: "700", fontSize: 14 },
  createButton: {
    backgroundColor: LaundryColors.roleMitraIcon,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  createButtonText: { color: LaundryColors.textWhite, fontWeight: "700", fontSize: 14 },
  
  card: {
    backgroundColor: LaundryColors.backgroundWhite,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: LaundryColors.textPrimary,
  },
  serviceId: {
    fontSize: 12,
    fontWeight: "700",
    color: LaundryColors.textMuted,
    marginTop: 2,
  },
  descriptionText: {
    fontSize: 14,
    color: LaundryColors.textSecondary,
    lineHeight: 20,
    marginTop: 12,
  },
  pricingContainer: {
    flexDirection: "row",
    backgroundColor: LaundryColors.surfaceSlate,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    alignItems: "center",
  },
  priceBox: { flex: 1 },
  priceDivider: { width: 1, height: 30, backgroundColor: LaundryColors.inputBorder, marginHorizontal: 12 },
  priceLabel: { fontSize: 12, color: LaundryColors.textSecondary, fontWeight: "600", marginBottom: 4 },
  priceValue: { fontSize: 16, fontWeight: "700", color: LaundryColors.textPrimary },
  
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: LaundryColors.inputBorder,
  },
  dateText: { fontSize: 12, color: LaundryColors.textMuted, fontWeight: "500" },
  actionButtons: { flexDirection: "row", gap: 8 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LaundryColors.roleMitraBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  editBtnText: { color: LaundryColors.roleMitraIcon, fontWeight: "700", fontSize: 12 },
  deleteBtn: {
    backgroundColor: LaundryColors.errorBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: "center",
  },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: LaundryColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "92%",
  },
  sheetHeader: {
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
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: LaundryColors.surfaceGray,
    alignItems: "center",
    justifyContent: "center",
  },
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    fontSize: 14,
    color: LaundryColors.textPrimary,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    backgroundColor: LaundryColors.backgroundWhite,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: LaundryColors.textPrimary,
    fontWeight: "500",
  },
  inputDisabled: {
    backgroundColor: LaundryColors.surfaceSlate,
    color: LaundryColors.textMuted,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: LaundryColors.surfaceSlate,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    marginBottom: 16,
  },
  switchLabel: { fontSize: 14, fontWeight: "700", color: LaundryColors.textPrimary },
  switchDesc: { fontSize: 12, color: LaundryColors.textSecondary, marginTop: 4, maxWidth: 200 },
});
