import { Platform } from 'react-native';

/**
 * Centralized mobile layout constants.
 * Used by BottomTabBar, FABs, sticky footers, and screen padding.
 */
export const MOBILE = {
  /** Height of the bottom tab bar (excluding safe area inset) */
  TAB_BAR_HEIGHT: 56,
  /** Recommended FAB bottom offset (clears tab bar + safe area) */
  FAB_BOTTOM_OFFSET: 96,
  /** Minimum touch target per Material Design guidelines */
  MIN_TOUCH_TARGET: 48,
  /** Standard horizontal screen padding */
  SCREEN_PADDING: 20,
  /** Standard card border radius */
  CARD_RADIUS: 20,
  /** Hero header bottom border radius */
  HEADER_RADIUS: 28,
} as const;
