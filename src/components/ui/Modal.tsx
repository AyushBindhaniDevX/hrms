import React from 'react';
import { Modal as RNModal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ visible, onClose, title, children }: ModalProps) {
  const colors = useTheme();

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.content, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          {title && (
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={[styles.closeBtn, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.body}>{children}</View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    borderRadius: 12,
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeBtn: {
    fontSize: 20,
    padding: 4,
  },
  body: {
    padding: 16,
    flexShrink: 1,
  },
});
