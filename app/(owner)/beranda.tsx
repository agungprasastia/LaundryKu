import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LaundryColors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

export default function OwnerBerandaScreen() {
  const { user } = useAuth();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerGreeting}>Halo, {user?.full_name || 'Mitra'} 👋</Text>
        <Text style={styles.headerSub}>Selamat datang di LaundryKu Mitra</Text>
      </View>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: LaundryColors.roleMitraBg }]}>
          <Ionicons name="storefront" size={40} color={LaundryColors.roleMitraIcon} />
        </View>
        <Text style={styles.title}>Beranda Mitra</Text>
        <Text style={styles.subtitle}>Fitur mitra akan segera hadir di phase selanjutnya.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LaundryColors.background },
  header: { backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: LaundryColors.inputBorder },
  headerGreeting: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary },
  headerSub: { fontSize: 12, color: LaundryColors.textSecondary, marginTop: 2 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary },
  subtitle: { fontSize: 13, color: LaundryColors.textSecondary, textAlign: 'center' },
});
