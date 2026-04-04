export interface CardPayoffSchedule {
  cardId: string;
  bankName: string;
  startingBalance: number;
  interestRate: number;
  monthlyPayments: number[]; // payment amount per month
  payoffMonth: number; // 1-indexed month when balance hits 0
  totalInterest: number;
  totalPaid: number;
}

export interface PayoffPlan {
  strategy: 'avalanche' | 'snowball';
  cards: CardPayoffSchedule[];
  totalMonths: number; // months to debt-free
  totalInterest: number;
  totalPaid: number;
  monthlySummary: MonthlySummary[]; // for timeline visualization
}

export interface MonthlySummary {
  month: number; // 1-indexed
  payments: { cardId: string; amount: number }[];
  remainingBalances: { cardId: string; balance: number }[];
  cardsPaidOff: string[]; // cardIds that hit 0 this month
}

export interface PayoffComparison {
  avalanche: PayoffPlan;
  snowball: PayoffPlan;
  avalancheSavings: number; // interest saved vs snowball
  snowballFirstPayoff: number; // month of first card payoff
  avalancheFirstPayoff: number;
}
