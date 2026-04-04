import { useUserStore } from '@/store/userStore';
import { formatAmount, getCurrencySymbol } from '@/utils/currency';
import type { Card } from '@/types/card';

export function useCurrency(card?: Card | null) {
  const globalCurrency = useUserStore((s) => s.globalCurrency);
  const currency = card?.currency ?? globalCurrency;

  return {
    currency,
    symbol: getCurrencySymbol(currency),
    format: (amount: number) => formatAmount(amount, currency),
  };
}
