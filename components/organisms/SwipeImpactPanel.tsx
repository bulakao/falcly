import { useState, useMemo, useEffect, useRef } from 'react';
import { StyleSheet, Pressable, Alert, Modal, FlatList } from 'react-native';
import { Link, router } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { FormInput, Label } from '@/components/atoms';
import { AlertBanner, BreakdownRow, BreakdownDivider, ChipSelector } from '@/components/molecules';
import { BillingTimeline } from '@/components/organisms/BillingTimeline';
import { GanttTimeline } from '@/components/organisms/GanttTimeline';
import { useCardStore } from '@/store/cardStore';
import { useUserStore, getPaydays } from '@/store/userStore';
import { useTransactionStore } from '@/store/transactionStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { calculateSwipeImpact, calculateCardStatus, computeNetAvailableCash, computeCurrentCycleTxSum, getCycleDates, computePayoffProjection } from '@/utils/decisionEngine';
import { getStalenessLevel } from '@/utils/staleness';
import type { Card } from '@/types/card';
import { trackSwipeCheckPerformed, trackDataStalenessWarningShown } from '@/utils/analytics';
import { useOverlayStore } from '@/store/overlayStore';
import { getContextualWikiOverlay } from '@/utils/overlayTriggers';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';
import { useCurrency } from '@/hooks/useCurrency';

