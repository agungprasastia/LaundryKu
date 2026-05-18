import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LaundryColors } from '@/constants/colors';

// ─── Data ────────────────────────────────────────
const statsData = [
  {
    icon: 'people',
    iconLib: 'ion',
    label: 'Total User',
    value: '12.540',
    change: '↑ 8,2%',
    changeSub: 'vs kemarin',
    color: '#2563EB',
    bg: '#EBF5FF',
  },
  {
    icon: 'cube',
    iconLib: 'ion',
    label: 'Total Order',
    value: '1.248',
    change: '↑ 12,4%',
    changeSub: 'vs kemarin',
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    icon: 'bicycle',
    iconLib: 'ion',
    label: 'Active Couriers',
    value: '320',
    change: '↑ 5,6%',
    changeSub: 'vs kemarin',
    color: '#F97316',
    bg: '#FFF7ED',
  },
  {
    icon: 'cash',
    iconLib: 'ion',
    label: 'Revenue',
    value: 'Rp 24.860.000',
    change: '↑ 15,3%',
    changeSub: 'vs kemarin',
    color: '#EF4444',
    bg: '#FEF2F2',
  },
];

const quickActions = [
  { icon: 'checkmark-circle', label: 'Verifikasi\nMitra', color: '#2563EB', bg: '#EBF5FF' },
  { icon: 'checkmark-circle', label: 'Verifikasi\nKurir', color: '#2563EB', bg: '#EBF5FF' },
  { icon: 'people', label: 'Kelola\nPengguna', color: '#2563EB', bg: '#EBF5FF' },
  { icon: 'desktop', label: 'Monitoring\nSistem', color: '#2563EB', bg: '#EBF5FF' },
  { icon: 'chatbubble-ellipses', label: 'Komplain', color: '#2563EB', bg: '#EBF5FF' },
];

const pendingVerifications = [
  {
    name: 'Laundry Bersih Depok',
    role: 'Mitra Laundry',
    date: 'Didaftarkan: 15 Mei 2024, 10:30',
    avatar: '🏪',
    avatarBg: '#EBF5FF',
  },
  {
    name: 'Budi Santoso',
    role: 'Kurir',
    date: 'Didaftarkan: 15 Mei 2024, 09:45',
    avatar: '👤',
    avatarBg: '#FFF7ED',
  },
  {
    name: 'Laundry Express',
    role: 'Mitra Laundry',
    date: 'Didaftarkan: 15 Mei 2024, 09:10',
    avatar: '🏪',
    avatarBg: '#ECFDF5',
  },
];

const activities = [
  {
    icon: 'cash-outline',
    iconColor: '#10B981',
    iconBg: '#ECFDF5',
    title: 'Pembayaran berhasil dari Order #ORD-20240515-1023',
    sub: 'Oleh Budi Santoso',
    time: '10:32',
  },
  {
    icon: 'receipt-outline',
    iconColor: '#2563EB',
    iconBg: '#EBF5FF',
    title: 'Order baru #ORD-20240515-1024',
    sub: 'Oleh Siti Aisyah',
    time: '10:18',
  },
  {
    icon: 'warning-outline',
    iconColor: '#EF4444',
    iconBg: '#FEF2F2',
    title: 'Laporan komplain baru diterima',
    sub: 'Order #ORD-20240515-0987',
    time: '09:56',
  },
  {
    icon: 'person-add-outline',
    iconColor: '#8B5CF6',
    iconBg: '#F5F3FF',
    title: 'Pengguna baru mendaftar',
    sub: 'Rina Apriani sebagai Mitra Laundry',
    time: '09:41',
  },
];

const systemStatuses = [
  { label: 'API', status: 'Normal', color: '#10B981' },
  { label: 'Payment', status: 'Normal', color: '#10B981' },
  { label: 'Maps', status: 'Normal', color: '#10B981' },
  { label: 'Notification', status: 'Normal', color: '#10B981' },
];

