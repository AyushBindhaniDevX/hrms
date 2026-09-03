import React from 'react';
import { View, StyleSheet, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { BorderRadius, Shadows } from '@/constants/theme';
import { MotiView } from 'moti';

interface CardProps extends ViewProps {
  /**
   * default  — surface + hairline border + soft shadow (the standard card)
   * elevated — surface + stronger shadow, no border (floating / hero cards)
   * outlined — surface + border, no shadow (dense lists, nested cards)
   * flat     — surface only, no border or shadow
   */
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padding?: number;
  radius?: number;
  animate?: boolean;
}

export function Card({
  style,
  variant = 'default',
  padding = 16,
  radius = 20,
  animate = false,
  children,
  ...props
}: CardProps) {
  const colors = useTheme();

  const cardStyle: ViewStyle[] = [
    {
      backgroundColor: colors.surface,
      borderRadius: radius,
      padding,
      borderColor: colors.border,
      borderWidth: variant === 'default' || variant === 'outlined' ? 1 : 0,
    },
    variant === 'default' && (Shadows.sm as ViewStyle),
    variant === 'elevated' && (Shadows.md as ViewStyle),
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  if (!animate) {
    return (
      <View style={cardStyle} {...props}>
        {children}
      </View>
    );
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 280 }}
      style={cardStyle as any}
      {...(props as any)}
    >
      {children}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  // retained for backwards-compat imports; styling now lives inline for token access
  card: { borderRadius: BorderRadius.xl },
});
