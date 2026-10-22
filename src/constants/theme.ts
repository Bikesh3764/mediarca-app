/**
 * MediArca Mobile Design System Tokens
 * Strict adherence to Apple Human Interface Guidelines (DESIGN.md)
 *
 * Core Tokens:
 * - Single Action Blue (#0066cc) for user intent & interactive states
 * - Canvas Parchment (#f5f5f7) and Pure White (#ffffff) alternating rhythm
 * - 44x44pt minimum touch targets
 * - High contrast Ink (#1d1d1f) typography
 */

import { Platform } from 'react-native';

export const Colors = {
  // Brand & Action
  primary: '#0066cc',
  primaryFocus: '#0071e3',
  primaryLight: '#e6f0fa',
  primaryDark: '#004c99',

  // Canvas & Surfaces
  canvas: '#ffffff',
  canvasParchment: '#f5f5f7',
  surfacePearl: '#fafafc',
  surfaceCard: '#ffffff',
  surfaceDark: '#1c1c1e',

  // Text & Ink
  ink: '#1d1d1f',
  inkMuted80: '#3a3a3c',
  inkMuted48: '#8e8e93',
  inkWhite: '#ffffff',

  // Borders & Dividers
  hairline: '#e5e5ea',
  divider: '#f0f0f0',

  // Semantic States (Cabin status, tokens, queue states)
  success: '#34c759',
  successLight: '#eafaf1',
  successDark: '#248a3d',

  warning: '#ff9500',
  warningLight: '#fff8eb',
  warningDark: '#b26a00',

  danger: '#ff3b30',
  dangerLight: '#feeceb',
  dangerDark: '#c7241b',

  // Theme support
  light: {
    text: '#1d1d1f',
    background: '#f5f5f7',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    card: '#ffffff',
    border: '#e5e5ea',
    primary: '#0066cc',
    textSecondary: '#8e8e93',
    tint: '#0066cc',
    tabIconDefault: '#8e8e93',
    tabIconSelected: '#0066cc',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    card: '#1c1c1e',
    border: '#2c2c2e',
    primary: '#2997ff',
    textSecondary: '#98989d',
    tint: '#2997ff',
    tabIconDefault: '#98989d',
    tabIconSelected: '#2997ff',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const TouchTarget = {
  minSize: 44,
  minHeight: 44,
  minWidth: 44,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 32,
  eight: 40,
  nine: 48,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  card: 16,
  lg: 20,
  pill: 9999,
} as const;

export const Typography = {
  hero: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
    lineHeight: 38,
  },
  title1: {
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  title2: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 22,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
    lineHeight: 22,
  },
  subheadline: {
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  captionBold: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
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
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: 'Georgia, Cambria, serif',
    rounded: 'ui-rounded, sans-serif',
    mono: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
});

export const Shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  cardElevated: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
  subtle: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
} as const;
