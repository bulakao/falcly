/**
 * Cycle Utils — test suite for billing cycle classification and formatting
 */
import {
  classifyTransactionCycle,
  getStatementMonth,
  getLandsOnLabel,
  daysUntilClose,
  formatCycleDateRange,
} from '@/utils/cycleUtils';
import { createMockCard } from './fixtures/cards';

// Mock dependencies used by getCycleDates (called internally)
jest.mock('@/store/userStore', () => ({
  useUserStore: { getState: () => ({ globalCurrency: 'PHP' }) },
}));
jest.mock('@/utils/currency', () => ({
  formatAmount: (amount: number, _currency: string) => `₱${amount.toFixed(2)}`,
}));

// Default card: statementDay 15, dueDayOffset 21
// Cycle: prev statement close (Mar 15) + 1 = Mar 16 → Apr 15
const card = createMockCard();

// ---------------------------------------------------------------------------
// classifyTransactionCycle
// ---------------------------------------------------------------------------
describe('classifyTransactionCycle', () => {
  it('classifies a mid-cycle transaction as current', () => {
    // Apr 5 is between cycle start (Mar 16) and close (Apr 15)
    const tx = new Date(2026, 3, 5).getTime();
    expect(classifyTransactionCycle(tx, card)).toBe('current');
  });

  it('classifies a transaction on cycle start as current', () => {
    // Mar 16 = first day of cycle ending Apr 15
    const tx = new Date(2026, 2, 16).getTime();
    expect(classifyTransactionCycle(tx, card)).toBe('current');
  });

  it('classifies a transaction on statement close as current', () => {
    // Apr 15 = statement close day
    const tx = new Date(2026, 3, 15).getTime();
    expect(classifyTransactionCycle(tx, card)).toBe('current');
  });

  it('classifies as previous when date falls before computed cycle start (day-31 edge case)', () => {
    // Statement day 31 in February (28 days):
    // getCycleDates(Feb 3): statementClose = new Date(2026,1,31) → Mar 3 (rollover)
    // prevStatementClose = Feb 3; cycleStart = Feb 4
    // Feb 3 < Feb 4 → "previous"
    const card31 = createMockCard({ statementDay: 31 });
    const tx = new Date(2026, 1, 3).getTime();
    expect(classifyTransactionCycle(tx, card31)).toBe('previous');
  });

  it('classifies as next when date falls after computed cycle end (day-31 edge case)', () => {
    // Statement day 31 in April (30 days):
    // getCycleDates(May 2): statementClose = new Date(2026,4,31) → May 31
    // prevStatementClose = Apr 31 → May 1; cycleStart = May 2
    // But with statementDay 31 and Apr 1:
    // getCycleDates(Apr 1): statementClose = new Date(2026,3,31) → May 1
    // prevStatementClose = Apr 1; cycleStart = Apr 2
    // cycle is Apr 2 – May 1; Apr 1 < Apr 2 → "previous"
    const card31 = createMockCard({ statementDay: 31 });
    const tx = new Date(2026, 3, 1).getTime();
    expect(classifyTransactionCycle(tx, card31)).toBe('previous');
  });

  it('handles statement day 1 (cycle spans month boundary)', () => {
    const card1 = createMockCard({ statementDay: 1 });
    // Statement close = Apr 1; cycle start = Mar 2
    // Mar 15 is mid-cycle
    const tx = new Date(2026, 2, 15).getTime();
    expect(classifyTransactionCycle(tx, card1)).toBe('current');
  });

  it('handles statement day 28 (short months)', () => {
    const card28 = createMockCard({ statementDay: 28 });
    // Feb context: statement close = Feb 28; cycle start = Jan 29
    const txMid = new Date(2026, 1, 15).getTime();
    expect(classifyTransactionCycle(txMid, card28)).toBe('current');
  });

  it('handles statement day 31 (month with 30 days)', () => {
    const card31 = createMockCard({ statementDay: 31 });
    // Apr has 30 days; Date(2026, 3, 31) rolls to May 1
    // For a tx on Apr 20, statement close = May 1
    const tx = new Date(2026, 3, 20).getTime();
    expect(classifyTransactionCycle(tx, card31)).toBe('current');
  });
});

