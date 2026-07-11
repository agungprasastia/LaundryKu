import React, { useState, useCallback, createContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStyles } from '@/hooks/useAppStyles';
import { AlertButton, setGlobalAlert } from './crossAlert';

// ─── Context ───
interface AlertContextType {
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
}

const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
});

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
}

/**
 * AlertProvider — wraps your app to provide styled modal dialogs on web.
 * On native, crossAlert() already uses Alert.alert directly, so this is only needed for web.
 */
export function AlertProvider({ children }: { children: React.ReactNode }) {
  const { isDarkMode, colors: LaundryColors } = useTheme();
  const styles = useAppStyles(createStyles);
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: undefined,
    buttons: [],
  });

  const showAlert = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      setAlertState({
        visible: true,
        title,
        message,
        buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }],
      });
    },
    []
  );

  // Register this showAlert as the global handler for crossAlert()
  useEffect(() => {
    if (Platform.OS === 'web') {
      setGlobalAlert(showAlert);
      return () => setGlobalAlert(null);
    }
  }, [showAlert]);

  const handleDismiss = useCallback((button?: AlertButton) => {
    setAlertState((prev) => ({ ...prev, visible: false }));
    if (button?.onPress) {
      setTimeout(() => button.onPress!(), 150);
    }
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {Platform.OS === 'web' && alertState.visible && (
        <Modal
          transparent
          visible={alertState.visible}
          animationType="fade"
          onRequestClose={() => handleDismiss()}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => {
              // If only 1 button (OK), dismiss on backdrop tap
              if (alertState.buttons.length <= 1) {
                handleDismiss(alertState.buttons[0]);
              }
            }}
          >
            <View style={styles.dialogCard}>
              {/* Title */}
              <Text style={styles.dialogTitle}>{alertState.title}</Text>

              {/* Message */}
              {alertState.message ? (
                <Text style={styles.dialogMessage}>{alertState.message}</Text>
              ) : null}

              {/* Buttons */}
              <View style={styles.buttonRow}>
                {alertState.buttons.map((btn, i) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';
                  const isSingle = alertState.buttons.length === 1;

                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.dialogButton,
                        isSingle && styles.dialogButtonFull,
                        isCancel && styles.dialogButtonCancel,
                        isDestructive && styles.dialogButtonDestructive,
                        !isCancel && !isDestructive && !isSingle && styles.dialogButtonPrimary,
                      ]}
                      onPress={() => handleDismiss(btn)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.dialogButtonText,
                          isCancel && styles.dialogButtonTextCancel,
                          isDestructive && styles.dialogButtonTextDestructive,
                          !isCancel && !isDestructive && styles.dialogButtonTextPrimary,
                        ]}
                      >
                        {btn.text || 'OK'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </AlertContext.Provider>
  );
}

// ─── Styles ───
const createStyles = (LaundryColors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  dialogCard: {
    backgroundColor: LaundryColors.cardBg,
    borderRadius: 18,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: LaundryColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  dialogMessage: {
    fontSize: 14,
    color: LaundryColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  dialogButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogButtonFull: {
    backgroundColor: LaundryColors.primary,
  },
  dialogButtonCancel: {
    backgroundColor: LaundryColors.surfaceGray,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dialogButtonDestructive: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dialogButtonPrimary: {
    backgroundColor: LaundryColors.primary,
  },
  dialogButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dialogButtonTextCancel: {
    color: LaundryColors.textSecondary,
  },
  dialogButtonTextDestructive: {
    color: LaundryColors.error,
  },
  dialogButtonTextPrimary: {
    color: LaundryColors.textWhite,
  },
});
