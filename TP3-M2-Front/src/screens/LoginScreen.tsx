import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { Screen, Header, Button, Card } from '../components/Ui';
import { Field, form } from '../components/Form';
import { sessionClient } from '../services/client';
import { useAction } from '../hooks/useAction';
export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const action = useAction();
  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={form.page}
          keyboardShouldPersistTaps="handled"
        >
          <Header
            title="LogiChain"
            subtitle="Votre équipe, vos équipements, même hors réseau."
          />
          <Card>
            <Field
              label="Adresse email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Field
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {action.error ? (
              <Text accessibilityRole="alert" style={form.error}>
                {action.error}
              </Text>
            ) : null}
            <Button
              title="Se connecter"
              loading={action.busy}
              onPress={() =>
                action.run(async () => {
                  if (!email.includes('@') || !password)
                    throw new Error(
                      'Saisissez votre email et votre mot de passe.',
                    );
                  await sessionClient.login(email, password);
                })
              }
            />
            <Text style={form.text}>
              La première connexion télécharge votre secteur. Votre session
              reste accessible lors des coupures réseau.
            </Text>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
