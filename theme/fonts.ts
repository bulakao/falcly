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
 * Use these instead of raw numbers. Every fontSize in the app should
 * reference one of these values. When adding new UI, pick the closest
 * semantic size rather than inventing a new number.
 *
 * Scaling is capped at 1.4x via maxFontSizeMultiplier (set in _layout.tsx
 * and Themed.tsx). At max scale:
 *   caption 11 → 15.4    body 14 → 19.6    title2 22 → 30.8
 *
 * If you need a size not in this scale, add it here — don't hardcode.
 */
/**
 * Type scale — aligned with Apple HIG Dynamic Type sizes.
 *
 * These values are the MINIMUM readable sizes. Dynamic Type can scale
 * them UP to 1.4x but never below these values (enforced in _layout.tsx
 * and Themed.tsx via allowFontScaling + maxFontSizeMultiplier).
 *
 * At max scale (1.4x):
 *   caption 12 → 16.8    body 17 → 23.8    title2 22 → 30.8
 */
export const typeScale = {
  /** 11px — Micro labels, badge counts */
  micro: 11,
  /** 12px — Timestamps, tertiary hints, small badges (Apple: Caption 2) */
  caption: 12,
  /** 13px — Secondary info, sublabels (Apple: Footnote) */
  footnote: 13,
  /** 15px — Labels, section group headers (Apple: Subhead) */
  subhead: 15,
  /** 17px — Default body text, buttons, nav items (Apple: Body) */
  body: 17,
  /** 16px — Emphasized body, form labels (Apple: Callout) */
  callout: 16,
  /** 17px — Section titles, card names (Apple: Headline, semibold) */
  headline: 17,
  /** 18px — Dense body text, line-height contexts */
  body2: 18,
  /** 20px — Card titles, stat values (Apple: Title 3) */
  title3: 20,
  /** 22px — Subsection heroes */
  title2a: 22,
  /** 22px — Screen titles (Apple: Title 2) */
  title2: 22,
  /** 24px — Prominent stat values, modal titles */
  title2b: 24,
  /** 26px — Large stat values */
  title1b: 26,
  /** 28px — Hero numbers (Apple: Title 1) */
  title1: 28,
  /** 32px — Hero display numbers */
  hero: 32,
  /** 34px — Welcome headline (Apple: Large Title) */
  largeTitle: 34,
  /** 36px — Extra large display */
  display: 36,
  /** 48px — Jumbo display (icons, onboarding) */
  jumbo: 48,
} as const;
