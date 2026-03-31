import { StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';

import { Text, View } from '@/components/Themed';

const PRO_FEATURES = [
  { icon: '💳', label: 'Unlimited cards' },
  { icon: '📊', label: 'Payment planning' },
  { icon: '📅', label: 'Installment tracking' },
  { icon: '🤖', label: 'AI-powered alerts' },
];

export default function ProPaywallScreen() {
  function handleAnnual() {
    // MO-02/MO-03 will integrate RevenueCat here
    router.back();
  }

  function handleMonthly() {
    // MO-02/MO-03 will integrate RevenueCat here
    router.back();
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🔒</Text>
        <Text style={styles.title}>Upgrade to Pro</Text>
        <Text style={styles.subtitle}>
          You&apos;ve reached the 2-card limit on the Free plan. Upgrade to manage all your cards.
        </Text>
      </View>

      <View style={styles.featureList}>
        {PRO_FEATURES.map((feature) => (
          <View key={feature.label} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{feature.icon}</Text>
            <Text style={styles.featureLabel}>{feature.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.plans}>
        <Pressable style={styles.annualPlan} onPress={handleAnnual}>
          <View style={styles.annualPlanContent}>
            <View style={styles.planHeader}>
              <Text style={styles.annualPlanTitle}>Annual Plan</Text>
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>Save 44%</Text>
              </View>
            </View>
            <Text style={styles.annualPrice}>₱83/mo, billed ₱999/yr</Text>
            <Text style={styles.annualCta}>Less than one late payment fee</Text>
          </View>
        </Pressable>

        <Pressable style={styles.monthlyPlan} onPress={handleMonthly}>
          <Text style={styles.monthlyPlanTitle}>Monthly Plan</Text>
          <Text style={styles.monthlyPrice}>₱149/mo</Text>
        </Pressable>

        <Text style={styles.cancelNote}>Cancel anytime</Text>
      </View>

      <Pressable style={styles.dismissButton} onPress={() => router.back()}>
        <Text style={styles.dismissText}>Not now</Text>
      </Pressable>
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
    color: '#666',
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
    borderBottomColor: '#f0f0f0',
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  plans: {
    width: '100%',
    alignItems: 'center',
  },
  annualPlan: {
    width: '100%',
    backgroundColor: '#10b981',
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
    color: '#fff',
  },
  saveBadge: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
  },
  saveBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  annualPrice: {
    fontSize: 15,
    color: '#d1fae5',
    fontWeight: '600',
    marginBottom: 4,
  },
  annualCta: {
    fontSize: 13,
    color: '#d1fae5',
    fontStyle: 'italic',
  },
  monthlyPlan: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
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
    color: '#374151',
  },
  monthlyPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  cancelNote: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  dismissButton: {
    marginTop: 24,
    paddingVertical: 12,
  },
  dismissText: {
    fontSize: 15,
    color: '#9ca3af',
  },
});
