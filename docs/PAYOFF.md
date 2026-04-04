# PAYOFF.md — Debt Payoff Strategies Research

> **Last Updated:** 2026-04-05
> **Status:** Research complete — Avalanche + Snowball implemented (P2-02 ✅)
> **Decision:** Credit Score Optimized strategy deferred — overlays already handle utilization nudges

---

## Executive Summary

There are 7+ recognized debt payoff strategies, but only 2 are universally recommended (Avalanche, Snowball). Research shows **Snowball has higher completion rates** despite costing more in interest, because motivation matters more than math for most people.

**Falcly implements Avalanche + Snowball** (P2-02 ✅). Credit Score Optimized was considered but deferred — the Card Overlay System already nudges users toward healthier utilization per card. Overlays do the credit score guidance job without adding a separate strategy with marginal reach. If users request it post-launch, revisit.

---

## The Core Strategies

### 1. Debt Avalanche (Math-Optimal)

**How it works:**
- Pay minimums on all cards
- Put extra toward **highest interest rate** first
- When paid off, roll payment to next highest rate

**Pros:**
- Saves the most money in interest (typically $1,000–$4,000 on $25K+ debt)
- Mathematically optimal
- Faster total payoff time (usually 2–6 months faster than snowball)

**Cons:**
- Slow early progress — may take 6+ months before first payoff
- Higher dropout rate — people lose motivation
- Requires discipline and long-term thinking

**Best for:**
- Disciplined, numbers-driven people
- High interest rate spread (e.g., 22% card vs 6% loan)
- People who don't need emotional wins

**Success rate:** Lower completion rate than snowball due to motivation challenges

---

### 2. Debt Snowball (Psychology-Optimal)

**How it works:**
- Pay minimums on all cards
- Put extra toward **smallest balance** first
- When paid off, roll payment to next smallest

**Pros:**
- Quick wins — first payoff often in 2–4 months
- Higher completion rate — motivation carries people through
- Reduces number of bills faster (mental clarity)
- Dave Ramsey endorsement = widespread awareness

**Cons:**
- Costs more in interest ($1,000–$4,000 extra on $25K+ debt)
- Slower total payoff (2–6 months longer)
- Ignores interest rate differences

**Best for:**
- People who've failed debt plans before
- Multiple small debts (<$3,000 each)
- High stress / anxiety about money
- Need frequent motivation boosts

**Success rate:** Higher completion rate — research shows "quick wins" keep people engaged

**Research citation:**
> "Research indicates that the snowball method has higher completion rates than the avalanche method" — Monefy, 2025
> 
> "Tasks such as the elimination of all debts... Dividing these tasks into smaller parts and completing the parts from smallest size to largest size can help people realize quick motivational gains" — Brown & Lahey, Journal of Marketing Research, 2015

---

### 3. Debt Consolidation

**How it works:**
- Combine multiple debts into single loan
- Usually lower interest rate (6%–24% vs 20%–29% credit cards)
- Single monthly payment

**Pros:**
- Simplifies payments
- Often lowers interest rate
- Fixed payoff timeline

**Cons:**
- Requires good credit (670+) for best rates
- May extend payoff timeline
- Doesn't eliminate debt — restructures it
- Risk of accumulating new debt on cleared cards

**Best for:**
- Multiple high-interest debts
- Good credit score
- Disciplined enough not to reuse cards

**Not applicable for Falcly:** This is a lending product, not a payoff strategy we calculate.

---

### 4. Balance Transfer

**How it works:**
- Move high-interest debt to 0% intro APR card
- Pay off during promotional period (12–21 months)
- Avoid interest entirely if paid in time

**Pros:**
- 0% interest during promo
- Can save thousands
- Clear deadline = motivation

**Cons:**
- 3–5% transfer fee upfront
- Requires good credit
- High rate (20%+) kicks in after promo
- Must have discipline to pay off in time

**Best for:**
- Good credit (670+)
- Debt payable within promo period
- Disciplined payers

**Not applicable for Falcly:** This is a credit product decision, not a payoff strategy we calculate.

---

