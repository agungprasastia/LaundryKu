import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { crossAlert } from "@/utils/crossAlert";
import * as serviceService from "@/services/serviceService";
import { useAuth } from "@/contexts/AuthContext";
import { LaundryService } from "@/types/service";
import { LaundryColors } from "@/constants/colors";
import {
  DangerButton,
  EmptyState,
  ErrorState,
  formatDate,
  formatMoney,
  getErrorMessage,
  isVerified,
  LoadingState,
  OwnerScreen,
  PrimaryButton,
  SecondaryButton,
  VerificationGate,
  ownerStyles,
} from "./_components";

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
  const { user } = useAuth();
  const verified = isVerified(user?.is_verified);
  const [services, setServices] = useState<LaundryService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<LaundryService | null>(
    null,
  );
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

  const saveService = async () => {
    const price = Number(form.price_per_kg_owner);

    if (!editingService && !form.service_id.trim())
      return crossAlert("Validasi", "service_id wajib diisi");
    if (!form.name.trim()) return crossAlert("Validasi", "name wajib diisi");
    if (!price || price <= 0)
      return crossAlert("Validasi", "price_per_kg_owner wajib angka > 0");

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
      setModalOpen(false);
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
      "Layanan akan dinonaktifkan (soft delete).",
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
      <OwnerScreen title="Layanan Saya" subtitle="CRUD layanan owner">
        <VerificationGate />
      </OwnerScreen>
    );
  }

  if (loading) {
    return (
      <OwnerScreen title="Layanan Saya" subtitle="CRUD layanan owner">
        <LoadingState text="Memuat layanan..." />
      </OwnerScreen>
    );
  }

  return (
    <OwnerScreen
      title="Layanan Saya"
      subtitle="CRUD layanan owner"
      refreshControl={refreshControl}
    >
      <View style={styles.toolbar}>
        <Text style={styles.countText}>{services.length} layanan</Text>
        <PrimaryButton text="+ Create Service" onPress={openCreateModal} />
      </View>

      {error ? <ErrorState message={error} onRetry={loadServices} /> : null}
      {services.length === 0 ? (
        <EmptyState
          title="Belum ada layanan"
          message="Buat layanan pertama untuk menerima order."
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
        onClose={() => setModalOpen(false)}
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
  const active = service.is_active !== false && service.is_active !== 0;

  return (
    <View style={ownerStyles.card}>
      <View style={ownerStyles.row}>
        <Text style={styles.serviceName}>{service.name}</Text>
        <StatusBadge active={active} />
      </View>
      <Text style={styles.serviceId}>{service.service_id}</Text>
      <Text style={ownerStyles.muted}>{service.description || "-"}</Text>
      <Text style={styles.priceText}>
        Owner {formatMoney(service.price_per_kg_owner ?? service.price_per_kg)}{" "}
        • Customer {formatMoney(service.price_per_kg_customer)}
      </Text>
      <Text style={ownerStyles.muted}>
        Dibuat {formatDate(service.created_at)}
      </Text>
      <View style={styles.actions}>
        <SecondaryButton text="Edit" onPress={onEdit} />
        <DangerButton text="Nonaktifkan Layanan" onPress={onDeactivate} />
      </View>
    </View>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: active ? LaundryColors.roleMitraBg : "#F1F5F9" },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            color: active
              ? LaundryColors.roleMitraIcon
              : LaundryColors.textMuted,
          },
        ]}
      >
        {active ? "ACTIVE" : "INACTIVE"}
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
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>
            {editing ? "Edit Service" : "Create Service"}
          </Text>
          <ScrollView>
            <FormInput
              label="service_id"
              value={form.service_id}
              disabled={editing}
              onChangeText={(service_id) => onChange({ ...form, service_id })}
            />
            <FormInput
              label="name"
              value={form.name}
              onChangeText={(name) => onChange({ ...form, name })}
            />
            <FormInput
              label="description"
              value={form.description}
              onChangeText={(description) => onChange({ ...form, description })}
            />
            <FormInput
              label="price_per_kg_owner"
              value={form.price_per_kg_owner}
              keyboardType="numeric"
              onChangeText={(price_per_kg_owner) =>
                onChange({ ...form, price_per_kg_owner })
              }
            />
            {editing ? (
              <View style={styles.switchRow}>
                <Text style={styles.inputLabel}>is_active</Text>
                <Switch
                  value={form.is_active}
                  onValueChange={(is_active) =>
                    onChange({ ...form, is_active })
                  }
                />
              </View>
            ) : null}
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
                <Text style={ownerStyles.primaryButtonText}>Simpan</Text>
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
  disabled?: boolean;
  keyboardType?: "default" | "numeric";
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{props.label}</Text>
      <TextInput
        style={[styles.input, props.disabled && ownerStyles.disabled]}
        value={props.value}
        editable={!props.disabled}
        keyboardType={props.keyboardType || "default"}
        onChangeText={props.onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  countText: { color: LaundryColors.textSecondary, fontWeight: "800" },
  serviceName: {
    fontSize: 16,
    fontWeight: "800",
    color: LaundryColors.textPrimary,
    flex: 1,
  },
  serviceId: {
    fontSize: 12,
    fontWeight: "800",
    color: LaundryColors.roleMitraIcon,
    marginTop: 4,
  },
  priceText: {
    fontSize: 13,
    fontWeight: "800",
    color: LaundryColors.textPrimary,
    marginTop: 8,
  },
  actions: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: "900" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,.35)",
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
    marginBottom: 12,
  },
  inputGroup: { marginBottom: 10 },
  inputLabel: {
    fontSize: 12,
    color: LaundryColors.textSecondary,
    fontWeight: "800",
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 5,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cancelButton: { padding: 14, alignItems: "center" },
});
