import { useState, useMemo, useEffect, useRef } from 'react';
import { StyleSheet, Pressable, Alert } from 'react-native';
import { Link } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { FormInput, Label } from '@/components/atoms';
import { AlertBanner, BreakdownRow, BreakdownDivider, ChipSelector } from '@/components/molecules';
import { BillingTimeline } from '@/components/organisms/BillingTimeline';
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { calculateSwipeImpact, computeNetAvailableCash, getCycleDates } from '@/utils/decisionEngine';
import { getStalenessLevel } from '@/utils/staleness';
import type { Card } from '@/types/card';
import { trackSwipeCheckPerformed, trackDataStalenessWarningShown } from '@/utils/analytics';
import { useAppTheme } from '@/theme';

const QUICK_AMOUNTS = [
  { label: '₱500', value: 500 },
  { label: '₱1K', value: 1000 },
  { label: '₱2K', value: 2000 },
  { label: '₱5K', value: 5000 },
];

function formatPeso(amount: number): string {
  return `₱${Math.round(amount).toLocaleString()}`;
}

interface SwipeImpactPanelProps {
  card: Card;
  readOnly: boolean;
  autoFocusInput?: boolean;
  onDeleteComplete?: () => void;
}

export function SwipeImpactPanel({
  card,
  readOnly,
  autoFocusInput = false,
  onDeleteComplete,
}: SwipeImpactPanelProps) {
  const t = useAppTheme();
  const deleteCard = useCardStore((s) => s.deleteCard);
  const cashOnHand = useUserStore((s) => s.cashOnHand);
  const monthlyIncome = useUserStore((s) => s.monthlyIncome);
  const payday = useUserStore((s) => s.payday);
  const committedExpenses = useUserStore((s) => s.committedExpenses);
  const subscriptionTier = useSubscriptionStore((s) => s.tier);
  const [amountText, setAmountText] = useState('');

  const proposedAmount = useMemo(() => {
    const n = parseFloat(amountText);
    return isNaN(n) || n < 0 ? 0 : n;
  }, [amountText]);

  const netAvailableCash = useMemo(
    () => computeNetAvailableCash(cashOnHand, monthlyIncome, payday, card, committedExpenses),
    [card, cashOnHand, monthlyIncome, payday, committedExpenses],
  );

  const incomeApplies = useMemo(() => {
    if (monthlyIncome === null || payday === null) return false;
    const { dueDate } = getCycleDates(card);
    return payday <= dueDate.getDate();
  }, [card, monthlyIncome, payday]);

  const impact = useMemo(
    () => calculateSwipeImpact(card, proposedAmount, netAvailableCash),
    [card, proposedAmount, netAvailableCash],
  );

  const staleness = getStalenessLevel(card.balanceUpdatedAt);

  // Track swipe check when user enters a non-zero proposed amount
  const prevAmountRef = useRef(0);
  useEffect(() => {
    if (proposedAmount > 0 && proposedAmount !== prevAmountRef.current && impact) {
      trackSwipeCheckPerformed(impact.status, proposedAmount);
    }
    prevAmountRef.current = proposedAmount;
  }, [proposedAmount, impact]);

  // Track staleness warning shown once per mount
  const stalenessTrackedRef = useRef(false);
  useEffect(() => {
    if (!stalenessTrackedRef.current && staleness !== 'fresh') {
      trackDataStalenessWarningShown(staleness);
      stalenessTrackedRef.current = true;
    }
  }, [staleness]);

  function handleQuickAmount(value: number) {
    setAmountText(String(value));
  }

  function handleDeleteCard() {
    Alert.alert(
      'Delete Card',
      `Are you sure you want to delete ${card.bankName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCard(card.id);
            onDeleteComplete?.();
          },
        },
      ],
    );
  }

  const showCarriedBalance = impact.carriedBalance > 0 && impact.monthlyInterest > 0;

  return (
    <View style={styles.container}>
      {/* Read-only upgrade banner */}
      {readOnly && (
        <Link href="/pro-paywall" asChild>
          <AlertBanner message="Reactivate Pro to manage all cards" variant="accent" centered />
        </Link>
      )}

      {/* Staleness banner */}
      {staleness !== 'fresh' && !readOnly && (
        <Link href={{ pathname: '/update-balance', params: { cardId: card.id } }} asChild>
          {staleness === 'stale'
            ? <AlertBanner message="⚠ Data stale — update before trusting this status" variant="stale" centered />
            : <AlertBanner message="⚠️ Balance may be outdated · Tap to update" variant="warning" centered />
          }
        </Link>
      )}

      {/* Action buttons */}
      {!readOnly && (
        <View style={styles.actionRow}>
          <Link href={{ pathname: '/edit-card', params: { cardId: card.id } }} asChild>
            <Pressable style={[styles.actionButton, { backgroundColor: t.surface }]}>
              <Text style={[styles.actionButtonText, { color: t.primary }]}>Edit Card</Text>
            </Pressable>
          </Link>
          <Link href={{ pathname: '/update-balance', params: { cardId: card.id } }} asChild>
            <Pressable style={[styles.actionButton, { backgroundColor: t.surface }]}>
              <Text style={[styles.actionButtonText, { color: t.primary }]}>Update Balance</Text>
            </Pressable>
          </Link>
          <Pressable style={[styles.actionButton, { backgroundColor: t.riskyBg }]} onPress={handleDeleteCard}>
            <Text style={[styles.actionButtonText, { color: t.risky }]}>Delete</Text>
          </Pressable>
        </View>
      )}

      {/* Billing cycle timeline */}
      <BillingTimeline card={card} />

      {/* Amount input */}
      <Label>How much will you swipe?</Label>
      <FormInput
        value={amountText}
        onChangeText={setAmountText}
        placeholder="0"
        keyboardType="numeric"
        autoFocus={autoFocusInput}
      />

      {/* Quick amount chips */}
      <ChipSelector
        options={QUICK_AMOUNTS}
        selectedValue={proposedAmount}
        onSelect={handleQuickAmount}
      />

      {/* Impact breakdown */}
      <View style={[styles.breakdown, { borderColor: t.border }]}>
        <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>
          {proposedAmount > 0 ? 'If you swipe today:' : 'Current status:'}
        </Text>

        <BreakdownRow label="Outstanding balance" value={formatPeso(card.outstandingBalance)} />
        {card.pendingTransactions > 0 && (
          <BreakdownRow label="Pending transactions" value={`+${formatPeso(card.pendingTransactions)}`} />
        )}
        {card.installmentsMonthlyAmount > 0 && (
          <BreakdownRow label="Installments" value={`+${formatPeso(card.installmentsMonthlyAmount)}`} />
        )}
        {card.subscriptionsThisCycle > 0 && (
          <BreakdownRow label="Subscriptions" value={`+${formatPeso(card.subscriptionsThisCycle)}`} />
        )}
        {card.annualFee > 0 && card.annualFeeMonth > 0 && (() => {
          const cycle = getCycleDates(card);
          const cycleMonth = cycle.statementClose.getMonth() + 1;
          return cycleMonth === card.annualFeeMonth;
        })() && (
          <BreakdownRow label="Annual fee" value={`+${formatPeso(card.annualFee)}`} />
        )}
        {proposedAmount > 0 && (
          <BreakdownRow label="Proposed swipe" value={`+${formatPeso(proposedAmount)}`} />
        )}
        <BreakdownDivider />
        <BreakdownRow label="Projected statement balance" value={formatPeso(impact.projectedBalance)} bold />

        {impact.netAvailableCash !== null ? (
          <>
            <BreakdownRow label="Cash on hand" value={cashOnHand !== null ? formatPeso(cashOnHand) : '—'} valueMuted />
            {monthlyIncome !== null && payday !== null && (
              <BreakdownRow
                label={`Monthly income${incomeApplies ? '' : ' (payday after due)'}`}
                value={`+${formatPeso(monthlyIncome)}`}
                valueMuted
                strikethrough={!incomeApplies}
              />
            )}
            {committedExpenses !== null && committedExpenses > 0 && (
              <BreakdownRow label="Committed expenses" value={`−${formatPeso(committedExpenses)}`} valueMuted />
            )}
            <BreakdownDivider />
            <BreakdownRow label="Available to pay" value={formatPeso(impact.netAvailableCash)} bold labelColor={t.inputText} valueColor={t.safe} />
          </>
        ) : (
          <BreakdownRow label="Available to pay" value="Not set" valueMuted />
        )}

        <BreakdownRow label="Minimum payment" value={formatPeso(impact.minimumPayment)} />
        <BreakdownRow label="Credit available after swipe" value={formatPeso(Math.max(0, card.creditLimit - impact.projectedBalance))} />

        {showCarriedBalance && (
          <>
            <BreakdownDivider />
            <BreakdownRow label="Carried balance" value={formatPeso(impact.carriedBalance)} labelColor={t.risky} valueColor={t.risky} />
            <BreakdownRow label={`Est. monthly interest (${card.interestRate * 100}%)`} value={formatPeso(impact.monthlyInterest)} labelColor={t.risky} valueColor={t.risky} />
          </>
        )}
      </View>

      {impact.netAvailableCash === null && (
        <Text style={[styles.hint, { color: t.textMuted }]}>
          Set your cash on hand in Settings to see payoff projections.
        </Text>
      )}

      {/* Trial CTA */}
      {subscriptionTier === 'free' && (
        <Link href="/pro-paywall" asChild>
          <Pressable style={[styles.trialCta, { backgroundColor: t.accentBg, borderColor: t.accent }]}>
            <Text style={[styles.trialCtaText, { color: t.accent }]}>Try Free for 14 Days</Text>
            <Text style={[styles.trialCtaSubtext, { color: t.accent }]}>
              Unlock payment planning, installment tracking & more
            </Text>
          </Pressable>
        </Link>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  breakdown: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  trialCta: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  trialCtaText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  trialCtaSubtext: {
    fontSize: 13,
  },
});
