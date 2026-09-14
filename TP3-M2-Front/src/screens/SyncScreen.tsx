import React from 'react';
import { FlatList, Text } from 'react-native';
import { Screen, Header, Card, Button, StatusPill } from '../components/Ui';
import { form } from '../components/Form';
import { useWorkspace } from '../context/MobileContext';
import { useAction } from '../hooks/useAction';
export function SyncScreen() {
  const { operations, workspace, busy, error, online } = useWorkspace();
  const action = useAction();
  return (
    <Screen>
      <Header
        title="Synchronisation"
        subtitle={operations.length + ' actions conservées sur ce téléphone'}
      />
      <StatusPill online={online} />
      <Button
        title="Synchroniser maintenant"
        loading={busy}
        disabled={!online}
        onPress={() => action.run(() => workspace.sync())}
      />
      {error || action.error ? (
        <Text style={form.error}>{action.error || error}</Text>
      ) : null}
      <FlatList
        data={operations}
        keyExtractor={o => o.id}
        contentContainerStyle={form.page}
        ListEmptyComponent={
          <Text style={form.text}>Toutes les actions ont été transmises.</Text>
        }
        renderItem={({ item }) => (
          <Card>
            <Text style={form.title}>
              {item.kind} · {item.action}
            </Text>
            <Text style={form.text}>
              {item.state === 'pending'
                ? 'En attente'
                : item.state === 'conflict'
                ? 'Conflit à résoudre'
                : 'Action refusée'}{' '}
              · {new Date(item.createdAt).toLocaleString('fr-FR')}
            </Text>
            <Text style={form.text}>{item.error}</Text>
            {item.current ? (
              <Text style={form.text}>
                Version serveur :{' '}
                {String(
                  item.current.status ?? item.current.zoneCode ?? 'modifiée',
                )}
              </Text>
            ) : null}
            {item.state !== 'pending' ? (
              <>
                <Button
                  title={
                    item.state === 'conflict'
                      ? 'Réappliquer ma modification'
                      : 'Réessayer'
                  }
                  onPress={() =>
                    action.run(() => workspace.resolve(item.id, true))
                  }
                />
                <Button
                  title="Garder la version serveur"
                  variant="secondary"
                  onPress={() =>
                    action.run(() => workspace.resolve(item.id, false))
                  }
                />
              </>
            ) : null}
          </Card>
        )}
      />
    </Screen>
  );
}
