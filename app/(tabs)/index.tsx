import { ThemeColors } from '@/constants/colors';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppStyles } from '@/hooks/useAppStyles';

export default function HomeScreen() {
  const styles = useAppStyles(createStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏠 Beranda</Text>
      <Text style={styles.subtitle}>Selamat datang di LaundryKu</Text>
    </View>
  );
}

const createStyles = (LaundryColors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LaundryColors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: LaundryColors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: LaundryColors.textSecondary,
  },
});
