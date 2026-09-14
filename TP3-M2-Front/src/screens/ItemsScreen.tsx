import React, { useState } from 'react';
import { FlatList, Text } from 'react-native';
import { Screen, Header, Card, Button } from '../components/Ui';
import { Choice, Field, form } from '../components/Form';
import { useWorkspace } from '../context/MobileContext';
import { useAction } from '../hooks/useAction';
export function ItemsScreen() {
  const { data, workspace, manager } = useWorkspace();
  const action = useAction();
  const [search, setSearch] = useState('');
  const [zone, setZone] = useState('');
  const [person, setPerson] = useState('');
  return (
    <Screen>
      <Header
        title="Équipements"
        subtitle="Stock, mouvements et responsabilité"
      />
      <Field label="Rechercher" value={search} onChangeText={setSearch} />
      {action.error ? <Text style={form.error}>{action.error}</Text> : null}
      <FlatList
        contentContainerStyle={form.page}
        data={data.items.filter(i =>
          (i.label + ' ' + i.qrCode)
            .toLowerCase()
            .includes(search.toLowerCase()),
        )}
        keyExtractor={i => i._id}
        renderItem={({ item }) => (
          <Card>
            <Text style={form.title}>{item.label}</Text>
            <Text style={form.text}>
              {item.qrCode} · {item.status} · {item.zoneCode ?? 'Sans zone'}
            </Text>
            <Text style={form.text}>
              {item.carbonKg} kg CO₂ · Responsable :{' '}
              {data.people.find(p => p._id === item.responsibleUserId)?.name ??
                item.responsibleUserId ??
                'Non assigné'}
            </Text>
            <Choice
              label="Destination"
              value={zone}
              onChange={setZone}
              options={(
                data.events.find(e => e._id === item.eventId)?.zones ?? []
              ).map(z => ({ value: z.code, label: z.label }))}
            />
            <Button
              title="Déplacer"
              disabled={!zone}
              onPress={() =>
                action.run(async () => {
                  if (
                    !data.events
                      .find(e => e._id === item.eventId)
                      ?.zones.some(z => z.code === zone)
                  )
                    throw new Error('Choisissez une zone de cet événement.');
                  await workspace.enqueue('item', item, 'moved', {
                    zoneCode: zone,
                  });
                })
              }
            />
            <Button
              title="Marquer livré"
              onPress={() =>
                action.run(() =>
                  workspace.enqueue('item', item, 'status', {
                    status: 'delivered',
                  }),
                )
              }
            />
            <Button
              title="Mettre en maintenance"
              variant="secondary"
              onPress={() =>
                action.run(() =>
                  workspace.enqueue('item', item, 'maintenance', {
                    status: 'maintenance',
                  }),
                )
              }
            />
            {manager ? (
              <>
                <Choice
                  label="Nouveau responsable"
                  value={person}
                  onChange={setPerson}
                  options={data.people
                    .filter(p => p.eventIds.includes(item.eventId))
                    .map(p => ({ value: p._id, label: p.name }))}
                />
                <Button
                  title="Transférer la responsabilité"
                  disabled={!person}
                  onPress={() =>
                    action.run(() =>
                      workspace.enqueue('item', item, 'transferred', {
                        responsibleUserId: person,
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
