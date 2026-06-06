import { Platform, Alert } from 'react-native';

// ─── Types ───
export interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

// ─── Global reference for AlertProvider to register itself ───
let _globalShowAlert: ((title: string, message?: string, buttons?: AlertButton[]) => void) | null = null;

export function setGlobalAlert(fn: typeof _globalShowAlert) {
  _globalShowAlert = fn;
}

/**
 * Cross-platform alert that works on both web and native.
 *
 * On native: uses React Native's Alert.alert (modal dialog)
 * On web:
 *   - If AlertProvider is mounted → shows styled modal dialog
 *   - Fallback → uses window.confirm / window.alert
 *
 * Usage:
 *   crossAlert('Title', 'Message');                           // simple alert
 *   crossAlert('Title', 'Message', [                          // confirm dialog
 *     { text: 'Cancel', style: 'cancel' },
 *     { text: 'OK', onPress: () => doSomething() },
 *   ]);
 */
export function crossAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
): void {
  // If AlertProvider is mounted, use styled modal
  if (_globalShowAlert) {
    _globalShowAlert(title, message, buttons);
    return;
  }

  // Native fallback
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  // Web fallback (no AlertProvider)
  if (!buttons || buttons.length <= 1) {
    window.alert(message ? `${title}\n\n${message}` : title);
    if (buttons?.[0]?.onPress) buttons[0].onPress();
    return;
  }

  const cancelBtn = buttons.find((b) => b.style === 'cancel');
  const actionBtn = buttons.find((b) => b.style !== 'cancel') || buttons[buttons.length - 1];
  const confirmed = window.confirm(message ? `${title}\n\n${message}` : title);
  if (confirmed) {
    actionBtn?.onPress?.();
  } else {
    cancelBtn?.onPress?.();
  }
}
