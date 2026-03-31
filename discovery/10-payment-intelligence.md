# Falcly — Payment Intelligence

> **Date:** 2026-03-30
> **For:** Falcly discovery — Phase 2 feature domain

---

## Executive Summary

Falcly's Phase 1 answers: *"Is it safe to use my card right now?"*
Payment Intelligence answers: *"How do I manage and pay off what I already owe?"*

This is a natural and high-value extension. Filipino credit card users face a uniquely complex debt landscape: installment conversions from every major bank (BDO, BPI, Metrobank, RCBC), recurring subscription charges now subject to 12% VAT, multiple annual fee schedules, and a BSP-capped revolving rate environment that still generates significant interest for minimum-payers.

**No existing app — globally or in the Philippines — combines installment tracking, subscription awareness, payment planning, and billing cycle intelligence in a single tool.** This gap is Falcly's to own.

Key findings:
- PH banks offer installment terms from 3 to 60 months; BPI 1%/month add-on is standard; RCBC offers 0% promos up to 24 months
- Revolving interest in PH is capped at 3%/month (BSP) — still punishing at 36% effective annual
- Standard minimum payment: 5% of outstanding balance or ₱500, whichever is higher
- Netflix PH is ₱619/month (post-VAT, June 2025); Spotify is ₱179/month standard
- YNAB has no installment tracking; Monarch has no payoff planner; no competitor covers PH installments
- Research shows avalanche saves the most money but snowball has higher user follow-through rates

---

## 1. Installment Tracking

### How PH Banks Handle Installment Conversions

Every major PH bank offers a mechanism to convert purchases (or outstanding balances) into fixed monthly installments. These are called different things per bank but all behave similarly: a one-time purchase is split into fixed equal monthly amounts that appear on the billing statement.

| Bank | Product Name | Terms Available | Rate | Notes |
|------|-------------|-----------------|------|-------|
| **BDO** | Purchase Convert | Variable | 0.49%–1%/month add-on | 0% at 25,000+ BNPL merchants |
| **BPI** | SIP (Store Installment Plan) Loan | 3, 6, 9, 12, 18, 24, 36 months | 1.00%/month (0.99% at 36mo); EIR ~21% p.a. | Service fee ₱300 (<₱50K) or ₱500 (>₱50K) as of April 2024 |
| **Metrobank** | Balance Conversion | 3 to 60 months | Varies | Fixed installment terms, widest range |
| **RCBC** | Unli-0% / Unli Installment | Up to 24 months | 0% at partner merchants | "Unli-0%" plan for qualified cardholders |
| **Security Bank** | Easy Pay (at select merchants) | 3, 6, 12, 24 months | 0% at partner merchants | Jan–Mar 2024 at Power Mac Center |
| **UnionBank / Citi PH** | EasyPay / Installment Plans | 3, 6, 12, 24 months | Varies by promo | Citibank PH absorbed into UnionBank |

### How 0% Installment Promos Work

Zero-percent installments are offered in two scenarios:
1. **Merchant-sponsored:** The merchant subsidizes the interest to drive purchases (common at electronics, appliance stores, Power Mac Center, Lazada/Shopee merchants).
2. **Bank-sponsored promos:** Time-limited promos offering 0% for a set number of months.

In both cases, the purchase amount is divided equally across the term. The monthly installment amount is deducted from the available credit limit and appears as a fixed line item on each billing statement.

**Example:** ₱24,000 MacBook on BPI SIP, 12 months, 0% promo:
- Monthly installment: ₱2,000/month
- Total paid: ₱24,000 (no interest)
- Impact on billing: ₱2,000 fixed charge appears for 12 billing cycles

### Installment vs. Revolving — Key Distinction

| Type | Behavior | Balance Impact |
|------|----------|---------------|
| **Revolving** | Full balance can be paid anytime; interest accrues on unpaid portion | Flexible, dangerous |
| **Installment** | Fixed monthly amount; cannot pay off early without fees in some cases | Predictable, committed |

For Falcly's safe-to-swipe logic: installment amounts are **committed monthly outflows**, not discretionary spend. A card with ₱5,000 in installment obligations per month has effectively ₱5,000 less "free" available credit each cycle.

### Data Model for Installments

