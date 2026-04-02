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
