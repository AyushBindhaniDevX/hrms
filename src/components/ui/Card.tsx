import React, { useRef } from 'react';
import { View, StyleSheet, Pressable, Animated, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { BorderRadius, Shadows } from '@/constants/theme';
import { MotiView } from 'moti';

interface CardProps extends ViewProps {
  /**
   * default  — surface + hairline border + soft shadow (the standard card)
   * elevated — surface + stronger shadow, no border (floating / hero cards)
   * outlined — surface + border, no shadow (dense lists, nested cards)
   * flat     — surface only, no border or shadow
   * glass    — translucent surface with border
   */
  variant?: 'default' | 'elevated' | 'outlined' | 'flat' | 'glass';
  padding?: number;
  radius?: number;
  animate?: boolean;
  pressable?: boolean;
  onPress?: () => void;
  gap?: number;
}

export function Card({
  style,
  variant = 'default',
  padding = 16,
  radius = 20,
  animate = false,
  pressable = false,
  onPress,
  gap,
  children,
  ...props
}: CardProps) {
  const colors = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, bounciness: 0 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 0 }).start();
  };

  const isGlass = variant === 'glass';

  const cardStyle: ViewStyle[] = [
    {
      backgroundColor: isGlass ? 'rgba(255,255,255,0.08)' : colors.surface,
      borderRadius: radius,
      padding,
      borderColor: isGlass ? 'rgba(255,255,255,0.15)' : colors.border,
      borderWidth: variant === 'default' || variant === 'outlined' || isGlass ? 1 : 0,
      gap,
    },
    variant === 'default' && (Shadows.sm as ViewStyle),
    variant === 'elevated' && (Shadows.md as ViewStyle),
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  const content = animate ? (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 280 }}
      style={cardStyle as any}
      {...(props as any)}
    >
      {children}
    </MotiView>
  ) : (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );

  if (pressable) {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
          {content}
        </Pressable>
      </Animated.View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  // retained for backwards-compat imports; styling now lives inline for token access
  card: { borderRadius: BorderRadius.xl },
});