```typescript
interface Installment {
  id: string;
  name: string;           // "MacBook Air M3"
  merchant: string;       // "Power Mac Center"
  cardId: string;         // linked card
  totalAmount: number;    // ₱72,000
  monthlyAmount: number;  // ₱3,000
  termMonths: number;     // 24
  monthsPaid: number;     // 6
  monthsRemaining: number; // 18 (computed: termMonths - monthsPaid)
  startDate: Date;        // 2025-09-01
  interestRate: number;   // 0 (for 0% promo) or add-on rate
  isPromo: boolean;       // true
  notes?: string;
}
```

### Competitor Gap Analysis — Installment Tracking

| App | Installment Tracking | Notes |
|-----|---------------------|-------|
| **YNAB** | ❌ Manual workaround only | Users create a budget category and manually split; no auto-tracking |
| **Monarch** | ❌ None | Treats installments as standard transactions |
| **Copilot** | ❌ None | No installment-specific feature |
| **Simplifi** | ❌ None | No installment-specific feature |
| **CardPointers** | ❌ None | Rewards-focused; no installment awareness |
| **BDO/BPI/Bank apps** | ⚠️ Partial | Shows current installment balance, not tracking/planning interface |
| **Any PH-specific app** | ❌ None found | No dedicated installment tracker for PH banks |
| **Falcly (planned)** | ✅ | Full tracking: name, merchant, amount, months remaining, impact on available credit |

**Gap:** No app in any market (PH or global) provides a structured installment tracker tied to billing cycle logic. Falcly would be first.

### UX Patterns for Installment Tracking

- **Card view:** Show installment badge on card thumbnail ("3 active installments")
- **Installment list:** Expandable section per card, sorted by months remaining
- **Progress bar:** Visual 6/24 months paid indicator
- **Cycle impact:** Show monthly committed installment amount subtracted from available credit in the safe-to-swipe calculation
- **Completion alert:** "Your Samsung TV installment ends in 2 months — ₱3,500 frees up!"

---

## 2. Upcoming Payments & Subscriptions

### Common Recurring Charges — Filipino Credit Card Users

| Service | Monthly Price (₱) | Frequency | Notes |
|---------|------------------|-----------|-------|
| **Netflix Standard with ads** | ₱249 | Monthly | Post-VAT June 2025 |
| **Netflix Standard** | ₱399 | Monthly | Post-VAT June 2025 |
| **Netflix Premium** | ₱619 | Monthly | Post-VAT, up from ₱549 |
| **Spotify Premium (Individual)** | ₱179 | Monthly | Standard rate |
| **Apple iCloud 50GB** | ₱49 | Monthly | |
| **Apple iCloud 200GB** | ₱149 | Monthly | |
| **Google One 100GB** | ₱99 | Monthly | |
| **YouTube Premium** | ₱189 | Monthly | VAT-inclusive |
| **Adobe Creative Cloud** | ₱1,089–₱3,599 | Monthly | Varies by plan |
| **Canva Pro** | ₱499 | Monthly | |
| **Microsoft 365 Personal** | ₱299 | Monthly | |
| **Gym memberships** | ₱800–₱2,500 | Monthly | Varies by gym |
| **Car insurance premium** | ₱1,500–₱4,000 | Monthly | If spread monthly |
| **Life insurance** | ₱500–₱3,000 | Monthly | Common for young professionals |
| **PhilHealth / Pag-IBIG** | Variable | Monthly | Usually salary-deducted but some pay via card |

*Note: 12% VAT applied to foreign digital services beginning October 2024 (RA signed by Marcos). Netflix, YouTube, Spotify all affected starting June 2025.*

### Annual Fee Landscape

| Bank / Card Type | Annual Fee (₱) | Waivable? | Waiver Conditions |
|-----------------|---------------|-----------|------------------|
| **BPI Classic** | ₱2,050 | ✅ Yes | Call and request; good standing |
| **BPI Gold/Premium** | ₱3,500–₱5,000 | ⚠️ Sometimes | Depends on usage volume |
| **BDO Classic** | ₱1,200–₱1,500 | ✅ Yes | Call CSR; 30–45 day processing |
| **Metrobank Classic** | ₱2,000 | ⚠️ Harder | Requires spend threshold |
| **RCBC** | ₱1,500–₱3,000 | ⚠️ Sometimes | Varies by card tier |
| **UnionBank (ex-Citi)** | ₱2,500 | ⚠️ Inconsistent | Was easier when Citi; harder post-merger |
| **Security Bank Classic** | ₱1,500–₱2,000 | ✅ Yes | Generally waivable |

