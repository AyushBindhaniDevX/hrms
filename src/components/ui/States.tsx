import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Button } from './Button';

export function EmptyState({ title, message, icon, illustration, fullScreen }: {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  /** Optional illustration rendered above the icon */
  illustration?: React.ReactNode;
  /** When true, fills entire viewport height instead of minHeight */
  fullScreen?: boolean;
}) {
  const colors = useTheme();
  return (
    <View style={[styles.center, fullScreen && styles.fullScreen]}>
      {illustration && <View style={styles.illustrationWrap}>{illustration}</View>}
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message && <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>}
    </View>
  );
}

export function LoadingState({ message = 'Loading...', fullScreen }: {
  message?: string;
  /** When true, fills entire viewport height instead of minHeight */
  fullScreen?: boolean;
}) {
  const colors = useTheme();
  return (
    <View style={[styles.center, fullScreen && styles.fullScreen]}>
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
  fullScreen: { minHeight: undefined },
  iconWrap: { marginBottom: 16 },
  illustrationWrap: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  message: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

