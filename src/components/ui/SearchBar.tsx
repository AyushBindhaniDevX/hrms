import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search...' }: SearchBarProps) {
  const colors = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { color: colors.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    height: '100%',
  },
});
