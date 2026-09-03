import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Animated,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/use-theme';
import { Shadows, BrandShadow } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

function getVariantStyles(variant: ButtonVariant, colors: ThemeColors) {
  const map: Record<ButtonVariant, { bg: string; text: string; border?: string; shadow?: any }> = {
    primary: { bg: colors.primary, text: colors.primaryForeground, shadow: BrandShadow },
    secondary: { bg: colors.backgroundElement, text: colors.text, shadow: Shadows?.sm },
    outline: { bg: 'transparent', text: colors.text, border: colors.border, shadow: undefined },
    danger: { bg: colors.danger, text: '#FFFFFF', shadow: Shadows?.md },
    ghost: { bg: 'transparent', text: colors.primary, shadow: undefined },
  };
  return map[variant];
}

const sizeStyles: Record<ButtonSize, { h: number; px: number; fontSize: number; borderRadius: number }> = {
  sm: { h: 40, px: 16, fontSize: 13, borderRadius: 12 },
  md: { h: 52, px: 24, fontSize: 15, borderRadius: 16 },
  lg: { h: 58, px: 32, fontSize: 16, borderRadius: 18 },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  haptic = true,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const colors = useTheme();
  const vs = getVariantStyles(variant, colors);
  const ss = sizeStyles[size];
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, bounciness: 0 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 0 }).start();
  };

  const handlePress = () => {
    if (haptic && Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && { width: '100%' }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        android_ripple={{
          color: variant === 'primary' || variant === 'danger' ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.06)',
          borderless: false,
        }}
        style={({ pressed }) => [
          styles.base,
          {
            backgroundColor: vs.bg,
            height: ss.h,
            paddingHorizontal: ss.px,
            borderRadius: ss.borderRadius,
            borderColor: vs.border || 'transparent',
            borderWidth: vs.border ? 1.5 : 0,
            opacity: disabled ? 0.45 : pressed && Platform.OS === 'ios' ? 0.9 : 1,
            ...(disabled ? {} : vs.shadow),
          },
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={vs.text} />
        ) : (
          <>
            {icon}
            <Text style={[styles.text, { color: vs.text, fontSize: ss.fontSize }, textStyle]}>{title}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
