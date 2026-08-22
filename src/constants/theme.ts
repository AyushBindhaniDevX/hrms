/**
 * Subedge Technology Pvt Ltd — Oasis Platform: Oasis HRMS Theme System.
 * Refined styling aligned with Subedge Design Language (https://subedge.vercel.app/).
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1A2E', // Subedge Deep Navy Slate
    background: '#F8FAFC', // Subedge Clean Light Background
    backgroundElement: '#F1F5F9', // Subedge Subtle Container
    backgroundSelected: '#F0F7F7', // Subedge Teal Tint
    textSecondary: '#64748B', // Subedge Muted Text
    surface: '#FFFFFF', // Clean White Card Surface
    border: '#E2E8F0', // Subedge Border Gray
    primary: '#0D7377', // Subedge Signature Teal
    primaryForeground: '#FFFFFF',
    primaryDark: '#0A5F62',
    primaryLight: '#F0F7F7',
    success: '#10B981', // Emerald
    successLight: '#D1FAE5',
    warning: '#D97706', // Amber
    warningLight: '#FEF3C7',
    danger: '#EF4444', // Crimson
    dangerLight: '#FEE2E2',
    accent: '#0D7377',
    accentLight: '#F0F7F7',
  },
  dark: {
    text: '#1A1A2E',
    background: '#F8FAFC',
    backgroundElement: '#F1F5F9',
    backgroundSelected: '#F0F7F7',
    textSecondary: '#64748B',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    primary: '#0D7377',
    primaryForeground: '#FFFFFF',
    primaryDark: '#0A5F62',
    primaryLight: '#F0F7F7',
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    danger: '#EF4444',
    dangerLight: '#FEE2E2',
    accent: '#0D7377',
    accentLight: '#F0F7F7',
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
    sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
    rounded: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
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
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 1280;
