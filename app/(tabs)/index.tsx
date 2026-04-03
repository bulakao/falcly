import { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { View } from '@/components/Themed';
import { AlertBanner } from '@/components/molecules';
import { CardPager } from '@/components/organisms';
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAppTheme } from '@/theme';
import { computeNetAvailableCash } from '@/utils/decisionEngine';
import type { Card } from '@/types/card';

export default function HomeScreen() {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const cards = useCardStore((s) => s.cards);
  const canAddCard = useSubscriptionStore((s) => s.canAddCard);
  const daysUntilDataDeletion = useSubscriptionStore((s) => s.daysUntilDataDeletion);
  const cashOnHand = useUserStore((s) => s.cashOnHand);
  const monthlyIncome = useUserStore((s) => s.monthlyIncome);
  const payday = useUserStore((s) => s.payday);
  const committedExpenses = useUserStore((s) => s.committedExpenses);

  const daysRemaining = daysUntilDataDeletion();

  // DEBUG — remove after diagnosis
  useEffect(() => {
    console.log('[DEBUG] userStore:', { cashOnHand, monthlyIncome, payday, committedExpenses });
    cards.forEach((card) => {
      const nac = computeNetAvailableCash(cashOnHand, monthlyIncome, payday, card, committedExpenses);
      const minPayment = Math.max(card.outstandingBalance * card.minPaymentPct, card.minPaymentFloor);
      console.log(`[DEBUG] card: ${card.bankName} | outstandingBalance: ${card.outstandingBalance} | minPayment: ${minPayment} | nac: ${nac} | statementDay: ${card.statementDay}`);
    });
  }, [cards, cashOnHand, monthlyIncome, payday, committedExpenses]);

  const activeCards = useMemo(() => cards.filter((c) => c.isActive), [cards]);
  const hasHiddenCards = cards.length > activeCards.length;

  const getNetAvailableCash = useCallback(
    (card: Card) => computeNetAvailableCash(cashOnHand, monthlyIncome, payday, card, committedExpenses),
    [cashOnHand, monthlyIncome, payday, committedExpenses],
  );

  function handleAddCard() {
    if (canAddCard(cards.length)) {
      router.push('/add-card');
    } else {
      router.push('/pro-paywall');
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      {daysRemaining !== null && (
        <Link href="/pro-paywall" asChild>
          <AlertBanner
            message={
              daysRemaining > 0
                ? `Your Pro card data will be deleted in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Reactivate Pro to keep it.`
                : 'Your Pro card data is scheduled for deletion. Reactivate Pro to keep it.'
            }
            variant="info"
            centered
          />
        </Link>
      )}
      <CardPager
        cards={activeCards}
        onAddCard={handleAddCard}
        getNetAvailableCash={getNetAvailableCash}
        initialIndex={0}
        onBannerPress={() => router.push('/manage-cards')}
        hasHiddenCards={hasHiddenCards}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
