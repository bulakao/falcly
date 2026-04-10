/**
 * Font family constants.
 *
 * Nunito → headers / titles
 * Inter  → everything else (body, labels, captions, buttons, inputs)
 *
 * Keys match the names registered in useFonts (app/_layout.tsx).
 */

export const fonts = {
  // Nunito (headers)
  nunitoBold: 'Nunito-Bold',
  nunitoSemiBold: 'Nunito-SemiBold',

  // Inter (body)
  interRegular: 'Inter-Regular',
  interMedium: 'Inter-Medium',
  interSemiBold: 'Inter-SemiBold',
  interBold: 'Inter-Bold',
} as const;

/** Shorthand aliases for common usage */
export const heading = fonts.nunitoBold;
export const body = fonts.interRegular;

/**
 * Type scale — the canonical set of font sizes for the app.
 *
 * Headings use h1–h6 (largest to smallest).
 * Body-level text uses semantic names (body, subhead, caption, etc.).
 * Display-level text (largeTitle, display, jumbo) is for heroes and splash.
 *
 * These are minimum readable sizes. Dynamic Type scales UP to 1.2x
 * but never below (enforced in _layout.tsx and Themed.tsx).
 */
export const typeScale = {
  /** 12px — Micro labels, badge counts */
  micro: 12,
  /** 13px — Timestamps, tertiary hints, small badges */
  caption: 13,
  /** 14px — Secondary info, sublabels, footnotes */
  footnote: 14,
  /** 15px — Labels, section group headers, compact UI */
  subhead: 15,
  /** 16px — Default body text, buttons, nav items */
  body: 16,
  /** 16px — Emphasized body, form labels, card descriptions */
  callout: 16,
  /** 17px — Section titles, card names, prominent text */
  headline: 17,
  /** 18px — Dense body text, line-height contexts */
  body2: 18,

  // ── Headings (h6 smallest → h1 largest) ──
  /** 19px — Card titles, stat values, form inputs */
  h6: 19,
  /** 20px — Screen titles */
  h5: 20,
  /** 22px — Prominent stat values, modal titles */
  h4: 22,
  /** 24px — Large stat values */
  h3: 24,
  /** 26px — Hero numbers (debt totals, balances) */
  h2: 26,
  /** 28px — Primary heading */
  h1: 28,

  // ── Display-level ──
  /** 30px — Welcome headline */
  largeTitle: 30,
  /** 32px — Extra large display */
  display: 32,
  /** 40px — Jumbo display (icons, onboarding) */
  jumbo: 40,
} as const;
