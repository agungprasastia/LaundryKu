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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { LaundryColors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_MAP, FrontendRole, UserRole } from '@/types/user';

type RoleType = 'pelanggan' | 'mitra' | 'kurir';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const { register } = useAuth();

  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [noHp, setNoHp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleType>(
    (params.role as RoleType) || 'pelanggan'
  );
  const [agreeTerms, setAgreeTerms] = useState(false);
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

  /**
   * Validate email format
   */
  const isValidEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleRegister = async () => {
    // Clear previous errors
    setErrorMessage('');

    // Validate
    if (!namaLengkap.trim()) {
      setErrorMessage('Nama lengkap wajib diisi');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Email wajib diisi');
      return;
    }
    if (!isValidEmail(email.trim())) {
      setErrorMessage('Format email tidak valid');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password minimal 6 karakter');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Anda harus menyetujui Syarat & Ketentuan');
      return;
    }

    // Map frontend role to backend role
    const backendRole: UserRole = ROLE_MAP[selectedRole as FrontendRole];

    // Build payload
    const payload: any = {
      full_name: namaLengkap.trim(),
      email: email.trim(),
      password: password,
      role: backendRole,
      address: null,
      lat: null,
      lng: null,
    };

    // Add courier-specific fields
    if (backendRole === 'courier') {
      payload.vehicle_name = null;
      payload.vehicle_plate_number = null;
    }

    setLoading(true);
    try {
      const result = await register(payload);

      if (result.success) {
        if (backendRole === 'customer') {
          // Customer → redirect to login with success message
          crossAlert(
            'Registrasi Berhasil',
            'Akun pelanggan Anda berhasil dibuat. Silakan login.',
            [
              {
                text: 'Login Sekarang',
                onPress: () => router.replace('/(auth)/login'),
              },
            ]
          );
        } else {
          // Owner/Courier → show verification message
          crossAlert(
            'Registrasi Berhasil',
            `Akun ${backendRole === 'owner' ? 'Mitra Laundry' : 'Kurir'} Anda berhasil dibuat. Akun harus diverifikasi admin sebelum bisa menggunakan fitur utama.`,
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(auth)/login'),
              },
            ]
          );
        }
      } else {
        setErrorMessage(result.message || 'Registrasi gagal');
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Registrasi gagal. Silakan coba lagi.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.back();
  };

  const handleGoogleRegister = () => {
    crossAlert(
      'Coming Soon',
      'Daftar dengan Google belum tersedia saat ini. Silakan gunakan form pendaftaran.',
      [{ text: 'OK' }]
    );
  };

  const roles: { key: RoleType; label: string; icon: string; color: string; bg: string }[] = [
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
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.headerBubble1} />
            <View style={styles.headerBubble2} />
            <View style={styles.headerBubble3} />

            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={navigateToLogin}>
              <Ionicons name="arrow-back" size={24} color={LaundryColors.textPrimary} />
            </TouchableOpacity>

            <Animated.View style={[styles.logoContainer, { transform: [{ scale: headerScale }] }]}>
              <View style={styles.logoIconWrap}>
                <Ionicons name="water" size={28} color={LaundryColors.primary} />
              </View>
              <Text style={styles.logoText}>
                Laundry<Text style={styles.logoTextAccent}>Ku</Text>
              </Text>
              <Text style={styles.logoSubtext}>
                Buat akun untuk pesan laundry,{'\n'}pickup, dan tracking real-time.
              </Text>
            </Animated.View>

            {/* Decorative items */}
            <View style={styles.decorativeRow}>
              <View style={styles.decorativeItem}>
                <Ionicons name="shirt" size={24} color={LaundryColors.primaryLight} />
              </View>
              <View style={styles.decorativeItem}>
                <MaterialIcons name="local-laundry-service" size={24} color={LaundryColors.primaryLight} />
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
            <Text style={styles.formTitle}>Daftar Akun</Text>
            <Text style={styles.formSubtitle}>
              Lengkapi data diri untuk mulai menggunakan LaundryKu.
            </Text>

            {/* Error Message */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color={LaundryColors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Nama Lengkap */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nama Lengkap</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={LaundryColors.inputIcon} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Masukkan nama lengkap"
                  placeholderTextColor={LaundryColors.inputPlaceholder}
                  value={namaLengkap}
                  onChangeText={(text) => {
                    setNamaLengkap(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Email */}
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

            {/* No. HP */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>No. HP</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color={LaundryColors.inputIcon} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Masukkan nomor handphone"
                  placeholderTextColor={LaundryColors.inputPlaceholder}
                  value={noHp}
                  onChangeText={setNoHp}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={LaundryColors.inputIcon} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Buat password (min. 6 karakter)"
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
            </View>

            {/* Konfirmasi Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Konfirmasi Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={LaundryColors.inputIcon} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ulangi password"
                  placeholderTextColor={LaundryColors.inputPlaceholder}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  secureTextEntry={!showConfirmPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color={LaundryColors.inputIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Role Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Daftar sebagai</Text>
              <View style={styles.roleCardsRow}>
                {roles.map((role) => {
                  const isSelected = selectedRole === role.key;
                  return (
                    <TouchableOpacity
                      key={role.key}
                      style={[
                        styles.roleCard,
                        { backgroundColor: role.bg },
                        isSelected && styles.roleCardSelected,
                        isSelected && { borderColor: role.color },
                      ]}
                      onPress={() => setSelectedRole(role.key)}
                      activeOpacity={0.7}
                      disabled={loading}
                    >
                      {isSelected && (
                        <View style={styles.roleCheckBadge}>
                          <Ionicons name="checkmark-circle" size={20} color={LaundryColors.checkmark} />
                        </View>
                      )}
                      <MaterialIcons name={role.icon as any} size={32} color={role.color} />
                      <Text style={[styles.roleCardName, { color: role.color }]}>{role.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity
              style={styles.termsCheckRow}
              onPress={() => setAgreeTerms(!agreeTerms)}
              activeOpacity={0.8}
              disabled={loading}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                {agreeTerms && <Ionicons name="checkmark" size={14} color={LaundryColors.textWhite} />}
              </View>
              <Text style={styles.termsCheckText}>
                Saya menyetujui{' '}
                <Text style={styles.termsLink}>Syarat & Ketentuan</Text>
                {' '}serta{' '}
                <Text style={styles.termsLink}>Kebijakan Privasi</Text>
              </Text>
            </TouchableOpacity>

            {/* Register Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  (!agreeTerms || loading) && styles.registerButtonDisabled,
                ]}
                onPress={handleRegister}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
                disabled={!agreeTerms || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={LaundryColors.textWhite} />
                ) : (
                  <>
                    <Text style={styles.registerButtonText}>Daftar</Text>
                    <Ionicons name="arrow-forward" size={20} color={LaundryColors.textWhite} />
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
              onPress={handleGoogleRegister}
            >
              <FontAwesome name="google" size={20} color="#DB4437" />
              <Text style={styles.googleButtonText}>Daftar dengan Google</Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginLinkRow}>
              <Text style={styles.loginLinkText}>Sudah punya akun? </Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text style={styles.loginLinkAction}>Masuk</Text>
              </TouchableOpacity>
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
    paddingBottom: 24,
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
  headerBubble3: {
    position: 'absolute',
    bottom: 10,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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
  logoSubtext: {
    fontSize: 12,
    color: LaundryColors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  decorativeRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  decorativeItem: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
    paddingTop: 24,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: LaundryColors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: LaundryColors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 22,
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
    fontSize: 14,
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
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: LaundryColors.inputBorder,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: LaundryColors.textPrimary,
  },
  eyeButton: {
    padding: 4,
  },

  // Role cards
  roleCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    position: 'relative',
  },
  roleCardSelected: {
    borderWidth: 2,
  },
  roleCheckBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: LaundryColors.backgroundWhite,
    borderRadius: 12,
    zIndex: 2,
  },
  roleCardName: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },

  // Terms checkbox
  termsCheckRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    marginTop: 4,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: LaundryColors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: LaundryColors.primary,
    borderColor: LaundryColors.primary,
  },
  termsCheckText: {
    flex: 1,
    fontSize: 14,
    color: LaundryColors.textSecondary,
    lineHeight: 19,
  },
  termsLink: {
    color: LaundryColors.textLink,
    fontWeight: '600',
  },

  // Register button
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LaundryColors.primary,
    borderRadius: 16,
    height: 54,
    gap: 8,
    shadowColor: LaundryColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  registerButtonDisabled: {
    backgroundColor: '#93C5FD',
    shadowOpacity: 0.1,
  },
  registerButtonText: {
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
    borderRadius: 16,
    height: 52,
    borderWidth: 1.5,
    borderColor: LaundryColors.googleBorder,
    gap: 10,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: LaundryColors.textPrimary,
  },

  // Login link
  loginLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  loginLinkText: {
    fontSize: 14,
    color: LaundryColors.textSecondary,
    fontWeight: '500',
  },
  loginLinkAction: {
    fontSize: 14,
    color: LaundryColors.textLink,
    fontWeight: '700',
  },
});

