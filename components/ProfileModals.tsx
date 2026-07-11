import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStyles } from '@/hooks/useAppStyles';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ visible, onClose }: ModalProps) => {
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const { isDarkMode, setTheme, colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pengaturan</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={LaundryColors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>Notifikasi</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Notifikasi Push</Text>
              <Switch value={pushNotif} onValueChange={setPushNotif} trackColor={{ true: LaundryColors.primary, false: LaundryColors.inputBorder }} thumbColor="#fff" />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Notifikasi Email</Text>
              <Switch value={emailNotif} onValueChange={setEmailNotif} trackColor={{ true: LaundryColors.primary, false: LaundryColors.inputBorder }} thumbColor="#fff" />
            </View>
            
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Tampilan</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Mode Gelap</Text>
              <Switch value={isDarkMode} onValueChange={setTheme} trackColor={{ true: LaundryColors.primary, false: LaundryColors.inputBorder }} thumbColor="#fff" />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export const HelpModal = ({ visible, onClose }: ModalProps) => {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Bantuan</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={LaundryColors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity style={styles.helpItem} activeOpacity={0.7}>
              <Ionicons name="logo-whatsapp" size={24} color={LaundryColors.success} />
              <View style={styles.helpItemText}>
                <Text style={styles.helpItemTitle}>Hubungi WhatsApp</Text>
                <Text style={styles.helpItemDesc}>Chat langsung dengan admin</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={LaundryColors.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.helpItem} activeOpacity={0.7}>
              <Ionicons name="mail-outline" size={24} color={LaundryColors.primary} />
              <View style={styles.helpItemText}>
                <Text style={styles.helpItemTitle}>Email Support</Text>
                <Text style={styles.helpItemDesc}>Kirim email ke cs@laundryku.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={LaundryColors.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.helpItem} activeOpacity={0.7}>
              <Ionicons name="book-outline" size={24} color="#8B5CF6" />
              <View style={styles.helpItemText}>
                <Text style={styles.helpItemTitle}>FAQ</Text>
                <Text style={styles.helpItemDesc}>Pertanyaan yang sering diajukan</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={LaundryColors.textMuted} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export const AboutModal = ({ visible, onClose }: ModalProps) => {
  const { colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlayFade}>
        <View style={styles.aboutModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tentang Aplikasi</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={LaundryColors.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.aboutContent}>
            <View style={styles.logoContainer}>
              <Ionicons name="water" size={48} color={LaundryColors.textWhite} />
            </View>
            <Text style={styles.appName}>LaundryKu</Text>
            <Text style={styles.appVersion}>Versi 1.0.0</Text>
            <Text style={styles.appDesc}>
              Platform manajemen laundry digital terbaik. Mudahkan pengelolaan outlet, pantau kurir, dan layani pelanggan dengan cepat, aman, dan terpercaya.
            </Text>
            <View style={styles.separator} />
            <Text style={styles.copyright}>© 2026 LaundryKu. All rights reserved.</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (LaundryColors: any) => StyleSheet.create({
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalOverlayFade: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalContainer: {
    backgroundColor: LaundryColors.backgroundWhite, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    height: '60%',
  },
  aboutModalContainer: {
    backgroundColor: LaundryColors.backgroundWhite, borderRadius: 24,
    width: '100%', paddingBottom: 16, overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 24, borderBottomWidth: 1, borderBottomColor: LaundryColors.inputBorder,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: LaundryColors.textPrimary },
  scrollContent: { padding: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: LaundryColors.textSecondary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  settingLabel: { fontSize: 16, fontWeight: '500', color: LaundryColors.textPrimary },
  helpItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: LaundryColors.backgroundWhite, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: LaundryColors.inputBorder },
  helpItemText: { flex: 1, marginLeft: 16 },
  helpItemTitle: { fontSize: 16, fontWeight: '600', color: LaundryColors.textPrimary },
  helpItemDesc: { fontSize: 13, color: LaundryColors.textSecondary, marginTop: 4 },
  aboutContent: { alignItems: 'center', padding: 24 },
  logoContainer: { width: 88, height: 88, borderRadius: 24, backgroundColor: LaundryColors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: LaundryColors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  appName: { fontSize: 24, fontWeight: 'bold', color: LaundryColors.textPrimary },
  appVersion: { fontSize: 14, color: LaundryColors.textMuted, marginTop: 4, marginBottom: 16 },
  appDesc: { fontSize: 14, color: LaundryColors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  separator: { height: 1, backgroundColor: LaundryColors.inputBorder, width: '100%', marginBottom: 20 },
  copyright: { fontSize: 12, color: LaundryColors.textMuted },
});
