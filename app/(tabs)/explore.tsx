import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStyles } from '@/hooks/useAppStyles';

export default function ExploreScreen() {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Jelajahi</Text>
      <Text style={styles.subtitle}>Temukan layanan laundry terdekat</Text>
    </View>
  );
}

const createStyles = (LaundryColors: any) => StyleSheet.create({
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
