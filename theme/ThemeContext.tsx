import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { type SemanticTokens } from './tokens';
import { lightTheme, darkTheme } from './themes';

const ThemeContext = createContext<SemanticTokens>(lightTheme);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): SemanticTokens {
  return useContext(ThemeContext);
}
