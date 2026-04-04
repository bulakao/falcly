# Falcly — Decision Logic Specification

> **Date:** 2026-03-30
> **For:** Falcly — engineering and product reference

---

## Executive Summary

Falcly's core value is a single, trustworthy answer: "Is it safe to use this card right now — and can I afford the consequences?" This document defines the full input model, the two-month scope, the swipe impact calculation, and the SAFE/CAUTION/RISKY output logic.

---

## Scope: Flexible Horizon

Falcly doesn't impose a fixed time window. Instead it reasons as far forward as the data is reliable — and fades into uncertainty beyond that.

| Layer | What it covers | Detail level |
|-------|---------------|--------------|
| **Known** | Current cycle — balance, pending, installments, subscriptions hitting before statement | Full detail |
| **Predictable** | Future cycles with known fixed events — installments continuing, subscriptions recurring, annual fees due, income repeating | Known items only, no estimated spending |
| **Uncertain** | Beyond the last known fixed event — behavior varies, income may change | Signal only (On Track / At Risk) |

**The horizon is determined by the data, not a config:**
- 6-month installment? Show 6 months of installment impact.
- Annual fee in 4 months? Surface it 4 months out.
- Subscription ending in 3 months? Reflect that in month 4 projection.
- No future fixed events? Current cycle only, with a simple next-cycle outlook.

**The app shows as far forward as it has reliable data.** Certainty fades naturally — no hard cutoff, no false precision.

---

## Input Model

### Card-Level Inputs (per card)
| Input | Type | Source | Notes |
|-------|------|--------|-------|
| Credit limit | Number | Manual | Fixed |
| Outstanding balance | Number | Manual | User updates periodically |
| Available credit | Number | Manual | From bank app |
| Pending transactions | List | Manual | Items not yet posted |
| Statement day | Number | Manual | Day of month cycle closes |
| Due day offset | Number | Manual | Days after statement → due date |
| Monthly interest rate | Number | Manual | PH default: 2% |
| Min payment % | Number | Manual | PH default: 5% or ₱500 floor |
| Annual fee | Number | Manual | ₱0 if waived |
| Annual fee month | Number | Manual | Month it's charged |
| Auto-pay enabled | Boolean | Manual | |
| Auto-pay type | Enum | Manual | minimum / full / fixed amount |
| Auto-pay amount | Number | Manual | If type = fixed |
| Installments | List | Manual | See installment model below |
| Subscriptions | List | Manual | Recurring charges assigned to card |

### Installment Model (per installment)
| Field | Type |
|-------|------|
| Name / merchant | String |
| Total amount | Number |
| Monthly amount | Number |
| Total months | Number |
| Months paid | Number |
| Months remaining | Computed |
| Start date | Date |
| Card | FK → Card |

### Subscription Model (per subscription)
| Field | Type |
|-------|------|
| Name | String |
| Amount | Number |
| Billing day | Number |
| Frequency | monthly / annual |
| Card | FK → Card |

### User-Level Inputs (set once, update occasionally)
| Input | Type | Notes |
|-------|------|-------|
| Liquid cash on hand | Number | What's in your wallet/account today |
| Monthly income | Number | Expected income this month |
| Payday | Number | Day of month income arrives |
| Monthly committed expenses | Number | Rent, utilities, groceries, loans — one number, not itemized |
| Payoff strategy preference | Enum | full / minimum / fixed / aggressive / avalanche / snowball |
| Fixed payoff amount | Number | If strategy = fixed |

---

## Net Available Cash Formula

```
net_available_cash =
  liquid_cash_on_hand
  + (income_before_due_date ? monthly_income : 0)
  - monthly_committed_expenses
  - sum(auto_payments_due_before_statement)
  - sum(subscriptions_hitting_this_cycle)
```

`income_before_due_date` = true if payday falls before the card's due date.

This is the real money available to pay off the card. Not gross income. Not theoretical cash. What you can actually put toward the bill.

---

## Projected Statement Balance Formula

```
projected_statement_balance =
  outstanding_balance
  + sum(pending_transactions)
  + sum(installments_monthly_amount)          # fixed, already committed
  + sum(subscriptions_this_cycle)             # known hits
  + proposed_swipe_amount                     # 0 for general status check
```

Annual fee is added in the month it's due.

---

## Swipe Impact Analysis

When user opens the app (or enters a proposed spend amount):

1. Compute `projected_statement_balance` with proposed amount
2. Compare against `net_available_cash`
3. Compute payoff plan based on user's strategy preference
4. Output status + impact explanation

### Payoff Strategy Calculations

| Strategy | Monthly Payment |
|----------|----------------|
| Full | projected_statement_balance |
| Minimum | max(balance × min_pct, min_floor) |
| Fixed | user-defined amount |
| Aggressive | net_available_cash − safety_buffer (20% of monthly expenses) |
| Avalanche | minimums on all cards, extra toward highest interest rate |
| Snowball | minimums on all cards, extra toward lowest balance |

