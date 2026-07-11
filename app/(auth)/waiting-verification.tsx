import { ThemeColors } from '@/constants/colors';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { crossAlert } from '@/utils/crossAlert';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStyles } from '@/hooks/useAppStyles';
import { useAuth } from '@/contexts/AuthContext';
import * as authService from '@/services/authService';

export default function WaitingVerificationScreen() {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  const router = useRouter();
  const { user, logout, refreshProfile } = useAuth();

  const handleCheckStatus = async () => {
    await refreshProfile();
    let latestUser = user;
    try {
      const response = await authService.getProfile();
      latestUser = response.success && response.data ? response.data : user;
    } catch {
      latestUser = user;
    }
    if (latestUser?.is_verified) {
      if (latestUser.role === 'owner') {
        router.replace('/(owner)/beranda');
        return;
      }
      if (latestUser.role === 'courier') {
        router.replace('/(courier)/beranda');
        return;
      }
    }
    crossAlert('Status Verifikasi', 'Akun masih menunggu verifikasi admin.', [
      { text: 'OK' },
    ]);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={LaundryColors.headerBg} />

      <View style={styles.headerSection}>
        <View style={styles.headerBubble1} />
        <View style={styles.headerBubble2} />

        <View style={styles.logoContainer}>
          <View style={styles.logoIconWrap}>
            <Ionicons name="water" size={28} color={LaundryColors.primary} />
          </View>
          <Text style={styles.logoText}>
            Laundry<Text style={styles.logoTextAccent}>Ku</Text>
          </Text>
        </View>
      </View>

      <View style={styles.contentSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="hourglass-outline" size={48} color={LaundryColors.primary} />
        </View>

        <Text style={styles.title}>Menunggu Verifikasi</Text>

        <Text style={styles.description}>
          Registrasi berhasil! Akun{' '}
          <Text style={styles.roleBold}>
            {user?.role === 'owner' ? 'Mitra Laundry' : 'Kurir'}
          </Text>{' '}
          Anda sedang menunggu verifikasi dari admin.
        </Text>

        <Text style={styles.subDescription}>
          Silakan tunggu sampai admin memverifikasi akun Anda.
          Anda akan bisa menggunakan fitur utama setelah diverifikasi.
        </Text>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={LaundryColors.primary} />
          <Text style={styles.infoText}>
            Proses verifikasi biasanya memakan waktu 1x24 jam. Hubungi admin jika lebih dari itu.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.checkButton}
          onPress={handleCheckStatus}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh-outline" size={20} color={LaundryColors.textWhite} />
          <Text style={styles.checkText}>Cek Status Verifikasi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={LaundryColors.primary} />
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (LaundryColors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LaundryColors.background,
  },
  headerSection: {
    backgroundColor: LaundryColors.headerBg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  headerBubble1: {
    position: 'absolute',
    top: -20,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
  },
  headerBubble2: {
    position: 'absolute',
    top: 30,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 9999,
    backgroundColor: 'rgba(37, 99, 235, 0.04)',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: LaundryColors.backgroundWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: LaundryColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: LaundryColors.textPrimary,
    letterSpacing: -0.5,
  },
  logoTextAccent: {
    color: LaundryColors.primary,
  },
  contentSection: {
    flex: 1,
    backgroundColor: LaundryColors.backgroundWhite,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -10,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
    shadowColor: LaundryColors.shadowDark,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 8,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 9999,
    backgroundColor: LaundryColors.rolePelangganBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: LaundryColors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: LaundryColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  roleBold: {
    fontWeight: '700',
    color: LaundryColors.primary,
  },
  subDescription: {
    fontSize: 14,
    color: LaundryColors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: LaundryColors.rolePelangganBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: LaundryColors.textSecondary,
    lineHeight: 18,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LaundryColors.primary,
    borderRadius: 16,
    height: 52,
    gap: 8,
    width: '100%',
    marginBottom: 12,
  },
  checkText: {
    fontSize: 16,
    fontWeight: '600',
    color: LaundryColors.textWhite,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LaundryColors.backgroundWhite,
    borderRadius: 16,
    height: 52,
    borderWidth: 1.5,
    borderColor: LaundryColors.inputBorder,
    gap: 8,
    width: '100%',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: LaundryColors.textPrimary,
  },
});



