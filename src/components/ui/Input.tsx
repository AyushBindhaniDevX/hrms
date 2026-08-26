import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, type TextInputProps } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function Input({ label, error, icon, rightElement, style, onFocus, onBlur, ...props }: InputProps) {
  const colors = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: isFocused ? colors.primary : colors.textSecondary }]}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : (isFocused ? colors.primary : colors.border),
            borderWidth: isFocused || error ? 2 : 1,
            paddingLeft: isFocused || error ? 11 : 12,
            paddingRight: rightElement ? 0 : (isFocused || error ? 11 : 12),
            overflow: 'hidden',
          },
        ]}
      >
        {icon && <View style={styles.icon}>{icon}</View>}
        <TextInput
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            { color: colors.text },
            icon ? { paddingLeft: 0 } : null,
            style,
          ]}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightElement}
      </View>
      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20, // slightly more spacing for MD
  },
  label: {
    fontSize: 12, // smaller floating label style
    fontWeight: '500',
    marginBottom: 4,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4, // MD standard border radius
    height: 52, // Taller touch target for MD
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16, // larger text
    height: '100%',
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
