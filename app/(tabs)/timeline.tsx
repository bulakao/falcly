import { useCallback } from 'react';
import { StyleSheet, ScrollView } from 'react-native';

import { Text, View } from '@/components/Themed';
import { GanttTimeline } from '@/components/GanttTimeline';
import { FutureTimeline } from '@/components/FutureTimeline';
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { useAppTheme } from '@/theme';
import { computeNetAvailableCash, getCycleDates } from '@/utils/decisionEngine';

export default function TimelineScreen() {
  const t = useAppTheme();
  const cards = useCardStore((s) => s.cards);
  const cashOnHand = useUserStore((s) => s.cashOnHand);
  const monthlyIncome = useUserStore((s) => s.monthlyIncome);
  const payday = useUserStore((s) => s.payday);
  const committedExpenses = useUserStore((s) => s.committedExpenses);

  // Cards that have any fixed events worth projecting
  const cardsWithFixedEvents = cards.filter(
    (c) => c.installmentsMonthlyAmount > 0 || c.subscriptionsThisCycle > 0 || (c.annualFee > 0 && c.annualFeeMonth > 0),
  );

  // Sort by urgency (closest statement close first)
  const sortedCards = [...cardsWithFixedEvents].sort((a, b) => {
    const aCycle = getCycleDates(a);
    const bCycle = getCycleDates(b);
    return aCycle.daysToStatement - bCycle.daysToStatement;
  });

  const getNetCash = useCallback(
    (card: Parameters<typeof computeNetAvailableCash>[3]) =>
      computeNetAvailableCash(cashOnHand, monthlyIncome, payday, card, committedExpenses),
    [cashOnHand, monthlyIncome, payday, committedExpenses],
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {cards.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No cards yet</Text>
          <Text style={[styles.emptySubtitle, { color: t.textMuted }]}>
            Add a credit card to see your billing cycle timelines.
          </Text>
        </View>
      ) : (
        <>
          <Text style={[styles.heading, { color: t.textPrimary }]}>Billing Cycles</Text>
          <Text style={[styles.subheading, { color: t.textMuted }]}>
            Sorted by urgency — closest statement close first
          </Text>
          <GanttTimeline cards={cards} />

          {sortedCards.length > 0 && (
            <View style={styles.futureSection}>
              <Text style={[styles.heading, { color: t.textPrimary }]}>Future Projections</Text>
              <Text style={[styles.subheading, { color: t.textMuted }]}>
                Based on installments, subscriptions, and annual fees
              </Text>
              {sortedCards.map((card) => (
                <View key={card.id} style={styles.cardSection}>
                  <Text style={[styles.cardName, { color: t.textPrimary }]}>{card.bankName}</Text>
                  <FutureTimeline card={card} netAvailableCash={getNetCash(card)} />
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    marginBottom: 16,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  futureSection: {
    marginTop: 24,
  },
  cardSection: {
    marginBottom: 20,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
});
