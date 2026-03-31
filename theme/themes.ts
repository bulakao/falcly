import { palette, type SemanticTokens } from './tokens';

export const lightTheme: SemanticTokens = {
  // Surfaces
  background: palette.warmWhite,
  surface: palette.surfaceLight,
  surfaceElevated: palette.white,

  // Text
  textPrimary: palette.textDark,
  textSecondary: palette.textSecondary,
  textMuted: palette.warmTaupe,
  textInverse: palette.white,

  // Borders
  border: palette.borderLight,
  borderStrong: palette.warmTaupe,

  // Primary action
  primary: palette.amberGold,
  primaryText: palette.deepNavy,
  primaryMuted: palette.borderLight,

  // Status
  safe: palette.teal,
  safeBg: palette.safeBg,
  caution: palette.amberGold,
  cautionBg: palette.cautionBg,
  cautionText: palette.cautionText,
  risky: palette.crimson,
  riskyBg: palette.riskyBg,
  riskyBorder: palette.riskyBorder,

  // Accent (pro badge, highlights)
  accent: palette.amberGold,
  accentBg: palette.accentBg,
  accentText: palette.darkGold,
  accentMuted: palette.lightGold,

  // Interactive
  inputBg: palette.surfaceLight,
  inputBorder: palette.borderLight,
  inputText: palette.textDark,
  placeholder: palette.warmTaupe,

  // Overlay
  overlay: 'rgba(18, 18, 31, 0.5)',

  // Tab bar
  tabIconDefault: palette.borderLight,
  tabIconSelected: palette.amberGold,
};

export const darkTheme: SemanticTokens = {
  // Surfaces
  background: '#000000',
  surface: palette.deepNavy,
  surfaceElevated: '#080808',

  // Text
  textPrimary: palette.paleSilver,
  textSecondary: palette.warmTaupe,
  textMuted: palette.warmTaupe,
  textInverse: palette.deepNavy,

  // Borders
  border: palette.borderDark,
  borderStrong: palette.warmTaupe,

  // Primary action
  primary: palette.amberGold,
  primaryText: palette.deepNavy,
  primaryMuted: palette.muted,

  // Status
  safe: palette.teal,
  safeBg: '#1A2E28',
  caution: palette.amberGold,
  cautionBg: '#2E2A1A',
  cautionText: palette.amberGold,
  risky: palette.crimson,
  riskyBg: '#2A1F1F',
  riskyBorder: '#3A2828',

  // Accent (pro badge, highlights)
  accent: palette.amberGold,
  accentBg: palette.muted,
  accentText: palette.amberGold,
  accentMuted: palette.darkGold,

  // Interactive
  inputBg: palette.muted,
  inputBorder: palette.borderDark,
  inputText: palette.paleSilver,
  placeholder: palette.warmTaupe,

  // Overlay
  overlay: 'rgba(18, 18, 31, 0.7)',

  // Tab bar
  tabIconDefault: palette.warmTaupe,
  tabIconSelected: palette.amberGold,
};
