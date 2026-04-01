import 'react-native-gesture-handler';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useUserStore } from '@/store/userStore';
import { useAuthStore } from '@/store/authStore';
import { initFirestore } from '@/utils/firebase';
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

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      useAuthStore.getState().setUser(user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      // Initialize Firebase Crashlytics with global JS error handler
      initCrashReporting();
      // Initialize Firestore with offline persistence (encrypted at rest by native SDK)
      initFirestore();
      // Verify Pro entitlement on app launch (checks trial expiry for trial users)
      useSubscriptionStore.getState().verifyEntitlement();
      // Initialize PostHog analytics (EU region)
      initAnalytics();
      // Restore opt-out preference from persisted store
      const optOut = useUserStore.getState().analyticsOptOut;
      if (optOut) setAnalyticsOptOut(true);
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);

  if (authLoading) return null;

  if (!user) {
    return (
      <AppThemeProvider>
        <ThemeProvider value={colorScheme === 'dark' ? navDark : navLight}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="sign-in" />
          </Stack>
        </ThemeProvider>
      </AppThemeProvider>
    );
  }

  return (
    <AppThemeProvider>
      <ThemeProvider value={colorScheme === 'dark' ? navDark : navLight}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="add-card" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="swipe-impact" options={{ presentation: 'modal', title: 'Swipe Impact' }} />
          <Stack.Screen name="update-balance" options={{ presentation: 'modal', title: 'Update Balance' }} />
          <Stack.Screen name="edit-card" options={{ presentation: 'modal', title: 'Edit Card' }} />
          <Stack.Screen name="pro-paywall" options={{ presentation: 'modal', title: 'Upgrade to Pro' }} />
          <Stack.Screen name="onboarding" options={{ presentation: 'modal', title: 'Get Started', headerShown: false }} />
          <Stack.Screen name="onboarding-result" options={{ presentation: 'modal', title: 'Your Status', headerShown: false }} />
          <Stack.Screen name="settings" options={{ presentation: 'containedModal', headerShown: false }} />
          <Stack.Screen name="manage-cards" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          <Stack.Screen name="component-showcase" options={{ presentation: 'modal', title: 'Component Showcase' }} />
        </Stack>
      </ThemeProvider>
    </AppThemeProvider>
  );
}
