/**
 * Decision Engine — comprehensive test suite
 */
import {
  daysToStatement,
  getCycleDates,
  utilization,
  projectedStatementBalance,
  calculateCardStatus,
  calculateSwipeImpact,
  computeNetAvailableCash,
  calculateBestCard,
  computePayoffProjection,
} from '@/utils/decisionEngine';
import { createMockCard } from './fixtures/cards';

// Mock formatPeso dependencies (runtime require inside decisionEngine)
jest.mock('@/store/userStore', () => ({
  useUserStore: { getState: () => ({ globalCurrency: 'PHP' }) },
}));
jest.mock('@/utils/currency', () => ({
  formatAmount: (amount: number, _currency: string) => `₱${amount.toFixed(2)}`,
}));

// ---------------------------------------------------------------------------
// 2.1  daysToStatement
// ---------------------------------------------------------------------------
describe('daysToStatement', () => {
  it('returns correct days when statement day is later this month', () => {
    const today = new Date(2026, 3, 4); // Apr 4
    expect(daysToStatement(15, today)).toBe(11);
  });

  it('wraps to next month when statement day already passed', () => {
    const today = new Date(2026, 3, 20); // Apr 20, statement day 15
    const days = daysToStatement(15, today);
    // next statement = May 15 → 25 days
    expect(days).toBe(25);
  });

  it('returns 0 when today IS the statement day', () => {
    const today = new Date(2026, 3, 15); // Apr 15
    expect(daysToStatement(15, today)).toBe(0);
  });

  it('handles statement day 31 when month has 30 days', () => {
    // Apr has 30 days. Statement day 31 → JS Date(2026, 3, 31) rolls to May 1
    const today = new Date(2026, 3, 10); // Apr 10
    const days = daysToStatement(31, today);
    // new Date(2026, 3, 31) = May 1 → 21 days from Apr 10
    expect(days).toBe(21);
  });
});

// ---------------------------------------------------------------------------
// 2.2  getCycleDates
// ---------------------------------------------------------------------------
describe('getCycleDates', () => {
  it('returns correct cycleStart, statementClose, dueDate', () => {
    const card = createMockCard({ statementDay: 15, dueDayOffset: 21 });
    const today = new Date(2026, 3, 4); // Apr 4
    const cycle = getCycleDates(card, today);

    expect(cycle.statementClose).toEqual(new Date(2026, 3, 15));
    // cycleStart = prev statement close (Mar 15) + 1 = Mar 16
    expect(cycle.cycleStart).toEqual(new Date(2026, 2, 16));
  });

  it('dueDate = statementClose + dueDayOffset', () => {
    const card = createMockCard({ statementDay: 15, dueDayOffset: 21 });
    const today = new Date(2026, 3, 4);
    const cycle = getCycleDates(card, today);

    const expectedDue = new Date(2026, 3, 15);
    expectedDue.setDate(expectedDue.getDate() + 21); // May 6
    expect(cycle.dueDate).toEqual(expectedDue);
  });

  it('totalDays is approximately 30', () => {
    const card = createMockCard({ statementDay: 15 });
    const today = new Date(2026, 3, 4);
    const cycle = getCycleDates(card, today);
    expect(cycle.totalDays).toBeGreaterThanOrEqual(28);
    expect(cycle.totalDays).toBeLessThanOrEqual(31);
  });

  it('daysSinceStart + daysToStatement ≈ totalDays', () => {
    const card = createMockCard({ statementDay: 15 });
    const today = new Date(2026, 3, 4);
    const cycle = getCycleDates(card, today);
    expect(cycle.daysSinceStart + cycle.daysToStatement).toBeCloseTo(cycle.totalDays, 0);
  });
});

