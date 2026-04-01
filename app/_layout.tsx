import 'react-native-gesture-handler';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from 'react-native';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useUserStore } from '@/store/userStore';
import { useCardStore } from '@/store/cardStore';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
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
  const isOnboardingComplete = useOnboardingStore((s) => s.isComplete);
  const segments = useSegments();
  const router = useRouter();

  // Redirect based on auth + onboarding state
  useEffect(() => {
    if (authLoading) return;

    const currentSegment = segments[0];
    const authScreens = ['sign-in', 'sign-up', 'welcome'];
    const onAuthScreen = authScreens.includes(currentSegment as string);
    const onOnboardingScreen = currentSegment === 'onboarding' || currentSegment === 'onboarding-result' || currentSegment === 'onboarding-paywall' || currentSegment === 'onboarding-notifications';

    if (!user) {
      // Not authenticated → go to welcome (unless already on an auth screen)
      if (!onAuthScreen) {
        router.replace('/welcome');
      }
    } else if (!isOnboardingComplete) {
      // Authenticated but onboarding not complete → stay on onboarding screens
      if (!onOnboardingScreen && !onAuthScreen) {
        router.replace('/onboarding');
      }
    } else {
      // Authenticated + onboarding complete → go to main app
      if (onAuthScreen || onOnboardingScreen) {
        router.replace('/');
      }
    }
  }, [user, authLoading, isOnboardingComplete, segments]);

  if (authLoading) return null;

  return (
    <AppThemeProvider>
      <ThemeProvider value={colorScheme === 'dark' ? navDark : navLight}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up" options={{ headerShown: false }} />
          <Stack.Screen name="add-card" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="swipe-impact" options={{ presentation: 'modal', title: 'Swipe Impact' }} />
          <Stack.Screen name="update-balance" options={{ presentation: 'modal', title: 'Update Balance' }} />
          <Stack.Screen name="edit-card" options={{ presentation: 'modal', title: 'Edit Card' }} />
          <Stack.Screen name="pro-paywall" options={{ presentation: 'modal', title: 'Upgrade to Pro' }} />
          <Stack.Screen name="onboarding" options={{ presentation: 'modal', title: 'Get Started', headerShown: false }} />
          <Stack.Screen name="onboarding-result" options={{ presentation: 'modal', title: 'Your Status', headerShown: false }} />
          <Stack.Screen name="onboarding-paywall" options={{ presentation: 'modal', title: 'Free Trial', headerShown: false }} />
          <Stack.Screen name="onboarding-notifications" options={{ presentation: 'modal', title: 'Notifications', headerShown: false }} />
          <Stack.Screen name="settings" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="manage-cards" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="component-showcase" options={{ presentation: 'modal', title: 'Component Showcase' }} />
        </Stack>
      </ThemeProvider>
    </AppThemeProvider>
  );
}