---

## SAFE / CAUTION / RISKY Logic

Evaluated in order — first match wins:

```
# RISKY conditions
if net_available_cash < minimum_payment:
    → RISKY: "You won't be able to make the minimum payment."

if proposed_swipe pushes projected_balance > credit_limit:
    → RISKY: "This would exceed your credit limit."

if days_to_statement <= 2:
    → RISKY: "Statement closes in {n} day(s) — charge will hit this bill."

if utilization > 0.80:
    → RISKY: "Utilization above 80%."

if net_available_cash < projected_statement_balance AND strategy = full:
    → RISKY: "You can't fully pay off the projected statement (₱{gap} short)."

# CAUTION conditions
if net_available_cash < projected_statement_balance AND strategy != minimum:
    → CAUTION: "You'll carry ₱{carried} to next month at {rate}%/mo = ₱{interest} interest."

if days_to_statement <= 7:
    → CAUTION: "{n} days to statement — charge lands on this bill."

if utilization > 0.50:
    → CAUTION: "Utilization at {pct}% — approaching high threshold."

if net_available_cash < projected_statement_balance × 1.2:
    → CAUTION: "Paying this off will leave you with less than 20% cash buffer."

# SAFE
→ SAFE: "Low utilization, plenty of time before statement, and you can pay this off."
```

---

## Output: Swipe Impact Card

When user checks a card (with or without a proposed amount):

```
[Bank Name] — [STATUS BADGE]

If you swipe ₱{amount} today:
  Next statement:    ₱{projected_balance}
  Available to pay:  ₱{net_available_cash}
  Payoff plan:       {strategy} → ₱{monthly_payment}/mo
  Carried balance:   ₱{carried} ({months} months, ₱{total_interest} interest)

[Adjust amount] [Use different card] [Update my cash]
```

If no amount entered → shows status based on current state only.

---

## Future Cycle Projections

For each future cycle where fixed events exist, project forward:

```
cycle_opening_balance =
  carried_balance_from_previous_cycle
  + sum(installments_this_cycle)       # only if still active
  + sum(subscriptions_this_cycle)      # only if still active
  + annual_fee (if due this cycle)

cycle_net_cash =
  monthly_income
  - monthly_committed_expenses
  - sum(auto_payments_this_cycle)

cycle_status = run SAFE/CAUTION/RISKY logic on above
```

Show each projected cycle as a compact timeline entry:

```
▸ Current  (Mar 15 – Apr 15)  ₱18,500 projected   [CAUTION]  ← full detail
▸ Apr 15 – May 15             ₱12,000 installments  [SAFE]    ← known items only
▸ May 15 – Jun 15             ₱12,000 installments  [SAFE]
▸ Jun 15 →                    Annual fee ₱2,050 due  [⚠ At Risk]
▸ Beyond                      [Unknown — update cash to project]
```

The timeline extends as far as fixed events exist. No cycle is fabricated beyond known data.

---

## Beyond Known Fixed Events

Once past the last predictable event, show a simple signal only:

```
[On Track]  — no known large hits coming, income covers projected minimums
[At Risk]   — known hit approaching (annual fee, new installment, subscription spike)
[Unknown]   — not enough data to project (shown when user hasn't set income/expenses)
```

No detailed numbers beyond what's known. No fabricated projections. The signal fades visually as certainty decreases — the UI communicates confidence level, not just the output.

---

## Data Freshness

User data goes stale. The app should:

1. **Timestamp every manual update** — "Balance updated 3 days ago"
2. **Show staleness warning** after 5 days: "Your balance may be outdated — tap to update"
3. **Flag when status might be wrong** due to stale data — show status with a ⚠️ indicator
4. **Phase 2:** SMS/notification listener for real-time balance updates (Android)

Trust depends on data freshness. A SAFE status on 10-day-old data is not trustworthy.

---

## Multi-Card: Best Card Algorithm

When user has multiple cards, rank by score (lower = better to use):

```
score =
  utilization × 100          # 0–100 base
  + (days_to_stmt ≤ 2 ? 200 : days_to_stmt ≤ 7 ? 50 : 0)
  + (status == RISKY ? 300 : status == CAUTION ? 100 : 0)
  + (net_available_cash < projected_balance ? 150 : 0)
```

Best card = lowest-scoring SAFE card. If no card is SAFE, show lowest-scoring CAUTION card with warning.

---

## Implementation Notes

- All calculations are **deterministic** — same inputs always produce same output
- AI/ML enhances but never overrides deterministic logic
- User-entered estimates are clearly labeled as estimates (not authoritative)
- Installments and subscriptions are the only "set and forget" inputs — everything else should be refreshed periodically
- Two-month scope keeps the model honest — no false precision beyond what the data supports
