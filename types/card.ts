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
  balanceUpdatedAt: number; // timestamp
  createdAt: number;
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

export const DEFAULT_DUE_DAY_OFFSET = 21;
export const DEFAULT_INTEREST_RATE = 0.02;
export const DEFAULT_MIN_PAYMENT_PCT = 0.05;
export const DEFAULT_MIN_PAYMENT_FLOOR = 500;
