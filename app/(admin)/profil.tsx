import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { crossAlert } from '@/utils/crossAlert';
import { useRouter } from 'expo-router';
import { LaundryColors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { SettingsModal, HelpModal, AboutModal } from '@/components/ProfileModals';

export default function ProfilScreen() {
  const [settingsModal, setSettingsModal] = useState(false);
  const [helpModal, setHelpModal] = useState(false);
  const [aboutModal, setAboutModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [notifModal, setNotifModal] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
  });

  const handleLogout = () => {
    crossAlert(
      'Logout',
      'Yakin ingin keluar dari akun?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleUnavailableFeature = () => {
    crossAlert('Fitur Belum Tersedia', 'Fitur ini belum tersedia.', [{ text: 'OK' }]);
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profil', color: LaundryColors.primary, action: () => setEditModal(true) },
    { icon: 'notifications-outline', label: 'Notifikasi', color: LaundryColors.warning, action: () => setNotifModal(true) },
    { icon: 'settings-outline', label: 'Pengaturan', color: '#8B5CF6', action: () => setSettingsModal(true) },
    { icon: 'help-circle-outline', label: 'Bantuan', color: LaundryColors.success, action: () => setHelpModal(true) },
    { icon: 'information-circle-outline', label: 'Tentang Aplikasi', color: LaundryColors.textSecondary, action: () => setAboutModal(true) },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Ionicons name="person" size={36} color={LaundryColors.textWhite} />
          </View>
          <Text style={styles.profileName}>{user?.full_name || 'Admin'}</Text>
          <Text style={styles.profileEmail}>{user?.email || '-'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {user?.role === 'admin' ? 'Administrator' : user?.role || 'Admin'}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]}
              onPress={item.action}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={LaundryColors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={LaundryColors.error} />
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>LaundryKu Admin v1.0.0</Text>

        <View style={{ height: 20 }} />
      </ScrollView>

      <SettingsModal visible={settingsModal} onClose={() => setSettingsModal(false)} />
      <HelpModal visible={helpModal} onClose={() => setHelpModal(false)} />
      <AboutModal visible={aboutModal} onClose={() => setAboutModal(false)} />

      {/* EDIT PROFILE MODAL */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profil</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <Ionicons name="close" size={24} color={LaundryColors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nama Lengkap</Text>
                <TextInput
                  style={styles.input}
                  value={form.full_name}
                  onChangeText={(text) => setForm({ ...form, full_name: text })}
                  placeholder="Masukkan nama lengkap"
                  placeholderTextColor={LaundryColors.textMuted}
                />
              </View>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={() => {
                  crossAlert('Berhasil', 'Profil berhasil diperbarui.', [{ text: 'OK', onPress: () => setEditModal(false) }]);
                }}
              >
                <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* NOTIFIKASI MODAL */}
      <Modal visible={notifModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifikasi</Text>
              <TouchableOpacity onPress={() => setNotifModal(false)}>
                <Ionicons name="close" size={24} color={LaundryColors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 24, alignItems: 'center', marginTop: 40 }}>
              <Ionicons name="notifications-off-outline" size={48} color={LaundryColors.textMuted} style={{ marginBottom: 16 }} />
              <Text style={{ fontSize: 16, color: LaundryColors.textSecondary }}>Tidak ada notifikasi saat ini.</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LaundryColors.background },
  header: {
    backgroundColor: LaundryColors.textWhite,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: LaundryColors.inputBorder,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

  // Profile card
  profileCard: {
    backgroundColor: LaundryColors.textWhite,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  avatarLarge: {
    width: 72, height: 72, borderRadius: 9999,
    backgroundColor: LaundryColors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  profileName: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary, marginBottom: 4 },
  profileEmail: { fontSize: 14, color: LaundryColors.textSecondary, marginBottom: 10 },
  roleBadge: {
    backgroundColor: LaundryColors.rolePelangganBg,
    paddingHorizontal: 16, paddingVertical: 4, borderRadius: 8,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '700', color: LaundryColors.primary },

  // Menu
  menuCard: {
    backgroundColor: LaundryColors.textWhite, borderRadius: 16,
    borderWidth: 1, borderColor: LaundryColors.inputBorder, marginBottom: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1, borderBottomColor: LaundryColors.inputBorder,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: LaundryColors.textPrimary },

  // Logout
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FEF2F2', borderRadius: 16, height: 50, gap: 8,
    borderWidth: 1, borderColor: '#FECACA',
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: LaundryColors.error },

  versionText: {
    textAlign: 'center', fontSize: 12, color: LaundryColors.textMuted, marginTop: 16,
  },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: LaundryColors.backgroundWhite, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    height: '60%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 24, borderBottomWidth: 1, borderBottomColor: LaundryColors.inputBorder,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: LaundryColors.textPrimary, marginBottom: 8 },
  input: {
    backgroundColor: LaundryColors.background, borderWidth: 1, borderColor: LaundryColors.inputBorder,
    borderRadius: 12, padding: 14, fontSize: 15, color: LaundryColors.textPrimary,
  },
  saveButton: {
    backgroundColor: LaundryColors.primary, borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 12,
  },
  saveButtonText: { color: LaundryColors.textWhite, fontSize: 16, fontWeight: '700' },
});
