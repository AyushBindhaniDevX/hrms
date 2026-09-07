import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * Reusable, self-contained screen fallback UI.
 * Deliberately uses no theme hooks or external context so it can render even
 * when the failure is in a provider/theme layer.
 */
export function ScreenErrorFallback({
  error,
  retry,
}: {
  error?: Error;
  retry?: () => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>
        {error?.message || 'This screen ran into a problem. Please try again.'}
      </Text>
      {retry && (
        <TouchableOpacity onPress={retry} style={styles.button} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  message: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
