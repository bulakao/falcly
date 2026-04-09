/**
 * Syncs detailed installment/subscription items into the card's aggregate fields.
 * This keeps the existing decision engine working without changes.
 *
 * Stores are required lazily to break the require cycle:
 * installmentStore/subscriptionItemStore -> aggregateSync -> stores
 */
export function syncCardAggregates(cardId: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy require to break circular dependency
  const { useCardStore } = require('@/store/cardStore');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useInstallmentStore } = require('@/store/installmentStore');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useSubscriptionItemStore } = require('@/store/subscriptionItemStore');

  const card = useCardStore.getState().cards.find((c: { id: string }) => c.id === cardId);
  if (!card) return;

  const installmentTotal = useInstallmentStore.getState().getMonthlyTotalForCard(cardId);
  const subscriptionTotal = useSubscriptionItemStore.getState().getCycleAmountForCard(cardId, card.statementDay);

  useCardStore.getState().updateCard(cardId, {
    installmentsMonthlyAmount: installmentTotal,
    subscriptionsThisCycle: subscriptionTotal,
  });
}
