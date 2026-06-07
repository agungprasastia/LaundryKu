import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { LaundryColors } from '@/constants/colors';
import { OrderTracking } from '@/types/order';

type TrackingMapProps = {
  courierLat?: number | string | null;
  courierLng?: number | string | null;
  pickupLat?: number | string | null;
  pickupLng?: number | string | null;
  ownerLat?: number | string | null;
  ownerLng?: number | string | null;
  height?: number;
  showRouteLine?: boolean;
};

type TrackingLocationInput = Partial<OrderTracking> & {
  courier_location?: Partial<NonNullable<OrderTracking['courier_location']>> & {
    courier_lat?: number | string | null;
    courier_lng?: number | string | null;
    updatedAt?: string;
  };
  location?: {
    lat?: number | string | null;
    lng?: number | string | null;
    courier_lat?: number | string | null;
    courier_lng?: number | string | null;
    updated_at?: string;
    updatedAt?: string;
  };
  updatedAt?: string;
};
export type NormalizedCourierLocation = {
  lat?: number;
  lng?: number;
  updatedAt?: string;
};

export const toCoordinate = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export function normalizeCourierLocation(tracking: TrackingLocationInput | null | undefined): NormalizedCourierLocation {
  const courierLocation = tracking?.courier_location;
  const location = tracking?.location;
  const lat = toCoordinate(
    tracking?.lat ??
      tracking?.courier_lat ??
      courierLocation?.lat ??
      courierLocation?.courier_lat ??
      location?.lat ??
      location?.courier_lat,
  );
  const lng = toCoordinate(
    tracking?.lng ??
      tracking?.courier_lng ??
      courierLocation?.lng ??
      courierLocation?.courier_lng ??
      location?.lng ??
      location?.courier_lng,
  );
  const updatedAt =
    tracking?.updated_at ??
    tracking?.updatedAt ??
    courierLocation?.updated_at ??
    courierLocation?.updatedAt ??
    location?.updated_at ??
    location?.updatedAt;
  return { lat, lng, updatedAt };
}

export default function TrackingMap({
  courierLat,
  courierLng,
  pickupLat,
  pickupLng,
  ownerLat,
  ownerLng,
  height = 220,
  showRouteLine = true,
}: TrackingMapProps) {
  const courier = { lat: toCoordinate(courierLat), lng: toCoordinate(courierLng) };
  const pickup = { lat: toCoordinate(pickupLat), lng: toCoordinate(pickupLng) };
  const owner = { lat: toCoordinate(ownerLat), lng: toCoordinate(ownerLng) };
  const hasCourier = courier.lat != null && courier.lng != null;
  const hasPickup = pickup.lat != null && pickup.lng != null;
  const hasOwner = owner.lat != null && owner.lng != null;

  const html = useMemo(() => {
    if (!hasCourier) return '';

    const markers = [
      { lat: courier.lat, lng: courier.lng, label: 'Kurir', color: LaundryColors.roleKurirIcon },
      hasPickup ? { lat: pickup.lat, lng: pickup.lng, label: 'Lokasi Pickup', color: LaundryColors.primary } : null,
      hasOwner ? { lat: owner.lat, lng: owner.lng, label: 'Laundry', color: LaundryColors.success } : null,
    ].filter(Boolean);
    const routeTarget = hasPickup ? [pickup.lat, pickup.lng] : hasOwner ? [owner.lat, owner.lng] : null;
    const route = showRouteLine && routeTarget ? [[courier.lat, courier.lng], routeTarget] : [];

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html,body,#map{height:100%;margin:0;background:#F0F4FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
    .pin{width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 4px 12px rgba(15,23,42,.28)}
    .leaflet-popup-content{font-weight:700;color:#1A1A2E}
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const markers = ${JSON.stringify(markers)};
    const route = ${JSON.stringify(route)};
    const map = L.map('map', { zoomControl: true, attributionControl: true }).setView([${courier.lat}, ${courier.lng}], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
    const bounds = [];
    markers.forEach((m) => {
      const icon = L.divIcon({ className: '', html: '<div class="pin" style="background:' + m.color + '"></div>', iconSize: [24,24], iconAnchor: [12,12] });
      L.marker([m.lat, m.lng], { icon }).addTo(map).bindPopup(m.label);
      bounds.push([m.lat, m.lng]);
    });
    if (route.length) L.polyline(route, { color: '${LaundryColors.roleKurirIcon}', weight: 4, opacity: .82, dashArray: '8,8' }).addTo(map);
    if (bounds.length > 1) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
  </script>
</body>
</html>`;
  }, [courier.lat, courier.lng, hasCourier, hasOwner, hasPickup, owner.lat, owner.lng, pickup.lat, pickup.lng, showRouteLine]);

  if (!hasCourier) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyTitle}>Lokasi kurir belum tersedia.</Text>
        <Text style={styles.emptyText}>Peta akan muncul setelah kurir mengirim posisi GPS.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LaundryColors.cardBorder,
    backgroundColor: LaundryColors.cardBg,
  },
  webview: { flex: 1, backgroundColor: LaundryColors.cardBg },
  empty: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LaundryColors.cardBorder,
    backgroundColor: LaundryColors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  emptyTitle: { fontSize: 13, fontWeight: '800', color: LaundryColors.textSecondary, textAlign: 'center' },
  emptyText: { fontSize: 11, color: LaundryColors.textMuted, textAlign: 'center', marginTop: 4 },
});







