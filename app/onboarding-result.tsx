import { useEffect, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,

  View as RNView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View } from '@/components/Themed';
import { Badge, Button } from '@/components/atoms';
import { StatusTooltip, SurfaceCard } from '@/components/molecules';
import { BillingTimeline } from '@/components/organisms';

import { calculateCardStatus, utilization } from '@/utils/decisionEngine';
import type { Card, CardStatus } from '@/types/card';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';
import { trackOnboardingFirstStatusViewed } from '@/utils/analytics';

const STATUS_ICONS: Record<CardStatus, string> = {
  SAFE: '\u2713',
  CAUTION: '\u26A0',
  RISKY: '\u2715',
};

const BADGE_VARIANT = { SAFE: 'safe', CAUTION: 'caution', RISKY: 'risky' } as const;

const STATUS_EXPLANATIONS: Record<CardStatus, string> = {
  SAFE: 'Good news \u2014 swiping now is unlikely to cause payment stress this cycle.',
  CAUTION: 'Be careful \u2014 your statement is closing soon or utilization is getting high.',
  RISKY: 'Hold off \u2014 swiping now could make it hard to pay your bill on time.',
};

export default function OnboardingResultScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const {
    bankName,
    creditLimit: creditLimitStr,
    outstandingBalance: outstandingBalanceStr,
    statementDay: statementDayStr,
    dueDayOffset: dueDayOffsetStr,
  } = useLocalSearchParams<{
    bankName: string;
    creditLimit: string;
    outstandingBalance: string;
    statementDay: string;
    dueDayOffset: string;
  }>();

  const inMemoryCard: Card = useMemo(() => ({
    id: 'preview',
    bankName: bankName ?? '',
    creditLimit: parseFloat(creditLimitStr ?? '0'),
    outstandingBalance: parseFloat(outstandingBalanceStr ?? '0'),
    statementDay: parseInt(statementDayStr ?? '1', 10),
    dueDayOffset: parseInt(dueDayOffsetStr ?? '21', 10),
    isActive: true,
    interestRate: 0.03,
    minPaymentPct: 0.02,
    minPaymentFloor: 500,
    customFinancials: false,
    pendingTransactions: 0,
    installmentsMonthlyAmount: 0,
    subscriptionsThisCycle: 0,
    annualFee: 0,
    annualFeeMonth: 0,
    balanceUpdatedAt: Date.now(),
    createdAt: Date.now(),
  }), [bankName, creditLimitStr, outstandingBalanceStr, statementDayStr, dueDayOffsetStr]);

  const STATUS_COLORS: Record<CardStatus, string> = {
    SAFE: t.safe,
    CAUTION: t.caution,
    RISKY: t.risky,
  };

  const statusResult = calculateCardStatus(inMemoryCard, new Date());
  const util = utilization(inMemoryCard.outstandingBalance, inMemoryCard.creditLimit);
  const utilPct = Math.round(util * 100);

  useEffect(() => {
    if (statusResult) trackOnboardingFirstStatusViewed(statusResult.status);
  }, [statusResult]);

  const { status } = statusResult;
  const color = STATUS_COLORS[status];

  async function handleSaveCard() {
    router.push({
      pathname: '/sign-in',
      params: {
        pendingCard: JSON.stringify({
          bankName,
          creditLimit: creditLimitStr,
          outstandingBalance: outstandingBalanceStr,
          statementDay: statementDayStr,
          dueDayOffset: dueDayOffsetStr,
        }),
        fromOnboarding: 'true',
        toPaywall: 'true',
      },
    });
  }


  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 56 }]}>
        {/* Status result */}
        <View style={[styles.statusCard, { borderColor: color }]}>
          <View style={styles.badgeRow}>
            <Badge label={`${STATUS_ICONS[status]} ${status}`} variant={BADGE_VARIANT[status]} />
            <StatusTooltip />
          </View>
          <Text style={[styles.explanation, { color: t.textSecondary }]}>{STATUS_EXPLANATIONS[status]}</Text>
        </View>

        <SurfaceCard>
          <Text style={styles.cardName}>{inMemoryCard.bankName}</Text>
          <RNView style={[styles.divider, { backgroundColor: t.border }]} />

          {/* Credit usage bar */}
          <RNView style={styles.usageSection}>
            <RNView style={styles.usageHeader}>
              <Text style={[styles.usageLabel, { color: t.textSecondary }]}>Credit Used</Text>
              <Text style={[styles.usagePct, { color: t.textPrimary }]}>{utilPct}%</Text>
            </RNView>
            <RNView style={[styles.progressTrack, { backgroundColor: t.border }]}>
              <RNView
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(utilPct, 100)}%`,
                    backgroundColor: color,
                  },
                ]}
              />
            </RNView>
            <RNView style={styles.usageFooter}>
              <Text style={[styles.usageAmount, { color: t.textMuted }]}>
                {inMemoryCard.outstandingBalance.toLocaleString()} / {inMemoryCard.creditLimit.toLocaleString()}
              </Text>
            </RNView>
          </RNView>
        </SurfaceCard>

        {/* Billing cycle timeline */}
        <SurfaceCard>
          <BillingTimeline card={inMemoryCard} />
        </SurfaceCard>

      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <Button label="Save my card" onPress={handleSaveCard} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 4,
  },
  statusCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  explanation: {
    fontSize: typeScale.body,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cardName: {
    fontSize: typeScale.headline,
    fontFamily: fonts.interBold,
    textAlign: 'center',
    marginBottom: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 4,
    marginBottom: 12,
  },
  usageSection: {},
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  usageLabel: {
    fontSize: typeScale.body,
    fontFamily: fonts.interMedium,
  },
  usagePct: {
    fontSize: typeScale.body,
    fontFamily: fonts.interBold,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  usageFooter: {
    marginTop: 6,
  },
  usageAmount: {
    fontSize: typeScale.caption,
    fontFamily: fonts.interRegular,
  },

});
