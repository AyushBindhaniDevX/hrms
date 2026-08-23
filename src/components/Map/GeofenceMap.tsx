import React from 'react';
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { View, StyleSheet, Text } from 'react-native';
import { Navigation } from 'lucide-react-native';

export interface GeofenceMapProps {
  latitude: number;
  longitude: number;
  radius?: number;
  name?: string;
  outOfBounds?: boolean;
}

export function GeofenceMap({ latitude, longitude, radius, name, outOfBounds }: GeofenceMapProps) {
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
});
