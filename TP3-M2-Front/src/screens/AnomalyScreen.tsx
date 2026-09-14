import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { Screen, Header, Button } from '../components/Ui';
import { Choice, Field, form } from '../components/Form';
import { useWorkspace } from '../context/MobileContext';
import { useLocation } from '../hooks/useLocation';
import { useAction } from '../hooks/useAction';
export function AnomalyScreen() {
  const { data, workspace } = useWorkspace();
  const [itemId, setItemId] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState('');
  const gps = useLocation();
  const action = useAction();
  return (
    <Screen>
      <ScrollView contentContainerStyle={form.page}>
        <Header
          title="Déclarer une anomalie"
          subtitle="Signalement enregistré localement avant envoi."
        />
        <Choice
          label="Équipement"
          value={itemId}
          onChange={setItemId}
          options={data.items.map(i => ({ value: i._id, label: i.label }))}
        />
        <Choice
          label="Sévérité"
          value={severity}
          onChange={setSeverity}
          options={[
            { value: 'low', label: 'Faible' },
            { value: 'medium', label: 'Moyenne' },
            { value: 'high', label: 'Haute' },
            { value: 'critical', label: 'Critique' },
          ]}
        />
        <Field
          label="Description"
          multiline
          maxLength={2000}
          value={description}
          onChangeText={setDescription}
        />
        <Button
          title={
            gps.location
              ? 'Position capturée — actualiser'
              : 'Capturer ma position'
          }
          onPress={() => action.run(gps.locate)}
        />
        {gps.location ? (
          <Text style={form.text}>{gps.location.coordinates.join(', ')}</Text>
        ) : null}
        {action.error ? <Text style={form.error}>{action.error}</Text> : null}
        {success ? <Text style={form.text}>{success}</Text> : null}
        <Button
          title="Enregistrer le signalement"
          loading={action.busy}
          onPress={() =>
            action.run(async () => {
              const item = data.items.find(i => i._id === itemId);
              if (!item) throw new Error('Choisissez un équipement.');
              await workspace.enqueue('anomaly', item, 'report', {
                severity,
                message: description.trim(),
                location: gps.location,
              });
              setDescription('');
              setSuccess(
                'Signalement sauvegardé. Il sera envoyé dès que possible.',
              );
            })
          }
        />
      </ScrollView>
    </Screen>
  );
}
