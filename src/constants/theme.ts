/**
 * Subedge Technology Pvt Ltd — Oasis Platform: Oasis HRMS Theme System.
 *
 * "Deep Teal, Elevated" design language.
 * Single source of truth for the mobile + web app: color, typography, spacing,
 * radius, elevation and brand gradients. Token-driven so a dark palette can be
 * dropped in later without touching screens.
 *
 * Canonical brand teal ramp (Tailwind `teal`, brand = teal-700 #0F766E):
 *   50 #F0FDFA · 100 #CCFBF1 · 200 #99F6E4 · 300 #5EEAD4 · 400 #2DD4BF
 *   500 #14B8A6 · 600 #0D9488 · 700 #0F766E · 800 #115E59 · 900 #134E4A · 950 #042F2E
 */

import '@/global.css';

import { Platform } from 'react-native';

/** Canonical brand teal ramp — used by the app theme AND the Gluestack config override. */
export const Teal = {
  50: '#F0FDFA',
  100: '#CCFBF1',
  200: '#99F6E4',
  300: '#5EEAD4',
  400: '#2DD4BF',
  500: '#14B8A6',
  600: '#0D9488',
  700: '#0F766E',
  800: '#115E59',
  900: '#134E4A',
  950: '#042F2E',
} as const;

/** Neutral slate ramp for text, borders and surfaces. */
export const Slate = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A',
} as const;

export const Colors = {
  light: {
    // Text
    text: Slate[900], // Deep slate — primary text
    textSecondary: Slate[500], // Muted text
    textTertiary: Slate[400], // Faint / captions / placeholders

    // Surfaces
    background: Slate[50], // App canvas
    backgroundElement: Slate[100], // Subtle filled containers
    backgroundSelected: Teal[50], // Selected / active teal tint
    surface: '#FFFFFF', // Cards & sheets
    surfaceMuted: Slate[50], // Inset rows inside cards

    // Lines
    border: Slate[200], // Hairline borders
    borderStrong: Slate[300], // Emphasized dividers

    // Brand
    primary: Teal[700], // #0F766E — canonical brand teal
    primaryForeground: '#FFFFFF',
    primaryDark: Teal[900], // Gradient end / pressed
    primaryLight: Teal[50], // Teal tint background
    accent: Teal[500], // #14B8A6 — bright highlight
    accentLight: Teal[100],

    // Semantic
    success: '#059669',
    successLight: '#D1FAE5',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    danger: '#DC2626',
    dangerLight: '#FEE2E2',
    info: '#0284C7',
    infoLight: '#E0F2FE',

    // Utility
    overlay: 'rgba(15, 23, 42, 0.55)',
    onPrimaryMuted: 'rgba(255,255,255,0.72)',
  },
  dark: {
    // Dark palette is intentionally a scaffold mirroring light for now.
    // The app runs light-only (see use-theme.ts); values here keep the shape
    // intact so a real dark theme can be authored later without code changes.
    text: Slate[900],
    textSecondary: Slate[500],
    textTertiary: Slate[400],
    background: Slate[50],
    backgroundElement: Slate[100],
    backgroundSelected: Teal[50],
    surface: '#FFFFFF',
    surfaceMuted: Slate[50],
    border: Slate[200],
    borderStrong: Slate[300],
    primary: Teal[700],
    primaryForeground: '#FFFFFF',
    primaryDark: Teal[900],
    primaryLight: Teal[50],
    accent: Teal[500],
    accentLight: Teal[100],
    success: '#059669',
    successLight: '#D1FAE5',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    danger: '#DC2626',
    dangerLight: '#FEE2E2',
    info: '#0284C7',
    infoLight: '#E0F2FE',
    overlay: 'rgba(15, 23, 42, 0.55)',
    onPrimaryMuted: 'rgba(255,255,255,0.72)',
  },
};

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ThemeColors = typeof Colors.light;

/**
 * Brand gradients. Each is a tuple of stops for `expo-linear-gradient`.
 * `hero` is the signature teal→deep-teal header wash used across dashboards.
 */
export const Gradients = {
  hero: [Teal[700], Teal[900]] as const, // #0F766E → #134E4A
  heroSoft: [Teal[600], Teal[800]] as const,
  accent: [Teal[500], Teal[700]] as const,
  navy: ['#1E293B', '#0F172A'] as const, // graphite hero (admin/hr)
} as const;

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

/**
 * Type scale. Weights are strings so they can be spread straight onto a
 * react-native `Text` style. Line heights are tuned for dense enterprise data.
 */
export const Typography = {
  display: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5, lineHeight: 38 },
  h1: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.4, lineHeight: 32 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2, lineHeight: 24 },
  title: { fontSize: 16, fontWeight: '700' as const, letterSpacing: -0.1, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '500' as const, letterSpacing: 0, lineHeight: 21 },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const, letterSpacing: 0, lineHeight: 21 },
  callout: { fontSize: 14, fontWeight: '500' as const, letterSpacing: 0, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.2, lineHeight: 16 },
  overline: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8, lineHeight: 14 },
} as const;

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
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  '2xl': 28,
  full: 9999,
} as const;

/** Soft, layered elevation. Neutral (near-black) shadow tuned low for a clean look. */
export const Shadows = Platform.select({
  ios: {
    sm: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
    md: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
    lg: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.10, shadowRadius: 24 },
  },
  android: {
    sm: { elevation: 1 },
    md: { elevation: 3 },
    lg: { elevation: 8 },
  },
  web: {
    sm: { boxShadow: '0 1px 2px rgba(15,23,42,0.06)' } as any,
    md: { boxShadow: '0 4px 12px -2px rgba(15,23,42,0.08), 0 2px 4px -2px rgba(15,23,42,0.04)' } as any,
    lg: { boxShadow: '0 12px 28px -6px rgba(15,23,42,0.12), 0 4px 10px -4px rgba(15,23,42,0.06)' } as any,
  },
  default: {
    sm: {},
    md: {},
    lg: {},
  },
});

/** Colored brand shadow for primary CTAs / floating actions. */
export const BrandShadow = Platform.select({
  ios: { shadowColor: Teal[700], shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 16 },
  android: { elevation: 8 },
  web: { boxShadow: '0 10px 24px -6px rgba(15,118,110,0.45)' } as any,
  default: {},
});

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 1280;
