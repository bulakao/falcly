import { Card, CardStatus, CardStatusResult, SwipeImpactResult, BestCardResult, CycleDates } from '@/types/card';

/**
 * Calculate days until statement close from today.
 * Statement day is the day of month the cycle closes.
 */
export function daysToStatement(statementDay: number, today: Date = new Date()): number {
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let statementDate: Date;
  if (currentDay <= statementDay) {
    // Statement is later this month
    statementDate = new Date(currentYear, currentMonth, statementDay);
  } else {
    // Statement is next month
    statementDate = new Date(currentYear, currentMonth + 1, statementDay);
  }

  const diffMs = statementDate.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculate the key dates in a card's billing cycle.
 * cycleStart is the day after the previous statement close.
 */
export function getCycleDates(card: Card, today: Date = new Date()): CycleDates {
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Statement close date (same logic as daysToStatement)
  let statementClose: Date;
  if (currentDay <= card.statementDay) {
    statementClose = new Date(currentYear, currentMonth, card.statementDay);
  } else {
    statementClose = new Date(currentYear, currentMonth + 1, card.statementDay);
  }

  // Cycle start = day after previous statement close (previous month's statement day + 1)
  const prevStatementClose = new Date(statementClose);
  prevStatementClose.setMonth(prevStatementClose.getMonth() - 1);
  const cycleStart = new Date(prevStatementClose);
  cycleStart.setDate(cycleStart.getDate() + 1);

  // Due date = statement close + dueDayOffset
  const dueDate = new Date(statementClose);
  dueDate.setDate(dueDate.getDate() + card.dueDayOffset);

  const totalDays = Math.round((statementClose.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceStart = Math.round((today.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysToStmt = Math.ceil((statementClose.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {
    cycleStart,
    statementClose,
    dueDate,
    today,
    totalDays,
    daysSinceStart: Math.max(0, daysSinceStart),
    daysToStatement: daysToStmt,
  };
}

/**
 * Calculate the projected statement balance for a card.
 * Formula: outstanding_balance + pending_transactions + installments_monthly_amount
 *          + subscriptions_this_cycle + proposed_swipe + annual_fee (if due this cycle)
 */
export function projectedStatementBalance(
  card: Card,
  proposedSwipe: number = 0,
  today: Date = new Date(),
): number {
  let projected = card.outstandingBalance
    + card.pendingTransactions
    + card.installmentsMonthlyAmount
    + card.subscriptionsThisCycle
    + proposedSwipe;

  // Add annual fee if it falls in the current cycle month
  if (card.annualFee > 0 && card.annualFeeMonth > 0) {
    const cycle = getCycleDates(card, today);
    const cycleMonth = cycle.statementClose.getMonth() + 1; // 1-based
    if (cycleMonth === card.annualFeeMonth) {
      projected += card.annualFee;
    }
  }

  return projected;
}

/**
 * Calculate utilization ratio.
 */
export function utilization(outstandingBalance: number, creditLimit: number): number {
  if (creditLimit <= 0) return 0;
  return outstandingBalance / creditLimit;
}

/**
 * Determine SAFE/CAUTION/RISKY status for a card.
 * netAvailableCash is optional — when provided, enables cash-based RISKY detection.
 */
export function calculateCardStatus(
  card: Card,
  today: Date = new Date(),
  netAvailableCash: number | null = null,
): CardStatusResult {
  const days = daysToStatement(card.statementDay, today);
  const util = utilization(card.outstandingBalance, card.creditLimit);
  const utilPct = Math.round(util * 100);

  // RISKY: cash below minimum payment — highest priority (first match wins)
  if (netAvailableCash !== null) {
    const minimumPayment = Math.max(
      card.outstandingBalance * card.minPaymentPct,
      card.minPaymentFloor,
    );
    if (netAvailableCash < minimumPayment) {
      return {
        status: 'RISKY',
        reason: "You won't be able to make the minimum payment",
      };
    }
  }

  // RISKY conditions (first match wins)
  if (days <= 2) {
    return {
      status: 'RISKY',
      reason: `Statement closes in ${days} day${days === 1 ? '' : 's'} — charge will hit this bill`,
    };
  }

  if (util > 0.8) {
    return {
      status: 'RISKY',
      reason: `Utilization above 80% (${utilPct}%)`,
    };
  }

  // CAUTION conditions
  if (days <= 7) {
    return {
      status: 'CAUTION',
      reason: `${days} days to statement — charge lands on this bill`,
    };
  }

  if (util > 0.5) {
    return {
      status: 'CAUTION',
      reason: `Utilization at ${utilPct}% — approaching high threshold`,
    };
  }

  // SAFE
  return {
    status: 'SAFE',
    reason: `${days} days to statement · ${utilPct}% utilization`,
  };
}

/**
 * Calculate the impact of a proposed swipe on a card.
 * netAvailableCash is null until CA stories add cash/income inputs.
 */
export function calculateSwipeImpact(
  card: Card,
  proposedAmount: number,
  netAvailableCash: number | null = null,
  today: Date = new Date(),
): SwipeImpactResult {
  const projectedBalance = projectedStatementBalance(card, proposedAmount, today);
  const projectedUtil = utilization(projectedBalance, card.creditLimit);
  const projectedUtilPct = Math.round(projectedUtil * 100);
  const days = daysToStatement(card.statementDay, today);

  const minimumPayment = Math.max(
    projectedBalance * card.minPaymentPct,
    card.minPaymentFloor,
  );

  // Carried balance and interest (when cash is known)
  let carriedBalance = 0;
  let monthlyInterest = 0;

  if (netAvailableCash !== null && netAvailableCash < projectedBalance) {
    carriedBalance = Math.max(0, projectedBalance - netAvailableCash);
    monthlyInterest = carriedBalance * card.interestRate;
  }

  // Status evaluation — first match wins (mirrors decision logic spec)
  // RISKY: can't cover minimum payment
  if (netAvailableCash !== null && netAvailableCash < minimumPayment) {
    return {
      status: 'RISKY',
      reason: "You won't be able to make the minimum payment",
      projectedBalance,
      netAvailableCash,
      minimumPayment,
      carriedBalance,
      monthlyInterest,
    };
  }

  // RISKY: would exceed credit limit
  if (projectedBalance > card.creditLimit) {
    return {
      status: 'RISKY',
      reason: 'This would exceed your credit limit',
      projectedBalance,
      netAvailableCash,
      minimumPayment,
      carriedBalance,
      monthlyInterest,
    };
  }

  // RISKY: statement closes in ≤2 days
  if (days <= 2) {
    return {
      status: 'RISKY',
      reason: `Statement closes in ${days} day${days === 1 ? '' : 's'} — charge will hit this bill`,
      projectedBalance,
      netAvailableCash,
      minimumPayment,
      carriedBalance,
      monthlyInterest,
    };
  }

  // RISKY: utilization above 80%
  if (projectedUtil > 0.8) {
    return {
      status: 'RISKY',
      reason: `Utilization would be ${projectedUtilPct}% — above 80%`,
      projectedBalance,
      netAvailableCash,
      minimumPayment,
      carriedBalance,
      monthlyInterest,
    };
  }

  // CAUTION: can't fully pay off
  if (netAvailableCash !== null && netAvailableCash < projectedBalance) {
    return {
      status: 'CAUTION',
      reason: `You'll carry ₱${Math.round(carriedBalance).toLocaleString()} to next month at ${card.interestRate * 100}%/mo = ₱${Math.round(monthlyInterest).toLocaleString()} interest`,
      projectedBalance,
      netAvailableCash,
      minimumPayment,
      carriedBalance,
      monthlyInterest,
    };
  }

  // CAUTION: statement closes in ≤7 days
  if (days <= 7) {
    return {
      status: 'CAUTION',
      reason: `${days} days to statement — charge lands on this bill`,
      projectedBalance,
      netAvailableCash,
      minimumPayment,
      carriedBalance,
      monthlyInterest,
    };
  }

  // CAUTION: utilization above 50%
  if (projectedUtil > 0.5) {
    return {
      status: 'CAUTION',
      reason: `Utilization would be ${projectedUtilPct}% — approaching high threshold`,
      projectedBalance,
      netAvailableCash,
      minimumPayment,
      carriedBalance,
      monthlyInterest,
    };
  }

  // SAFE
  return {
    status: 'SAFE',
    reason: `${days} days to statement · ${projectedUtilPct}% utilization after swipe`,
    projectedBalance,
    netAvailableCash,
    minimumPayment,
    carriedBalance,
    monthlyInterest,
  };
}

/**
 * Compute net available cash for a specific card.
 * Monthly income is added only when payday falls on or before the card's due date.
 */
export function computeNetAvailableCash(
  cashOnHand: number | null,
  monthlyIncome: number | null,
  payday: number | null,
  card: Card,
  committedExpenses: number | null = null,
  today: Date = new Date(),
): number | null {
  if (cashOnHand === null) return null;

  let net = cashOnHand;

  if (monthlyIncome !== null && payday !== null) {
    const { dueDate } = getCycleDates(card, today);
    const dueDayOfMonth = dueDate.getDate();
    if (payday <= dueDayOfMonth) {
      net += monthlyIncome;
    }
  }

  if (committedExpenses !== null) {
    net -= committedExpenses;
  }

  return net;
}

/**
 * Score a card for best-card ranking.
 * Lower score = better card to use.
 * score = utilization×100 + days penalty + status penalty + cash coverage penalty
 */
export function scoreCard(
  card: Card,
  today: Date = new Date(),
  netAvailableCash: number | null = null,
): number {
  const util = utilization(card.outstandingBalance, card.creditLimit);
  const days = daysToStatement(card.statementDay, today);
  const { status } = calculateCardStatus(card, today, netAvailableCash);

  // Utilization component: 0–100
  const utilizationScore = util * 100;

  // Days penalty: fewer days to statement = higher penalty (0–30)
  const daysPenalty = Math.max(0, 30 - days);

  // Status penalty: SAFE=0, CAUTION=50, RISKY=100
  const statusPenalty = status === 'SAFE' ? 0 : status === 'CAUTION' ? 50 : 100;

  // Cash coverage penalty: deferred until CA stories (always 0 for now)
  const cashPenalty = 0;

  return utilizationScore + daysPenalty + statusPenalty + cashPenalty;
}

/**
 * Find the best card to use today.
 * Picks the lowest-scoring SAFE card; if none, lowest-scoring CAUTION card with warning.
 */
export function calculateBestCard(
  cards: Card[],
  today: Date = new Date(),
  getNetAvailableCash?: (card: Card) => number | null,
): BestCardResult | null {
  if (cards.length === 0) return null;

  const scored = cards.map((card) => {
    const nac = getNetAvailableCash ? getNetAvailableCash(card) : null;
    return {
      card,
      score: scoreCard(card, today, nac),
      status: calculateCardStatus(card, today, nac),
    };
  });

  // Sort by score ascending (lowest = best)
  scored.sort((a, b) => a.score - b.score);

  // Pick lowest-scoring SAFE card
  const safePick = scored.find((s) => s.status.status === 'SAFE');
  if (safePick) {
    return {
      card: safePick.card,
      status: safePick.status,
      score: safePick.score,
      warning: null,
    };
  }

  // No SAFE cards — pick lowest-scoring CAUTION card
  const cautionPick = scored.find((s) => s.status.status === 'CAUTION');
  if (cautionPick) {
    return {
      card: cautionPick.card,
      status: cautionPick.status,
      score: cautionPick.score,
      warning: 'No SAFE cards available — use with caution',
    };
  }

  // All cards are RISKY
  return null;
}
