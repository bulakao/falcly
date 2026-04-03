import 'react-native-gesture-handler';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useSubscriptionStore, FREE_CARD_LIMIT } from '@/store/subscriptionStore';
import { useUserStore } from '@/store/userStore';
import { useCardStore } from '@/store/cardStore';
import { useTransactionStore } from '@/store/transactionStore';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { supabase } from '@/utils/supabase';
import { useRunMigrations } from '@/db/migrate';
import { initAnalytics, setAnalyticsOptOut } from '@/utils/analytics';
import { initLogger, initCrashHandler, logger, installNetworkLogger, useNavigationLogger } from '@/utils/logger';
import { AppThemeProvider, useEffectiveColorScheme, lightTheme, darkTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import type { Theme } from '@react-navigation/native';

const navFonts: Theme['fonts'] = {
  regular: { fontFamily: fonts.interRegular, fontWeight: '400' },
  medium: { fontFamily: fonts.interMedium, fontWeight: '500' },
  bold: { fontFamily: fonts.interBold, fontWeight: '700' },
  heavy: { fontFamily: fonts.interBold, fontWeight: '800' },
};

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
  fonts: navFonts,
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
  fonts: navFonts,
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
    [fonts.nunitoBold]: require('@/assets/fonts/Nunito-Bold.ttf'),
    [fonts.nunitoSemiBold]: require('@/assets/fonts/Nunito-SemiBold.ttf'),
    [fonts.interRegular]: require('@/assets/fonts/Inter-Regular.ttf'),
    [fonts.interMedium]: require('@/assets/fonts/Inter-Medium.ttf'),
    [fonts.interSemiBold]: require('@/assets/fonts/Inter-SemiBold.ttf'),
    [fonts.interBold]: require('@/assets/fonts/Inter-Bold.ttf'),
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
      useTransactionStore.getState().loadTransactions();
      useUserStore.getState().loadProfile();
      // Enforce free-tier active card limit on load
      const { tier } = useSubscriptionStore.getState();
      if (tier === 'free') {
        useCardStore.getState().enforceActiveLimit(FREE_CARD_LIMIT);
      }
    }
  }, [dbReady]);

  useEffect(() => {
    if (loaded && dbReady) {
      SplashScreen.hideAsync();
      // Initialize logger and crash handler
      initLogger();
      initCrashHandler(logger);
      installNetworkLogger();
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
  useNavigationLogger();
  const colorScheme = useEffectiveColorScheme();
  const isOnboardingComplete = useOnboardingStore((s) => s.isComplete);
  const segments = useSegments();
  const router = useRouter();

  // Redirect based on onboarding state (no auth gate)
  useEffect(() => {
    const currentSegment = segments[0];
    const onboardingScreens = ['welcome', 'onboarding', 'onboarding-result'];
    const onOnboardingScreen = onboardingScreens.includes(currentSegment as string);

    if (!isOnboardingComplete && !onOnboardingScreen) {
      router.replace('/welcome');
    } else if (isOnboardingComplete && onOnboardingScreen) {
      router.replace('/');
    }
  }, [isOnboardingComplete, segments]);

  return (
    <AppThemeProvider>
      <ThemeProvider value={colorScheme === 'dark' ? navDark : navLight}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="sign-in" options={{ headerTitle: '', headerBackTitle: 'Settings', headerTransparent: true }} />
          <Stack.Screen name="add-card" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="swipe-impact" options={{ presentation: 'modal', title: 'Swipe Impact' }} />
          <Stack.Screen name="update-balance" options={{ presentation: 'modal', title: 'Update Balance' }} />
          <Stack.Screen name="edit-card" options={{ presentation: 'modal', title: 'Edit Card' }} />
          <Stack.Screen name="pro-paywall" options={{ presentation: 'modal', title: 'Upgrade to Pro' }} />
          <Stack.Screen name="onboarding" options={{ title: '', headerBackTitle: 'Back', headerTransparent: true, animation: 'slide_from_right' }} />
          <Stack.Screen name="onboarding-result" options={{ title: '', headerBackTitle: 'Back', headerTransparent: true, animation: 'slide_from_right' }} />
          <Stack.Screen name="settings" options={{ title: '', headerBackTitle: 'Back', headerTransparent: true, animation: 'slide_from_left' }} />
          <Stack.Screen name="manage-cards" options={{ presentation: 'card', title: '', headerTransparent: true, headerBackTitle: 'Back', headerStyle: { backgroundColor: 'transparent' } as never }} />
          <Stack.Screen name="log-transaction" options={{ presentation: 'modal', title: 'Log Transaction' }} />
          <Stack.Screen name="card-transactions" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="payment-summary" options={{ presentation: 'modal', title: 'What You Owe' }} />
          <Stack.Screen name="status-guide" options={{ presentation: 'modal', title: 'How Status Works' }} />
          <Stack.Screen name="component-showcase" options={{ presentation: 'modal', title: 'Component Showcase' }} />
        </Stack>
      </ThemeProvider>
    </AppThemeProvider>
  );
}