Annual fees are a high-signal pain point in r/PHCreditCards — users frequently ask how to waive, forget to call in time, and end up paying. Tracking and reminders here are high-value.

### Recurring Charge Data Model

```typescript
interface RecurringCharge {
  id: string;
  name: string;         // "Netflix Premium"
  cardId: string;       // linked card
  amount: number;       // ₱619
  frequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  billingDay: number;   // day of month (e.g., 15)
  category: string;     // "Streaming" / "Insurance" / "Gym" / etc.
  isActive: boolean;
  lastCharged?: Date;
  nextExpected?: Date;  // computed from billingDay + frequency
  notes?: string;
}
```

### How Upcoming Payments Affect Safe-to-Swipe

The safe-to-swipe indicator must be forward-looking, not just current-state. Example:

> Card balance: ₱8,000 | Credit limit: ₱20,000 | Utilization: 40% → Status: CAUTION
> But: Netflix ₱619 + Spotify ₱179 + gym ₱1,200 all hit in the next 3 days
> Adjusted committed spend this cycle: +₱1,998
> Revised projected balance: ₱9,998 → Utilization: 50% → Status still CAUTION but tighter

**Logic change:** The safe-to-swipe algorithm should project "committed spend this cycle" by summing subscriptions due before next statement date, adding to current balance before scoring.

### UX Patterns

- **Calendar view:** Monthly grid showing each recurring charge on its billing day, color-coded by category
- **Running total widget:** "₱2,450 committed spend remaining this cycle" (subscriptions not yet charged)
- **Cycle overlay:** Subscriptions shown as markers on the billing cycle Gantt chart
- **Annual fee flag:** Yellow badge on card thumbnail 30 days before annual fee due
- **"This week" list:** All charges hitting in the next 7 days across all cards, sorted chronologically

---

## 3. Payment Planning

### Connection to Swipe Impact Analysis

Payment planning isn't a separate screen — it's the output of every swipe check. When a user asks "can I use my card?", Falcly simultaneously:
1. Checks cycle timing (existing logic)
2. Projects the statement balance including the proposed swipe
3. Runs the payoff plan against net available cash
4. Shows the result inline: "If you swipe ₱5,000, your next bill is ₱18,500. At your current payoff strategy (fixed ₱15,000/mo), you'll carry ₱3,500 at 2%/mo = ₱70 interest."

This makes payment planning ambient — it happens automatically on every check, not just when the user visits a "payoff" screen.

### PH Regulatory Context

- **BSP revolving interest cap:** 3% per month (raised from 2% in Feb 2023)
- **Effective annual rate:** ~36% (if revolving full balance monthly)
- **Standard minimum payment:** 5% of outstanding balance **or** ₱500, whichever is higher
- **Delinquency threshold:** Missing minimum for 2 consecutive billing cycles (60 days) per BSP/CCAP
- **Late payment fee:** ₱500–₱1,000 typical across PH banks

### Payment Strategies Supported

| Strategy | Description | Best For | Interest Cost |
|----------|-------------|----------|--------------|
| **Minimum only** | Pay 5% or ₱500, whichever is higher | Emergency cash flow constraint | Highest — can take years to clear |
| **Fixed amount** | User sets a target (e.g., ₱5,000/month) | Predictable budgeting | Medium |
| **Full balance** | Pay entire statement balance each cycle | Ideal; no interest | Zero |
| **Aggressive** | Cash on hand minus essentials | Maximize debt reduction | Low |
| **Avalanche** | Minimums on all cards, extra on highest-rate card | Mathematically optimal | Lowest total |
| **Snowball** | Minimums on all cards, extra on lowest balance card | Behavioral — wins early | Slightly higher than avalanche |

### PH User Behavior — What Data Suggests

Direct BSP survey data on minimum-only payment rates for Filipino cardholders is not publicly granular, but contextual signals suggest:

