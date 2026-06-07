import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { LaundryColors } from '@/constants/colors';
import {
  ALL_ORDER_STATUSES,
  getStatusColor,
  getStatusLabel,
} from '@/constants/orderStatus';
import { Order } from '@/types/order';

function formatTimelineDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function StatusTimeline({ order }: { order: Order }) {
  const currentStatusIndex = ALL_ORDER_STATUSES.indexOf(order.status);
  const trackingMap = new Map<string, { timestamp: string; description?: string }>();

  order.status_history?.forEach((entry) => {
    trackingMap.set(entry.status, { timestamp: entry.at });
  });

  return (
    <View style={styles.container}>
      {ALL_ORDER_STATUSES.map((status, index) => {
        const isCompleted = index <= currentStatusIndex;
        const isCurrent = index === currentStatusIndex;
        const entry = trackingMap.get(status);
        const statusColor = isCompleted ? getStatusColor(status) : LaundryColors.textMuted;

        return (
          <View key={status} style={styles.step}>
            {index > 0 ? (
              <View
                style={[
                  styles.connector,
                  { backgroundColor: isCompleted ? LaundryColors.primary : '#E2E8F0' },
                ]}
              />
            ) : null}

            <View style={styles.stepRow}>
              <View
                style={[
                  styles.dot,
                  isCompleted && { backgroundColor: statusColor, borderColor: statusColor },
                  isCurrent && styles.dotCurrent,
                ]}
              >
                {isCompleted ? <Ionicons name="checkmark" size={10} color="#FFFFFF" /> : null}
              </View>

              <View style={styles.labelWrap}>
                <Text
                  style={[
                    styles.label,
                    isCompleted && { color: LaundryColors.textPrimary, fontWeight: '600' },
                    isCurrent && { fontWeight: '700' },
                  ]}
                >
                  {getStatusLabel(status)}
                </Text>
                {entry?.timestamp ? (
                  <Text style={styles.timestamp}>{formatTimelineDate(entry.timestamp)}</Text>
                ) : null}
                {entry?.description ? (
                  <Text style={styles.description}>{entry.description}</Text>
                ) : null}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8, paddingLeft: 4 },
  step: { position: 'relative' },
  connector: {
    position: 'absolute',
    left: 9,
    top: 0,
    width: 2,
    height: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 12,
    gap: 10,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  dotCurrent: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
  },
  labelWrap: { flex: 1 },
  label: { fontSize: 12, color: LaundryColors.textMuted },
  timestamp: { fontSize: 10, color: LaundryColors.textMuted, marginTop: 1 },
  description: { fontSize: 10, color: LaundryColors.textSecondary, marginTop: 1 },
});
