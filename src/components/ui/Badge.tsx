import React from 'react';
import { View, Text, StyleSheet, type TextStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import type { ThemeColors } from '@/constants/theme';

type BadgeVariant =
  | 'success'
  | 'successLight'
  | 'warning'
  | 'warningLight'
  | 'danger'
  | 'dangerLight'
  | 'neutral'
  | 'accent'
  | 'accentLight';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  textStyle?: TextStyle;
}

function getVariantColors(variant: BadgeVariant, colors: ThemeColors) {
  const map: Record<BadgeVariant, { bg: string; text: string }> = {
    success:      { bg: colors.success,      text: '#ffffff' },
    successLight: { bg: colors.successLight, text: colors.success },
    warning:      { bg: colors.warning,      text: '#ffffff' },
    warningLight: { bg: colors.warningLight, text: colors.warning },
    danger:       { bg: colors.danger,       text: '#ffffff' },
    dangerLight:  { bg: colors.dangerLight,  text: colors.danger },
    neutral:      { bg: colors.backgroundElement, text: colors.textSecondary },
    accent:       { bg: colors.accent,       text: '#ffffff' },
    accentLight:  { bg: colors.accentLight,  text: colors.accent },
  };
  return map[variant];
}

export function Badge({ label, variant = 'neutral', textStyle }: BadgeProps) {
  const colors = useTheme();
  const vc = getVariantColors(variant, colors);

  return (
    <View style={[styles.badge, { backgroundColor: vc.bg }]}>
      <Text style={[styles.text, { color: vc.text }, textStyle]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
