import type { Card } from '@/types/card';
import { getCycleDates } from '@/utils/decisionEngine';

export type CycleLabel = 'previous' | 'current' | 'next' | 'excluded';

/**
 * Classify which billing cycle a transaction date falls into.
 */
export function classifyTransactionCycle(date: number, card: Card): CycleLabel {
  const txDate = new Date(date);
  const cycle = getCycleDates(card, txDate);

  // Normalize to midnight for date-only comparison
  const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
  const cycleStart = new Date(
    cycle.cycleStart.getFullYear(),
    cycle.cycleStart.getMonth(),
    cycle.cycleStart.getDate(),
  );
  const cycleEnd = new Date(
    cycle.statementClose.getFullYear(),
    cycle.statementClose.getMonth(),
    cycle.statementClose.getDate(),
  );

  if (txDay < cycleStart) return 'previous';
  if (txDay > cycleEnd) return 'next';
  return 'current';
}

/**
 * Get the statement month ("YYYY-MM") a transaction date falls into.
 */
export function getStatementMonth(date: number, card: Card): string {
  const txDate = new Date(date);
  // Use the current time context to get the cycle the tx date belongs to
  const cycle = getCycleDates(card, txDate);
  const close = cycle.statementClose;
  const year = close.getFullYear();
  const month = String(close.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get the "Lands on" label for a transaction.
 * e.g. "Lands on your October 2026 statement · due Oct 20"
 */
export function getLandsOnLabel(date: number, card: Card): string {
  const txDate = new Date(date);
  const cycle = getCycleDates(card, txDate);
  const close = cycle.statementClose;
  const due = cycle.dueDate;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const stmtMonth = monthNames[close.getMonth()];
  const stmtYear = close.getFullYear();
  const dueMonth = shortMonths[due.getMonth()];
  const dueDay = due.getDate();

  return `Lands on your ${stmtMonth} ${stmtYear} statement · due ${dueMonth} ${dueDay}`;
}

/**
 * Get the number of days until statement close for a given date.
 */
export function daysUntilClose(date: number, card: Card): number {
  const txDate = new Date(date);
  const cycle = getCycleDates(card, txDate);

  const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
  const closeDay = new Date(
    cycle.statementClose.getFullYear(),
    cycle.statementClose.getMonth(),
    cycle.statementClose.getDate(),
  );

  const diffMs = closeDay.getTime() - txDay.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format a cycle date range label, e.g. "Sep 5 – Oct 5"
 */
export function formatCycleDateRange(card: Card, referenceDate?: Date): string {
  const cycle = getCycleDates(card, referenceDate);
  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const start = cycle.cycleStart;
  const end = cycle.statementClose;
  return `${shortMonths[start.getMonth()]} ${start.getDate()} – ${shortMonths[end.getMonth()]} ${end.getDate()}`;
}
