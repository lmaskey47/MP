import React from 'react';
import { FlatList, Text } from 'react-native';
import { Screen, Header, Card, Button } from '../components/Ui';
import { form } from '../components/Form';
import { useWorkspace } from '../context/MobileContext';
import { useAction } from '../hooks/useAction';
export function DeliveriesScreen() {
  const { data, workspace, manager } = useWorkspace();
  const action = useAction();
  return (
    <Screen>
      <Header title="Livraisons" subtitle="Feuilles de route et avancement" />
      {action.error ? <Text style={form.error}>{action.error}</Text> : null}
      <FlatList
        contentContainerStyle={form.page}
        data={data.deliveries}
        keyExtractor={d => d._id}
        ListEmptyComponent={<Text>Aucune livraison assignée.</Text>}
        renderItem={({ item }) => (
          <Card>
            <Text style={form.title}>Livraison · {item.status}</Text>
            <Text style={form.text}>
              Feuille de route{' '}
              {item.routeSheetValidated
                ? 'validée'
                : 'en attente de validation'}
            </Text>
            {item.stops.map((stop, i) => (
              <Text key={i} style={form.text}>
                {i + 1}. {stop.zoneCode} ·{' '}
                {new Date(stop.plannedAt).toLocaleString('fr-FR')}
              </Text>
            ))}
            {manager && !item.routeSheetValidated ? (
              <Button
                title="Valider la feuille de route"
                onPress={() =>
                  action.run(() =>
                    workspace.enqueue('delivery', item, 'validate', {
                      routeSheetValidated: true,
                    }),
                  )
                }
              />
            ) : null}
            {item.status !== 'delivered' && item.status !== 'cancelled' ? (
              <Button
                title={
                  item.status === 'planned'
                    ? 'Démarrer la livraison'
                    : 'Confirmer la livraison'
                }
                onPress={() =>
                  action.run(() =>
                    workspace.enqueue('delivery', item, 'status', {
                      status:
                        item.status === 'planned' ? 'in_transit' : 'delivered',
                    }),
                  )
                }
              />
            ) : null}
          </Card>
        )}
      />
    </Screen>
  );
}
