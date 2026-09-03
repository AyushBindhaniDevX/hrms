import React from 'react';
import { View, Text, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import type { ThemeColors } from '@/constants/theme';

type BadgeVariant =
  | 'success'
  | 'successLight'
  | 'warning'
  | 'warningLight'
  | 'danger'
  | 'dangerLight'
  | 'info'
  | 'infoLight'
  | 'neutral'
  | 'default'
  | 'accent'
  | 'accentLight'
  | 'primary'
  | 'primaryLight';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  uppercase?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

function getVariantColors(variant: BadgeVariant, colors: ThemeColors) {
  const map: Record<BadgeVariant, { bg: string; text: string }> = {
    success: { bg: colors.success, text: '#ffffff' },
    successLight: { bg: colors.successLight, text: colors.success },
    warning: { bg: colors.warning, text: '#ffffff' },
    warningLight: { bg: colors.warningLight, text: colors.warning },
    danger: { bg: colors.danger, text: '#ffffff' },
    dangerLight: { bg: colors.dangerLight, text: colors.danger },
    info: { bg: colors.info, text: '#ffffff' },
    infoLight: { bg: colors.infoLight, text: colors.info },
    neutral: { bg: colors.backgroundElement, text: colors.textSecondary },
    default: { bg: colors.backgroundElement, text: colors.textSecondary },
    accent: { bg: colors.accent, text: '#ffffff' },
    accentLight: { bg: colors.accentLight, text: colors.primary },
    primary: { bg: colors.primary, text: colors.primaryForeground },
    primaryLight: { bg: colors.primaryLight, text: colors.primary },
  };
  return map[variant] ?? map.neutral;
}

export function Badge({
  label,
  variant = 'neutral',
  size = 'md',
  dot = false,
  uppercase = true,
  style,
  textStyle,
}: BadgeProps) {
  const colors = useTheme();
  const vc = getVariantColors(variant, colors);
  const sm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: vc.bg,
          paddingHorizontal: sm ? 8 : 10,
          paddingVertical: sm ? 3 : 4,
        },
        style,
      ]}
    >
      {dot && <View style={[styles.dot, { backgroundColor: vc.text }]} />}
      <Text style={[styles.text, { color: vc.text, fontSize: sm ? 10 : 11 }, textStyle]}>
        {uppercase ? label.toUpperCase() : label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
