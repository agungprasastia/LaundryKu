import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LaundryColors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar', style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={36} color="#FFFFFF" />
        </View>
        <Text style={styles.name}>{user?.full_name || 'Pelanggan'}</Text>
        <Text style={styles.email}>{user?.email || '-'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Pelanggan</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={LaundryColors.error} />
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LaundryColors.background },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: LaundryColors.inputBorder,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: LaundryColors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary },
  email: { fontSize: 13, color: LaundryColors.textSecondary },
  roleBadge: {
    backgroundColor: LaundryColors.rolePelangganBg,
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 8,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '700', color: LaundryColors.primary },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FEF2F2', borderRadius: 14, height: 50, gap: 8,
    borderWidth: 1, borderColor: '#FECACA', width: '100%', marginTop: 20,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: LaundryColors.error },
});
