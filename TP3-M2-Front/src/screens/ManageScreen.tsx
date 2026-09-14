import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { Screen, Header, Button } from '../components/Ui';
import { Choice, Field, form } from '../components/Form';
import { useWorkspace } from '../context/MobileContext';
import { useEventEditor } from '../hooks/useEventEditor';
import { useAction } from '../hooks/useAction';
import { ZoneMap } from '../components/ZoneMap';
export function ManageScreen() {
  const { manager, online } = useWorkspace();
  const editor = useEventEditor();
  const action = useAction();
  const [advanced, setAdvanced] = useState(false);
  if (!manager)
    return (
      <Screen>
        <Text>Accès réservé aux responsables.</Text>
      </Screen>
    );
  return (
    <Screen>
      <ScrollView contentContainerStyle={form.page}>
        <Header
          title="Configuration de l’événement"
          subtitle="Modifications transmises au serveur puis aux équipes."
        />
        <Choice
          label="Événement"
          value={editor.event?._id ?? 'new'}
          onChange={editor.setSelected}
          options={[
            ...editor.events.map(e => ({ value: e._id, label: e.name })),
            { value: 'new', label: 'Nouvel événement' },
          ]}
        />
        <Field label="Nom" value={editor.name} onChangeText={editor.setName} />
        <Field
          label="Description"
          multiline
          value={editor.description}
          onChangeText={editor.setDescription}
        />
        <Choice
          label="Statut"
          value={editor.status}
          onChange={editor.setStatus}
          options={[
            { value: 'draft', label: 'Brouillon' },
            { value: 'active', label: 'Actif' },
            { value: 'closed', label: 'Clôturé' },
          ]}
        />
        <Field
          label="Début (date ISO, ex. 2026-09-10T08:00:00Z)"
          value={editor.startsAt}
          onChangeText={editor.setStartsAt}
        />
        <Field
          label="Fin (date ISO)"
          value={editor.endsAt}
          onChangeText={editor.setEndsAt}
        />
        <Field
          label="Longitude du centre"
          value={editor.longitude}
          onChangeText={editor.setLongitude}
          keyboardType="numbers-and-punctuation"
        />
        <Field
          label="Latitude du centre"
          value={editor.latitude}
          onChangeText={editor.setLatitude}
          keyboardType="numbers-and-punctuation"
        />
        <ZoneMap
          zones={editor.preview}
          center={
            editor.event?.location ?? {
              type: 'Point',
              coordinates: [2.3522, 48.8566],
            }
          }
        />
        <Field
          label="Code de la nouvelle zone"
          value={editor.zoneCode}
          onChangeText={editor.setZoneCode}
        />
        <Field
          label="Nom de la zone"
          value={editor.zoneLabel}
          onChangeText={editor.setZoneLabel}
        />
        <Choice
          label="Usage"
          value={editor.zoneKind}
          onChange={editor.setZoneKind}
          options={[
            { value: 'storage', label: 'Stockage' },
            { value: 'delivery', label: 'Livraison' },
            { value: 'maintenance', label: 'Maintenance' },
            { value: 'public', label: 'Public' },
            { value: 'restricted', label: 'Accès limité' },
          ]}
        />
        <Field
          label="Largeur de la zone carrée, en mètres"
          value={editor.size}
          onChangeText={editor.setSize}
          keyboardType="numeric"
        />
        <Button
          title="Ajouter autour du centre indiqué"
          onPress={() => action.run(async () => editor.addZone())}
        />
        {editor.preview.map(z => (
          <Button
            key={z.code}
            title={'Retirer ' + z.label}
            variant="secondary"
            onPress={() => action.run(async () => editor.removeZone(z.code))}
          />
        ))}
        <Button
          title="Importer ou modifier un contour GeoJSON"
          variant="secondary"
          onPress={() => setAdvanced(!advanced)}
        />
        {advanced ? (
          <Field
            label="Zones GeoJSON"
            multiline
            value={editor.zones}
            onChangeText={editor.setZones}
          />
        ) : null}
        {action.error ? <Text style={form.error}>{action.error}</Text> : null}
        <Button
          title="Enregistrer la configuration"
          loading={action.busy}
          disabled={!online}
          onPress={() => action.run(editor.save)}
        />
      </ScrollView>
    </Screen>
  );
}
