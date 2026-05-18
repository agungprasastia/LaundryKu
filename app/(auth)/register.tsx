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
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { LaundryColors } from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RoleType = 'pelanggan' | 'mitra' | 'kurir';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();

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
  }, []);

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

  const handleRegister = () => {
    // TODO: Implement register logic
    console.log('Register:', { namaLengkap, email, noHp, password, selectedRole });
  };

  const navigateToLogin = () => {
    router.back();
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
                  onChangeText={setNamaLengkap}
                  autoCapitalize="words"
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
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
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
                  placeholder="Buat password"
                  placeholderTextColor={LaundryColors.inputPlaceholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
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
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
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
                  !agreeTerms && styles.registerButtonDisabled,
                ]}
                onPress={handleRegister}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
                disabled={!agreeTerms}
              >
                <Text style={styles.registerButtonText}>Daftar</Text>
                <Ionicons name="arrow-forward" size={20} color={LaundryColors.textWhite} />
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>atau lanjut dengan</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Button */}
            <TouchableOpacity style={styles.googleButton} activeOpacity={0.8}>
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
    fontSize: 22,
    fontWeight: '700',
    color: LaundryColors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: LaundryColors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 22,
  },

  // Input
  inputGroup: {
    marginBottom: 14,
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

  // Role cards
  roleCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleCard: {
    flex: 1,
    borderRadius: 14,
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
    borderRadius: 10,
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
    marginBottom: 18,
    marginTop: 4,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
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
    fontSize: 13,
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
    borderRadius: 14,
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
    marginVertical: 18,
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

  // Login link
  loginLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
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