### 5. Highest Balance First

**How it works:**
- Pay minimums on all cards
- Put extra toward **largest balance** first

**Pros:**
- Removes psychological weight of big debt
- Makes overall debt feel smaller faster

**Cons:**
- Usually not optimal for interest or motivation
- Large balance may take very long to pay off
- Combines downsides of avalanche (slow wins) without interest savings

**Best for:**
- People psychologically burdened by one large debt
- Edge case — rarely recommended

**Verdict:** Not worth implementing. Avalanche and Snowball cover the use cases better.

---

### 6. Credit Score Optimized 🌟

**How it works:**
- Pay minimums on all cards
- Put extra toward cards **above 30% utilization** first
- Goal: Get all cards under 30% utilization threshold
- Once all under 30%, switch to avalanche

**Pros:**
- Fastest credit score improvement
- Visible progress (credit score updates monthly)
- Combines quick wins with eventual interest savings
- **Unique to Falcly** — no competitor does this

**Cons:**
- May not minimize total interest
- Requires tracking utilization (Falcly already does this!)

**Best for:**
- People rebuilding credit
- Planning major purchase (mortgage, car loan) soon
- Multiple cards above 30% utilization

**Why this is a Falcly differentiator:**
- We already track utilization per card
- We already flag cards above 30%, 50%, 80%
- Natural extension of existing decision engine
- No other debt payoff app combines utilization awareness with payoff planning

---

### 7. Hybrid (Snowball → Avalanche)

**How it works:**
- Start with snowball for first 1–2 debts (build momentum)
- Switch to avalanche for remaining debts (maximize savings)

**Pros:**
- Gets quick wins early
- Then optimizes for interest
- Best of both worlds

**Cons:**
- More complex to explain
- Harder to automate (when to switch?)

**Best for:**
- People who need initial motivation but can sustain discipline
- Multiple small debts + one large high-interest debt

**Implementation complexity:** Medium — need clear switching logic.

---

### 8. Due Date Priority (Reactive)

**How it works:**
- Pay the debt due soonest first
- Prevent late fees

**Pros:**
- Avoids late fees
- Simple to understand

**Cons:**
- Doesn't optimize for interest or motivation
- Reactive, not proactive
- Keeps you in debt longer

**Best for:**
- People living paycheck to paycheck
- Emergency cash flow situations

**Verdict:** This isn't a payoff strategy — it's survival mode. Not worth implementing as a "strategy."

---

## Philippines-Specific Context

### Interest Rate Cap (BSP)

- **Maximum:** 3% per month (36% annual) — mandated by BSP
- **Typical rates:** 2%–3% monthly (24%–36% annual)
- Most PH banks are at or near the cap

**Implication:** In PH, interest rate differences between cards are smaller than US, which means:
- Avalanche saves less money (smaller spread)
- Snowball's motivation advantage is relatively stronger
- Credit Score Optimized becomes more valuable (utilization matters more than rate differences)

### Common PH Card Rates (2026)

| Bank | Monthly Rate | Annual Rate |
|------|--------------|-------------|
| BDO | 2.0%–3.0% | 24%–36% |
| BPI | 2.0%–3.0% | 24%–36% |
| Metrobank | 2.0%–3.0% | 24%–36% |
| Security Bank | 2.0%–2.5% | 24%–30% |
| RCBC | 2.0%–3.0% | 24%–36% |
| UnionBank | 2.0%–2.5% | 24%–30% |

---

## Research Findings

### Completion Rates

| Strategy | Completion Rate | Source |
|----------|-----------------|--------|
| Snowball | Higher | Monefy 2025, Brown & Lahey 2015 |
| Avalanche | Lower | JMU Scholarly Commons |

> "Though the avalanche is more effective in the majority of cases, the snowball method is a very close competitor that offers debtors additional psychological benefits in motivation and habit-forming." — JMU Scholarly Commons

### Interest Savings

