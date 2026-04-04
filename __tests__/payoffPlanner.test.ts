/**
 * Payoff Planner — avalanche and snowball strategy tests
 */
import { computeAvalanchePlan, computeSnowballPlan, comparePayoffStrategies } from '@/utils/payoffPlanner';
import { createMockCard } from './fixtures/cards';

// ---------------------------------------------------------------------------
// Edge cases — null returns
// ---------------------------------------------------------------------------
describe('payoff planner edge cases', () => {
  it('returns null for empty cards array', () => {
    expect(computeAvalanchePlan([], 5000)).toBeNull();
    expect(computeSnowballPlan([], 5000)).toBeNull();
  });

  it('returns null when all cards have 0 balance', () => {
    const cards = [
      createMockCard({ id: 'a', outstandingBalance: 0 }),
      createMockCard({ id: 'b', outstandingBalance: 0 }),
    ];
    expect(computeAvalanchePlan(cards, 5000)).toBeNull();
    expect(computeSnowballPlan(cards, 5000)).toBeNull();
  });

  it('returns null when budget is less than total minimums', () => {
    const cards = [
      createMockCard({ id: 'a', outstandingBalance: 20000, minPaymentFloor: 500 }),
      createMockCard({ id: 'b', outstandingBalance: 15000, minPaymentFloor: 500 }),
    ];
    // min payments: max(20000*0.05, 500) + max(15000*0.05, 500) = 1000 + 750 = 1750
    expect(computeAvalanchePlan(cards, 1000)).toBeNull();
    expect(computeSnowballPlan(cards, 1000)).toBeNull();
  });

  it('skips inactive cards', () => {
    const cards = [
      createMockCard({ id: 'a', outstandingBalance: 10000, isActive: false }),
    ];
    expect(computeAvalanchePlan(cards, 5000)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Single card
// ---------------------------------------------------------------------------
describe('single card payoff', () => {
  it('pays off a single card', () => {
    const card = createMockCard({
      id: 'solo',
      outstandingBalance: 10000,
      interestRate: 0.02,
      minPaymentPct: 0.05,
      minPaymentFloor: 500,
    });

    const plan = computeAvalanchePlan([card], 3000);
    expect(plan).not.toBeNull();
    expect(plan!.strategy).toBe('avalanche');
    expect(plan!.cards).toHaveLength(1);
    expect(plan!.totalMonths).toBeGreaterThan(0);
    expect(plan!.totalMonths).toBeLessThan(10); // should pay off quickly with 3K/mo budget
    expect(plan!.totalPaid).toBeGreaterThan(10000); // paid more than balance due to interest
    expect(plan!.totalInterest).toBeGreaterThan(0);
    expect(plan!.cards[0].payoffMonth).toBe(plan!.totalMonths);
  });

  it('avalanche and snowball produce same result for single card', () => {
    const card = createMockCard({
      id: 'solo',
      outstandingBalance: 10000,
      interestRate: 0.02,
    });

    const avalanche = computeAvalanchePlan([card], 3000)!;
    const snowball = computeSnowballPlan([card], 3000)!;

    expect(avalanche.totalMonths).toBe(snowball.totalMonths);
    expect(avalanche.totalInterest).toBeCloseTo(snowball.totalInterest, 2);
    expect(avalanche.totalPaid).toBeCloseTo(snowball.totalPaid, 2);
  });
});

// ---------------------------------------------------------------------------
// Two cards — strategy ordering
// ---------------------------------------------------------------------------
describe('two cards — avalanche vs snowball ordering', () => {
  const highInterest = createMockCard({
    id: 'high-rate',
    bankName: 'High Rate Bank',
    outstandingBalance: 20000,
    interestRate: 0.035, // 3.5% monthly
    minPaymentPct: 0.05,
    minPaymentFloor: 500,
  });

  const lowBalance = createMockCard({
    id: 'low-bal',
    bankName: 'Low Balance Bank',
    outstandingBalance: 5000,
    interestRate: 0.015, // 1.5% monthly
    minPaymentPct: 0.05,
    minPaymentFloor: 500,
  });

  const cards = [highInterest, lowBalance];
  // Min payments: max(20000*0.05, 500) + max(5000*0.05, 500) = 1000 + 500 = 1500
  const budget = 4000;

  it('avalanche targets highest interest rate first', () => {
    const plan = computeAvalanchePlan(cards, budget)!;
    expect(plan).not.toBeNull();

    // Avalanche: high-rate card should be first in the schedule
    expect(plan.cards[0].cardId).toBe('high-rate');
    expect(plan.cards[1].cardId).toBe('low-bal');
  });

  it('snowball targets lowest balance first', () => {
    const plan = computeSnowballPlan(cards, budget)!;
    expect(plan).not.toBeNull();

    // Snowball: low-balance card should be paid off first
    expect(plan.cards[0].cardId).toBe('low-bal');
    expect(plan.cards[1].cardId).toBe('high-rate');
  });

  it('avalanche saves more interest than snowball', () => {
    const avalanche = computeAvalanchePlan(cards, budget)!;
    const snowball = computeSnowballPlan(cards, budget)!;

    expect(avalanche.totalInterest).toBeLessThan(snowball.totalInterest);
  });

  it('snowball pays off first card faster than avalanche', () => {
    const avalanche = computeAvalanchePlan(cards, budget)!;
    const snowball = computeSnowballPlan(cards, budget)!;

    // Snowball's first card (low balance) should pay off sooner than avalanche's first payoff
    const snowballFirstPayoff = Math.min(...snowball.cards.map((c) => c.payoffMonth));
    const avalancheFirstPayoff = Math.min(...avalanche.cards.map((c) => c.payoffMonth));

    expect(snowballFirstPayoff).toBeLessThanOrEqual(avalancheFirstPayoff);
  });
});

// ---------------------------------------------------------------------------
// Plan structure
// ---------------------------------------------------------------------------
describe('plan structure', () => {
  it('monthlySummary has correct number of entries', () => {
    const card = createMockCard({
      id: 'test',
      outstandingBalance: 5000,
      interestRate: 0.02,
    });

    const plan = computeAvalanchePlan([card], 3000)!;
    expect(plan.monthlySummary).toHaveLength(plan.totalMonths);
    expect(plan.monthlySummary[0].month).toBe(1);
    expect(plan.monthlySummary[plan.totalMonths - 1].month).toBe(plan.totalMonths);
  });

  it('monthlySummary tracks cards paid off', () => {
    const cards = [
      createMockCard({ id: 'a', outstandingBalance: 2000, interestRate: 0.01, minPaymentFloor: 200 }),
      createMockCard({ id: 'b', outstandingBalance: 10000, interestRate: 0.02, minPaymentFloor: 500 }),
    ];

    const plan = computeSnowballPlan(cards, 5000)!;

    // Find the month card 'a' was paid off
    const payoffSummary = plan.monthlySummary.find((m) =>
      m.cardsPaidOff.includes('a'),
    );
    expect(payoffSummary).toBeDefined();
  });

  it('final remaining balances are all zero', () => {
    const card = createMockCard({
      id: 'test',
      outstandingBalance: 5000,
      interestRate: 0.02,
    });

    const plan = computeAvalanchePlan([card], 3000)!;
    const lastMonth = plan.monthlySummary[plan.monthlySummary.length - 1];

    for (const bal of lastMonth.remainingBalances) {
      expect(bal.balance).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// comparePayoffStrategies
// ---------------------------------------------------------------------------
describe('comparePayoffStrategies', () => {
  it('returns null for empty cards', () => {
    expect(comparePayoffStrategies([], 5000)).toBeNull();
  });

  it('returns null when budget is below minimums', () => {
    const cards = [
      createMockCard({ id: 'a', outstandingBalance: 20000, minPaymentFloor: 500 }),
      createMockCard({ id: 'b', outstandingBalance: 15000, minPaymentFloor: 500 }),
    ];
    expect(comparePayoffStrategies(cards, 1000)).toBeNull();
  });

  it('returns both plans with correct strategies', () => {
    const cards = [
      createMockCard({ id: 'a', outstandingBalance: 20000, interestRate: 0.035 }),
      createMockCard({ id: 'b', outstandingBalance: 5000, interestRate: 0.015 }),
    ];

    const result = comparePayoffStrategies(cards, 4000)!;
    expect(result).not.toBeNull();
    expect(result.avalanche.strategy).toBe('avalanche');
    expect(result.snowball.strategy).toBe('snowball');
  });

  it('calculates avalanche savings correctly', () => {
    const cards = [
      createMockCard({ id: 'high', outstandingBalance: 20000, interestRate: 0.035 }),
      createMockCard({ id: 'low', outstandingBalance: 5000, interestRate: 0.015 }),
    ];

    const result = comparePayoffStrategies(cards, 4000)!;
    expect(result.avalancheSavings).toBeCloseTo(
      result.snowball.totalInterest - result.avalanche.totalInterest,
      2,
    );
    expect(result.avalancheSavings).toBeGreaterThan(0);
  });

  it('shows snowball first payoff is earlier or equal', () => {
    const cards = [
      createMockCard({ id: 'high', outstandingBalance: 20000, interestRate: 0.035 }),
      createMockCard({ id: 'low', outstandingBalance: 5000, interestRate: 0.015 }),
    ];

    const result = comparePayoffStrategies(cards, 4000)!;
    expect(result.snowballFirstPayoff).toBeLessThanOrEqual(result.avalancheFirstPayoff);
  });
});

// ---------------------------------------------------------------------------
// Safety cap
// ---------------------------------------------------------------------------
describe('safety cap', () => {
  it('caps at 360 months for extremely small payments', () => {
    const card = createMockCard({
      id: 'stuck',
      outstandingBalance: 100000,
      interestRate: 0.035, // 3.5% monthly — interest alone is 3500
      minPaymentPct: 0.02,
      minPaymentFloor: 200,
    });

    // Budget barely covers minimum — interest outpaces payments
    const plan = computeAvalanchePlan([card], 2500);
    expect(plan).not.toBeNull();
    expect(plan!.totalMonths).toBe(360);
  });
});
