import { useEffect } from 'react';
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
import { useCardStore } from '@/store/cardStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { calculateCardStatus, utilization } from '@/utils/decisionEngine';
import type { CardStatus } from '@/types/card';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import { trackOnboardingFirstStatusViewed } from '@/utils/analytics';

const STATUS_ICONS: Record<CardStatus, string> = {
  SAFE: '✓',
  CAUTION: '⚠',
  RISKY: '✕',
};

const BADGE_VARIANT = { SAFE: 'safe', CAUTION: 'caution', RISKY: 'risky' } as const;

const STATUS_EXPLANATIONS: Record<CardStatus, string> = {
  SAFE: 'Good news — swiping now is unlikely to cause payment stress this cycle.',
  CAUTION: 'Be careful — your statement is closing soon or utilization is getting high.',
  RISKY: 'Hold off — swiping now could make it hard to pay your bill on time.',
};

export default function OnboardingResultScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const card = useCardStore((s) => s.cards.find((c) => c.id === cardId));

  const STATUS_COLORS: Record<CardStatus, string> = {
    SAFE: t.safe,
    CAUTION: t.caution,
    RISKY: t.risky,
  };

  const statusResult = card ? calculateCardStatus(card, new Date()) : null;
  const util = card ? utilization(card.outstandingBalance, card.creditLimit) : 0;
  const utilPct = Math.round(util * 100);

  useEffect(() => {
    if (statusResult) trackOnboardingFirstStatusViewed(statusResult.status);
  }, [statusResult]);

  if (!card || !statusResult) {
    return (
      <View style={styles.container}>
        <Text>Card not found.</Text>
      </View>
    );
  }

  const { status } = statusResult;
  const color = STATUS_COLORS[status];

  function handleContinue() {
    useOnboardingStore.getState().complete();
    router.replace('/');
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
          <Text style={styles.cardName}>{card.bankName}</Text>
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
                {card.outstandingBalance.toLocaleString()} / {card.creditLimit.toLocaleString()}
              </Text>
            </RNView>
          </RNView>
        </SurfaceCard>

        {/* Billing cycle timeline */}
        <SurfaceCard>
          <BillingTimeline card={card} />
        </SurfaceCard>

      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <Button label="Go to Dashboard" onPress={handleContinue} />
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
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cardName: {
    fontSize: 18,
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
    fontSize: 13,
    fontFamily: fonts.interMedium,
  },
  usagePct: {
    fontSize: 13,
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
    fontSize: 12,
    fontFamily: fonts.interRegular,
  },
});
