import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LaundryColors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerOrdersScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pesanan Saya</Text>
      </View>
      <View style={styles.content}>
        <Ionicons name="cube" size={48} color={LaundryColors.primaryLight} />
        <Text style={styles.title}>Pesanan Saya</Text>
        <Text style={styles.subtitle}>Fitur pesanan akan segera hadir di phase selanjutnya.</Text>
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
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary },
  subtitle: { fontSize: 13, color: LaundryColors.textSecondary, textAlign: 'center', paddingHorizontal: 24 },
});
