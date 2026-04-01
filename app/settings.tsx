import { useState } from 'react';
import {
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View } from '@/components/Themed';
import { useUserStore } from '@/store/userStore';
import { useCardStore } from '@/store/cardStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAppTheme } from '@/theme';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { exportDataAsCSV } from '@/utils/csvExport';
import { Button, Badge, Heading, SectionHeader } from '@/components/atoms';
import { SectionCard, AlertBanner } from '@/components/molecules';

export default function SettingsScreen() {
  const t = useAppTheme();

  const tier = useSubscriptionStore((s) => s.tier);
  const isTrialActive = useSubscriptionStore((s) => s.isTrialActive);
  const isPaidPro = useSubscriptionStore((s) => s.isPaidPro);
  const planType = useSubscriptionStore((s) => s.planType);
  const getTrialEndDate = useSubscriptionStore((s) => s.getTrialEndDate);
  const trialEndDate = getTrialEndDate();

  const analyticsOptOut = useUserStore((s) => s.analyticsOptOut);
  const setAnalyticsOptOutStore = useUserStore((s) => s.setAnalyticsOptOut);
  const cashOnHand = useUserStore((s) => s.cashOnHand);
  const monthlyIncome = useUserStore((s) => s.monthlyIncome);
  const payday = useUserStore((s) => s.payday);
  const committedExpenses = useUserStore((s) => s.committedExpenses);

  const cards = useCardStore((s) => s.cards);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isOffline } = useNetworkStatus();
  const [exporting, setExporting] = useState(false);

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
        <FontAwesome name="chevron-left" size={16} color={t.textMuted} />
      </Pressable>
      <Heading>Settings</Heading>

      {/* Pro Subscription Status */}
      {tier === 'pro' && (
        <SectionCard accentBorder={t.accent} accentBg={t.accentBg}>
          <View style={[styles.proBadgeRow, { backgroundColor: 'transparent' }]}>
            <Badge label="PRO" variant="pro" />
            <Text style={[styles.proStatusText, { color: t.accentText }]}>
              {isPaidPro()
                ? planType === 'annual' ? 'Annual Plan' : 'Monthly Plan'
                : isTrialActive() ? 'Free Trial' : 'Active'}
            </Text>
          </View>
          {isTrialActive() && trialEndDate && (
            <Text style={[styles.trialEndText, { color: t.accent }]}>
              Your trial ends on{' '}
              {trialEndDate.toLocaleDateString('en-PH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          )}
          {isPaidPro() && (
            <Text style={[styles.trialEndText, { color: t.accent }]}>
              {planType === 'annual' ? '₱999/yr' : '₱149/mo'} · Cancel anytime
            </Text>
          )}
        </SectionCard>
      )}

      {/* Export Data */}
      <SectionCard>
        <SectionHeader
          title="Export Data"
          subtitle="Export all your cards, installments, subscriptions, and profile data as a CSV file."
        />
        <Button
          label={exporting ? 'Exporting...' : 'Export as CSV'}
          onPress={() => {
            setExporting(true);
            exportDataAsCSV(cards, {
              cashOnHand,
              monthlyIncome,
              payday,
              committedExpenses,
            })
              .catch((e: unknown) => {
                const message = e instanceof Error ? e.message : 'Export failed';
                Alert.alert('Export Error', message);
              })
              .finally(() => {
                setExporting(false);
              });
          }}
          disabled={exporting}
        />
      </SectionCard>

      {/* Cloud Sync Status */}
      {tier === 'pro' && (
        <SectionCard>
          <SectionHeader
            title="Cloud Sync"
            subtitle="Pro feature — sync your card data across devices."
          />
          {isOffline ? (
            <AlertBanner message="Cloud sync unavailable — you are offline. Your data is saved locally and all core features work normally." variant="stale" />
          ) : (
            <Text style={[styles.cloudOnlineText, { color: t.safe }]}>Connected — sync available</Text>
          )}
        </SectionCard>
      )}

      {/* Component Showcase */}
      <SectionCard>
        <SectionHeader
          title="Component Showcase"
          subtitle="Preview all UI components with the falcon premium palette."
        />
        <Button
          label="Open Showcase"
          onPress={() => router.push('/component-showcase')}
          variant="secondary"
        />
      </SectionCard>

      {/* Analytics Opt-Out */}
      <SectionCard>
        <SectionHeader
          title="Analytics"
          subtitle="Anonymous behavioral analytics help us improve Falcly. No personal or financial data is ever tracked."
        />
        <View style={styles.valueRow}>
          <Text style={[styles.optOutLabel, { color: t.textPrimary }]}>Opt out of analytics</Text>
          <Switch
            value={analyticsOptOut}
            onValueChange={setAnalyticsOptOutStore}
            trackColor={{ true: t.risky }}
          />
        </View>
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  backButton: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  proBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  proStatusText: {
    fontSize: 15,
    fontWeight: '600',
  },
  trialEndText: {
    fontSize: 13,
    marginTop: 8,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cloudOnlineText: {
    fontSize: 13,
    fontWeight: '600',
  },
  optOutLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
