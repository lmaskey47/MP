import { useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import type { GeoPoint } from '../types/api';
export function useLocation() {
  const [location, setLocation] = useState<GeoPoint>();
  async function locate() {
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);
      if (result['android.permission.ACCESS_FINE_LOCATION'] !== 'granted')
        throw new Error('Autorisez la localisation précise dans les réglages.');
    }
    const point = await new Promise<GeoPoint>((resolve, reject) =>
      Geolocation.getCurrentPosition(
        p =>
          resolve({
            type: 'Point',
            coordinates: [p.coords.longitude, p.coords.latitude],
          }),
        e => reject(new Error(e.message)),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      ),
    );
    setLocation(point);
    return point;
  }
  return { location, locate };
}
