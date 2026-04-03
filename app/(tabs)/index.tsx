import { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { View } from '@/components/Themed';
import { AlertBanner } from '@/components/molecules';
import { CardPager } from '@/components/organisms';
import { useCardStore } from '@/store/cardStore';
import { useUserStore, getPaydays } from '@/store/userStore';
import { useTransactionStore } from '@/store/transactionStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAppTheme } from '@/theme';
import { computeNetAvailableCash, computeCurrentCycleTxSum } from '@/utils/decisionEngine';
import type { Card } from '@/types/card';

export default function HomeScreen() {
  const t = useAppTheme();
  const cards = useCardStore((s) => s.cards);
  const canAddCard = useSubscriptionStore((s) => s.canAddCard);
  const daysUntilDataDeletion = useSubscriptionStore((s) => s.daysUntilDataDeletion);
  const cashOnHand = useUserStore((s) => s.cashOnHand);
  const monthlyIncome = useUserStore((s) => s.monthlyIncome);
  const committedExpenses = useUserStore((s) => s.committedExpenses);
  const paydays = getPaydays();
  const transactions = useTransactionStore((s) => s.transactions);
  const getCurrentCycle = useTransactionStore((s) => s.getCurrentCycle);

  const daysRemaining = daysUntilDataDeletion();

  const activeCards = useMemo(() => cards.filter((c) => c.isActive), [cards]);
  const hasHiddenCards = cards.length > activeCards.length;

  const getNetAvailableCash = useCallback(
    (card: Card) => computeNetAvailableCash(cashOnHand, monthlyIncome, paydays, card, committedExpenses),
    [cashOnHand, monthlyIncome, paydays, committedExpenses],
  );

  const getCurrentCycleTxSum = useCallback(
    (card: Card) => computeCurrentCycleTxSum(getCurrentCycle(card.id, card.statementDay)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, getCurrentCycle],
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
        getCurrentCycleTxSum={getCurrentCycleTxSum}
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
