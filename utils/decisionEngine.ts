import { Card, CardStatus, CardStatusResult, SwipeImpactResult } from '@/types/card';

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
 * Calculate utilization ratio.
 */
export function utilization(outstandingBalance: number, creditLimit: number): number {
  if (creditLimit <= 0) return 0;
  return outstandingBalance / creditLimit;
}

/**
 * Determine SAFE/CAUTION/RISKY status for a card.
 * Simplified for CL-01 — no cash/income inputs yet (those come in CA stories).
 */
export function calculateCardStatus(card: Card, today: Date = new Date()): CardStatusResult {
  const days = daysToStatement(card.statementDay, today);
  const util = utilization(card.outstandingBalance, card.creditLimit);
  const utilPct = Math.round(util * 100);

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
  const projectedBalance = card.outstandingBalance + proposedAmount;
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
