import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { Button } from '@/components/atoms';
import { useAppTheme } from '@/theme';
import {
  trackOnboardingWelcomeViewed,
  trackOnboardingGetStartedTapped,
} from '@/utils/analytics';

const BENEFITS = [
  { icon: '✓', label: 'SAFE/CAUTION/RISKY per card' },
  { icon: '📅', label: 'Which cycle each purchase lands on' },
  { icon: '💳', label: 'Exactly what to pay and when' },
];

export default function WelcomeScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    trackOnboardingWelcomeViewed();
  }, []);

  function handleGetStarted() {
    trackOnboardingGetStartedTapped();
    router.replace('/onboarding');
  }

  return (
    <View style={[styles.container, { backgroundColor: t.background, paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.content}>
        <Text style={[styles.brand, { color: t.primary }]}>Falcly</Text>
        <Text style={[styles.headline, { color: t.textPrimary }]}>
          Know before you swipe.
        </Text>
        <Text style={[styles.subheadline, { color: t.textSecondary }]}>
          Falcly tells you if it&apos;s safe to use your credit card — before you swipe.
        </Text>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.label} style={[styles.chip, { backgroundColor: t.surface }]}>
              <Text style={styles.chipIcon}>{b.icon}</Text>
              <Text style={[styles.chipLabel, { color: t.textPrimary }]}>{b.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.cta}>
        <Button label="Get Started" onPress={handleGetStarted} />
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
    alignItems: 'center',
  },
  brand: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 32,
    letterSpacing: 1,
  },
  headline: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subheadline: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  benefits: {
    width: '100%',
    gap: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  chipIcon: {
    fontSize: 18,
  },
  chipLabel: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  cta: {
    gap: 12,
    alignItems: 'center',
  },
});
