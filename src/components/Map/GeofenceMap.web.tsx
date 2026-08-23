import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { GeofenceMapProps } from './GeofenceMap';

export function GeofenceMap({ radius, name, outOfBounds }: GeofenceMapProps) {
  return (
    <View style={styles.container}>
      <MapPin size={24} color={outOfBounds ? '#EF4444' : '#0D7377'} />
      <Text style={[styles.text, { color: outOfBounds ? '#EF4444' : '#0D7377' }]}>
        {outOfBounds ? 'Out of Bounds' : 'Location Tracking Active'}
      </Text>
      <Text style={styles.subtext}>{name || 'Office'} · {radius ?? 200}m radius</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 170,
    backgroundColor: '#F0F7F7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
  subtext: {
    fontSize: 11,
    color: '#64748B',
  },
});
