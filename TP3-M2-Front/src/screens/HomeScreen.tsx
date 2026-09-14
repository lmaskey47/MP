import React from 'react';
import { ScrollView, Text, RefreshControl, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Header, Screen, Card, Button, StatusPill } from '../components/Ui';
import { form } from '../components/Form';
import { useWorkspace } from '../context/MobileContext';
import { sessionClient } from '../services/client';
import { useAction } from '../hooks/useAction';
import type { RootStackParamList } from '../types/api';
import { useDashboard } from '../hooks/useDashboard';
import { useCriticalAlerts } from '../hooks/useCriticalAlerts';
export function HomeScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Home'>) {
  const {
    session,
    data,
    operations,
    error,
    workspace,
    online,
    manager,
    ready,
  } = useWorkspace();
  const action = useAction();
  const dashboard = useDashboard();
  useCriticalAlerts();
  const logout = () => {
    if (operations.length)
      Alert.alert(
        'Actions en attente',
        'Elles resteront sur ce téléphone et seront reprises à votre prochaine connexion avec ce compte.',
        [
          { text: 'Rester', style: 'cancel' },
          {
            text: 'Se déconnecter',
            onPress: () => action.run(() => sessionClient.logout()),
          },
        ],
      );
    else action.run(() => sessionClient.logout());
  };
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={form.page}
        refreshControl={
          <RefreshControl
            refreshing={action.busy}
            onRefresh={() => action.run(() => workspace.refresh())}
          />
        }
      >
        <Header
          title={'Bonjour ' + session!.user.name.split(' ')[0]}
          subtitle={
            data.events.map(e => e.name).join(' · ') || 'Chargement du secteur'
          }
        />
        <StatusPill online={online} />
        {!ready ? <Text>Ouverture du cache…</Text> : null}
        {error || action.error ? (
          <Text style={form.error}>{action.error || error}</Text>
        ) : null}
        <Card>
          <Text style={form.title}>
            {data.tasks.filter(t => t.status !== 'done').length} tâches actives
          </Text>
          <Text style={form.text}>
            {operations.length} actions à transmettre ·{' '}
            {data.notifications.length} alertes
          </Text>
        </Card>
        {manager ? (
          <Card>
            <Text style={form.title}>Pilotage</Text>
            {dashboard.stock.map(([status, count]) => (
              <Text key={status} style={form.text}>
                {status} : {count}
              </Text>
            ))}
            <Text style={form.text}>
              {dashboard.overdue.length} tâches en retard ·{' '}
              {dashboard.lateDeliveries.length} livraisons en retard
            </Text>
            <Text style={form.text}>
              {data.items.length} équipements ·{' '}
              {data.items.reduce((sum, i) => sum + i.carbonKg, 0).toFixed(1)} kg
              CO₂
            </Text>
            <Text style={form.text}>
              {data.anomalies.filter(a => a.status !== 'resolved').length}{' '}
              anomalies ouvertes ·{' '}
              {data.tasks.filter(t => t.status === 'blocked').length} tâches
              bloquées
            </Text>
            <Button
              title="Gérer les événements et zones"
              onPress={() => navigation.navigate('Manage')}
            />
          </Card>
        ) : null}
        <Button
          title="Scanner un équipement"
          onPress={() => navigation.navigate('Scan')}
        />
        <Button
          title="Mes tâches"
          onPress={() => navigation.navigate('Tasks')}
        />
        <Button
          title="Équipements et mouvements"
          onPress={() => navigation.navigate('Items')}
        />
        <Button
          title="Carte et itinéraires"
          onPress={() => navigation.navigate('Map')}
        />
        <Button
          title="Livraisons et feuilles de route"
          onPress={() => navigation.navigate('Deliveries')}
        />
        <Button
          title="Déclarer une anomalie"
          onPress={() => navigation.navigate('Anomaly')}
        />
        <Button title="Alertes" onPress={() => navigation.navigate('Alerts')} />
        <Button
          title={'Synchronisation (' + operations.length + ')'}
          variant="secondary"
          onPress={() => navigation.navigate('Sync')}
        />
        <Button title="Se déconnecter" variant="danger" onPress={logout} />
      </ScrollView>
    </Screen>
  );
}
