/**
 * Design tokens — the single source of truth for all visual values.
 *
 * Raw palette: literal color values, never used directly in components.
 * Semantic tokens: what colors *mean* (e.g. "primary", "safe", "border").
 * Components reference semantic tokens via light/dark themes in themes.ts.
 */

// ─── Raw Palette ─────────────────────────────────────────────────────────────

export const palette = {
  // Core falcon tones
  slateCharcoal: '#1C1C2E',
  deepNavy: '#12121F',
  amberGold: '#D4A017',
  darkGold: '#B8880F',
  lightGold: '#E8D48A',
  warmTaupe: '#8C7A6B',
  paleSilver: '#E8E4DF',
  muted: '#3A3A52',

  // Warm neutrals
  warmWhite: '#F7F7F7',
  surfaceLight: '#F5F3F0',
  borderLight: '#D6D0C8',
  borderDark: '#2E2E44',
  textDark: '#1C1C2E',
  textSecondary: '#6B6358',

  // Status
  teal: '#2A9D8F',
  crimson: '#C0392B',

  // Status backgrounds
  safeBg: '#F0FAF8',
  cautionBg: '#FFF8E7',
  riskyBg: '#FFF5F3',
  accentBg: '#FBF7ED',
  cautionText: '#7A5C00',
  riskyBorder: '#F5D5D0',

  // Absolute
  white: '#FFFFFF',
  transparent: 'transparent',
} as const;

// ─── Semantic Tokens (theme-agnostic names) ──────────────────────────────────

export type SemanticTokens = {
  // Surfaces
  background: string;
  surface: string;
  surfaceElevated: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Borders
  border: string;
  borderStrong: string;

  // Primary action
  primary: string;
  primaryText: string;
  primaryMuted: string;

  // Status — SAFE / CAUTION / RISKY
  safe: string;
  safeBg: string;
  caution: string;
  cautionBg: string;
  cautionText: string;
  risky: string;
  riskyBg: string;
  riskyBorder: string;

  // Accent (pro badge, highlights)
  accent: string;
  accentBg: string;
  accentText: string;
  accentMuted: string;

  // Interactive
  inputBg: string;
  inputBorder: string;
  inputText: string;
  placeholder: string;

  // Overlay
  overlay: string;

  // Tab bar
  tabIconDefault: string;
  tabIconSelected: string;
};