// ---------------------------------------------------------------------------
// 2.3  utilization
// ---------------------------------------------------------------------------
describe('utilization', () => {
  it('returns 0 for 0 balance', () => {
    expect(utilization(0, 50000)).toBe(0);
  });

  it('returns 0.5 for half limit', () => {
    expect(utilization(25000, 50000)).toBe(0.5);
  });

  it('returns >1 when over limit', () => {
    expect(utilization(60000, 50000)).toBeGreaterThan(1);
  });

  it('returns 0 when credit limit is 0 (no divide by zero)', () => {
    expect(utilization(10000, 0)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 2.4  projectedStatementBalance
// ---------------------------------------------------------------------------
describe('projectedStatementBalance', () => {
  it('returns sum of existing charges with no proposed swipe', () => {
    const card = createMockCard({
      outstandingBalance: 10000,
      pendingTransactions: 500,
      installmentsMonthlyAmount: 1000,
      subscriptionsThisCycle: 300,
    });
    const today = new Date(2026, 3, 4);
    expect(projectedStatementBalance(card, 0, today)).toBe(11800);
  });

  it('adds proposed swipe to total', () => {
    const card = createMockCard({ outstandingBalance: 10000 });
    const today = new Date(2026, 3, 4);
    expect(projectedStatementBalance(card, 5000, today)).toBe(15000);
  });

  it('includes annual fee when due this cycle', () => {
    // Statement day 15, today Apr 4 → statementClose = Apr 15 → cycleMonth = 4
    const card = createMockCard({
      outstandingBalance: 10000,
      annualFee: 3500,
      annualFeeMonth: 4,
      statementDay: 15,
    });
    const today = new Date(2026, 3, 4);
    expect(projectedStatementBalance(card, 0, today)).toBe(13500);
  });

  it('excludes annual fee when due in different month', () => {
    const card = createMockCard({
      outstandingBalance: 10000,
      annualFee: 3500,
      annualFeeMonth: 8,
      statementDay: 15,
    });
    const today = new Date(2026, 3, 4);
    expect(projectedStatementBalance(card, 0, today)).toBe(10000);
  });

  it('includes currentCycleTxSum', () => {
    const card = createMockCard({ outstandingBalance: 10000 });
    const today = new Date(2026, 3, 4);
    expect(projectedStatementBalance(card, 0, today, 2000)).toBe(12000);
  });
});

// ---------------------------------------------------------------------------
// 2.5  calculateCardStatus
// ---------------------------------------------------------------------------
describe('calculateCardStatus', () => {
  it('returns RISKY when netAvailableCash < minimumPayment', () => {
    const card = createMockCard({ outstandingBalance: 20000, minPaymentPct: 0.05, minPaymentFloor: 500 });
    // minimumPayment = max(20000*0.05, 500) = 1000
    const today = new Date(2026, 3, 1); // plenty of days
    const result = calculateCardStatus(card, today, 500); // cash < 1000
    expect(result.status).toBe('RISKY');
    expect(result.reason).toContain('minimum payment');
  });

  it('returns RISKY when days <= 2', () => {
    // statement day 15, today Apr 14 → 1 day
    const card = createMockCard({ statementDay: 15, outstandingBalance: 5000, creditLimit: 50000 });
    const today = new Date(2026, 3, 14);
    const result = calculateCardStatus(card, today);
    expect(result.status).toBe('RISKY');
    expect(result.reason).toContain('1 day');
  });

  it('returns RISKY when utilization > 80%', () => {
    const card = createMockCard({ outstandingBalance: 45000, creditLimit: 50000, statementDay: 25 });
    const today = new Date(2026, 3, 4); // 21 days out
    const result = calculateCardStatus(card, today);
    expect(result.status).toBe('RISKY');
    expect(result.reason).toContain('80%');
  });

  it('returns CAUTION when days <= 7 (but > 2)', () => {
    // statement day 15, today Apr 10 → 5 days
    const card = createMockCard({ statementDay: 15, outstandingBalance: 5000, creditLimit: 50000 });
    const today = new Date(2026, 3, 10);
    const result = calculateCardStatus(card, today);
    expect(result.status).toBe('CAUTION');
    expect(result.reason).toContain('5 days');
  });

  it('returns CAUTION when utilization > 50% (but ≤ 80%)', () => {
    // 60% utilization, plenty of days
    const card = createMockCard({ outstandingBalance: 30000, creditLimit: 50000, statementDay: 25 });
    const today = new Date(2026, 3, 4);
    const result = calculateCardStatus(card, today);
    expect(result.status).toBe('CAUTION');
    expect(result.reason).toContain('60%');
  });

  it('returns SAFE when no conditions triggered', () => {
    const card = createMockCard({ outstandingBalance: 10000, creditLimit: 50000, statementDay: 25 });
    const today = new Date(2026, 3, 4); // 21 days, 20% util
    const result = calculateCardStatus(card, today);
    expect(result.status).toBe('SAFE');
  });

  it('RISKY cash takes priority over all other conditions', () => {
    // Even with plenty of days and low util, cash below min payment → RISKY
    const card = createMockCard({ outstandingBalance: 10000, creditLimit: 50000, statementDay: 25 });
    const today = new Date(2026, 3, 4);
    const result = calculateCardStatus(card, today, 100); // cash way below min payment
    expect(result.status).toBe('RISKY');
    expect(result.reason).toContain('minimum payment');
  });
});

// ---------------------------------------------------------------------------
// 2.6  calculateSwipeImpact
// ---------------------------------------------------------------------------
describe('calculateSwipeImpact', () => {
  it('returns RISKY when swipe exceeds credit limit', () => {
    const card = createMockCard({ outstandingBalance: 45000, creditLimit: 50000, statementDay: 25 });
    const today = new Date(2026, 3, 4);
    const result = calculateSwipeImpact(card, 10000, null, today);
    expect(result.status).toBe('RISKY');
    expect(result.reason).toContain('exceed');
  });

  it('returns RISKY when swipe pushes utilization above 80%', () => {
    const card = createMockCard({ outstandingBalance: 30000, creditLimit: 50000, statementDay: 25 });
    const today = new Date(2026, 3, 4);
    // projected = 30000 + 12000 = 42000 → 84%
    const result = calculateSwipeImpact(card, 12000, null, today);
    expect(result.status).toBe('RISKY');
    expect(result.reason).toContain('80%');
  });

  it('returns RISKY when within 2 days of statement', () => {
    const card = createMockCard({ statementDay: 15, outstandingBalance: 5000, creditLimit: 50000 });
    const today = new Date(2026, 3, 14); // 1 day to statement
    const result = calculateSwipeImpact(card, 1000, null, today);
    expect(result.status).toBe('RISKY');
    expect(result.reason).toContain('1 day');
  });

  it('returns CAUTION when carrying balance with strategy != minimum', () => {
    // strategy = full, but netAvailableCash < projected → carrying balance
    const card = createMockCard({ outstandingBalance: 10000, creditLimit: 50000, statementDay: 25 });
    const today = new Date(2026, 3, 4);
    // projected = 10000 + 5000 = 15000, netCash = 8000 → monthly payment (aggressive) ≈ 8000 < 15000
    const result = calculateSwipeImpact(card, 5000, 8000, today, 0, 'aggressive');
    expect(result.status).toBe('CAUTION');
    expect(result.reason).toContain('carry');
  });

  it('returns SAFE with correct projections for safe scenario', () => {
    const card = createMockCard({ outstandingBalance: 5000, creditLimit: 50000, statementDay: 25 });
    const today = new Date(2026, 3, 4);
    const result = calculateSwipeImpact(card, 1000, null, today);
    expect(result.status).toBe('SAFE');
    expect(result.projectedBalance).toBe(6000);
  });
});

// ---------------------------------------------------------------------------
// 2.7  computeNetAvailableCash
// ---------------------------------------------------------------------------
describe('computeNetAvailableCash', () => {
  it('returns null when cashOnHand is null', () => {
    const card = createMockCard();
    expect(computeNetAvailableCash(null, 50000, [15, 30], card)).toBeNull();
  });

  it('returns just cashOnHand when no payday before due date', () => {
    // dueDayOffset=21, statement day 15 → due date = 15+21 = day 36 → wraps → ~day 5-6 next month
    // Actually let's use a card where due day is early so paydays on 15 and 30 are after it
    const card = createMockCard({ statementDay: 5, dueDayOffset: 3 });
    // statement close = May 5 (today is Apr 20), due = May 8, dueDayOfMonth = 8
    // paydays 15 and 30 are both > 8 → no payday before due
    const today = new Date(2026, 3, 20);
    const result = computeNetAvailableCash(10000, 50000, [15, 30], card, 0, today);
    expect(result).toBe(10000);
  });

  it('adds income share when payday is before due date', () => {
    // statementDay=15, dueDayOffset=21 → due ~May 6 → dueDayOfMonth = 6
    // payday on day 5 → before due date
    const card = createMockCard({ statementDay: 15, dueDayOffset: 21 });
    const today = new Date(2026, 3, 4);
    // monthlyIncome=60000, paydays=[5,20], perPayday=30000
    // day 5 <= 6 → adds 30000, day 20 > 6 → skip
    const result = computeNetAvailableCash(10000, 60000, [5, 20], card, 0, today);
    expect(result).toBe(40000);
  });

  it('adds proportionally for multiple paydays before due', () => {
    // Use a card where due day is late in month
    const card = createMockCard({ statementDay: 5, dueDayOffset: 21 });
    // statementClose = May 5, dueDate = May 26, dueDayOfMonth = 26
    // paydays [10, 15, 25] all <= 26
    const today = new Date(2026, 3, 20);
    const result = computeNetAvailableCash(10000, 90000, [10, 15, 25], card, 0, today);
    // perPayday = 30000, 3 paydays qualify → 10000 + 90000 = 100000
    expect(result).toBe(100000);
  });

  it('deducts committedExpenses', () => {
    const card = createMockCard({ statementDay: 15, dueDayOffset: 21 });
    const today = new Date(2026, 3, 4);
    const result = computeNetAvailableCash(50000, null, [], card, 15000, today);
    expect(result).toBe(35000);
  });
});

// ---------------------------------------------------------------------------
// 2.8  calculateBestCard
// ---------------------------------------------------------------------------
describe('calculateBestCard', () => {
  it('returns SAFE card if available', () => {
    const today = new Date(2026, 3, 4);
    const safeCard = createMockCard({ id: 'safe', outstandingBalance: 5000, creditLimit: 50000, statementDay: 25 });
    const riskyCard = createMockCard({ id: 'risky', outstandingBalance: 45000, creditLimit: 50000, statementDay: 25 });
    const result = calculateBestCard([riskyCard, safeCard], today);
    expect(result).not.toBeNull();
    expect(result!.card.id).toBe('safe');
    expect(result!.warning).toBeNull();
  });

  it('prefers card with most days to statement when tied on status', () => {
    const today = new Date(2026, 3, 4);
    // Both SAFE, but card B has statement day 28 (24 days) vs card A day 20 (16 days)
    const cardA = createMockCard({ id: 'a', outstandingBalance: 5000, creditLimit: 50000, statementDay: 20 });
    const cardB = createMockCard({ id: 'b', outstandingBalance: 5000, creditLimit: 50000, statementDay: 28 });
    const result = calculateBestCard([cardA, cardB], today);
    expect(result).not.toBeNull();
    expect(result!.card.id).toBe('b');
  });

  it('returns CAUTION card with warning if no SAFE', () => {
    const today = new Date(2026, 3, 4);
    // 60% utilization → CAUTION
    const cautionCard = createMockCard({ id: 'caution', outstandingBalance: 30000, creditLimit: 50000, statementDay: 25 });
    const result = calculateBestCard([cautionCard], today);
    expect(result).not.toBeNull();
    expect(result!.status.status).toBe('CAUTION');
    expect(result!.warning).not.toBeNull();
  });

  it('returns RISKY card with warning if no SAFE/CAUTION', () => {
    const today = new Date(2026, 3, 4);
    // 90% utilization → RISKY
    const riskyCard = createMockCard({ id: 'risky', outstandingBalance: 45000, creditLimit: 50000, statementDay: 25 });
    const result = calculateBestCard([riskyCard], today);
    expect(result).not.toBeNull();
    expect(result!.status.status).toBe('RISKY');
    expect(result!.warning).toContain('risky');
  });

  it('returns null for empty array', () => {
    const today = new Date(2026, 3, 4);
    expect(calculateBestCard([], today)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2.9  computePayoffProjection
// ---------------------------------------------------------------------------
describe('computePayoffProjection', () => {
  it('returns 1 month and 0 interest when payment > balance', () => {
    const result = computePayoffProjection(10000, 15000, 0.02);
    expect(result).not.toBeNull();
    expect(result!.monthsToPayoff).toBe(1);
    // Interest for 1 month = 10000 * 0.02 = 200, but overpaid so adjusted
    expect(result!.totalInterest).toBeLessThanOrEqual(200);
  });

  it('takes many months with significant interest on minimum payment', () => {
    // Balance 50000, monthly payment 2500 (5% of 50k), 2% monthly interest
    const result = computePayoffProjection(50000, 2500, 0.02);
    expect(result).not.toBeNull();
    expect(result!.monthsToPayoff).toBeGreaterThan(12);
    expect(result!.totalInterest).toBeGreaterThan(5000);
  });

  it('returns null for zero payment', () => {
    expect(computePayoffProjection(10000, 0, 0.02)).toBeNull();
  });

  it('returns null for negative payment', () => {
    expect(computePayoffProjection(10000, -100, 0.02)).toBeNull();
  });

  it('returns null for zero balance', () => {
    expect(computePayoffProjection(0, 5000, 0.02)).toBeNull();
  });

  it('caps at 360 months', () => {
    // Tiny payment, large balance, high interest — will never pay off
    const result = computePayoffProjection(100000, 100, 0.05);
    // Payment < interest each month (100000*0.05 = 5000 > 100) → never pays off
    // But the loop caps at 360
    expect(result).not.toBeNull();
    expect(result!.monthsToPayoff).toBe(360);
  });
});
