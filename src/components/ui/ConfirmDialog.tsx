import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal } from './Modal';
import { Button } from './Button';
import { useTheme } from '@/hooks/use-theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  visible, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm, onCancel, loading,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} onClose={onCancel} title={title}>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        <Button title={cancelLabel} onPress={onCancel} variant="outline" style={{ flex: 1 }} />
        <Button
          title={confirmLabel}
          onPress={onConfirm}
          variant={variant === 'danger' ? 'danger' : 'primary'}
          loading={loading}
          style={{ flex: 1 }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  message: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 12 },
});
