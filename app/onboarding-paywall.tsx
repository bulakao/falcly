import { useEffect } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { Button } from '@/components/atoms';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useAppTheme } from '@/theme';
import {
  trackOnboardingPaywallViewed,
  trackOnboardingTrialStarted,
  trackOnboardingPaywallDismissed,
} from '@/utils/analytics';

const PRO_FEATURES = [
  { icon: '💳', label: 'Unlimited cards' },
  { icon: '📊', label: 'Payment planning' },
  { icon: '📅', label: 'Installment tracking' },
  { icon: '🔔', label: 'Priority alerts' },
];

export default function OnboardingPaywallScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const tier = useSubscriptionStore((s) => s.tier);
  const startTrial = useSubscriptionStore((s) => s.startTrial);

  useEffect(() => {
    // Skip if user already has trial/pro/pro_plus
    if (tier === 'trial' || tier === 'pro' || tier === 'pro_plus') {
      useOnboardingStore.getState().setStep('notifications');
      router.replace('/onboarding-notifications');
      return;
    }
    trackOnboardingPaywallViewed();
  }, [tier]);

  function handleStartTrial() {
    startTrial();
    trackOnboardingTrialStarted();
    useOnboardingStore.getState().setStep('notifications');
    router.replace('/onboarding-notifications');
  }

  function handleContinueFree() {
    trackOnboardingPaywallDismissed();
    useOnboardingStore.getState().setStep('notifications');
    router.replace('/onboarding-notifications');
  }

  return (
    <ScrollView
      style={{ backgroundColor: t.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
    >
      <Text style={[styles.title, { color: t.textPrimary }]}>
        You&apos;re on the free plan
      </Text>
      <Text style={[styles.freeSummary, { color: t.textSecondary }]}>
        2 cards · SAFE/CAUTION/RISKY status · Basic reminders
      </Text>

      <View style={[styles.divider, { backgroundColor: t.border }]} />

      <Text style={[styles.trialTitle, { color: t.textPrimary }]}>
        Unlock more with a 30-day free trial
      </Text>

      <View style={styles.features}>
        {PRO_FEATURES.map((f) => (
          <View key={f.label} style={[styles.featureRow, { backgroundColor: t.surface }]}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={[styles.featureLabel, { color: t.textPrimary }]}>{f.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cta}>
        <Button label="Start Free Trial" onPress={handleStartTrial} />
        <View style={styles.ctaSpacer} />
        <Button label="Continue with Free" onPress={handleContinueFree} variant="ghost" />
      </View>

      <Text style={[styles.finePrint, { color: t.textMuted }]}>
        Payment method required. No charge for 30 days. Cancel anytime.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  freeSummary: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 24,
  },
  trialTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  features: {
    gap: 12,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  cta: {
    marginBottom: 16,
  },
  ctaSpacer: {
    height: 8,
  },
  finePrint: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
