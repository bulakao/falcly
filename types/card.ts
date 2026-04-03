export interface Card {
  id: string;
  bankName: string;
  creditLimit: number;
  outstandingBalance: number;
  statementDay: number; // 1–31
  dueDayOffset: number; // days after statement → due date
  interestRate: number; // monthly rate, e.g. 0.02 = 2%
  minPaymentPct: number; // e.g. 0.05 = 5%
  minPaymentFloor: number; // e.g. 500
  customFinancials: boolean; // true = user set custom interest/payment values
  pendingTransactions: number; // pending charges not yet posted
  installmentsMonthlyAmount: number; // committed installment amount per cycle
  subscriptionsThisCycle: number; // subscriptions hitting this billing cycle
  annualFee: number; // annual fee amount (0 if none)
  annualFeeMonth: number; // month (1–12) when annual fee is charged (0 if none)
  balanceUpdatedAt: number; // timestamp
  createdAt: number;
  isActive: boolean;
}

export type CardStatus = 'SAFE' | 'CAUTION' | 'RISKY';

export interface CardStatusResult {
  status: CardStatus;
  reason: string;
}

export interface SwipeImpactResult {
  status: CardStatus;
  reason: string;
  projectedBalance: number;
  netAvailableCash: number | null; // null when cash not set (CA stories)
  minimumPayment: number;
  monthlyPayment: number; // strategy-aware payment amount
  carriedBalance: number; // 0 if full payoff possible
  monthlyInterest: number; // 0 if no carried balance
}

export interface BestCardResult {
  card: Card;
  status: CardStatusResult;
  score: number;
  warning: string | null; // non-null when no SAFE card available
}

export interface CycleDates {
  cycleStart: Date;
  statementClose: Date;
  dueDate: Date;
  today: Date;
  totalDays: number; // cycle length in days
  daysSinceStart: number;
  daysToStatement: number;
}

export type FutureSignal = 'On Track' | 'At Risk' | 'Unknown';

export interface FutureCycleProjection {
  cycleNumber: number; // 0 = current, 1 = next, etc.
  statementClose: Date;
  dueDate: Date;
  committedItems: {
    installments: number;
    subscriptions: number;
    annualFee: number;
  };
  projectedBalance: number; // sum of committed items (for future cycles)
  status: CardStatusResult;
  isKnown: boolean; // false for signal-only cycles beyond last fixed event
  signal?: FutureSignal; // only set when isKnown is false
}

export const DEFAULT_DUE_DAY_OFFSET = 21;
