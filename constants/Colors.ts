/**
 * @deprecated Import from '@/theme' instead.
 * Kept for backward compatibility with components/Themed.tsx and tabs layout.
 */
import { lightTheme, darkTheme } from '@/theme';

export default {
  light: {
    text: lightTheme.textPrimary,
    background: lightTheme.background,
    tint: lightTheme.primary,
    tabIconDefault: lightTheme.tabIconDefault,
    tabIconSelected: lightTheme.tabIconSelected,
  },
  dark: {
    text: darkTheme.textPrimary,
    background: darkTheme.background,
    tint: darkTheme.primary,
    tabIconDefault: darkTheme.tabIconDefault,
    tabIconSelected: darkTheme.tabIconSelected,
  },
};
