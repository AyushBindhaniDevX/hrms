import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  Platform,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
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
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

function getVariantStyles(variant: ButtonVariant, colors: ThemeColors) {
  const map: Record<ButtonVariant, { bg: string; text: string; border?: string; elevation?: number }> = {
    primary: { bg: colors.primary, text: colors.primaryForeground, elevation: 2 },
    secondary: { bg: colors.backgroundElement, text: colors.text, elevation: 0 },
    outline: { bg: 'transparent', text: colors.text, border: colors.border, elevation: 0 },
    danger: { bg: colors.danger, text: '#FFFFFF', elevation: 2 },
    ghost: { bg: 'transparent', text: colors.text, elevation: 0 },
  };
  return map[variant];
}

const sizeStyles: Record<ButtonSize, { h: number; px: number; fontSize: number }> = {
  sm: { h: 36, px: 16, fontSize: 13 },
  md: { h: 40, px: 24, fontSize: 14 },
  lg: { h: 48, px: 32, fontSize: 16 },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const colors = useTheme();
  const vs = getVariantStyles(variant, colors);
  const ss = sizeStyles[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={{ color: variant === 'primary' || variant === 'danger' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)' }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: vs.bg,
          height: ss.h,
          paddingHorizontal: ss.px,
          borderColor: vs.border || 'transparent',
          borderWidth: vs.border ? 1 : 0,
          opacity: disabled ? 0.38 : (pressed && Platform.OS === 'ios' ? 0.7 : 1),
          elevation: disabled ? 0 : vs.elevation,
          ...Platform.select({
            web: {
              boxShadow: vs.elevation && !disabled ? '0px 1px 2px rgba(0,0,0,0.15)' : 'none',
            } as any,
            default: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: vs.elevation ? 1 : 0 },
              shadowOpacity: vs.elevation ? 0.15 : 0,
              shadowRadius: vs.elevation ? 2 : 0,
            }
          })
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vs.text} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: vs.text, fontSize: ss.fontSize }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999, // Pill shape for MD3
    gap: 8,
    overflow: 'hidden',
  },
  text: {
    fontWeight: '500', // Medium weight for MD3
    letterSpacing: 0.1,
  },
});