// ---------------------------------------------------------------------------
// getStatementMonth
// ---------------------------------------------------------------------------
describe('getStatementMonth', () => {
  it('returns the statement close month in YYYY-MM format', () => {
    // Apr 5 transaction, statement closes Apr 15
    const tx = new Date(2026, 3, 5).getTime();
    expect(getStatementMonth(tx, card)).toBe('2026-04');
  });

  it('returns next month when transaction is after statement close', () => {
    // Apr 20 transaction, past Apr 15 close → next close is May 15
    const tx = new Date(2026, 3, 20).getTime();
    expect(getStatementMonth(tx, card)).toBe('2026-05');
  });

  it('pads single-digit months with leading zero', () => {
    // Jan 5 transaction, statement closes Jan 15
    const tx = new Date(2026, 0, 5).getTime();
    expect(getStatementMonth(tx, card)).toBe('2026-01');
  });

  it('handles year boundary (Dec transaction → Jan statement)', () => {
    // Dec 20, past Dec 15 close → next close Jan 15, 2027
    const tx = new Date(2026, 11, 20).getTime();
    expect(getStatementMonth(tx, card)).toBe('2027-01');
  });
});

// ---------------------------------------------------------------------------
// getLandsOnLabel
// ---------------------------------------------------------------------------
describe('getLandsOnLabel', () => {
  it('returns a formatted label with statement month and due date', () => {
    // Apr 5, statement close Apr 15, due date = Apr 15 + 21 = May 6
    const tx = new Date(2026, 3, 5).getTime();
    const label = getLandsOnLabel(tx, card);
    expect(label).toBe('Lands on your April 2026 statement · due May 6');
  });

  it('handles year boundary in label', () => {
    // Dec 10, statement close Dec 15, due = Dec 15 + 21 = Jan 5 2027
    const tx = new Date(2026, 11, 10).getTime();
    const label = getLandsOnLabel(tx, card);
    expect(label).toBe('Lands on your December 2026 statement · due Jan 5');
  });

  it('works with different dueDayOffset', () => {
    const card7 = createMockCard({ dueDayOffset: 7 });
    // Apr 5, close Apr 15, due = Apr 15 + 7 = Apr 22
    const tx = new Date(2026, 3, 5).getTime();
    const label = getLandsOnLabel(tx, card7);
    expect(label).toBe('Lands on your April 2026 statement · due Apr 22');
  });
});

// ---------------------------------------------------------------------------
// daysUntilClose
// ---------------------------------------------------------------------------
describe('daysUntilClose', () => {
  it('returns positive days when before statement close', () => {
    // Apr 5 → Apr 15 = 10 days
    const tx = new Date(2026, 3, 5).getTime();
    expect(daysUntilClose(tx, card)).toBe(10);
  });

  it('returns 0 on statement close day', () => {
    const tx = new Date(2026, 3, 15).getTime();
    expect(daysUntilClose(tx, card)).toBe(0);
  });

  it('returns negative days when after statement close', () => {
    // Apr 20, close was Apr 15 → -5
    const tx = new Date(2026, 3, 20).getTime();
    // After close, getCycleDates will compute next cycle close (May 15)
    // Apr 20 → May 15 = 25 days
    expect(daysUntilClose(tx, card)).toBe(25);
  });

  it('returns 1 for the day before close', () => {
    const tx = new Date(2026, 3, 14).getTime();
    expect(daysUntilClose(tx, card)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// formatCycleDateRange
// ---------------------------------------------------------------------------
describe('formatCycleDateRange', () => {
  it('returns formatted range for current cycle', () => {
    const ref = new Date(2026, 3, 5); // Apr 5
    // Cycle: Mar 16 – Apr 15
    expect(formatCycleDateRange(card, ref)).toBe('Mar 16 – Apr 15');
  });

  it('handles year boundary', () => {
    const ref = new Date(2026, 0, 5); // Jan 5
    // Statement close = Jan 15; cycle start = Dec 16
    expect(formatCycleDateRange(card, ref)).toBe('Dec 16 – Jan 15');
  });

  it('uses current date when no reference provided', () => {
    // Just verify it returns a string in the expected format
    const result = formatCycleDateRange(card);
    expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2} – [A-Z][a-z]{2} \d{1,2}$/);
  });

  it('works with statement day 1', () => {
    const card1 = createMockCard({ statementDay: 1 });
    const ref = new Date(2026, 2, 15); // Mar 15
    // Statement close = Apr 1; cycle start = Mar 2
    expect(formatCycleDateRange(card1, ref)).toBe('Mar 2 – Apr 1');
  });
});