- **High minimum-payment prevalence:** PH revolving receivables grew 29% YoY (CCAP 2024) — indicates more balance-carrying, not paydown
- **3% monthly interest cap** was raised from 2% in early 2023, signaling banks lobbied for it due to high revolving balances
- **Gen Z cardholders** (now 22%+ of new originations) are more likely to only pay minimum due to tighter cash flow
- **US CFPB data (2023)** found ~35% of US cardholders revolve (don't pay full balance) — PH rate is likely higher given lower average income-to-credit-limit ratios
- **r/PHCreditCards anecdotal signal:** Many posts are about "safe to swipe" and installment promos, but also about "how do I clear my balance?" — indicating active planning interest

**Implication for Falcly:** Many users are minimum-payers who want to do better. The payoff planner should meet them where they are (minimum payment) and clearly show them the path to doing better.

### How Competitors Handle Payoff Planning

| App | Payoff Planning | Avalanche | Snowball | PH Support |
|-----|----------------|-----------|----------|------------|
| **YNAB** | ⚠️ Loan calculator only | ❌ Manual | ❌ Manual | ❌ |
| **Monarch Money** | ❌ Debt tracked as net worth, no planner | ❌ | ❌ | ❌ |
| **Copilot** | ❌ None | ❌ | ❌ | ❌ |
| **EveryDollar** | ✅ Ramsey snowball approach | ❌ | ✅ | ❌ |
| **Debt Payoff Planner (app)** | ✅ Dedicated | ✅ | ✅ | ❌ |
| **undebt.it (web)** | ✅ Free web tool | ✅ Avalanche + Snowball + custom | ✅ | ❌ |
| **Falcly (planned)** | ✅ | ✅ | ✅ | ✅ |

**Research insight:** Studies on debt payoff adherence (including work by Amar, Ariely et al.) show **snowball (lowest balance first) has higher user follow-through** than avalanche despite costing more in total interest. The psychological "win" from clearing a card entirely keeps users engaged. Falcly should offer both strategies and clearly explain the tradeoff.

### Payoff Timeline Presentation

Show users a clear, specific projection — not vague advice:

> **Card:** BPI Petron | Balance: ₱32,000 | Rate: 3%/month
>
> | Strategy | Monthly Payment | Months to Clear | Total Interest |
> |----------|----------------|-----------------|---------------|
> | Minimum only | ₱1,600 → decreases | 58 months | ₱27,400 |
> | ₱3,000/month fixed | ₱3,000 | 14 months | ₱9,800 |
> | ₱5,000/month | ₱5,000 | 8 months | ₱5,200 |
> | Full balance | ₱32,000 | 1 month | ₱0 |

For multi-card users, show the Avalanche vs. Snowball comparison:

> You have 3 cards with a combined balance of ₱85,000.
> Extra cash available after minimums: ₱4,000/month
>
> **Avalanche:** Debt-free in 22 months | Save ₱11,200 in interest
> **Snowball:** Debt-free in 24 months | Save ₱9,500 in interest (clear BDO card in 5 months for a quick win)

---

## 4. Auto-Payments

### What to Track

```typescript
interface AutoPayment {
  cardId: string;
  enabled: boolean;
  type: 'minimum' | 'full' | 'fixed';
  fixedAmount?: number;   // only if type === 'fixed'
  dayOfMonth: number;     // when the auto-debit runs (e.g., 3 days after due date)
  bankAccountLinked?: string; // source account nickname
  notes?: string;
}
```

### How Auto-Pay Affects Cash Flow Model

When a card has auto-pay enabled, that payment amount is a **committed cash outflow** on a specific day. This directly impacts the cash-aware logic.

**Net available cash formula:**
```
netCash = liquidCashOnHand - sum(all active auto-pay amounts)
```

This net cash figure — not raw liquid cash — should be the input to the safe-to-swipe logic.

**Example:**
- Liquid cash: ₱15,000
- Auto-pay Card 1 (full balance): ₱8,000 (due in 4 days)
- Auto-pay Card 2 (minimum): ₱1,200 (due in 6 days)
- Net available cash: ₱15,000 - ₱8,000 - ₱1,200 = **₱5,800**

The safe-to-swipe indicator should use ₱5,800, not ₱15,000.

### Warning Logic

Auto-pay warnings should fire proactively, not just when cash is already too low:

| Scenario | Warning |
|----------|---------|
| Auto-pay in ≤3 days, cash < auto-pay amount | 🔴 **Critical:** "Auto-pay of ₱8,000 for BPI is due in 2 days — your balance is ₱6,500. You may be short." |
| Auto-pay in ≤3 days, cash ≥ auto-pay but tight | 🟡 **Caution:** "Auto-pay of ₱8,000 hits Thursday — swipe carefully today." |
| Auto-pay week is approaching | 🔵 **Info:** "3 auto-payments totaling ₱12,400 due this week." |
| Card set to minimum-only auto-pay | 🔵 **Nudge:** "BDO set to minimum auto-pay. Paying ₱3,000 instead saves ₱8,200 in interest over 14 months." |

---

## 5. Competitive Gap Analysis

### Does Any App Combine All of This?

| Feature | YNAB | Monarch | Copilot | CardPointers | Debt Payoff Planner | Any PH App | **Falcly** |
|---------|------|---------|---------|-------------|--------------------|-----------|----|
| Billing cycle intelligence | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Installment tracking | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Subscription / recurring tracking | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Annual fee reminders | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Payment strategy (avalanche/snowball) | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Auto-payment awareness | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Cash-dependent planning | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| PH bank support | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ✅ |

**No app combines more than 2–3 of these.** The closest is YNAB + Debt Payoff Planner used simultaneously — two subscriptions, two apps, manual sync, no PH context.

### The Gap Falcly Can Own

**The unified payment intelligence gap:**

1. **Cycle-aware payment planning:** Falcly already knows your statement date, due date, and cycle position. That context makes payment planning *smarter* — e.g., "Pay ₱5,000 now (6 days before statement) so it doesn't appear in next month's balance."

2. **Installment intelligence:** No app anywhere tracks PH bank installment plans tied to billing cycle math. Falcly can show "you have ₱8,500 in committed installments this cycle" as part of the safe-to-swipe score.

3. **Cash-first planning:** All Western apps assume bank connectivity (Plaid). Falcly is designed for manual entry and cash awareness from Day 1 — which is exactly right for PH, where bank APIs are unavailable and users track cash manually.

4. **The "how do I get out of this?" moment:** A user who just swiped ₱30,000 at a 3%/month rate needs to immediately see payoff scenarios. No app provides this within the cycle timing context. Falcly can.

---

## Actionable Recommendations for Falcly

### Phase 2 — Payment Intelligence Buildout

**P0 — Must Have**
- [ ] Installment tracker: add/edit/delete installments; show committed monthly amount per card
- [ ] Monthly installment impact in safe-to-swipe score (committed outflow, not discretionary)
- [ ] Subscription/recurring tracker: add recurring charges with billing day and amount
- [ ] Upcoming payments view: list of all charges in next 7/14/30 days across all cards
- [ ] Auto-pay configuration per card with cash warning logic

**P1 — High Value**
- [ ] Annual fee calendar and 30-day reminder
- [ ] Payoff calculator: single card view with timeline at different payment amounts
- [ ] Multi-card payoff planner: avalanche vs. snowball comparison
- [ ] Cycle commitment total: "₱3,450 committed this cycle before discretionary spend"
- [ ] Subscription committed spend overlay on billing cycle Gantt chart

**P2 — Nice to Have**
- [ ] Subscription price change detection (e.g., Netflix VAT increase alerts)
- [ ] "Free up" alerts when installments complete
- [ ] Payoff sharing: exportable PDF for debt coaching conversations
- [ ] AI-suggested strategy: "Based on your spending, avalanche saves you ₱11K — here's the plan"

### Suggested Safe-to-Swipe Algorithm Enhancement

```
committedThisCycle = sum(installments) + sum(subscriptions due before statement date)
effectiveBalance = currentBalance + committedThisCycle
adjustedUtilization = effectiveBalance / creditLimit

if cashPosition < (effectiveBalance + autoPaysDueInDays(7)) → RISKY
if adjustedUtilization > 60% → RISKY
if daysToStatement <= 2 → RISKY
if adjustedUtilization > 30% OR daysToStatement <= 7 → CAUTION
else → SAFE
```

This is a meaningful upgrade from Phase 1 — the safe-to-swipe is now "cycle-committed" aware, not just current balance aware.

---

*Sources: BDO installment page, BPI SIP Loan rates page (April 2024 fee update), Metrobank balance conversion page, RCBC credit card page, moneymax.ph, pinoymoneytalk.com, rcbccredit.com, BSP Circular 2023, CCAP payments guide, gameops.net (Netflix VAT pricing), Spotify PH pricing page, Investopedia debt payoff planners (March 2026), credilinea.co budgeting app comparison (February 2026), undebt.it.*
