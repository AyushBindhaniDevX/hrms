/**
 * Oasis HRMS Theme — extends the existing Expo theme system.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0b1c30', // on-surface
    background: '#f8f9ff', // background
    backgroundElement: '#eff4ff', // surface-container-low
    backgroundSelected: '#e5eeff', // surface-container
    textSecondary: '#45464d', // on-surface-variant
    surface: '#ffffff', // surface-container-lowest
    border: '#dce9ff', // surface-container-high
    primary: '#006a61', // Teal (secondary in tokens, used for primary action)
    primaryForeground: '#ffffff', 
    success: '#006a61', 
    successLight: '#86f2e4',
    warning: '#F9AB00',
    warningLight: '#FEF7E0',
    danger: '#ba1a1a', // error
    dangerLight: '#ffdad6', // error-container
    accent: '#0b1c30',
    accentLight: '#eaf1ff', // inverse-on-surface
  },
  dark: {
    text: '#0b1c30',
    background: '#f8f9ff',
    backgroundElement: '#eff4ff',
    backgroundSelected: '#e5eeff',
    textSecondary: '#45464d',
    surface: '#ffffff',
    border: '#dce9ff',
    primary: '#006a61', 
    primaryForeground: '#ffffff',
    success: '#006a61',
    successLight: '#86f2e4',
    warning: '#F9AB00',
    warningLight: '#FEF7E0',
    danger: '#ba1a1a',
    dangerLight: '#ffdad6',
    accent: '#0b1c30',
    accentLight: '#eaf1ff',
  },
};

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ThemeColors = typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 1200;
