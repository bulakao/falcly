import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme, type ColorSchemeName } from 'react-native';
import { type SemanticTokens } from './tokens';
import { lightTheme, darkTheme } from './themes';
import { useUserStore } from '@/store/userStore';

const ThemeContext = createContext<SemanticTokens>(lightTheme);

export function useEffectiveColorScheme(): ColorSchemeName {
  const systemScheme = useColorScheme();
  const themePreference = useUserStore((s) => s.themePreference);

  if (themePreference === 'light') return 'light';
  if (themePreference === 'dark') return 'dark';
  return systemScheme;
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useEffectiveColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): SemanticTokens {
  return useContext(ThemeContext);
}
