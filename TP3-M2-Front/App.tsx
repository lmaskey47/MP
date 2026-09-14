import 'react-native-gesture-handler';
import React from 'react';
import { ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MobileProvider, useMobile } from './src/context/MobileContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { TasksScreen } from './src/screens/TasksScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { AnomalyScreen } from './src/screens/AnomalyScreen';
import { SyncScreen } from './src/screens/SyncScreen';
import { ItemsScreen } from './src/screens/ItemsScreen';
import { DeliveriesScreen } from './src/screens/DeliveriesScreen';
import { AlertsScreen } from './src/screens/AlertsScreen';
import { MapScreen } from './src/screens/MapScreen';
import { ManageScreen } from './src/screens/ManageScreen';
import { colors } from './src/theme';
import type { RootStackParamList } from './src/types/api';
const Stack = createNativeStackNavigator<RootStackParamList>();
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.ink,
  },
};
function Navigation() {
  const { session, loading } = useMobile();
  if (loading) return <ActivityIndicator />;
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerTintColor: colors.ink,
          headerShadowVisible: false,
        }}
      >
        {session ? (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Scan"
              component={ScanScreen}
              options={{ title: 'Scan' }}
            />
            <Stack.Screen
              name="Tasks"
              component={TasksScreen}
              options={{ title: 'Tâches' }}
            />
            <Stack.Screen
              name="Items"
              component={ItemsScreen}
              options={{ title: 'Équipements' }}
            />
            <Stack.Screen
              name="Anomaly"
              component={AnomalyScreen}
              options={{ title: 'Anomalie' }}
            />
            <Stack.Screen
              name="Sync"
              component={SyncScreen}
              options={{ title: 'Synchronisation' }}
            />
            <Stack.Screen
              name="Map"
              component={MapScreen}
              options={{ title: 'Carte' }}
            />
            <Stack.Screen
              name="Deliveries"
              component={DeliveriesScreen}
              options={{ title: 'Livraisons' }}
            />
            <Stack.Screen
              name="Alerts"
              component={AlertsScreen}
              options={{ title: 'Alertes' }}
            />
            <Stack.Screen
              name="Manage"
              component={ManageScreen}
              options={{ title: 'Configuration' }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <MobileProvider>
        <StatusBar barStyle="dark-content" />
        <Navigation />
      </MobileProvider>
    </SafeAreaProvider>
  );
}
