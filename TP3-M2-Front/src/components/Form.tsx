import React from 'react';
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  type TextInputProps,
  ScrollView,
} from 'react-native';
import { Button } from './Ui';
export const form = StyleSheet.create({
  page: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '800', color: '#173D2B', marginBottom: 8 },
  text: { color: '#365544', lineHeight: 22, marginBottom: 8 },
  error: { color: '#B42318', marginVertical: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#B9CFC1',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    color: '#173D2B',
    marginBottom: 12,
    minHeight: 48,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  multiline: { minHeight: 100 },
});
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View>
      <Text style={form.text}>{label}</Text>
      <TextInput
        {...props}
        style={[form.input, props.multiline && form.multiline, props.style]}
        placeholderTextColor="#667C6E"
      />
    </View>
  );
}
export function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <View>
      <Text style={form.text}>{label}</Text>
      <ScrollView horizontal>
        <View style={form.row}>
          {options.map(option => (
            <Button
              key={option.value}
              title={(value === option.value ? '✓ ' : '') + option.label}
              variant={value === option.value ? 'primary' : 'secondary'}
              onPress={() => onChange(option.value)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
