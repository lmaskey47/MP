import { Platform } from 'react-native';

// 10.0.2.2 pointe vers la machine hôte depuis l'émulateur Android.
export const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api/v1',
  default: 'http://localhost:3000/api/v1',
}) as string;
