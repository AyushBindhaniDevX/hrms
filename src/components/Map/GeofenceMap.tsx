import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import Constants from 'expo-constants';
import { Navigation, MapPin } from 'lucide-react-native';

export interface GeofenceMapProps {
  latitude: number;
  longitude: number;
  radius?: number;
  name?: string;
  outOfBounds?: boolean;
}

// ── Static, always-safe fallback (no native module) ────────────────────────────
function GeofenceFallback({ radius, name, outOfBounds }: GeofenceMapProps) {
  const color = outOfBounds ? '#EF4444' : '#0D7377';
  return (
    <View style={styles.fallback}>
      <MapPin size={24} color={color} />
      <Text style={[styles.fallbackText, { color }]}>
        {outOfBounds ? 'Out of Bounds' : 'Location Tracking Active'}
      </Text>
      <Text style={styles.fallbackSub}>{name || 'Office'} · {radius ?? 200}m radius</Text>
    </View>
  );
}

/**
 * Returns true only when a real Google Maps Android key is configured.
 * Rendering a native Google MapView with a missing/placeholder key crashes
 * release Android builds at native init (uncatchable by JS error boundaries),
 * so we gate the native map behind this check and degrade to a static card.
 */
function hasValidAndroidMapsKey(): boolean {
  try {
    const key = (Constants?.expoConfig as any)?.android?.config?.googleMaps?.apiKey;
    if (typeof key !== 'string') return false;
    const trimmed = key.trim();
    if (!trimmed) return false;
    // Reject the committed placeholder / obvious non-keys.
    if (trimmed.toUpperCase().includes('YOUR_') || trimmed.length < 20) return false;
    return true;
  } catch {
    return false;
  }
}

// ── Error boundary so any render/runtime failure degrades instead of crashing ──
class MapErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    // Swallow — the geofence map is non-critical; never take down the screen.
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function NativeGeofenceMap(props: GeofenceMapProps) {
  const { latitude, longitude, radius, name, outOfBounds } = props;

  // Lazy require so the native module is only pulled in when we actually mount it.
  let MapView: any, Circle: any, Marker: any, PROVIDER_DEFAULT: any;
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Circle = Maps.Circle;
    Marker = Maps.Marker;
    PROVIDER_DEFAULT = Maps.PROVIDER_DEFAULT;
  } catch {
    return <GeofenceFallback {...props} />;
  }

  if (!MapView) return <GeofenceFallback {...props} />;

  return (
    <>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.mapView}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        mapType="standard"
      >
        <Circle
          center={{ latitude, longitude }}
          radius={radius ?? 200}
          fillColor={outOfBounds ? 'rgba(239,68,68,0.12)' : 'rgba(13,115,119,0.12)'}
          strokeColor={outOfBounds ? '#EF4444' : '#0D7377'}
          strokeWidth={2}
        />
        <Marker
          coordinate={{ latitude, longitude }}
          title={name || 'Workplace'}
          pinColor={outOfBounds ? '#EF4444' : '#0D7377'}
        />
      </MapView>
      <View style={styles.mapLabel}>
        <Navigation size={11} color={outOfBounds ? '#EF4444' : '#0D7377'} />
        <Text style={[styles.mapLabelText, { color: outOfBounds ? '#EF4444' : '#0D7377' }]}>
          {name || 'Office'} · {radius ?? 200}m radius
        </Text>
      </View>
    </>
  );
}

export function GeofenceMap(props: GeofenceMapProps) {
  // Only Android needs the Google Maps key gate. iOS uses Apple Maps by default.
  if (Platform.OS === 'android' && !hasValidAndroidMapsKey()) {
    return <GeofenceFallback {...props} />;
  }

  const fallback = <GeofenceFallback {...props} />;
  return (
    <MapErrorBoundary fallback={fallback}>
      <NativeGeofenceMap {...props} />
    </MapErrorBoundary>
  );
}

const styles = StyleSheet.create({
  mapView: {
    width: '100%',
    height: 170,
  },
  mapLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mapLabelText: { fontSize: 11, fontWeight: '700' },
  fallback: {
    width: '100%',
    height: 170,
    backgroundColor: '#F0F7F7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fallbackText: {
    fontSize: 13,
    fontWeight: '700',
  },
  fallbackSub: {
    fontSize: 11,
    color: '#64748B',
  },
});
