import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { crossAlert } from '@/utils/crossAlert';
import { useRouter } from 'expo-router';
import { LaundryColors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

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

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profil', color: LaundryColors.primary },
    { icon: 'notifications-outline', label: 'Notifikasi', color: '#F97316' },
    { icon: 'settings-outline', label: 'Pengaturan', color: '#8B5CF6' },
    { icon: 'help-circle-outline', label: 'Bantuan', color: '#10B981' },
    { icon: 'information-circle-outline', label: 'Tentang Aplikasi', color: '#64748B' },
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
            <Ionicons name="person" size={36} color="#FFFFFF" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LaundryColors.background },
  header: {
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  avatarLarge: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: LaundryColors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  profileName: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary, marginBottom: 4 },
  profileEmail: { fontSize: 13, color: LaundryColors.textSecondary, marginBottom: 10 },
  roleBadge: {
    backgroundColor: LaundryColors.rolePelangganBg,
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 8,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '700', color: LaundryColors.primary },

  // Menu
  menuCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1, borderColor: LaundryColors.inputBorder, marginBottom: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1, borderBottomColor: LaundryColors.inputBorder,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: LaundryColors.textPrimary },

  // Logout
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FEF2F2', borderRadius: 14, height: 50, gap: 8,
    borderWidth: 1, borderColor: '#FECACA',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: LaundryColors.error },

  versionText: {
    textAlign: 'center', fontSize: 11, color: LaundryColors.textMuted, marginTop: 16,
  },
});
