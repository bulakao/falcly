import { StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import type { PlanType } from '@/store/subscriptionStore';
import { trackProConversionStarted, trackProTrialStarted, trackProConverted } from '@/utils/analytics';
import { useAppTheme } from '@/theme';
import { Button, Caption } from '@/components/atoms';

const TRIAL_FEATURES = [
  { icon: '💳', label: 'Unlimited cards' },
  { icon: '📊', label: 'Payment planning' },
  { icon: '📅', label: 'Installment tracking' },
  { icon: '🔔', label: 'Billing cycle alerts' },
];

const PRO_PLUS_FEATURES = [
  { icon: '🤖', label: 'AI-powered alerts' },
  { icon: '💬', label: 'Natural language queries' },
  { icon: '📈', label: 'Smart spending insights' },
];

export default function ProPaywallScreen() {
  const t = useAppTheme();
  const startTrial = useSubscriptionStore((s) => s.startTrial);
  const isTrialActive = useSubscriptionStore((s) => s.isTrialActive);
  const isPro = useSubscriptionStore((s) => s.isPro);
  const isProPlus = useSubscriptionStore((s) => s.isProPlus);
  const purchasePlan = useSubscriptionStore((s) => s.purchasePlan);
  const trialDaysRemaining = useSubscriptionStore((s) => s.trialDaysRemaining);

  function handleStartTrial() {
    Alert.alert(
      'Start Free Trial',
      'Full access for 30 days — no charge until your trial ends. A payment method is required to start.',
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
    const labels: Record<PlanType, string> = {
      pro_monthly: 'Pro — ₱149/mo',
      pro_quarterly: 'Pro — ₱399/qtr (₱133/mo)',
      pro_annual: 'Pro — ₱999/yr (₱83/mo)',
      pro_plus_monthly: 'Pro+ — ₱249/mo',
      pro_plus_quarterly: 'Pro+ — ₱649/qtr (₱216/mo)',
      pro_plus_annual: 'Pro+ — ₱1,699/yr (₱142/mo)',
    };
    trackProConversionStarted('paywall');
    Alert.alert(
      'Subscribe',
      `You selected ${labels[plan]}. Cancel anytime.\n\nIn the full app, RevenueCat handles the purchase.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: () => {
            trackProConverted(plan);
            purchasePlan(plan);
            router.back();
          },
        },
      ],
    );
  }

  const trialActive = isTrialActive();
  const daysLeft = trialDaysRemaining();

  // Already on Pro+
  if (isProPlus()) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.title}>You&apos;re on Pro+</Text>
          <Text style={[styles.subtitle, { color: t.textSecondary }]}>
            You have full access to all features including AI.
          </Text>
        </View>
        <Button label="Go back" onPress={() => router.back()} variant="ghost" />
      </ScrollView>
    );
  }

  // On Pro (upsell to Pro+)
  if (isPro()) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🚀</Text>
          <Text style={styles.title}>Upgrade to Pro+</Text>
          <Text style={[styles.subtitle, { color: t.textSecondary }]}>
            You&apos;re on Pro. Upgrade to Pro+ to unlock AI features.
          </Text>
        </View>
        <View style={styles.featureList}>
          {PRO_PLUS_FEATURES.map((f) => (
            <View key={f.label} style={[styles.featureRow, { borderBottomColor: t.surface }]}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.plans}>
          <Pressable style={[styles.annualPlan, { backgroundColor: t.primary }]} onPress={() => handlePurchase('pro_plus_annual')}>
            <View style={styles.annualPlanContent}>
              <View style={styles.planHeader}>
                <Text style={[styles.annualPlanTitle, { color: t.textInverse }]}>Annual</Text>
                <View style={[styles.saveBadge, { backgroundColor: t.textInverse }]}>
                  <Text style={[styles.saveBadgeText, { color: t.primary }]}>Best Value · Save 43%</Text>
                </View>
              </View>
              <Text style={[styles.annualPrice, { color: t.accentMuted }]}>₱142/mo, billed ₱1,699/yr</Text>
            </View>
          </Pressable>
          <Pressable style={[styles.monthlyPlan, { borderColor: t.border }]} onPress={() => handlePurchase('pro_plus_quarterly')}>
            <View>
              <Text style={[styles.monthlyPlanTitle, { color: t.inputText }]}>Quarterly</Text>
              <Text style={[styles.planBadgeText, { color: t.textMuted }]}>Most Flexible</Text>
            </View>
            <Text style={[styles.monthlyPrice, { color: t.textMuted }]}>₱649/qtr</Text>
          </Pressable>
          <Pressable style={[styles.monthlyPlan, { borderColor: t.border }]} onPress={() => handlePurchase('pro_plus_monthly')}>
            <Text style={[styles.monthlyPlanTitle, { color: t.inputText }]}>Monthly</Text>
            <Text style={[styles.monthlyPrice, { color: t.textMuted }]}>₱249/mo</Text>
          </Pressable>
          <Caption>Cancel anytime</Caption>
        </View>
        <Button label="Not now" onPress={() => router.back()} variant="ghost" />
      </ScrollView>
    );
  }

  // Free or trial expired — main paywall
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🔒</Text>
        <Text style={styles.title}>
          {trialActive ? `${daysLeft} days left in trial` : 'Upgrade to Pro'}
        </Text>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>
          {trialActive
            ? 'Subscribe before your trial ends to keep full access.'
            : 'Start a 30-day free trial or subscribe directly.'}
        </Text>
      </View>

      <View style={styles.featureList}>
        {TRIAL_FEATURES.map((f) => (
          <View key={f.label} style={[styles.featureRow, { borderBottomColor: t.surface }]}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureLabel}>{f.label}</Text>
          </View>
        ))}
      </View>

      {/* Trial CTA — only show if not already in trial */}
      {!trialActive && (
        <Pressable style={[styles.trialButton, { backgroundColor: t.primary }]} onPress={handleStartTrial}>
          <Text style={[styles.trialButtonText, { color: t.textInverse }]}>Try Free for 30 Days</Text>
          <Text style={[styles.trialSubtext, { color: t.accentMuted }]}>
            Payment method required. No charge for 30 days.
          </Text>
        </Pressable>
      )}

      {/* Pro plans */}
      <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>Pro — Full access, no AI</Text>
      <View style={styles.plans}>
        <Pressable style={[styles.annualPlan, { backgroundColor: t.primary }]} onPress={() => handlePurchase('pro_annual')}>
          <View style={styles.annualPlanContent}>
            <View style={styles.planHeader}>
              <Text style={[styles.annualPlanTitle, { color: t.textInverse }]}>Annual</Text>
              <View style={[styles.saveBadge, { backgroundColor: t.textInverse }]}>
                <Text style={[styles.saveBadgeText, { color: t.primary }]}>Best Value · Save 44%</Text>
              </View>
            </View>
            <Text style={[styles.annualPrice, { color: t.accentMuted }]}>₱83/mo, billed ₱999/yr</Text>
            <Text style={[styles.annualCta, { color: t.accentMuted }]}>Less than one late payment fee</Text>
          </View>
        </Pressable>
        <Pressable style={[styles.monthlyPlan, { borderColor: t.border }]} onPress={() => handlePurchase('pro_quarterly')}>
          <View>
            <Text style={[styles.monthlyPlanTitle, { color: t.inputText }]}>Quarterly</Text>
            <Text style={[styles.planBadgeText, { color: t.textMuted }]}>Most Flexible</Text>
          </View>
          <Text style={[styles.monthlyPrice, { color: t.textMuted }]}>₱399/qtr</Text>
        </Pressable>
        <Pressable style={[styles.monthlyPlan, { borderColor: t.border }]} onPress={() => handlePurchase('pro_monthly')}>
          <Text style={[styles.monthlyPlanTitle, { color: t.inputText }]}>Monthly</Text>
          <Text style={[styles.monthlyPrice, { color: t.textMuted }]}>₱149/mo</Text>
        </Pressable>
      </View>

      {/* Pro+ plans */}
      <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>Pro+ — Everything + AI</Text>
      <View style={styles.plans}>
        <Pressable style={[styles.annualPlan, { backgroundColor: t.primary }]} onPress={() => handlePurchase('pro_plus_annual')}>
          <View style={styles.annualPlanContent}>
            <View style={styles.planHeader}>
              <Text style={[styles.annualPlanTitle, { color: t.textInverse }]}>Annual</Text>
              <View style={[styles.saveBadge, { backgroundColor: t.textInverse }]}>
                <Text style={[styles.saveBadgeText, { color: t.primary }]}>Best Value · Save 43%</Text>
              </View>
            </View>
            <Text style={[styles.annualPrice, { color: t.accentMuted }]}>₱142/mo, billed ₱1,699/yr</Text>
          </View>
        </Pressable>
        <Pressable style={[styles.monthlyPlan, { borderColor: t.border }]} onPress={() => handlePurchase('pro_plus_quarterly')}>
          <View>
            <Text style={[styles.monthlyPlanTitle, { color: t.inputText }]}>Quarterly</Text>
            <Text style={[styles.planBadgeText, { color: t.textMuted }]}>Most Flexible</Text>
          </View>
          <Text style={[styles.monthlyPrice, { color: t.textMuted }]}>₱649/qtr</Text>
        </Pressable>
        <Pressable style={[styles.monthlyPlan, { borderColor: t.border }]} onPress={() => handlePurchase('pro_plus_monthly')}>
          <Text style={[styles.monthlyPlanTitle, { color: t.inputText }]}>Monthly</Text>
          <Text style={[styles.monthlyPrice, { color: t.textMuted }]}>₱249/mo</Text>
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginTop: 8,
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
    marginBottom: 16,
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
  planBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
});
