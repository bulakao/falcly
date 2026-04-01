import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { Button } from '@/components/atoms';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useAppTheme } from '@/theme';
import {
  trackOnboardingNotificationsGranted,
  trackOnboardingNotificationsDeclined,
} from '@/utils/analytics';

function completeOnboarding() {
  useOnboardingStore.getState().complete();
  router.replace('/');
}

interface NotificationsModule {
  requestPermissionsAsync: () => Promise<{ status: string }>;
}

let Notifications: NotificationsModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications') as NotificationsModule;
} catch {
  // expo-notifications not installed
}

export default function OnboardingNotificationsScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();

  async function handleTurnOn() {
    if (Notifications) {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          trackOnboardingNotificationsGranted();
        } else {
          trackOnboardingNotificationsDeclined();
        }
      } catch {
        trackOnboardingNotificationsDeclined();
      }
    } else {
      trackOnboardingNotificationsGranted();
    }
    completeOnboarding();
  }

  function handleNotNow() {
    trackOnboardingNotificationsDeclined();
    completeOnboarding();
  }

  return (
    <View style={[styles.container, { backgroundColor: t.background, paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.content}>
        <Text style={styles.icon}>🔔</Text>
        <Text style={[styles.title, { color: t.textPrimary }]}>
          Never miss a payment
        </Text>
        <Text style={[styles.body, { color: t.textSecondary }]}>
          Get notified before your statement closes and when your bill is due.
        </Text>
      </View>

      <View style={styles.cta}>
        <Button label="Turn on Notifications" onPress={handleTurnOn} />
        <View style={styles.ctaSpacer} />
        <Button label="Not now" onPress={handleNotNow} variant="ghost" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  cta: {
    gap: 4,
  },
  ctaSpacer: {
    height: 4,
  },
});
