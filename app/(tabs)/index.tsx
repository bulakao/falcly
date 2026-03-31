import { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';

import { View } from '@/components/Themed';
import { AlertBanner } from '@/components/molecules';
import { CardPager } from '@/components/organisms';
import { useCardStore } from '@/store/cardStore';
import { useUserStore } from '@/store/userStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAppTheme } from '@/theme';
import { calculateBestCard, computeNetAvailableCash } from '@/utils/decisionEngine';
import type { Card } from '@/types/card';

export default function HomeScreen() {
  const t = useAppTheme();
  const cards = useCardStore((s) => s.cards);
  const canAddCard = useSubscriptionStore((s) => s.canAddCard);
  const daysUntilDataDeletion = useSubscriptionStore((s) => s.daysUntilDataDeletion);
  const cashOnHand = useUserStore((s) => s.cashOnHand);
  const monthlyIncome = useUserStore((s) => s.monthlyIncome);
  const payday = useUserStore((s) => s.payday);
  const committedExpenses = useUserStore((s) => s.committedExpenses);

  const daysRemaining = daysUntilDataDeletion();

  const getNetAvailableCash = useCallback(
    (card: Card) => computeNetAvailableCash(cashOnHand, monthlyIncome, payday, card, committedExpenses),
    [cashOnHand, monthlyIncome, payday, committedExpenses],
  );

  // Start on the best card
  const bestCardIndex = useMemo(() => {
    if (cards.length === 0) return 0;
    const best = calculateBestCard(cards, new Date(), getNetAvailableCash);
    if (!best) return 0;
    return cards.findIndex((c) => c.id === best.card.id);
  }, [cards, getNetAvailableCash]);

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
        cards={cards}
        onAddCard={handleAddCard}
        getNetAvailableCash={getNetAvailableCash}
        initialIndex={bestCardIndex}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
