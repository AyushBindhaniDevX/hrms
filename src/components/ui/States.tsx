import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Button } from './Button';

export function EmptyState({ title, message, icon }: { title: string; message?: string; icon?: React.ReactNode }) {
  const colors = useTheme();
  return (
    <View style={styles.center}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message && <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>}
    </View>
  );
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  const colors = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.message, { color: colors.textSecondary, marginTop: 12 }]}>{message}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const colors = useTheme();
  return (
    <View style={styles.center}>
      <Text style={[styles.title, { color: colors.danger }]}>Error</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      {onRetry && <Button title="Retry" onPress={onRetry} variant="outline" size="sm" style={{ marginTop: 12 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, minHeight: 200 },
  iconWrap: { marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  message: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
