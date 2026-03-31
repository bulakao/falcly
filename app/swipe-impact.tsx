import { useState, useMemo, useEffect, useRef } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Link, useRouter } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { BillingTimeline } from '@/components/BillingTimeline';
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { calculateSwipeImpact, computeNetAvailableCash, getCycleDates } from '@/utils/decisionEngine';
import { formatUpdatedAgo, getStalenessLevel } from '@/utils/staleness';
import type { CardStatus } from '@/types/card';
import { trackSwipeCheckPerformed, trackDataStalenessWarningShown } from '@/utils/analytics';
import { useAppTheme } from '@/theme';

const STATUS_ICONS: Record<CardStatus, string> = {
  SAFE: '✓',
  CAUTION: '⚠',
  RISKY: '✕',
};

const QUICK_AMOUNTS = [
  { label: '₱500', value: 500 },
  { label: '₱1K', value: 1000 },
  { label: '₱2K', value: 2000 },
  { label: '₱5K', value: 5000 },
];

function formatPeso(amount: number): string {
  return `₱${Math.round(amount).toLocaleString()}`;
}

export default function SwipeImpactScreen() {
  const t = useAppTheme();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const cards = useCardStore((s) => s.cards);
  const card = cards.find((c) => c.id === cardId);
  const cardIndex = cards.findIndex((c) => c.id === cardId);
  const deleteCard = useCardStore((s) => s.deleteCard);
  const router = useRouter();
  const cashOnHand = useUserStore((s) => s.cashOnHand);
  const monthlyIncome = useUserStore((s) => s.monthlyIncome);
  const payday = useUserStore((s) => s.payday);
  const committedExpenses = useUserStore((s) => s.committedExpenses);
  const subscriptionTier = useSubscriptionStore((s) => s.tier);
  const isCardReadOnly = useSubscriptionStore((s) => s.isCardReadOnly);
  const readOnly = isCardReadOnly(cardIndex);
  const [amountText, setAmountText] = useState('');

  const STATUS_COLORS: Record<CardStatus, string> = {
    SAFE: t.safe,
    CAUTION: t.caution,
    RISKY: t.risky,
  };

  const proposedAmount = useMemo(() => {
    const n = parseFloat(amountText);
    return isNaN(n) || n < 0 ? 0 : n;
  }, [amountText]);

  const netAvailableCash = useMemo(() => {
    if (!card) return null;
    return computeNetAvailableCash(cashOnHand, monthlyIncome, payday, card, committedExpenses);
  }, [card, cashOnHand, monthlyIncome, payday, committedExpenses]);

  const incomeApplies = useMemo(() => {
    if (!card || monthlyIncome === null || payday === null) return false;
    const { dueDate } = getCycleDates(card);
    return payday <= dueDate.getDate();
  }, [card, monthlyIncome, payday]);

  const impact = useMemo(() => {
    if (!card) return null;
    return calculateSwipeImpact(card, proposedAmount, netAvailableCash);
  }, [card, proposedAmount, netAvailableCash]);

  const staleness = card ? getStalenessLevel(card.balanceUpdatedAt) : 'fresh' as const;

  // Track swipe check when user enters a non-zero proposed amount
  const prevAmountRef = useRef(0);
  useEffect(() => {
    if (proposedAmount > 0 && proposedAmount !== prevAmountRef.current && impact) {
      trackSwipeCheckPerformed(impact.status, proposedAmount);
    }
    prevAmountRef.current = proposedAmount;
  }, [proposedAmount, impact]);

  // Track staleness warning shown once per screen mount
  const stalenessTrackedRef = useRef(false);
  useEffect(() => {
    if (!stalenessTrackedRef.current && staleness !== 'fresh') {
      trackDataStalenessWarningShown(staleness);
      stalenessTrackedRef.current = true;
    }
  }, [staleness]);

  if (!card || !impact) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Card not found</Text>
      </View>
    );
  }

  function handleQuickAmount(value: number) {
    setAmountText(String(value));
  }

  const cardBankName = card.bankName;
  const cardIdForDelete = card.id;

  function handleDeleteCard() {
    Alert.alert(
      'Delete Card',
      `Are you sure you want to delete ${cardBankName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCard(cardIdForDelete);
            router.back();
          },
        },
      ],
    );
  }

  const showCarriedBalance = impact.carriedBalance > 0 && impact.monthlyInterest > 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Read-only upgrade banner for expired Pro cards */}
        {readOnly && (
          <Link href="/pro-paywall" asChild>
            <Pressable style={[styles.readOnlyBanner, { backgroundColor: t.accentBg, borderColor: t.accent }]}>
              <Text style={[styles.readOnlyBannerText, { color: t.accent }]}>
                Reactivate Pro to manage all cards
              </Text>
            </Pressable>
          </Link>
        )}

        {/* Staleness banner at 5+ days — tappable to update balance (disabled for read-only) */}
        {staleness !== 'fresh' && !readOnly && (
          <Link href={{ pathname: '/update-balance', params: { cardId: card.id } }} asChild>
            <Pressable style={staleness === 'stale'
              ? [styles.staleBanner, { backgroundColor: t.surface, borderColor: t.border }]
              : [styles.warningBanner, { backgroundColor: t.cautionBg }]
            }>
              <Text style={staleness === 'stale'
                ? [styles.staleBannerText, { color: t.textMuted }]
                : [styles.warningBannerText, { color: t.cautionText }]
              }>
                {staleness === 'stale'
                  ? '⚠ Data stale — update before trusting this status'
                  : '⚠️ Balance may be outdated · Tap to update'}
              </Text>
            </Pressable>
          </Link>
        )}

        {/* Card header */}
        <View style={styles.cardHeader}>
          <Text style={styles.bankName}>{card.bankName}</Text>
          {staleness === 'stale' ? (
            <View style={[styles.badge, { backgroundColor: t.textMuted }]}>
              <Text style={[styles.badgeText, { color: t.textInverse }]}>⚠ STALE</Text>
            </View>
          ) : (
            <View style={[styles.badge, { backgroundColor: STATUS_COLORS[impact.status] }]}>
              <Text style={[styles.badgeText, { color: t.textInverse }]}>
                {STATUS_ICONS[impact.status]} {impact.status}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.reason, { color: t.textSecondary }]}>{staleness !== 'stale' ? impact.reason : ''}</Text>

        {/* Balance timestamp + actions */}
        <View style={styles.balanceRow}>
          <Text style={[
            styles.balanceTimestamp,
            { color: t.textMuted },
            staleness === 'warning' && { color: t.caution },
            staleness === 'stale' && { color: t.textMuted, fontWeight: '600' },
          ]}>
            Balance updated {formatUpdatedAgo(card.balanceUpdatedAt)}
          </Text>
          {!readOnly && (
            <View style={styles.actionRow}>
              <Link href={{ pathname: '/edit-card', params: { cardId: card.id } }} asChild>
                <Pressable style={[styles.updateButton, { backgroundColor: t.surface }]}>
                  <Text style={[styles.editButtonText, { color: t.primary }]}>Edit Card</Text>
                </Pressable>
              </Link>
              <Link href={{ pathname: '/update-balance', params: { cardId: card.id } }} asChild>
                <Pressable style={[styles.updateButton, { backgroundColor: t.surface }]}>
                  <Text style={[styles.updateButtonText, { color: t.primary }]}>Update Balance</Text>
                </Pressable>
              </Link>
              <Pressable style={[styles.deleteButton, { backgroundColor: t.riskyBg }]} onPress={handleDeleteCard}>
                <Text style={[styles.deleteButtonText, { color: t.risky }]}>Delete</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Billing cycle timeline */}
        <BillingTimeline card={card} />

        {/* Amount input */}
        <Text style={[styles.label, { color: t.textSecondary }]}>How much will you swipe?</Text>
        <TextInput
          style={[styles.amountInput, { borderColor: t.inputBorder, backgroundColor: t.inputBg, color: t.inputText }]}
          value={amountText}
          onChangeText={setAmountText}
          placeholder="0"
          placeholderTextColor={t.placeholder}
          keyboardType="numeric"
          autoFocus
        />

        {/* Quick amount chips */}
        <View style={styles.chipRow}>
          {QUICK_AMOUNTS.map((qa) => (
            <Pressable
              key={qa.value}
              style={[
                styles.chip,
                { borderColor: t.inputBorder, backgroundColor: t.inputBg },
                proposedAmount === qa.value && { backgroundColor: t.primary, borderColor: t.primary },
              ]}
              onPress={() => handleQuickAmount(qa.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: t.inputText },
                  proposedAmount === qa.value && { color: t.textInverse },
                ]}
              >
                {qa.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Impact breakdown */}
        <View style={[styles.breakdown, { borderColor: t.border }]}>
          <Text style={styles.sectionTitle}>
            {proposedAmount > 0 ? 'If you swipe today:' : 'Current status:'}
          </Text>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: t.textSecondary }]}>Outstanding balance</Text>
            <Text style={[styles.rowValue, { color: t.inputText }]}>{formatPeso(card.outstandingBalance)}</Text>
          </View>
          {card.pendingTransactions > 0 && (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: t.textSecondary }]}>Pending transactions</Text>
              <Text style={[styles.rowValue, { color: t.inputText }]}>+{formatPeso(card.pendingTransactions)}</Text>
            </View>
          )}
          {card.installmentsMonthlyAmount > 0 && (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: t.textSecondary }]}>Installments</Text>
              <Text style={[styles.rowValue, { color: t.inputText }]}>+{formatPeso(card.installmentsMonthlyAmount)}</Text>
            </View>
          )}
          {card.subscriptionsThisCycle > 0 && (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: t.textSecondary }]}>Subscriptions</Text>
              <Text style={[styles.rowValue, { color: t.inputText }]}>+{formatPeso(card.subscriptionsThisCycle)}</Text>
            </View>
          )}
          {card.annualFee > 0 && card.annualFeeMonth > 0 && (() => {
            const cycle = getCycleDates(card);
            const cycleMonth = cycle.statementClose.getMonth() + 1;
            return cycleMonth === card.annualFeeMonth;
          })() && (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: t.textSecondary }]}>Annual fee</Text>
              <Text style={[styles.rowValue, { color: t.inputText }]}>+{formatPeso(card.annualFee)}</Text>
            </View>
          )}
          {proposedAmount > 0 && (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: t.textSecondary }]}>Proposed swipe</Text>
              <Text style={[styles.rowValue, { color: t.inputText }]}>+{formatPeso(proposedAmount)}</Text>
            </View>
          )}
          <View style={[styles.divider, { backgroundColor: t.border }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: t.textSecondary, fontWeight: '700' }]}>Projected statement balance</Text>
            <Text style={[styles.rowValue, { color: t.inputText, fontWeight: '700' }]}>{formatPeso(impact.projectedBalance)}</Text>
          </View>

          {impact.netAvailableCash !== null ? (
            <>
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: t.textSecondary }]}>Cash on hand</Text>
                <Text style={[styles.rowValueMuted, { color: t.textMuted }]}>
                  {cashOnHand !== null ? formatPeso(cashOnHand) : '—'}
                </Text>
              </View>
              {monthlyIncome !== null && payday !== null && (
                <View style={styles.row}>
                  <Text style={[styles.rowLabel, { color: t.textSecondary }]}>
                    Monthly income{incomeApplies ? '' : ' (payday after due)'}
                  </Text>
                  <Text style={[styles.rowValueMuted, { color: t.textMuted }, !incomeApplies && { textDecorationLine: 'line-through', color: t.border }]}>
                    {incomeApplies ? `+${formatPeso(monthlyIncome)}` : `+${formatPeso(monthlyIncome)}`}
                  </Text>
                </View>
              )}
              {committedExpenses !== null && committedExpenses > 0 && (
                <View style={styles.row}>
                  <Text style={[styles.rowLabel, { color: t.textSecondary }]}>Committed expenses</Text>
                  <Text style={[styles.rowValueMuted, { color: t.textMuted }]}>
                    −{formatPeso(committedExpenses)}
                  </Text>
                </View>
              )}
              <View style={[styles.divider, { backgroundColor: t.border }]} />
              <View style={styles.row}>
                <Text style={[styles.rowLabel, styles.netCashLabel, { color: t.inputText }]}>Available to pay</Text>
                <Text style={[styles.netCashValue, { color: t.safe }]}>
                  {formatPeso(impact.netAvailableCash)}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: t.textSecondary }]}>Available to pay</Text>
              <Text style={[styles.rowValueMuted, { color: t.textMuted }]}>Not set</Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: t.textSecondary }]}>Minimum payment</Text>
            <Text style={[styles.rowValue, { color: t.inputText }]}>{formatPeso(impact.minimumPayment)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: t.textSecondary }]}>Credit available after swipe</Text>
            <Text style={[styles.rowValue, { color: t.inputText }]}>
              {formatPeso(Math.max(0, card.creditLimit - impact.projectedBalance))}
            </Text>
          </View>

          {showCarriedBalance && (
            <>
              <View style={[styles.divider, { backgroundColor: t.border }]} />
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: t.risky }]}>Carried balance</Text>
                <Text style={[styles.rowValue, { color: t.risky }]}>
                  {formatPeso(impact.carriedBalance)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: t.risky }]}>
                  Est. monthly interest ({card.interestRate * 100}%)
                </Text>
                <Text style={[styles.rowValue, { color: t.risky }]}>
                  {formatPeso(impact.monthlyInterest)}
                </Text>
              </View>
            </>
          )}
        </View>

        {impact.netAvailableCash === null && (
          <Text style={[styles.hint, { color: t.textMuted }]}>
            Set your cash on hand in Settings to see payoff projections.
          </Text>
        )}

        {/* Trial CTA — payoff planner entry point */}
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
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bankName: {
    fontSize: 20,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  reason: {
    fontSize: 13,
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceTimestamp: {
    fontSize: 12,
  },
  updateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  updateButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 24,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowLabel: {
    fontSize: 14,
    flex: 1,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowValueMuted: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  netCashLabel: {
    fontWeight: '700',
  },
  netCashValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  warningBanner: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  warningBannerText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  staleBanner: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  staleBannerText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
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
  readOnlyBanner: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  readOnlyBannerText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
