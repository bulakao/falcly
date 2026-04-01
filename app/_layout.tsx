import 'react-native-gesture-handler';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Redirect, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from 'react-native';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useUserStore } from '@/store/userStore';
import { useCardStore } from '@/store/cardStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/utils/supabase';
import { useRunMigrations } from '@/db/migrate';
import { initAnalytics, setAnalyticsOptOut } from '@/utils/analytics';
import { initCrashReporting } from '@/utils/crashReporting';
import { AppThemeProvider, lightTheme, darkTheme } from '@/theme';
import type { Theme } from '@react-navigation/native';

const navLight: Theme = {
  dark: false,
  colors: {
    primary: lightTheme.primary,
    background: lightTheme.background,
    card: lightTheme.background,
    text: lightTheme.textPrimary,
    border: lightTheme.border,
    notification: lightTheme.risky,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '800' },
  },
};

const navDark: Theme = {
  dark: true,
  colors: {
    primary: darkTheme.primary,
    background: darkTheme.background,
    card: darkTheme.background,
    text: darkTheme.textPrimary,
    border: darkTheme.border,
    notification: darkTheme.risky,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '800' },
  },
};

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });
  const { success: dbReady, error: dbError } = useRunMigrations();

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (dbError) throw dbError;
  }, [dbError]);

  // Check initial session + listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      useAuthStore.getState().setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      useAuthStore.getState().setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load data from SQLite once migrations complete
  useEffect(() => {
    if (dbReady) {
      useCardStore.getState().loadCards();
      useUserStore.getState().loadProfile();
    }
  }, [dbReady]);

  useEffect(() => {
    if (loaded && dbReady) {
      SplashScreen.hideAsync();
      // Initialize crash reporting
      initCrashReporting();
      // Verify Pro entitlement on app launch
      useSubscriptionStore.getState().verifyEntitlement();
      // Initialize PostHog analytics
      initAnalytics();
      // Restore opt-out preference
      const optOut = useUserStore.getState().analyticsOptOut;
      if (optOut) setAnalyticsOptOut(true);
    }
  }, [loaded, dbReady]);

  if (!loaded || !dbReady) {
    return null;
  }

  return <RootLayoutNav />;
}

export default RootLayout;


function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);

  if (authLoading) return null;

  return (
    <AppThemeProvider>
      <ThemeProvider value={colorScheme === 'dark' ? navDark : navLight}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="add-card" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="swipe-impact" options={{ presentation: 'modal', title: 'Swipe Impact' }} />
          <Stack.Screen name="update-balance" options={{ presentation: 'modal', title: 'Update Balance' }} />
          <Stack.Screen name="edit-card" options={{ presentation: 'modal', title: 'Edit Card' }} />
          <Stack.Screen name="pro-paywall" options={{ presentation: 'modal', title: 'Upgrade to Pro' }} />
          <Stack.Screen name="onboarding" options={{ presentation: 'modal', title: 'Get Started', headerShown: false }} />
          <Stack.Screen name="onboarding-result" options={{ presentation: 'modal', title: 'Your Status', headerShown: false }} />
          <Stack.Screen name="settings" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="manage-cards" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="component-showcase" options={{ presentation: 'modal', title: 'Component Showcase' }} />
        </Stack>
        {!user && <Redirect href="/sign-in" />}
      </ThemeProvider>
    </AppThemeProvider>
  );
}
