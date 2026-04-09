import { useMemo } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { Button, Caption } from '@/components/atoms';
import { SectionCard, BreakdownRow, BreakdownDivider } from '@/components/molecules';
import { useAppTheme } from '@/theme';
import { fonts, typeScale } from '@/theme/fonts';
import { useCardStore } from '@/store/cardStore';
import { useTransactionStore } from '@/store/transactionStore';
import { getCycleDates } from '@/utils/decisionEngine';
import { useCurrency } from '@/hooks/useCurrency';

export default function PaymentSummaryScreen() {
  const t = useAppTheme();
  const router = useRouter();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const card = useCardStore((s) => s.cards.find((c) => c.id === cardId));
  const allTransactions = useTransactionStore((s) => s.transactions);
  const { format: formatPeso } = useCurrency(card);

  const data = useMemo(() => {
    if (!card) return null;

    const cycle = getCycleDates(card);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const shortMonths = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const dueMonth = shortMonths[cycle.dueDate.getMonth()];
    const dueDay = cycle.dueDate.getDate();
    const dueYear = cycle.dueDate.getFullYear();
    const dueLabel = `${dueMonth} ${dueDay}, ${dueYear}`;

    const stmtMonth = months[cycle.statementClose.getMonth()];

    // Next statement date (next cycle)
    const nextStmt = new Date(cycle.statementClose);
    nextStmt.setMonth(nextStmt.getMonth() + 1);
    const nextStmtLabel = `${shortMonths[nextStmt.getMonth()]} ${nextStmt.getDate()}`;
    const nextStmtMonth = months[nextStmt.getMonth()];

    // Current cycle transactions
    const currentCycleTxns = allTransactions.filter(
      (tx) => tx.cardId === card.id && tx.cycleLabel === 'current',
    );
    const previousPayments = allTransactions.filter(
      (tx) => tx.cardId === card.id && tx.cycleLabel === 'previous' && tx.type === 'payment',
    );

    const currentCycleSum = currentCycleTxns.reduce((sum, tx) => {
      if (tx.type === 'payment' || tx.type === 'refund') return sum - tx.amount;
      if (tx.cycleLabel === 'excluded') return sum;
      return sum + tx.amount;
    }, 0);

    const paymentsSum = previousPayments.reduce((sum, tx) => sum + tx.amount, 0);

    // What you owe now = outstanding balance - payments made
    const statementBalance = Math.max(0, card.outstandingBalance - paymentsSum);

    // Interest cost if carrying balance
    const interestCost = statementBalance > 0
      ? statementBalance * card.interestRate
      : 0;

    // Projected next bill
    const unpaidCarryover = statementBalance; // if not paid in full
    const projectedNext = currentCycleSum
      + card.installmentsMonthlyAmount
      + card.subscriptionsThisCycle;

    return {
      dueLabel,
      stmtMonth,
      statementBalance,
      interestCost,
      currentCycleSum,
      projectedNext,
      unpaidCarryover,
      nextStmtLabel,
      nextStmtMonth,
      previousPayments,
      paymentsSum,
      hasTransactions: currentCycleTxns.length > 0,
    };
  }, [card, allTransactions]);

  if (!card || !data) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Card not found</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{card.bankName}</Text>

      {/* Current bill due */}
      <SectionCard>
        <Caption>PAY BY {data.dueLabel.toUpperCase()}</Caption>
        <Text style={[styles.bigAmount, { color: t.textPrimary }]}>
          {formatPeso(data.statementBalance)}
        </Text>
        <Caption>Your {data.stmtMonth} statement</Caption>

        {data.previousPayments.length > 0 ? (
          <View style={styles.paymentNote}>
            {data.previousPayments.map((p) => (
              <Text key={p.id} style={[styles.paymentText, { color: t.safe }]}>
                Payment received · {formatPeso(p.amount)}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.interestRow}>
          {data.statementBalance > 0 ? (
            <Text style={[styles.interestText, { color: t.caution }]}>
              {formatPeso(data.interestCost)} interest at {card.interestRate * 100}%/mo if not paid in full
            </Text>
          ) : (
            <Text style={[styles.interestText, { color: t.safe }]}>
              {formatPeso(0)} interest
            </Text>
          )}
        </View>
      </SectionCard>

      {/* Coming next */}
      <SectionCard>
        <Caption>COMING NEXT ({data.nextStmtLabel} statement)</Caption>
        <Text style={[styles.projectedAmount, { color: t.textPrimary }]}>
          Projected: {formatPeso(data.projectedNext)}
        </Text>

        <View style={styles.breakdownSection}>
          {data.hasTransactions ? (
            <BreakdownRow
              label="Current cycle transactions"
              value={formatPeso(data.currentCycleSum)}
            />
          ) : (
            <Text style={[styles.nudge, { color: t.textMuted }]}>
              No transactions logged yet — log purchases to see a projection.
            </Text>
          )}
          {card.installmentsMonthlyAmount > 0 ? (
            <BreakdownRow
              label="Installments"
              value={`+ ${formatPeso(card.installmentsMonthlyAmount)}`}
            />
          ) : null}
          {card.subscriptionsThisCycle > 0 ? (
            <BreakdownRow
              label="Subscriptions"
              value={`+ ${formatPeso(card.subscriptionsThisCycle)}`}
            />
          ) : null}
          <BreakdownDivider />
          <BreakdownRow
            label={`Projected ${data.nextStmtMonth} bill`}
            value={formatPeso(data.projectedNext)}
            bold
          />
        </View>
      </SectionCard>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          label="View Transactions"
          variant="secondary"
          onPress={() => router.push(`/card-transactions?cardId=${card.id}`)}
        />
        <View style={styles.actionGap} />
        <Button
          label="Update Balance"
          variant="ghost"
          onPress={() => router.push(`/update-balance?cardId=${card.id}`)}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 48,
  },
  heading: {
    fontSize: typeScale.title2,
    fontFamily: fonts.interBold,
    marginBottom: 20,
  },
  bigAmount: {
    fontSize: typeScale.hero,
    fontFamily: fonts.nunitoBold,
    marginVertical: 4,
  },
  projectedAmount: {
    fontSize: typeScale.title2a,
    fontFamily: fonts.interBold,
    marginTop: 4,
    marginBottom: 12,
  },
  interestRow: {
    marginTop: 8,
  },
  interestText: {
    fontSize: typeScale.subhead,
    fontFamily: fonts.interMedium,
  },
  paymentNote: {
    marginTop: 8,
  },
  paymentText: {
    fontSize: typeScale.subhead,
    fontFamily: fonts.interSemiBold,
  },
  breakdownSection: {
    marginTop: 4,
  },
  nudge: {
    fontSize: typeScale.subhead,
    marginBottom: 8,
  },
  actions: {
    marginTop: 8,
  },
  actionGap: {
    height: 8,
  },
});
