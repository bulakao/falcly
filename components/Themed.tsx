/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import { Text as DefaultText, View as DefaultView, PixelRatio } from 'react-native';

import Colors from '@/constants/Colors';
import { useEffectiveColorScheme } from '@/theme';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'] & {
  maxFontSizeMultiplier?: number;
};
export type ViewProps = ThemeProps & DefaultView['props'];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useEffectiveColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

/**
 * maxFontSizeMultiplier caps iOS Dynamic Type scaling at 1.4x.
 * Generous for accessibility, prevents layout destruction.
 * Individual components can override with their own maxFontSizeMultiplier prop.
 */
const DEFAULT_MAX_FONT_SCALE = 1.2;
const ALLOW_SCALING = PixelRatio.getFontScale() >= 1;

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, maxFontSizeMultiplier, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <DefaultText
      allowFontScaling={ALLOW_SCALING}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? DEFAULT_MAX_FONT_SCALE}
      style={[{ color }, style]}
      {...otherProps}
    />
  );
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
