import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export async function getCurrentLocation(): Promise<LocationCoords> {
  if (Platform.OS === 'web') {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => reject(new Error(err.message || 'Unable to retrieve location')),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }

  // Mobile (Android / iOS)
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied. Please enable location access in your device settings.');
  }

  try {
    // 1. Try to get last known position first for instant response
    const lastKnown = await Location.getLastKnownPositionAsync({});
    if (lastKnown && lastKnown.coords) {
      // If position was recorded in the last 2 minutes, use it
      const ageMs = Date.now() - lastKnown.timestamp;
      if (ageMs < 120000) {
        return {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
        };
      }
    }
  } catch (e) {
    // Ignore and proceed to live fetch
  }

  try {
    // 2. Fetch live position with 6-second timeout promise race
    const livePromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('GPS location request timed out')), 7000)
    );

    const location = await Promise.race([livePromise, timeoutPromise]);
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (err) {
    // 3. Fallback to any last known location if live GPS timeout
    try {
      const fallback = await Location.getLastKnownPositionAsync({});
      if (fallback && fallback.coords) {
        return {
          latitude: fallback.coords.latitude,
          longitude: fallback.coords.longitude,
        };
      }
    } catch (e) {}

    throw new Error('Unable to obtain GPS fix. Please ensure location/GPS is toggled on.');
  }
}

export function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
