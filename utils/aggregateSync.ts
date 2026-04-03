import { useCardStore } from '@/store/cardStore';
import { useInstallmentStore } from '@/store/installmentStore';
import { useSubscriptionItemStore } from '@/store/subscriptionItemStore';

/**
 * Syncs detailed installment/subscription items into the card's aggregate fields.
 * This keeps the existing decision engine working without changes.
 */
export function syncCardAggregates(cardId: string) {
  const card = useCardStore.getState().cards.find((c) => c.id === cardId);
  if (!card) return;

  const installmentTotal = useInstallmentStore.getState().getMonthlyTotalForCard(cardId);
  const subscriptionTotal = useSubscriptionItemStore.getState().getCycleAmountForCard(cardId, card.statementDay);

  useCardStore.getState().updateCard(cardId, {
    installmentsMonthlyAmount: installmentTotal,
    subscriptionsThisCycle: subscriptionTotal,
  });
}
