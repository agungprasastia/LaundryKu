import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { crossAlert } from '@/utils/crossAlert';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { LaundryColors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

type RoleType = 'pelanggan' | 'mitra' | 'kurir';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const headerScale = useRef(new Animated.Value(0.9)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, headerScale, slideAnim]);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleLogin = async () => {
    // Clear previous errors
    setErrorMessage('');

    // Validate inputs
    if (!email.trim()) {
      setErrorMessage('Email wajib diisi');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Password wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const { role, isVerified } = await login(email.trim(), password);

      // Redirect based on role and verification status
      if ((role === 'owner' || role === 'courier') && !isVerified) {
        router.replace('/(auth)/waiting-verification');
        return;
      }

      switch (role) {
        case 'admin':
          router.replace('/(admin)/beranda');
          break;
        case 'customer':
          router.replace('/(customer)/beranda');
          break;
        case 'owner':
          router.replace('/(owner)/beranda');
          break;
        case 'courier':
          router.replace('/(courier)/beranda');
          break;
        default:
          router.replace('/(auth)/login');
      }
    } catch (error: any) {
      // Extract error message from backend or axios error
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Login gagal. Periksa email dan password Anda.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const navigateToRegister = () => {
    router.push('/(auth)/register');
  };

  const handleGoogleLogin = () => {
    crossAlert(
      'Coming Soon',
      'Login dengan Google belum tersedia saat ini. Silakan gunakan email dan password.',
      [{ text: 'OK' }]
    );
  };

  const handleForgotPassword = () => {
    crossAlert('Lupa Password', 'Fitur lupa password belum tersedia. Silakan hubungi admin.', [
      { text: 'OK' },
    ]);
  };

  const roleCards: { key: RoleType; label: string; icon: string; color: string; bg: string }[] = [
    { key: 'pelanggan', label: 'Pelanggan', icon: 'person', color: LaundryColors.rolePelangganIcon, bg: LaundryColors.rolePelangganBg },
    { key: 'mitra', label: 'Mitra Laundry', icon: 'storefront', color: LaundryColors.roleMitraIcon, bg: LaundryColors.roleMitraBg },
    { key: 'kurir', label: 'Kurir', icon: 'delivery-dining', color: LaundryColors.roleKurirIcon, bg: LaundryColors.roleKurirBg },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={LaundryColors.headerBg} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header Section with gradient background */}
          <View style={styles.headerSection}>
            <View style={styles.headerBubble1} />
            <View style={styles.headerBubble2} />
            <View style={styles.headerBubble3} />

            <Animated.View style={[styles.logoContainer, { transform: [{ scale: headerScale }] }]}>
              {/* Washing Machine Icon */}
              <View style={styles.logoIconWrap}>
                <Ionicons name="water" size={32} color={LaundryColors.primary} />
              </View>
              <Text style={styles.logoText}>
                Laundry<Text style={styles.logoTextAccent}>Ku</Text>
              </Text>
              <Text style={styles.logoSubtext}>
                Laundry online dengan pickup,{'\n'}tracking, dan delivery.
              </Text>
            </Animated.View>

            {/* Decorative laundry items */}
            <View style={styles.decorativeRow}>
              <View style={styles.decorativeItem}>
                <Ionicons name="shirt" size={28} color={LaundryColors.primaryLight} />
              </View>
              <View style={styles.decorativeItem}>
                <MaterialIcons name="local-laundry-service" size={28} color={LaundryColors.primaryLight} />
              </View>
            </View>
          </View>

          {/* Form Section */}
          <Animated.View
            style={[
              styles.formSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.welcomeTitle}>Selamat Datang Kembali!</Text>
            <Text style={styles.welcomeSubtitle}>
              Masuk untuk memantau status laundry,{'\n'}jadwal pickup, dan status pesananmu.
            </Text>

            {/* Error Message */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color={LaundryColors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={LaundryColors.inputIcon} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Masukkan email"
                  placeholderTextColor={LaundryColors.inputPlaceholder}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={LaundryColors.inputIcon} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Masukkan password"
                  placeholderTextColor={LaundryColors.inputPlaceholder}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color={LaundryColors.inputIcon}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.forgotButton} onPress={handleForgotPassword}>
                <Text style={styles.forgotText}>Lupa password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={22} color={LaundryColors.textWhite} />
                    <Text style={styles.loginButtonText}>Masuk</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>atau lanjut dengan</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Button */}
            <TouchableOpacity
              style={styles.googleButton}
              activeOpacity={0.8}
              onPress={handleGoogleLogin}
            >
              <FontAwesome name="google" size={20} color="#DB4437" />
              <Text style={styles.googleButtonText}>Masuk dengan Google</Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerLinkRow}>
              <Text style={styles.registerLinkText}>Belum punya akun? </Text>
              <TouchableOpacity onPress={navigateToRegister}>
                <Text style={styles.registerLinkAction}>Daftar</Text>
              </TouchableOpacity>
            </View>

            {/* Role Cards */}
            <View style={styles.roleCardsRow}>
              {roleCards.map((role) => (
                <TouchableOpacity
                  key={role.key}
                  style={[styles.roleCard, { backgroundColor: role.bg }]}
                  onPress={() => router.push({ pathname: '/(auth)/register', params: { role: role.key } })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.roleIconCircle, { backgroundColor: role.bg }]}>
                    <MaterialIcons name={role.icon as any} size={28} color={role.color} />
                  </View>
                  <Text style={styles.roleCardLabel}>Daftar sebagai</Text>
                  <View style={styles.roleCardNameRow}>
                    <Text style={[styles.roleCardName, { color: role.color }]}>{role.label}</Text>
                    <Ionicons name="chevron-forward" size={14} color={role.color} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Terms */}
            <View style={styles.termsRow}>
              <Text style={styles.termsText}>
                Dengan masuk, kamu menyetujui{' '}
                <Text style={styles.termsLink}>Syarat & Ketentuan</Text>
                {'\n'}serta <Text style={styles.termsLink}>Kebijakan Privasi</Text> LaundryKu.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LaundryColors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header
  headerSection: {
    backgroundColor: LaundryColors.headerBg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
    borderRadius: 40,
    backgroundColor: 'rgba(37, 99, 235, 0.04)',
  },
  headerBubble3: {
    position: 'absolute',
    bottom: 10,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: LaundryColors.backgroundWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: LaundryColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: LaundryColors.textPrimary,
    letterSpacing: -0.5,
  },
  logoTextAccent: {
    color: LaundryColors.primary,
  },
  logoSubtext: {
    fontSize: 13,
    color: LaundryColors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  decorativeRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 20,
  },
  decorativeItem: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Form
  formSection: {
    backgroundColor: LaundryColors.backgroundWhite,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -10,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: LaundryColors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: LaundryColors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },

  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: LaundryColors.error,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Input
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: LaundryColors.textPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LaundryColors.inputBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: LaundryColors.inputBorder,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: LaundryColors.textPrimary,
  },
  eyeButton: {
    padding: 4,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotText: {
    fontSize: 13,
    color: LaundryColors.textLink,
    fontWeight: '600',
  },

  // Login button
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LaundryColors.primary,
    borderRadius: 14,
    height: 54,
    marginTop: 8,
    gap: 8,
    shadowColor: LaundryColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: '#93C5FD',
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: LaundryColors.textWhite,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: LaundryColors.divider,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: LaundryColors.textMuted,
  },

  // Google
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LaundryColors.backgroundWhite,
    borderRadius: 14,
    height: 52,
    borderWidth: 1.5,
    borderColor: LaundryColors.googleBorder,
    gap: 10,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: LaundryColors.textPrimary,
  },

  // Register link
  registerLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 16,
  },
  registerLinkText: {
    fontSize: 14,
    color: LaundryColors.textSecondary,
    fontWeight: '500',
  },
  registerLinkAction: {
    fontSize: 14,
    color: LaundryColors.textLink,
    fontWeight: '700',
  },

  // Role cards
  roleCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  roleCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  roleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  roleCardLabel: {
    fontSize: 10,
    color: LaundryColors.textSecondary,
    marginBottom: 2,
  },
  roleCardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  roleCardName: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Terms
  termsRow: {
    marginTop: 4,
    marginBottom: 8,
  },
  termsText: {
    fontSize: 11,
    color: LaundryColors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
  termsLink: {
    color: LaundryColors.textLink,
    fontWeight: '600',
  },
});

