import type { Card } from '@/types/card';

export function createMockCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'test-card-1',
    bankName: 'Test Bank',
    creditLimit: 50000,
    outstandingBalance: 10000,
    statementDay: 15,
    dueDayOffset: 21,
    interestRate: 0.02,
    minPaymentPct: 0.05,
    minPaymentFloor: 500,
    customFinancials: false,
    pendingTransactions: 0,
    installmentsMonthlyAmount: 0,
    subscriptionsThisCycle: 0,
    annualFee: 0,
    annualFeeMonth: 0,
    balanceUpdatedAt: Date.now(),
    createdAt: Date.now(),
    isActive: true,
    ...overrides,
  };
}
