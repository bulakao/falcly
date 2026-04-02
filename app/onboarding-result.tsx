import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { Badge, Button } from '@/components/atoms';
import { FormFieldGroup, StatusTooltip } from '@/components/molecules';
import { useCardStore, cardDefaults } from '@/store/cardStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { calculateCardStatus } from '@/utils/decisionEngine';
import type { CardStatus } from '@/types/card';
import { useAppTheme } from '@/theme';
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
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const card = useCardStore((s) => s.cards.find((c) => c.id === cardId));
  const updateCard = useCardStore((s) => s.updateCard);

  const STATUS_COLORS: Record<CardStatus, string> = {
    SAFE: t.safe,
    CAUTION: t.caution,
    RISKY: t.risky,
  };

  const [showEnrichment, setShowEnrichment] = useState(false);
  const [dueDay, setDueDay] = useState('');
  const [interestRate, setInterestRate] = useState(
    String(cardDefaults.interestRate * 100),
  );

  const statusResult = card ? calculateCardStatus(card, new Date()) : null;

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
    if (!card) return;

    const dueDayNum = parseInt(dueDay, 10);
    const rate = parseFloat(interestRate);

    const updates: Record<string, number> = {};
    if (!isNaN(dueDayNum) && dueDayNum >= 1 && dueDayNum <= 31) {
      // Calculate offset from statement day to due day
      const offset = (dueDayNum - card.statementDay + 30) % 30 || 30;
      updates.dueDayOffset = offset;
    }
    if (!isNaN(rate) && rate > 0) {
      updates.interestRate = rate / 100;
    }
    if (Object.keys(updates).length > 0) {
      updateCard(card.id, updates);
    }

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
      <ScrollView contentContainerStyle={styles.container}>
        {/* Status result */}
        <View style={[styles.statusCard, { borderColor: color }]}>
          <View style={styles.badgeRow}>
            <Badge label={`${STATUS_ICONS[status]} ${status}`} variant={BADGE_VARIANT[status]} />
            <StatusTooltip />
          </View>
          <Text style={[styles.reason, { color: t.textSecondary }]}>{reason}</Text>
          <Text style={[styles.explanation, { color: t.textMuted }]}>{STATUS_EXPLANATIONS[status]}</Text>
        </View>

        <Text style={styles.cardName}>{card.bankName}</Text>
        <Text style={[styles.balanceDetail, { color: t.textMuted }]}>
          ₱{card.outstandingBalance.toLocaleString()} / ₱{card.creditLimit.toLocaleString()}
        </Text>

        {/* Enrichment section */}
        {!showEnrichment ? (
          <Pressable
            style={[styles.enrichButton, { borderColor: t.border }]}
            onPress={() => setShowEnrichment(true)}
          >
            <Text style={[styles.enrichButtonText, { color: t.accent }]}>
              Improve accuracy (optional)
            </Text>
            <Text style={[styles.enrichHint, { color: t.textMuted }]}>
              Add your due date or interest rate
            </Text>
          </Pressable>
        ) : (
          <View style={styles.enrichSection}>
            <Text style={styles.enrichHeading}>Fine-tune your result</Text>

            <FormFieldGroup
              label="Due Date (day of month)"
              value={dueDay}
              onChangeText={setDueDay}
              placeholder="e.g. 15"
              keyboardType="numeric"
            />

            <FormFieldGroup
              label="Monthly Interest Rate (%)"
              value={interestRate}
              onChangeText={setInterestRate}
              placeholder={String(cardDefaults.interestRate * 100)}
              keyboardType="numeric"
              selectTextOnFocus
            />

            <Button label="Save & Continue" onPress={handleEnrichmentSave} />
          </View>
        )}

        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipButtonText, { color: t.textMuted }]}>
            {showEnrichment ? 'Skip for now' : 'Go to Dashboard'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 24,
    paddingBottom: 48,
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
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 18,
    fontWeight: '800',
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
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  balanceDetail: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  enrichButton: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  enrichButtonText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  enrichHint: {
    fontSize: 12,
  },
  enrichSection: {
    marginBottom: 12,
  },
  enrichHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
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
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
