import React, { type PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

export function Screen({ children }: PropsWithChildren) {
  return <SafeAreaView style={styles.screen}>{children}</SafeAreaView>;
}
export function Header({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}
export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}
export function Button({
  title,
  loading,
  variant = 'primary',
  ...props
}: PressableProps & {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  return (
    <Pressable
      {...props}
      disabled={props.disabled || loading}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && styles.pressed,
        (props.disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'secondary' && styles.secondaryText,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
export function StatusPill({ online }: { online: boolean }) {
  return (
    <View
      style={[styles.pill, online ? styles.pillOnline : styles.pillOffline]}
    >
      <View
        style={[styles.dot, online ? styles.dotOnline : styles.dotOffline]}
      />
      <Text style={styles.pillText}>
        {online ? 'En ligne' : 'Mode hors ligne'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  title: { color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  button: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 10,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: '#E6EFEA' },
  danger: { backgroundColor: colors.danger },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  secondaryText: { color: colors.primaryDark },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 30,
  },
  pillOnline: { backgroundColor: '#DDF3E8' },
  pillOffline: { backgroundColor: '#EEE7F8' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOnline: { backgroundColor: colors.success },
  dotOffline: { backgroundColor: colors.offline },
  pillText: { color: colors.ink, fontSize: 12, fontWeight: '700' },
});
