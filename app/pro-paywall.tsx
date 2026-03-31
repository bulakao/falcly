import { StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import type { PlanType } from '@/store/subscriptionStore';
import { trackProConversionStarted, trackProTrialStarted, trackProConverted } from '@/utils/analytics';
import { useAppTheme } from '@/theme';
import { Button, Caption } from '@/components/atoms';

const PRO_FEATURES = [
  { icon: '💳', label: 'Unlimited cards' },
  { icon: '📊', label: 'Payment planning' },
  { icon: '📅', label: 'Installment tracking' },
  { icon: '🤖', label: 'AI-powered alerts' },
];

export default function ProPaywallScreen() {
  const t = useAppTheme();
  const startTrial = useSubscriptionStore((s) => s.startTrial);
  const isTrialActive = useSubscriptionStore((s) => s.isTrialActive);
  const purchasePro = useSubscriptionStore((s) => s.purchasePro);
  const isPaidPro = useSubscriptionStore((s) => s.isPaidPro);

  function handleStartTrial() {
    // RevenueCat would handle payment method collection here
    // For now, simulate trial activation
    Alert.alert(
      'Start Free Trial',
      'In the full app, you would be asked to add a payment method. No charge for 14 days. Start your free trial now?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Trial',
          onPress: () => {
            trackProTrialStarted();
            startTrial();
            router.back();
          },
        },
      ],
    );
  }

  function handlePurchase(plan: PlanType) {
    const planLabel = plan === 'annual' ? 'Annual (₱999/yr)' : 'Monthly (₱149/mo)';
    trackProConversionStarted('paywall');
    // RevenueCat would handle the actual purchase flow here
    Alert.alert(
      'Subscribe to Pro',
      `You selected the ${planLabel} plan. Less than one late payment fee. Cancel anytime.\n\nIn the full app, RevenueCat handles the purchase.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: () => {
            trackProConverted(plan);
            purchasePro(plan);
            router.back();
          },
        },
      ],
    );
  }

  function handleAnnual() {
    handlePurchase('annual');
  }

  function handleMonthly() {
    handlePurchase('monthly');
  }

  const trialActive = isTrialActive();
  const paidPro = isPaidPro();

  // If already a paid Pro subscriber, show confirmation instead of paywall
  if (paidPro) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.emoji}>✅</Text>
          <Text style={styles.title}>You&apos;re on Pro</Text>
          <Text style={[styles.subtitle, { color: t.textSecondary }]}>
            You have full access to all Pro features.
          </Text>
        </View>
        <Button label="Go back" onPress={() => router.back()} variant="ghost" />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🔒</Text>
        <Text style={styles.title}>Upgrade to Pro</Text>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>
          You&apos;ve reached the 2-card limit on the Free plan. Upgrade to manage all your cards.
        </Text>
      </View>

      <View style={styles.featureList}>
        {PRO_FEATURES.map((feature) => (
          <View key={feature.label} style={[styles.featureRow, { borderBottomColor: t.surface }]}>
            <Text style={styles.featureIcon}>{feature.icon}</Text>
            <Text style={styles.featureLabel}>{feature.label}</Text>
          </View>
        ))}
      </View>

      {/* Trial CTA */}
      {!trialActive && (
        <Pressable style={[styles.trialButton, { backgroundColor: t.primary }]} onPress={handleStartTrial}>
          <Text style={[styles.trialButtonText, { color: t.textInverse }]}>Try Free for 14 Days</Text>
          <Text style={[styles.trialSubtext, { color: t.accentMuted }]}>
            Payment method required. No charge for 14 days.
          </Text>
        </Pressable>
      )}

      <View style={styles.plans}>
        <Pressable style={[styles.annualPlan, { backgroundColor: t.primary }]} onPress={handleAnnual}>
          <View style={styles.annualPlanContent}>
            <View style={styles.planHeader}>
              <Text style={[styles.annualPlanTitle, { color: t.textInverse }]}>Annual Plan</Text>
              <View style={[styles.saveBadge, { backgroundColor: t.textInverse }]}>
                <Text style={[styles.saveBadgeText, { color: t.primary }]}>Save 44%</Text>
              </View>
            </View>
            <Text style={[styles.annualPrice, { color: t.accentMuted }]}>₱83/mo, billed ₱999/yr</Text>
            <Text style={[styles.annualCta, { color: t.accentMuted }]}>Less than one late payment fee</Text>
          </View>
        </Pressable>

        <Pressable style={[styles.monthlyPlan, { borderColor: t.border }]} onPress={handleMonthly}>
          <Text style={[styles.monthlyPlanTitle, { color: t.inputText }]}>Monthly Plan</Text>
          <Text style={[styles.monthlyPrice, { color: t.textMuted }]}>₱149/mo</Text>
        </Pressable>

        <Caption>Cancel anytime</Caption>
      </View>

      <Button label="Not now" onPress={() => router.back()} variant="ghost" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  featureList: {
    width: '100%',
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  trialButton: {
    width: '100%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  trialButtonText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  trialSubtext: {
    fontSize: 13,
  },
  plans: {
    width: '100%',
    alignItems: 'center',
  },
  annualPlan: {
    width: '100%',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  annualPlanContent: {
    backgroundColor: 'transparent',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  annualPlanTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
  },
  saveBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  annualPrice: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  annualCta: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  monthlyPlan: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthlyPlanTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  monthlyPrice: {
    fontSize: 15,
    fontWeight: '600',
  },
});
