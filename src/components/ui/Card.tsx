import React from 'react';
import { View, StyleSheet, type ViewProps, Platform } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'outlined';
}

export function Card({ style, variant = 'default', children, ...props }: CardProps) {
  const colors = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: variant === 'outlined' ? colors.border : 'transparent',
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
    borderRadius: 12,
    padding: 16,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  elevated: Platform.select({
    web: {
      boxShadow: '0px 1px 3px rgba(0,0,0,0.15)',
    } as any,
    default: {
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
    }
  }),
});
