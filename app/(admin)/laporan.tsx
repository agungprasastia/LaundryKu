import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LaundryColors } from '@/constants/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LaporanScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Laporan</Text>
      </View>
      <View style={styles.content}>
        <MaterialCommunityIcons name="chart-box-outline" size={48} color={LaundryColors.primaryLight} />
        <Text style={styles.title}>Halaman Laporan</Text>
        <Text style={styles.subtitle}>Lihat statistik dan laporan platform</Text>
      </View>
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
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary },
  subtitle: { fontSize: 13, color: LaundryColors.textSecondary },
});
