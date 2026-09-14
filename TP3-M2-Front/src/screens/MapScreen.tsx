import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { Screen, Header, Button, Card } from '../components/Ui';
import { Choice, form } from '../components/Form';
import { ZoneMap } from '../components/ZoneMap';
import { useWorkspace } from '../context/MobileContext';
import { useLocation } from '../hooks/useLocation';
import { useAction } from '../hooks/useAction';
export function MapScreen() {
  const { data } = useWorkspace();
  const [eventId, setEventId] = useState('');
  const event = data.events.find(e => e._id === eventId) ?? data.events[0];
  const [deliveryId, setDeliveryId] = useState('');
  const deliveries = data.deliveries.filter(d => d.eventId === event?._id);
  const delivery = deliveries.find(d => d._id === deliveryId) ?? deliveries[0];
  const gps = useLocation();
  const action = useAction();
  return (
    <Screen>
      <ScrollView contentContainerStyle={form.page}>
        <Header
          title="Carte terrain"
          subtitle="Zones GeoJSON et étapes disponibles hors réseau."
        />
        <Choice
          label="Événement"
          value={event?._id ?? ''}
          onChange={setEventId}
          options={data.events.map(e => ({ value: e._id, label: e.name }))}
        />
        <Choice
          label="Feuille de route"
          value={delivery?._id ?? ''}
          onChange={setDeliveryId}
          options={deliveries.map((d, i) => ({
            value: d._id,
            label: 'Livraison ' + (i + 1),
          }))}
        />
        {event ? (
          <ZoneMap
            zones={event.zones}
            center={event.location}
            route={
              delivery?.stops.flatMap(s =>
                s.location ? [s.location.coordinates] : [],
              ) ?? []
            }
            position={gps.location}
          />
        ) : (
          <Text>Aucun événement en cache.</Text>
        )}
        <Text style={form.text}>
          Les lignes relient les étapes de la feuille de route ; elles ne
          représentent pas un guidage routier.
        </Text>
        <Button title="Me localiser" onPress={() => action.run(gps.locate)} />
        {action.error ? <Text style={form.error}>{action.error}</Text> : null}
        {event?.zones.map(z => (
          <Card key={z.code}>
            <Text style={form.title}>{z.label}</Text>
            <Text style={form.text}>
              {z.code} ·{' '}
              {
                data.items.filter(
                  i => i.eventId === event._id && i.zoneCode === z.code,
                ).length
              }{' '}
              équipements
            </Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
