import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  View as RNView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown } from 'lucide-react-native';

import { Text, View } from '@/components/Themed';
import { Badge, Button } from '@/components/atoms';
import { PercentInput, StatusTooltip, SurfaceCard } from '@/components/molecules';
import { BillingTimeline } from '@/components/organisms';
import { useCardStore, cardDefaults } from '@/store/cardStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { calculateCardStatus, utilization } from '@/utils/decisionEngine';
import type { CardStatus } from '@/types/card';
import { useAppTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import {
  trackOnboardingFirstStatusViewed,
  trackOnboardingEnrichmentCompleted,
  trackOnboardingEnrichmentSkipped,
} from '@/utils/analytics';

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
  const updateCard = useCardStore((s) => s.updateCard);

  const STATUS_COLORS: Record<CardStatus, string> = {
    SAFE: t.safe,
    CAUTION: t.caution,
    RISKY: t.risky,
  };

  const [showEnrichment, setShowEnrichment] = useState(false);
  const [interestRate, setInterestRate] = useState(
    String(cardDefaults.interestRate * 100),
  );

  function handleInterestRateChange(text: string) {
    setInterestRate(text);
    if (!card) return;
    const rate = parseFloat(text);
    if (!isNaN(rate) && rate > 0) {
      updateCard(card.id, { interestRate: rate / 100 });
    }
  }

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

  const { status, reason } = statusResult;
  const color = STATUS_COLORS[status];

  function handleEnrichmentSave() {
    trackOnboardingEnrichmentCompleted(false, false);
    useOnboardingStore.getState().complete();
    router.replace('/');
  }

  function handleSkip() {
    if (showEnrichment) {
      trackOnboardingEnrichmentSkipped();
    }
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

        {/* Enrichment section */}
        <SurfaceCard>
          <Pressable
            style={styles.enrichToggle}
            onPress={() => setShowEnrichment(!showEnrichment)}
          >
            <RNView style={styles.enrichTextWrap}>
              <Text style={[styles.enrichButtonText, { color: t.accent }]}>
                Fine-tune your result (optional)
              </Text>
              <Text style={[styles.enrichHint, { color: t.textMuted }]}>
                Add your interest rate
              </Text>
            </RNView>
            <RNView style={{ transform: [{ rotate: showEnrichment ? '180deg' : '0deg' }] }}>
              <ChevronDown size={20} color={t.textSecondary} />
            </RNView>
          </Pressable>
          {showEnrichment && (
            <RNView style={[styles.enrichSection, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border }]}>
              <PercentInput
                label="Monthly Interest Rate (%)"
                value={interestRate}
                onChangeText={handleInterestRateChange}
                placeholder={String(cardDefaults.interestRate * 100)}
              />
            </RNView>
          )}
        </SurfaceCard>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {showEnrichment ? (
          <>
            <Button label="Save & Continue" onPress={handleEnrichmentSave} />
            <Button label="Skip for now" variant="ghost" onPress={handleSkip} />
          </>
        ) : (
          <Button label="Go to Dashboard" variant="secondary" onPress={handleSkip} />
        )}
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
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 18,
    fontFamily: fonts.nunitoBold,
  },
  reason: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
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
  enrichToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  enrichTextWrap: {
    flex: 1,
  },
  enrichButtonText: {
    fontSize: 15,
    fontFamily: fonts.interSemiBold,
    marginBottom: 4,
  },
  enrichHint: {
    fontSize: 12,
  },
  enrichSection: {
    marginTop: 12,
    paddingTop: 12,
  },
  enrichHeading: {
    fontSize: 16,
    fontFamily: fonts.interBold,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.interSemiBold,
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: fonts.interBold,
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontFamily: fonts.interSemiBold,
  },
});