On $25,000–$45,000 mixed debt:
- Avalanche saves $1,000–$4,000 more than snowball
- Avalanche is 2–6 months faster
- But only if you complete it (which many don't)

### Behavioral Economics

Key insight from Brown & Lahey (Journal of Marketing Research, 2015):
> "Dividing tasks into smaller parts and completing the parts from smallest size to largest size can help people realize quick motivational gains that increase their likelihood of completing the task."

This is the "small victories" effect that powers snowball's success despite higher cost.

---

## Recommendation for Falcly

### Phase 1 (P2-02): Core Strategies

| Strategy | Priority | Rationale |
|----------|----------|-----------|
| **Avalanche** | P0 | Math-optimal, expected by users |
| **Snowball** | P0 | Psychology-optimal, higher completion |

### Phase 2: Differentiator

| Strategy | Priority | Rationale |
|----------|----------|-----------|
| **Credit Score Optimized** | ❌ Deferred | Overlays already nudge utilization per card — separate strategy has thin reach |

### Phase 3 (Optional)

| Strategy | Priority | Rationale |
|----------|----------|-----------|
| **Hybrid** | P2 | Nice-to-have, complex UX |

### NOT implementing

| Strategy | Reason |
|----------|--------|
| Highest Balance | Covered by Snowball/Avalanche, rarely optimal |
| Due Date Priority | Survival mode, not a strategy |
| Consolidation | Lending product, not calculation |
| Balance Transfer | Credit product, not calculation |

---

## UX Recommendations

### Side-by-Side Comparison

Show both avalanche and snowball simultaneously:
```
┌─────────────────────┬─────────────────────┐
│     AVALANCHE       │      SNOWBALL       │
├─────────────────────┼─────────────────────┤
│ 14 months           │ 16 months           │
│ ₱12,300 interest    │ ₱15,800 interest    │
│ Saves ₱3,500        │ First card: 3 mo    │
└─────────────────────┴─────────────────────┘
```

### Messaging

**Avalanche:**
> "Saves the most money — but requires patience. Your first card pays off in month 7."

**Snowball:**
> "Quick wins keep you motivated. Your first card pays off in just 3 months."

**Credit Score Optimized:**
> "Boost your credit score fast. All cards under 30% utilization in 4 months."

### Pro-Gating Strategy

- **Free:** Show teaser with blurred numbers + "See how fast you can be debt-free"
- **Pro:** Full access to all strategies, timeline, per-card breakdown

---

## Technical Considerations

### Inputs Required

```typescript
interface PayoffInput {
  cards: Card[];          // cards with balance, rate, min payment
  monthlyBudget: number;  // total available for all payments
}
```

### Outputs Required

```typescript
interface PayoffPlan {
  strategy: 'avalanche' | 'snowball' | 'credit_score';
  totalMonths: number;
  totalInterest: number;
  totalPaid: number;
  perCardSchedule: CardPayoffSchedule[];
  monthlySummary: MonthlySummary[];
}
```

### Algorithm Complexity

- Avalanche: O(cards × months) — simple iteration
- Snowball: O(cards × months) — simple iteration
- Credit Score: O(cards × months) — needs utilization recalc each month

All three are computationally trivial — no performance concerns.

---

## Next Steps

1. ✅ Complete this research doc
2. ✅ Implement Avalanche + Snowball (P2-02)
3. ❌ Credit Score Optimized — deferred (overlays handle utilization nudges)
4. ⏳ User testing to validate UX
5. ⏳ Consider Hybrid or Credit Score Optimized if users request post-launch

---

## Sources

1. LendingTree — Debt Avalanche vs Snowball Study (2023)
2. Monefy — How Debt Snowball vs Avalanche Actually Work (2025)
3. JMU Scholarly Commons — "A Snowball's Chance" (McAllister)
4. Brown & Lahey — "Small Victories" Journal of Marketing Research (2015)
5. Savings Grove — 7 Proven Debt Payoff Strategies (2026)
6. RCBC — Credit Card Interest Rates in the Philippines (2025)
7. BSP — Credit Card Interest Rate Cap (Circular 1098)
8. Rappler — BSP Credit Card Fees Interest Rate Cap (2023)
9. Investopedia — Debt Avalanche vs Debt Snowball (2025)
