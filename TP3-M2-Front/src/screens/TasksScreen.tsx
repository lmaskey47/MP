import React from 'react';
import { FlatList, Text } from 'react-native';
import { Screen, Card, Header, Button, StatusPill } from '../components/Ui';
import { form } from '../components/Form';
import { useWorkspace } from '../context/MobileContext';
import { useAction } from '../hooks/useAction';
export function TasksScreen() {
  const { data, workspace, online } = useWorkspace();
  const action = useAction();
  return (
    <Screen>
      <Header
        title="Tâches prioritaires"
        subtitle="Les changements sont conservés même hors réseau."
      />
      <StatusPill online={online} />
      {action.error ? <Text style={form.error}>{action.error}</Text> : null}
      <FlatList
        contentContainerStyle={form.page}
        data={[...data.tasks].sort((a, b) =>
          (a.dueAt ?? 'z').localeCompare(b.dueAt ?? 'z'),
        )}
        keyExtractor={t => t._id}
        ListEmptyComponent={<Text>Aucune tâche assignée.</Text>}
        renderItem={({ item }) => (
          <Card>
            <Text style={form.title}>{item.title}</Text>
            <Text style={form.text}>{item.description}</Text>
            <Text style={form.text}>
              {item.zoneCode} · {item.status}
              {item.dueAt
                ? ' · ' + new Date(item.dueAt).toLocaleString('fr-FR')
                : ''}
            </Text>
            {item.status !== 'done' ? (
              <>
                <Button
                  title={
                    item.status === 'in_progress' ? 'Terminer' : 'Commencer'
                  }
                  loading={action.busy}
                  onPress={() =>
                    action.run(() =>
                      workspace.enqueue('task', item, 'status', {
                        status:
                          item.status === 'in_progress'
                            ? 'done'
                            : 'in_progress',
                      }),
                    )
                  }
                />
                <Button
                  title="Signaler un blocage"
                  variant="secondary"
                  onPress={() =>
                    action.run(() =>
                      workspace.enqueue('task', item, 'status', {
                        status: 'blocked',
                      }),
                    )
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
