import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, type TextInputProps, Animated, Platform } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { BorderRadius } from '@/constants/theme';

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
            backgroundColor: isFocused ? colors.surface : colors.backgroundElement,
            borderColor: error ? colors.danger : (isFocused ? colors.primary : 'transparent'),
            borderWidth: isFocused || error ? 1.5 : 1,
            paddingLeft: isFocused || error ? 15 : 16,
            paddingRight: rightElement ? 0 : (isFocused || error ? 15 : 16),
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
            Platform.OS === 'web' && { outlineStyle: 'none' } as any
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
    marginBottom: 24, // slightly more spacing for modern layouts
  },
  label: {
    fontSize: 13, // slightly larger floating label style
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg, // MD standard border radius
    height: 56, // Taller touch target for modern mobile
    overflow: 'hidden',
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  error: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
});
