/**
 * LaundryKu Design System Colors
 * Consistent color palette matching the brand identity
 */

export const lightColors = {
  // Primary brand colors
  primary: '#2563EB',        // Main blue
  primaryLight: '#60A5FA',   // Light blue
  primaryDark: '#1D4ED8',    // Dark blue
  primaryGradientStart: '#3B82F6',
  primaryGradientEnd: '#1D4ED8',

  // Background
  background: '#F0F4FF',     // Very light blue-gray
  backgroundWhite: '#FFFFFF',
  headerBg: '#E8F0FE',       // Light blue for header area

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textWhite: '#FFFFFF',
  textLink: '#2563EB',

  // Input
  inputBorder: '#E2E8F0',
  inputBg: '#FFFFFF',
  inputIcon: '#94A3B8',
  inputPlaceholder: '#A0AEC0',

  // Cards & surfaces
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0',
  cardSelected: '#EBF5FF',
  cardSelectedBorder: '#2563EB',

  // Role cards
  rolePelangganBg: '#EBF5FF',
  rolePelangganIcon: '#2563EB',
  roleMitraBg: '#ECFDF5',
  roleMitraIcon: '#10B981',
  roleKurirBg: '#FFF7ED',
  roleKurirIcon: '#F97316',

  // Status / semantic
  warning: '#F97316',
  info: '#0EA5E9',
  purple: '#8B5CF6',
  indigo: '#6366F1',
  amber: '#F59E0B',

  // Light surfaces (reusable)
  surfaceSlate: '#F8FAFC',
  surfaceGray: '#F1F5F9',
  surfaceBlueTint: '#EFF6FF',
  surfacePurple: '#F5F3FF',
  surfaceIndigo: '#EEF2FF',

  // Error surfaces
  errorBg: '#FEF2F2',
  errorBorder: '#FECACA',

  // Notification unread
  notifUnreadBg: '#FAFCFF',

  // Wallet
  walletOwnerLightText: '#D1FAE5',
  walletOwnerDarkLabel: '#065F46',
  walletOwnerDarkValue: '#064E3B',
  walletCourierLightText: '#FFEDD5',
  walletCourierDarkLabel: '#9A3412',
  walletCourierDarkValue: '#7C2D12',
  amberDark: '#92400E',

  // Misc
  divider: '#E2E8F0',
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowDark: '#000000',
  checkmark: '#2563EB',
  googleBorder: '#E2E8F0',
  error: '#EF4444',
  success: '#10B981',
  successDark: '#059669',
  leaf: '#4CAF50',
  leafBg: 'rgba(76, 175, 80, 0.12)',
};

export const darkColors = {
  primary: '#3B82F6',
  primaryLight: '#93C5FD',
  primaryDark: '#2563EB',
  primaryGradientStart: '#60A5FA',
  primaryGradientEnd: '#2563EB',

  background: '#0F172A',     // Deep slate
  backgroundWhite: '#1E293B', // Slightly lighter slate for cards
  headerBg: '#1E293B',

  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textWhite: '#FFFFFF',
  textLink: '#60A5FA',

  inputBorder: '#334155',
  inputBg: '#1E293B',
  inputIcon: '#64748B',
  inputPlaceholder: '#475569',

  cardBg: '#1E293B',
  cardBorder: '#334155',
  cardSelected: '#1E3A8A',
  cardSelectedBorder: '#3B82F6',

  rolePelangganBg: '#1E3A8A',
  rolePelangganIcon: '#60A5FA',
  roleMitraBg: '#064E3B',
  roleMitraIcon: '#34D399',
  roleKurirBg: '#7C2D12',
  roleKurirIcon: '#FB923C',

  warning: '#FB923C',
  info: '#38BDF8',
  purple: '#A78BFA',
  indigo: '#818CF8',
  amber: '#FBBF24',

  surfaceSlate: '#1E293B',
  surfaceGray: '#334155',
  surfaceBlueTint: '#1E3A8A',
  surfacePurple: '#4C1D95',
  surfaceIndigo: '#3730A3',

  errorBg: '#7F1D1D',
  errorBorder: '#991B1B',

  notifUnreadBg: '#1E3A8A',

  walletOwnerLightText: '#D1FAE5',
  walletOwnerDarkLabel: '#6EE7B7',
  walletOwnerDarkValue: '#34D399',
  walletCourierLightText: '#FFEDD5',
  walletCourierDarkLabel: '#FDBA74',
  walletCourierDarkValue: '#FB923C',
  amberDark: '#FDE68A',

  divider: '#334155',
  shadow: 'rgba(0, 0, 0, 0.4)',
  shadowDark: '#000000',
  checkmark: '#60A5FA',
  googleBorder: '#334155',
  error: '#F87171',
  success: '#34D399',
  successDark: '#10B981',
  leaf: '#4CAF50',
  leafBg: 'rgba(76, 175, 80, 0.2)',
};

export type ThemeColors = typeof lightColors;

// Default export for backward compatibility during transition
export const LaundryColors = lightColors;
