import React from 'react';
import { View, StyleSheet, type ViewProps, Platform } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'outlined' | 'flat';
}

export function Card({ style, variant = 'default', children, ...props }: CardProps) {
  const colors = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: variant === 'outlined' ? '#E2E8F0' : 'transparent',
          borderWidth: variant === 'outlined' ? 1 : 0,
        },
        variant === 'default' && styles.elevated,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  elevated: Platform.select({
    web: {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)',
    } as any,
    default: {
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
  }),
});
