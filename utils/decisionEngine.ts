import { Card, CardStatus, CardStatusResult } from '@/types/card';

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
