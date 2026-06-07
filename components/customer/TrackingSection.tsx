import { Text, View } from 'react-native';
import TrackingMap, { normalizeCourierLocation } from '@/components/TrackingMap';
import { getStatusLabel } from '@/constants/orderStatus';
import { Order, OrderTracking } from '@/types/order';

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

export function TrackingSection({ order, tracking }: { order: Order; tracking: OrderTracking | null }) {
  const courierLocation = normalizeCourierLocation(tracking);
  const updatedText = courierLocation.updatedAt ? formatTimelineDate(courierLocation.updatedAt) : null;

  return (
    <View style={{ gap: 8 }}>
      <TrackingMap
        courierLat={courierLocation.lat}
        courierLng={courierLocation.lng}
        pickupLat={order.pickup_lat}
        pickupLng={order.pickup_lng}
        ownerLat={order.owner_lat}
        ownerLng={order.owner_lng}
        height={220}
        showRouteLine
      />
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#1A1A2E' }}>
        Status: {getStatusLabel(order.status)}
      </Text>
      <Text style={{ fontSize: 12, color: '#64748B' }}>
        {courierLocation.lat != null && courierLocation.lng != null
          ? `Lokasi kurir terakhir diperbarui${updatedText ? `: ${updatedText}` : '.'}`
          : 'Kurir belum mengirim lokasi.'}
      </Text>
    </View>
  );
}
