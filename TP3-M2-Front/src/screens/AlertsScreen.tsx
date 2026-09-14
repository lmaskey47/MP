import React from 'react';
import { FlatList, Text } from 'react-native';
import { Screen, Header, Card, Button } from '../components/Ui';
import { form } from '../components/Form';
import { useWorkspace } from '../context/MobileContext';
import { useAction } from '../hooks/useAction';
export function AlertsScreen() {
  const { data, workspace, online } = useWorkspace();
  const action = useAction();
  return (
    <Screen>
      <Header
        title="Alertes"
        subtitle="Actualisées automatiquement lorsque l’application est active."
      />
      {action.error ? <Text style={form.error}>{action.error}</Text> : null}
      <FlatList
        data={data.notifications}
        contentContainerStyle={form.page}
        keyExtractor={n => n._id}
        ListEmptyComponent={<Text>Aucune alerte non lue.</Text>}
        renderItem={({ item }) => (
          <Card>
            <Text style={[form.title, item.critical && form.error]}>
              {item.critical ? '⚠ ' : ''}
              {item.title}
            </Text>
            <Text style={form.text}>{item.message}</Text>
            <Button
              title="Marquer comme lue"
              disabled={!online}
              onPress={() => action.run(() => workspace.readNotice(item._id))}
            />
          </Card>
        )}
      />
    </Screen>
  );
}
