import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Camera } from 'react-native-vision-camera';
import { Screen, Header, Button } from '../components/Ui';
import { Field, form } from '../components/Form';
import { useScanner } from '../hooks/useScanner';
export function ScanScreen() {
  const scanner = useScanner();
  const focused = useIsFocused();
  const [code, setCode] = useState('');
  return (
    <Screen>
      <ScrollView contentContainerStyle={form.page}>
        <Header
          title="Scanner"
          subtitle="Retour sonore et vibration après enregistrement."
        />
        <View style={styles.camera}>
          {scanner.permission && scanner.device ? (
            <Camera
              style={StyleSheet.absoluteFill}
              device={scanner.device}
              isActive={scanner.active && focused}
              codeScanner={scanner.codeScanner}
            />
          ) : (
            <Button title="Autoriser la caméra" onPress={scanner.authorize} />
          )}
        </View>
        <Text accessibilityLiveRegion="polite" style={form.text}>
          {scanner.status}
        </Text>
        <Field
          label="Ou saisir le code"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
        />
        <Button
          title="Valider le code"
          onPress={() => scanner.accept(code.trim())}
        />
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  camera: {
    height: 310,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#173D2B',
    marginVertical: 16,
  },
});
