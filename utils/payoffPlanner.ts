import type { Card } from '@/types/card';
import type { PayoffPlan, CardPayoffSchedule, MonthlySummary, PayoffComparison } from '@/types/payoff';

const MAX_MONTHS = 360;

/**
 * Compute avalanche payoff plan.
 * Avalanche: pay minimums on all cards, apply extra to highest interest rate first.
 */
export function computeAvalanchePlan(
  cards: Card[],
  monthlyBudget: number,
): PayoffPlan | null {
  return computePlan(cards, monthlyBudget, 'avalanche');
}

/**
 * Compute snowball payoff plan.
 * Snowball: pay minimums on all cards, apply extra to lowest balance first.
 */
export function computeSnowballPlan(
  cards: Card[],
  monthlyBudget: number,
): PayoffPlan | null {
  return computePlan(cards, monthlyBudget, 'snowball');
}

function computePlan(
  cards: Card[],
  monthlyBudget: number,
  strategy: 'avalanche' | 'snowball',
): PayoffPlan | null {
  // Filter to active cards with balance > 0
  const activeCards = cards.filter((c) => c.isActive && c.outstandingBalance > 0);
  if (activeCards.length === 0) return null;

  // Check if budget covers total minimum payments
  const totalMinimums = activeCards.reduce((sum, c) => {
    return sum + Math.max(c.outstandingBalance * c.minPaymentPct, c.minPaymentFloor);
  }, 0);
  if (monthlyBudget < totalMinimums) return null;

  // Sort cards by strategy
  const sorted = sortCards(activeCards, strategy);

  // Initialize tracking
  const balances: Record<string, number> = {};
  const schedules: Record<string, CardPayoffSchedule> = {};
  const paidOff: Set<string> = new Set();

  for (const card of sorted) {
    balances[card.id] = card.outstandingBalance;
    schedules[card.id] = {
      cardId: card.id,
      bankName: card.bankName,
      startingBalance: card.outstandingBalance,
      interestRate: card.interestRate,
      monthlyPayments: [],
      payoffMonth: 0,
      totalInterest: 0,
      totalPaid: 0,
    };
  }

  const monthlySummary: MonthlySummary[] = [];
  let month = 0;

  while (month < MAX_MONTHS) {
    // Check if all paid off
    if (paidOff.size === sorted.length) break;

    month++;

    const monthPayments: { cardId: string; amount: number }[] = [];
    const monthPaidOff: string[] = [];
    let budgetRemaining = monthlyBudget;

    // a. Apply interest to each card with remaining balance
    for (const card of sorted) {
      if (paidOff.has(card.id)) continue;
      const interest = balances[card.id] * card.interestRate;
      balances[card.id] += interest;
      schedules[card.id].totalInterest += interest;
    }

    // b. Pay minimum on each card
    for (const card of sorted) {
      if (paidOff.has(card.id)) continue;

      const minPayment = Math.max(
        balances[card.id] * card.minPaymentPct,
        card.minPaymentFloor,
      );
      const actualPayment = Math.min(minPayment, balances[card.id]);
      balances[card.id] -= actualPayment;
      budgetRemaining -= actualPayment;
      schedules[card.id].totalPaid += actualPayment;
      schedules[card.id].monthlyPayments.push(actualPayment);

      // Track for monthly summary (will add extra later)
      monthPayments.push({ cardId: card.id, amount: actualPayment });

      if (balances[card.id] <= 0.005) {
        balances[card.id] = 0;
        paidOff.add(card.id);
        schedules[card.id].payoffMonth = month;
        monthPaidOff.push(card.id);
      }
    }

    // c. Apply extra cash to target card(s) — re-sort for snowball each month
    const targets = strategy === 'snowball'
      ? sortCards(sorted.filter((c) => !paidOff.has(c.id)), 'snowball')
      : sorted.filter((c) => !paidOff.has(c.id));

    let extraCash = Math.max(0, budgetRemaining);

    for (const card of targets) {
      if (extraCash <= 0) break;

      const extraPayment = Math.min(extraCash, balances[card.id]);
      if (extraPayment <= 0) continue;

      balances[card.id] -= extraPayment;
      extraCash -= extraPayment;
      schedules[card.id].totalPaid += extraPayment;

      // Update the monthly payment for this card
      const paymentEntry = monthPayments.find((p) => p.cardId === card.id);
      if (paymentEntry) {
        paymentEntry.amount += extraPayment;
      }

      // Update the monthlyPayments array (add extra to last entry)
      const payments = schedules[card.id].monthlyPayments;
      payments[payments.length - 1] += extraPayment;

      if (balances[card.id] <= 0.005) {
        balances[card.id] = 0;
        if (!paidOff.has(card.id)) {
          paidOff.add(card.id);
          schedules[card.id].payoffMonth = month;
          monthPaidOff.push(card.id);
        }
      }
    }

    // Build monthly summary
    const remainingBalances = sorted.map((c) => ({
      cardId: c.id,
      balance: balances[c.id],
    }));

    monthlySummary.push({
      month,
      payments: monthPayments,
      remainingBalances,
      cardsPaidOff: monthPaidOff,
    });
  }

  // Ensure all cards have a payoff month (safety cap)
  for (const card of sorted) {
    if (schedules[card.id].payoffMonth === 0) {
      schedules[card.id].payoffMonth = MAX_MONTHS;
    }
  }

  const cardSchedules = sorted.map((c) => schedules[c.id]);
  const totalMonths = Math.max(...cardSchedules.map((s) => s.payoffMonth));
  const totalInterest = cardSchedules.reduce((sum, s) => sum + s.totalInterest, 0);
  const totalPaid = cardSchedules.reduce((sum, s) => sum + s.totalPaid, 0);

  return {
    strategy,
    cards: cardSchedules,
    totalMonths,
    totalInterest,
    totalPaid,
    monthlySummary,
  };
}

/**
 * Compare both strategies side-by-side.
 */
export function comparePayoffStrategies(
  cards: Card[],
  monthlyBudget: number,
): PayoffComparison | null {
  const avalanche = computeAvalanchePlan(cards, monthlyBudget);
  const snowball = computeSnowballPlan(cards, monthlyBudget);

  if (!avalanche || !snowball) return null;

  return {
    avalanche,
    snowball,
    avalancheSavings: snowball.totalInterest - avalanche.totalInterest,
    snowballFirstPayoff: Math.min(...snowball.cards.map((c) => c.payoffMonth)),
    avalancheFirstPayoff: Math.min(...avalanche.cards.map((c) => c.payoffMonth)),
  };
}

function sortCards(cards: Card[], strategy: 'avalanche' | 'snowball'): Card[] {
  return [...cards].sort((a, b) => {
    if (strategy === 'avalanche') {
      // Highest interest rate first
      return b.interestRate - a.interestRate;
    }
    // Lowest balance first
    return a.outstandingBalance - b.outstandingBalance;
  });
}
