import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useSubscriptionStore } from '@/store/subscriptionStore';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      // Check if Pro trial has expired on app launch
      useSubscriptionStore.getState().checkTrialExpiry();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-card" options={{ presentation: 'modal', title: 'Add Card' }} />
        <Stack.Screen name="swipe-impact" options={{ presentation: 'modal', title: 'Swipe Impact' }} />
        <Stack.Screen name="update-balance" options={{ presentation: 'modal', title: 'Update Balance' }} />
        <Stack.Screen name="edit-card" options={{ presentation: 'modal', title: 'Edit Card' }} />
        <Stack.Screen name="pro-paywall" options={{ presentation: 'modal', title: 'Upgrade to Pro' }} />
        <Stack.Screen name="onboarding" options={{ presentation: 'modal', title: 'Get Started', headerShown: false }} />
        <Stack.Screen name="onboarding-result" options={{ presentation: 'modal', title: 'Your Status', headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