// Module-level flag so expand/collapse persists across re-mounts within the session
let ganttExpandedSession = false;

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
  const { format: formatPeso, symbol } = useCurrency(card);
  const QUICK_AMOUNTS = useMemo(() => [
    { label: `${symbol}500`, value: 500 },
    { label: `${symbol}1K`, value: 1000 },
    { label: `${symbol}2K`, value: 2000 },
    { label: `${symbol}5K`, value: 5000 },
  ], [symbol]);
  const deleteCard = useCardStore((s) => s.deleteCard);
  const cashOnHand = useUserStore((s) => s.cashOnHand);
  const cashUpdatedAt = useUserStore((s) => s.cashUpdatedAt);
  const monthlyIncome = useUserStore((s) => s.monthlyIncome);
  const committedExpenses = useUserStore((s) => s.committedExpenses);
  const payoffStrategy = useUserStore((s) => s.payoffStrategy);
  const fixedPayoffAmount = useUserStore((s) => s.fixedPayoffAmount);
  const paydays = getPaydays();
  const subscriptionTier = useSubscriptionStore((s) => s.tier);
  const offerings = useSubscriptionStore((s) => s.offerings);

  const trialDays = useMemo(() => {
    const pkg = offerings?.availablePackages.find((p) => p.packageType === 'MONTHLY' || p.packageType === 'ANNUAL');
    const intro = pkg?.product.introPrice;
    if (!intro || intro.price !== 0) return null;
    const { periodUnit, periodNumberOfUnits } = intro;
    const unit = periodUnit?.toLowerCase() ?? 'day';
    const unitLabel = periodNumberOfUnits === 1 ? unit : `${unit}s`;
    return `${periodNumberOfUnits} ${unitLabel}`;
  }, [offerings]);
  const getCurrentCycle = useTransactionStore((s) => s.getCurrentCycle);
  const transactions = useTransactionStore((s) => s.transactions);
  const [amountText, setAmountText] = useState('');
  const [ganttExpanded, setGanttExpanded] = useState(ganttExpandedSession);
  const [cardPickerVisible, setCardPickerVisible] = useState(false);
  const allCards = useCardStore((s) => s.cards);
  const activeCards = useMemo(() => allCards.filter((c) => c.isActive), [allCards]);

  const proposedAmount = useMemo(() => {
    const n = parseFloat(amountText);
    return isNaN(n) || n < 0 ? 0 : n;
  }, [amountText]);

  const netAvailableCash = useMemo(
    () => computeNetAvailableCash(cashOnHand, monthlyIncome, paydays, card, committedExpenses),
    [card, cashOnHand, monthlyIncome, paydays, committedExpenses],
  );

  const incomeApplies = useMemo(() => {
    if (monthlyIncome === null || paydays.length === 0) return false;
    const { dueDate } = getCycleDates(card);
    return paydays.some((day) => day <= dueDate.getDate());
  }, [card, monthlyIncome, paydays]);

  const currentCycleTxSum = useMemo(
    () => computeCurrentCycleTxSum(getCurrentCycle(card.id, card.statementDay)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- transactions triggers recalc when txs change
    [card.id, card.statementDay, getCurrentCycle, transactions],
  );

  const impact = useMemo(
    () => calculateSwipeImpact(card, proposedAmount, netAvailableCash, new Date(), currentCycleTxSum, payoffStrategy, fixedPayoffAmount, committedExpenses ?? 0),
    [card, proposedAmount, netAvailableCash, currentCycleTxSum, payoffStrategy, fixedPayoffAmount, committedExpenses],
  );

  const [projectionExpanded, setProjectionExpanded] = useState(false);

  const payoffProjection = useMemo(() => {
    if (impact.carriedBalance <= 0) return null;
    return computePayoffProjection(impact.carriedBalance, impact.monthlyPayment, card.interestRate);
  }, [impact.carriedBalance, impact.monthlyPayment, card.interestRate]);

  const staleness = getStalenessLevel(card.balanceUpdatedAt);

  const showFundsPrompt = cashOnHand === null || (
    cashUpdatedAt !== null && getStalenessLevel(cashUpdatedAt) !== 'fresh'
  );

  // Track swipe check when user enters a non-zero proposed amount
  const prevAmountRef = useRef(0);
  useEffect(() => {
    if (proposedAmount > 0 && proposedAmount !== prevAmountRef.current && impact) {
      trackSwipeCheckPerformed(impact.status, proposedAmount);
    }
    prevAmountRef.current = proposedAmount;
  }, [proposedAmount, impact]);

  // Trigger contextual wiki overlays when user enters an amount
  const enqueueOverlay = useOverlayStore((s) => s.enqueue);
  useEffect(() => {
    if (proposedAmount > 0) {
      const cycle = getCycleDates(card);
      const projectedUtil = card.creditLimit > 0
        ? (card.outstandingBalance + proposedAmount) / card.creditLimit
        : 0;
      const overlay = getContextualWikiOverlay({
        card,
        today: new Date(),
        daysToStatement: cycle.daysToStatement,
        utilization: projectedUtil,
        justSwiped: true,
        proposedAmount,
      });
      if (overlay) enqueueOverlay(overlay);
    }
  }, [proposedAmount, card, enqueueOverlay]);

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

  function toggleGantt() {
    setGanttExpanded((prev) => {
      ganttExpandedSession = !prev;
      return !prev;
    });
  }

  const showCarriedBalance = payoffStrategy !== 'minimum' && impact.carriedBalance > 0 && impact.monthlyInterest > 0;

  return (
    <View style={styles.container}>
      {/* Read-only upgrade banner */}
      {readOnly && (
        <Link href={"/paywall-manual" as any} asChild>
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
            <Pressable style={[styles.actionButton, { backgroundColor: t.surface }]} accessibilityRole="button" accessibilityLabel="Edit card">
              <Text style={[styles.actionButtonText, { color: t.primary }]}>Edit Card</Text>
            </Pressable>
          </Link>
          <Link href={{ pathname: '/update-balance', params: { cardId: card.id } }} asChild>
            <Pressable style={[styles.actionButton, { backgroundColor: t.surface }]} accessibilityRole="button" accessibilityLabel="Update balance">
              <Text style={[styles.actionButtonText, { color: t.primary }]}>Update Balance</Text>
            </Pressable>
          </Link>
          <Pressable style={[styles.actionButton, { backgroundColor: t.riskyBg }]} onPress={handleDeleteCard} accessibilityRole="button" accessibilityLabel="Delete card">
            <Text style={[styles.actionButtonText, { color: t.risky }]}>Delete</Text>
          </Pressable>
        </View>
      )}

      {/* Billing cycle timeline */}
      <BillingTimeline card={card} />

      {/* Collapsible Gantt timeline */}
      <Pressable onPress={toggleGantt} style={styles.ganttToggle} accessibilityRole="button" accessibilityLabel="Billing cycle details" accessibilityState={{ expanded: ganttExpanded }}>
        <Text style={[styles.ganttToggleText, { color: t.primary }]}>
          Billing Cycle {ganttExpanded ? '▴' : '▾'}
        </Text>
      </Pressable>
      {ganttExpanded && (
        <View style={[styles.ganttContainer, { borderColor: t.border }]}>
          <GanttTimeline cards={[card]} />
        </View>
      )}

      {/* Amount input */}
      <Label>How much will you swipe?</Label>
      <FormInput
        value={amountText}
        onChangeText={setAmountText}
        placeholder="0"
        keyboardType="numeric"
        autoFocus={autoFocusInput}
        accessibilityLabel="Swipe amount"
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
          <Link href={{ pathname: '/manage-installments', params: { cardId: card.id } }} asChild>
            <Pressable>
              <BreakdownRow label="Installments ›" value={`+${formatPeso(card.installmentsMonthlyAmount)}`} />
            </Pressable>
          </Link>
        )}
        {card.subscriptionsThisCycle > 0 && (
          <Link href={{ pathname: '/manage-subscriptions', params: { cardId: card.id } }} asChild>
            <Pressable>
              <BreakdownRow label="Subscriptions ›" value={`+${formatPeso(card.subscriptionsThisCycle)}`} />
            </Pressable>
          </Link>
        )}
        {card.annualFee > 0 && card.annualFeeMonth > 0 && (() => {
          const cycle = getCycleDates(card);
          const cycleMonth = cycle.statementClose.getMonth() + 1;
          return cycleMonth === card.annualFeeMonth;
        })() && (
          <BreakdownRow label="Annual fee" value={`+${formatPeso(card.annualFee)}`} />
        )}
        {currentCycleTxSum > 0 && (
          <BreakdownRow label="Logged this cycle" value={`+${formatPeso(currentCycleTxSum)}`} />
        )}
        {proposedAmount > 0 && (
          <BreakdownRow label="Proposed swipe" value={`+${formatPeso(proposedAmount)}`} />
        )}
        <BreakdownDivider />
        <BreakdownRow label="Projected statement balance" value={formatPeso(impact.projectedBalance)} bold />
        {currentCycleTxSum > 0 && (
          <Text style={[styles.cycleTxLabel, { color: t.textMuted }]}>
            Includes {formatPeso(currentCycleTxSum)} logged this cycle
          </Text>
        )}

        {impact.netAvailableCash !== null ? (
          <>
            <BreakdownRow label="Funds available" value={cashOnHand !== null ? formatPeso(cashOnHand) : '—'} valueMuted />
            {monthlyIncome !== null && paydays.length > 0 && (
              <BreakdownRow
                label={`Monthly income${incomeApplies ? '' : ' (payday after due)'}`}
                value={`+${formatPeso(monthlyIncome)}`}
                valueMuted
                strikethrough={!incomeApplies}
              />
            )}
            {committedExpenses !== null && committedExpenses > 0 && (
              <BreakdownRow label="Fixed expenses" value={`−${formatPeso(committedExpenses)}`} valueMuted />
            )}
            <BreakdownDivider />
            <BreakdownRow label="Available to pay" value={formatPeso(impact.netAvailableCash)} bold labelColor={t.inputText} valueColor={t.safe} />
          </>
        ) : (
          <BreakdownRow label="Available to pay" value="Not set" valueMuted />
        )}

        <BreakdownRow label="Monthly payment" value={formatPeso(impact.monthlyPayment)} bold />
        {payoffStrategy !== 'minimum' && (
          <BreakdownRow label="Minimum payment" value={formatPeso(impact.minimumPayment)} valueMuted />
        )}
        <BreakdownRow label="Credit available after swipe" value={formatPeso(Math.max(0, card.creditLimit - impact.projectedBalance))} />

        {showCarriedBalance && (
          <>
            <BreakdownDivider />
            <BreakdownRow label="Carried balance" value={formatPeso(impact.carriedBalance)} labelColor={t.risky} valueColor={t.risky} />
            <BreakdownRow label={`Est. monthly interest (${card.interestRate * 100}%)`} value={formatPeso(impact.monthlyInterest)} labelColor={t.risky} valueColor={t.risky} />
          </>
        )}

        {showCarriedBalance && payoffProjection && (
          <>
            <BreakdownDivider />
            <Pressable onPress={() => setProjectionExpanded((p) => !p)} style={styles.projectionToggle} accessibilityRole="button" accessibilityLabel="Payoff projection" accessibilityState={{ expanded: projectionExpanded }}>
              <Text style={[styles.projectionToggleText, { color: t.caution }]}>
                Payoff Projection {projectionExpanded ? '▴' : '▾'}
              </Text>
            </Pressable>
            {projectionExpanded && (
              <View style={styles.projectionContent}>
                <BreakdownRow
                  label="Months to pay off"
                  value={payoffProjection.monthsToPayoff >= 360 ? '360+' : String(payoffProjection.monthsToPayoff)}
                />
                <BreakdownRow label="Total interest" value={formatPeso(payoffProjection.totalInterest)} labelColor={t.risky} valueColor={t.risky} />
                <BreakdownRow label="Total paid" value={formatPeso(payoffProjection.totalPaid)} bold />
              </View>
            )}
          </>
        )}
      </View>

      {/* Navigation links */}
      <View style={styles.navRow}>
        <Link href={{ pathname: '/card-transactions', params: { cardId: card.id } }} asChild>
          <Pressable style={[styles.navButton, { backgroundColor: t.surface, borderColor: t.border }]} accessibilityRole="button" accessibilityLabel="View transactions">
            <Text style={[styles.navButtonText, { color: t.primary }]}>View Transactions ›</Text>
          </Pressable>
        </Link>
        <Link href={{ pathname: '/payment-summary', params: { cardId: card.id } }} asChild>
          <Pressable style={[styles.navButton, { backgroundColor: t.surface, borderColor: t.border }]} accessibilityRole="button" accessibilityLabel="What you owe">
            <Text style={[styles.navButtonText, { color: t.primary }]}>What You Owe ›</Text>
          </Pressable>
        </Link>
      </View>

      {/* Payoff Planner link */}
      <Link href={(subscriptionTier === 'free' ? '/paywall-manual' : '/payoff-planner') as any} asChild>
        <Pressable style={[styles.navButton, { backgroundColor: t.surface, borderColor: t.border }]} accessibilityRole="button" accessibilityLabel="Payoff Planner">
          <View style={styles.plannerLinkRow}>
            <Text style={[styles.navButtonText, { color: t.primary }]}>Payoff Planner ›</Text>
            {subscriptionTier === 'free' && (
              <Text style={[styles.proBadge, { color: t.accent, backgroundColor: t.accentBg }]}>PRO</Text>
            )}
          </View>
        </Pressable>
      </Link>

      {/* Try a different card */}
      {activeCards.length > 1 && (
        <>
          <Pressable
            style={[styles.tryCardButton, { borderColor: t.border }]}
            onPress={() => setCardPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Try a different card"
          >
            <Text style={[styles.tryCardText, { color: t.primary }]}>Try a different card</Text>
          </Pressable>

          <Modal visible={cardPickerVisible} animationType="slide" transparent accessibilityViewIsModal>
            <Pressable style={styles.tryCardOverlay} onPress={() => setCardPickerVisible(false)} accessibilityLabel="Close card picker">
              <View style={[styles.tryCardSheet, { backgroundColor: t.background }]}>
                <Text style={[styles.tryCardTitle, { color: t.textPrimary }]}>Switch Card</Text>
                <FlatList
                  data={activeCards.filter((c) => c.id !== card.id)}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => {
                    const status = calculateCardStatus(item);
                    const dotColor = status.status === 'SAFE' ? t.safe : status.status === 'CAUTION' ? t.caution : t.risky;
                    return (
                      <Pressable
                        style={[styles.tryCardRow, { borderBottomColor: t.border }]}
                        onPress={() => {
                          setCardPickerVisible(false);
                          router.push({ pathname: '/swipe-impact', params: { cardId: item.id } });
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Switch to ${item.bankName}, ${status.status}`}
                      >
                        <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
                        <Text style={[styles.tryCardName, { color: t.textPrimary }]}>{item.bankName}</Text>
                      </Pressable>
                    );
                  }}
                />
              </View>
            </Pressable>
          </Modal>
        </>
      )}

      {/* Quick-update funds available prompt */}
      {showFundsPrompt && !readOnly && (
        <Pressable
          style={[styles.fundsPrompt, { backgroundColor: t.cautionBg, borderColor: t.caution }]}
          onPress={() => router.navigate('/')}
          accessibilityRole="button"
          accessibilityLabel={cashOnHand === null ? 'Set funds available' : 'Update funds available'}
        >
          <Text style={[styles.fundsPromptText, { color: t.caution }]}>
            {cashOnHand === null ? 'Set funds available \u2192' : 'Update funds available \u2192'}
          </Text>
        </Pressable>
      )}

      {impact.netAvailableCash === null && (
        <Text style={[styles.hint, { color: t.textMuted }]}>
          Set your funds available to see payoff projections.
        </Text>
      )}

      {/* Trial CTA */}
      {subscriptionTier === 'free' && (
        <Link href={"/paywall-manual" as any} asChild>
          <Pressable style={[styles.trialCta, { backgroundColor: t.accentBg, borderColor: t.accent }]} accessibilityRole="button" accessibilityLabel={`Try free${trialDays ? ` for ${trialDays}` : ''} — unlock payment planning, installment tracking, and more`}>
            <Text style={[styles.trialCtaText, { color: t.accent }]}>
              {trialDays ? `Try Free for ${trialDays}` : 'Upgrade to Pro'}
            </Text>
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
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: typeScale.caption,
    fontFamily: fonts.interSemiBold,
  },
  ganttToggle: {
    paddingVertical: 8,
    marginBottom: 4,
  },
  ganttToggleText: {
    fontSize: typeScale.body,
    fontFamily: fonts.interSemiBold,
  },
  ganttContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  breakdown: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: typeScale.body,
    fontFamily: fonts.interBold,
    marginBottom: 12,
  },
  cycleTxLabel: {
    fontSize: typeScale.caption,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 4,
  },
  navRow: {
    gap: 8,
    marginBottom: 16,
  },
  navButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navButtonText: {
    fontSize: typeScale.body,
    fontFamily: fonts.interSemiBold,
  },
  fundsPrompt: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  fundsPromptText: {
    fontSize: typeScale.body,
    fontFamily: fonts.interSemiBold,
  },
  hint: {
    fontSize: typeScale.body,
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
    fontSize: typeScale.headline,
    fontFamily: fonts.interBold,
    marginBottom: 4,
  },
  trialCtaSubtext: {
    fontSize: typeScale.body,
  },
  projectionToggle: {
    paddingVertical: 8,
  },
  projectionToggleText: {
    fontSize: typeScale.body,
    fontFamily: fonts.interSemiBold,
  },
  projectionContent: {
    paddingTop: 4,
  },
  plannerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  proBadge: {
    fontSize: typeScale.caption,
    fontFamily: fonts.interBold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tryCardButton: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  tryCardText: {
    fontSize: typeScale.body,
    fontFamily: fonts.interSemiBold,
  },
  tryCardOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  tryCardSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32,
    maxHeight: '50%',
  },
  tryCardTitle: {
    fontSize: typeScale.headline,
    fontFamily: fonts.interBold,
    marginBottom: 12,
  },
  tryCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tryCardName: {
    fontSize: typeScale.headline,
    fontFamily: fonts.interRegular,
  },
});
