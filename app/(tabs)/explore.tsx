import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LaundryColors } from '@/constants/colors';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Jelajahi</Text>
      <Text style={styles.subtitle}>Temukan layanan laundry terdekat</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