// ─── Component ───────────────────────────────────
export default function AdminBerandaScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── HEADER ─── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerGreeting}>Halo, Admin 👋</Text>
              <Text style={styles.headerSub}>Selamat datang di LaundryKu Admin</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notifButton}>
            <Ionicons name="notifications-outline" size={24} color={LaundryColors.textPrimary} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* ─── RINGKASAN PLATFORM ─── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ringkasan Platform</Text>
            <TouchableOpacity style={styles.filterBtn}>
              <Text style={styles.filterText}>Hari ini</Text>
              <Ionicons name="chevron-down" size={14} color={LaundryColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            {statsData.map((stat, i) => (
              <View key={i} style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: stat.bg }]}>
                  <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                </View>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statChange}>
                  <Text style={{ color: '#10B981' }}>{stat.change}</Text>
                  {'  '}
                  <Text style={{ color: LaundryColors.textMuted }}>{stat.changeSub}</Text>
                </Text>
              </View>
            ))}
          </View>

          {/* ─── AKSI CEPAT ─── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Aksi Cepat</Text>
          </View>

          <View style={styles.quickActionsCard}>
            <View style={styles.quickActionsRow}>
              {quickActions.map((action, i) => (
                <TouchableOpacity key={i} style={styles.quickActionItem} activeOpacity={0.7}>
                  <View style={[styles.quickActionIcon, { backgroundColor: action.bg }]}>
                    <Ionicons name={action.icon as any} size={24} color={action.color} />
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ─── VERIFIKASI PENDING ─── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Verifikasi Pending</Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>Lihat Semua {'>'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pendingCard}>
            {pendingVerifications.map((item, i) => (
              <View
                key={i}
                style={[
                  styles.pendingItem,
                  i < pendingVerifications.length - 1 && styles.pendingItemBorder,
                ]}
              >
                <View style={[styles.pendingAvatar, { backgroundColor: item.avatarBg }]}>
                  <Text style={{ fontSize: 20 }}>{item.avatar}</Text>
                </View>
                <View style={styles.pendingInfo}>
                  <Text style={styles.pendingName}>{item.name}</Text>
                  <Text style={styles.pendingRole}>{item.role}</Text>
                  <Text style={styles.pendingDate}>{item.date}</Text>
                </View>
                <View style={styles.pendingActions}>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Menunggu Verifikasi</Text>
                  </View>
                  <TouchableOpacity style={styles.cekButton} activeOpacity={0.7}>
                    <Text style={styles.cekButtonText}>Cek</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* ─── AKTIVITAS PLATFORM ─── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Aktivitas Platform</Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>Lihat Semua {'>'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityCard}>
            {activities.map((act, i) => (
              <View
                key={i}
                style={[
                  styles.activityItem,
                  i < activities.length - 1 && styles.activityItemBorder,
                ]}
              >
                <View style={[styles.activityIcon, { backgroundColor: act.iconBg }]}>
                  <Ionicons name={act.icon as any} size={18} color={act.iconColor} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle} numberOfLines={2}>{act.title}</Text>
                  <Text style={styles.activitySub}>{act.sub}</Text>
                </View>
                <Text style={styles.activityTime}>{act.time}</Text>
              </View>
            ))}
          </View>

          {/* ─── STATUS SISTEM ─── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Status Sistem</Text>
          </View>

          <View style={styles.systemStatusCard}>
            <View style={styles.systemStatusRow}>
              {systemStatuses.map((sys, i) => (
                <View key={i} style={styles.systemStatusItem}>
                  <View style={[styles.systemStatusDot, { backgroundColor: sys.color }]}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                  <Text style={styles.systemStatusLabel}>{sys.label}</Text>
                  <Text style={[styles.systemStatusValue, { color: sys.color }]}>{sys.status}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 20 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LaundryColors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: LaundryColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGreeting: {
    fontSize: 16,
    fontWeight: '700',
    color: LaundryColors.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: LaundryColors.textSecondary,
    marginTop: 1,
  },
  notifButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: LaundryColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  /* Section headers */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: LaundryColors.textPrimary,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterText: {
    fontSize: 13,
    color: LaundryColors.textSecondary,
    fontWeight: '500',
  },
  linkText: {
    fontSize: 13,
    color: LaundryColors.primary,
    fontWeight: '600',
  },

  /* Stats */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: LaundryColors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: LaundryColors.textPrimary,
    marginBottom: 3,
  },
  statChange: {
    fontSize: 9,
    lineHeight: 13,
  },

  /* Quick Actions */
  quickActionsCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 10,
    color: LaundryColors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
  },

  /* Pending Verifications */
  pendingCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    overflow: 'hidden',
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  pendingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: LaundryColors.inputBorder,
  },
  pendingAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pendingInfo: {
    flex: 1,
  },
  pendingName: {
    fontSize: 13,
    fontWeight: '700',
    color: LaundryColors.textPrimary,
  },
  pendingRole: {
    fontSize: 11,
    color: LaundryColors.textSecondary,
    marginTop: 1,
  },
  pendingDate: {
    fontSize: 10,
    color: LaundryColors.textMuted,
    marginTop: 2,
  },
  pendingActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  pendingBadge: {
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingBadgeText: {
    fontSize: 9,
    color: '#F97316',
    fontWeight: '600',
  },
  cekButton: {
    borderWidth: 1.5,
    borderColor: LaundryColors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  cekButtonText: {
    fontSize: 12,
    color: LaundryColors.primary,
    fontWeight: '700',
  },

  /* Activity */
  activityCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: LaundryColors.inputBorder,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activityInfo: {
    flex: 1,
    marginRight: 8,
  },
  activityTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: LaundryColors.textPrimary,
    lineHeight: 17,
  },
  activitySub: {
    fontSize: 11,
    color: LaundryColors.textMuted,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    color: LaundryColors.textSecondary,
    fontWeight: '600',
  },

  /* System Status */
  systemStatusCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: LaundryColors.inputBorder,
  },
  systemStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  systemStatusItem: {
    alignItems: 'center',
    gap: 4,
  },
  systemStatusDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemStatusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: LaundryColors.textPrimary,
  },
  systemStatusValue: {
    fontSize: 11,
    fontWeight: '500',
  },
});
