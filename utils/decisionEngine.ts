import { Card, CardStatusResult, SwipeImpactResult, BestCardResult, CycleDates, FutureCycleProjection, FutureSignal, PayoffProjection } from '@/types/card';
import type { PayoffStrategy } from '@/store/userStore';
import type { Transaction } from '@/store/transactionStore';

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
 *          + subscriptions_this_cycle + proposed_swipe + current_cycle_tx_sum
 *          + annual_fee (if due this cycle)
 *
 * currentCycleTxSum: sum of logged current-cycle transactions (purchases positive,
 * payments/refunds negative, excluded = 0). Defaults to 0 for backward compat.
 */
export function projectedStatementBalance(
  card: Card,
  proposedSwipe: number = 0,
  today: Date = new Date(),
  currentCycleTxSum: number = 0,
): number {
  let projected = card.outstandingBalance
    + card.pendingTransactions
    + card.installmentsMonthlyAmount
    + card.subscriptionsThisCycle
    + proposedSwipe
    + currentCycleTxSum;

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
  currentCycleTxSum: number = 0,
): CardStatusResult {
  const days = daysToStatement(card.statementDay, today);
  const effectiveBalance = card.outstandingBalance + currentCycleTxSum;
  const util = utilization(effectiveBalance, card.creditLimit);
  const utilPct = Math.round(util * 100);

  // RISKY: cash below minimum payment — highest priority (first match wins)
  if (netAvailableCash !== null) {
    const minimumPayment = Math.max(
      effectiveBalance * card.minPaymentPct,
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
 * Compute the monthly payment amount based on the user's payoff strategy.
 * Returns the amount the user intends to pay this month toward the projected balance.
 */
export function computeMonthlyPayment(
  projectedBalance: number,
  netAvailableCash: number | null,
  strategy: PayoffStrategy,
  fixedAmount: number | null,
  minPaymentPct: number,
  minPaymentFloor: number,
  committedExpenses: number = 0,
): number {
  switch (strategy) {
    case 'full':
      return projectedBalance;
    case 'minimum':
      return Math.max(projectedBalance * minPaymentPct, minPaymentFloor);
    case 'fixed':
      return Math.min(fixedAmount ?? 0, projectedBalance);
    case 'aggressive': {
      if (netAvailableCash === null) return projectedBalance;
      const safetyBuffer = Math.max(committedExpenses * 0.2, 0);
      return Math.min(Math.max(netAvailableCash - safetyBuffer, 0), projectedBalance);
    }
    default:
      return projectedBalance;
  }
}

/**
 * Compute payoff projection using standard amortization.
 * Returns months to pay off, total interest, and total paid.
 * Returns null if monthlyPayment <= 0 (would never pay off).
 * Caps at 360 months.
 */
export function computePayoffProjection(
  balance: number,
  monthlyPayment: number,
  interestRate: number,
): PayoffProjection | null {
  if (monthlyPayment <= 0 || balance <= 0) return null;

  let remaining = balance;
  let totalInterest = 0;
  let months = 0;
  const maxMonths = 360;

  while (remaining > 0 && months < maxMonths) {
    const interest = remaining * interestRate;
    totalInterest += interest;
    remaining = remaining + interest - monthlyPayment;
    months++;

    if (remaining <= 0) {
      // Overpaid on the last month — adjust
      totalInterest += remaining; // remaining is negative, so this subtracts the overpayment interest
      remaining = 0;
    }
  }

  return {
    monthsToPayoff: months,
    totalInterest: Math.max(0, totalInterest),
    totalPaid: balance + Math.max(0, totalInterest),
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
  currentCycleTxSum: number = 0,
  strategy: PayoffStrategy = 'full',
  fixedPayoffAmount: number | null = null,
  committedExpenses: number = 0,
): SwipeImpactResult {
  const projectedBalance = projectedStatementBalance(card, proposedAmount, today, currentCycleTxSum);
  const projectedUtil = utilization(projectedBalance, card.creditLimit);
  const projectedUtilPct = Math.round(projectedUtil * 100);
  const days = daysToStatement(card.statementDay, today);

  const minimumPayment = Math.max(
    projectedBalance * card.minPaymentPct,
    card.minPaymentFloor,
  );

  const monthlyPayment = computeMonthlyPayment(
    projectedBalance,
    netAvailableCash,
    strategy,
    fixedPayoffAmount,
    card.minPaymentPct,
    card.minPaymentFloor,
    committedExpenses,
  );

  // Carried balance and interest based on monthly payment (not raw netAvailableCash)
  let carriedBalance = 0;
  let monthlyInterest = 0;

  if (monthlyPayment < projectedBalance) {
    carriedBalance = Math.max(0, projectedBalance - monthlyPayment);
    monthlyInterest = carriedBalance * card.interestRate;
  }

  const result = {
    projectedBalance,
    netAvailableCash,
    minimumPayment,
    monthlyPayment,
    carriedBalance,
    monthlyInterest,
  };

  // Status evaluation — first match wins (mirrors decision logic spec)
  // RISKY: can't cover minimum payment
  if (netAvailableCash !== null && netAvailableCash < minimumPayment) {
    return {
      status: 'RISKY',
      reason: "You won't be able to make the minimum payment",
      ...result,
    };
  }

  // RISKY: would exceed credit limit
  if (projectedBalance > card.creditLimit) {
    return {
      status: 'RISKY',
      reason: 'This would exceed your credit limit',
      ...result,
    };
  }

  // RISKY: statement closes in ≤2 days
  if (days <= 2) {
    return {
      status: 'RISKY',
      reason: `Statement closes in ${days} day${days === 1 ? '' : 's'} — charge will hit this bill`,
      ...result,
    };
  }

  // RISKY: utilization above 80%
  if (projectedUtil > 0.8) {
    return {
      status: 'RISKY',
      reason: `Utilization would be ${projectedUtilPct}% — above 80%`,
      ...result,
    };
  }

  // CAUTION: strategy != minimum AND monthly payment < projectedBalance → carrying balance
  if (strategy !== 'minimum' && monthlyPayment < projectedBalance) {
    return {
      status: 'CAUTION',
      reason: `You'll carry ₱${Math.round(carriedBalance).toLocaleString()} to next month at ${card.interestRate * 100}%/mo = ₱${Math.round(monthlyInterest).toLocaleString()} interest`,
      ...result,
    };
  }

  // CAUTION: statement closes in ≤7 days
  if (days <= 7) {
    return {
      status: 'CAUTION',
      reason: `${days} days to statement — charge lands on this bill`,
      ...result,
    };
  }

  // CAUTION: utilization above 50%
  if (projectedUtil > 0.5) {
    return {
      status: 'CAUTION',
      reason: `Utilization would be ${projectedUtilPct}% — approaching high threshold`,
      ...result,
    };
  }

  // SAFE
  return {
    status: 'SAFE',
    reason: `${days} days to statement · ${projectedUtilPct}% utilization after swipe`,
    ...result,
  };
}

/**
 * Compute net available cash for a specific card.
 * For each payday that falls on or before the card's due date,
 * adds an equal share of monthly income (monthlyIncome / paydays.length).
 */
export function computeNetAvailableCash(
  cashOnHand: number | null,
  monthlyIncome: number | null,
  paydays: number[],
  card: Card,
  committedExpenses: number | null = null,
  today: Date = new Date(),
): number | null {
  if (cashOnHand === null) return null;

  let net = cashOnHand;

  if (monthlyIncome !== null && paydays.length > 0) {
    const { dueDate } = getCycleDates(card, today);
    const dueDayOfMonth = dueDate.getDate();
    const perPayday = monthlyIncome / paydays.length;
    for (const day of paydays) {
      if (day <= dueDayOfMonth) {
        net += perPayday;
      }
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
  currentCycleTxSum: number = 0,
): number {
  const effectiveBalance = card.outstandingBalance + currentCycleTxSum;
  const util = utilization(effectiveBalance, card.creditLimit);
  const days = daysToStatement(card.statementDay, today);
  const { status } = calculateCardStatus(card, today, netAvailableCash, currentCycleTxSum);

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
 * Get cycle dates for a future cycle N months from now.
 * cycleOffset: 0 = current, 1 = next, etc.
 */
function getFutureCycleDates(card: Card, cycleOffset: number, today: Date = new Date()): { statementClose: Date; dueDate: Date } {
  const currentCycle = getCycleDates(card, today);
  const statementClose = new Date(currentCycle.statementClose);
  statementClose.setMonth(statementClose.getMonth() + cycleOffset);
  const dueDate = new Date(statementClose);
  dueDate.setDate(dueDate.getDate() + card.dueDayOffset);
  return { statementClose, dueDate };
}

/**
 * Project future billing cycles based on known fixed events.
 * Shows committed items per cycle for as many cycles as fixed events exist.
 * Cycles beyond the last known event get a signal only (no fabricated numbers).
 */
export function projectFutureCycles(
  card: Card,
  netAvailableCash: number | null = null,
  today: Date = new Date(),
): FutureCycleProjection[] {
  const hasInstallments = card.installmentsMonthlyAmount > 0;
  const hasSubscriptions = card.subscriptionsThisCycle > 0;
  const hasAnnualFee = card.annualFee > 0 && card.annualFeeMonth > 0;

  // No fixed events → no future projections
  if (!hasInstallments && !hasSubscriptions && !hasAnnualFee) return [];

  // Determine projection horizon: project enough cycles to capture all fixed events.
  // Recurring items (installments/subscriptions) → 6 cycles.
  // If only annual fee, project until its next occurrence (up to 12).
  let horizon = 0;
  if (hasInstallments || hasSubscriptions) {
    horizon = 6;
  }
  if (hasAnnualFee) {
    // Find how many cycles until annual fee month
    const currentCycle = getCycleDates(card, today);
    const currentCycleMonth = currentCycle.statementClose.getMonth() + 1; // 1-based
    let monthsToFee = card.annualFeeMonth - currentCycleMonth;
    if (monthsToFee <= 0) monthsToFee += 12;
    horizon = Math.max(horizon, monthsToFee);
  }

  // Cap at 12
  horizon = Math.min(horizon, 12);

  const projections: FutureCycleProjection[] = [];

  // Current cycle (cycle 0)
  const currentProjected = projectedStatementBalance(card, 0, today);
  const currentStatus = calculateCardStatus(card, today, netAvailableCash);
  const currentCycleDates = getCycleDates(card, today);
  projections.push({
    cycleNumber: 0,
    statementClose: currentCycleDates.statementClose,
    dueDate: currentCycleDates.dueDate,
    committedItems: {
      installments: card.installmentsMonthlyAmount,
      subscriptions: card.subscriptionsThisCycle,
      annualFee: (() => {
        const m = currentCycleDates.statementClose.getMonth() + 1;
        return hasAnnualFee && m === card.annualFeeMonth ? card.annualFee : 0;
      })(),
    },
    projectedBalance: currentProjected,
    status: currentStatus,
    isKnown: true,
  });

  // Future cycles (1..horizon)
  for (let i = 1; i <= horizon; i++) {
    const { statementClose, dueDate } = getFutureCycleDates(card, i, today);
    const cycleMonth = statementClose.getMonth() + 1; // 1-based

    const installments = hasInstallments ? card.installmentsMonthlyAmount : 0;
    const subscriptions = hasSubscriptions ? card.subscriptionsThisCycle : 0;
    const annualFee = hasAnnualFee && cycleMonth === card.annualFeeMonth ? card.annualFee : 0;

    const projectedBalance = installments + subscriptions + annualFee;

    // Status for future cycle: evaluate committed items against credit limit
    const futureUtil = projectedBalance / card.creditLimit;
    let status: CardStatusResult;
    if (futureUtil > 0.8) {
      status = { status: 'RISKY', reason: `Committed charges at ${Math.round(futureUtil * 100)}% of limit` };
    } else if (futureUtil > 0.5) {
      status = { status: 'CAUTION', reason: `Committed charges at ${Math.round(futureUtil * 100)}% of limit` };
    } else if (projectedBalance > 0) {
      status = { status: 'SAFE', reason: `${formatPeso(projectedBalance)} in known charges` };
    } else {
      status = { status: 'SAFE', reason: 'No known charges this cycle' };
    }

    projections.push({
      cycleNumber: i,
      statementClose,
      dueDate,
      committedItems: { installments, subscriptions, annualFee },
      projectedBalance,
      status,
      isKnown: true,
    });
  }

  // Add one signal-only cycle beyond the horizon
  const { statementClose: beyondStmt, dueDate: beyondDue } = getFutureCycleDates(card, horizon + 1, today);
  let signal: FutureSignal;
  if (currentStatus.status === 'SAFE') {
    signal = 'On Track';
  } else if (currentStatus.status === 'CAUTION' || currentStatus.status === 'RISKY') {
    signal = 'At Risk';
  } else {
    signal = 'Unknown';
  }
  projections.push({
    cycleNumber: horizon + 1,
    statementClose: beyondStmt,
    dueDate: beyondDue,
    committedItems: { installments: 0, subscriptions: 0, annualFee: 0 },
    projectedBalance: 0,
    status: { status: currentStatus.status, reason: '' },
    isKnown: false,
    signal,
  });

  return projections;
}

/**
 * Compute the net sum of current-cycle transactions for a card.
 * Purchases/fees add to the balance; payments/refunds subtract.
 * Excluded transactions are skipped. Returns 0 if no transactions.
 */
export function computeCurrentCycleTxSum(currentCycleTxns: Transaction[]): number {
  return currentCycleTxns.reduce((sum, tx) => {
    if (tx.cycleLabel === 'excluded') return sum;
    if (tx.type === 'payment' || tx.type === 'refund') return sum - tx.amount;
    return sum + tx.amount;
  }, 0);
}

function formatPeso(amount: number): string {
  return `₱${Math.round(amount).toLocaleString()}`;
}

/**
 * Find the best card to use today.
 * Picks the lowest-scoring SAFE card; if none, lowest-scoring CAUTION card with warning.
 */
export function calculateBestCard(
  cards: Card[],
  today: Date = new Date(),
  getNetAvailableCash?: (card: Card) => number | null,
  getCurrentCycleTxSum?: (card: Card) => number,
): BestCardResult | null {
  if (cards.length === 0) return null;

  const scored = cards.map((card) => {
    const nac = getNetAvailableCash ? getNetAvailableCash(card) : null;
    const txSum = getCurrentCycleTxSum ? getCurrentCycleTxSum(card) : 0;
    return {
      card,
      score: scoreCard(card, today, nac, txSum),
      status: calculateCardStatus(card, today, nac, txSum),
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

  // All cards are RISKY — pick the least bad
  const riskyPick = scored[0];
  return {
    card: riskyPick.card,
    status: riskyPick.status,
    score: riskyPick.score,
    warning: 'All cards are risky — hold off if you can',
  };
}
