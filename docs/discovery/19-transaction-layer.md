# 19 — Transaction Layer Discovery

> Status: Draft  
> Date: 2026-04-01  
> Scope: Cycle-aware manual transaction log + payment education layer  
> Related docs: 10-payment-intelligence.md, 13-decision-logic.md, 15-user-stories.md, 17-ux-patterns.md

---

## 1. Problem Statement

### The Core Gap

PH bank apps do not give users a real-time, cycle-organized view of their credit card transactions. The result:

- **BPI:** Transactions take days to appear in the app. Users check credit limit deduction to infer if a charge went through — there is no itemized real-time list.
- **BDO:** Shows "Pending & Unbilled" as a label but without clear cycle context. Users don't know if a pending charge hits this bill or the next.
- **Security Bank:** New app reportedly broke transaction history visibility entirely.
- **All PH banks:** No app answers the question "which bill does this purchase land on?" — it requires users to manually cross-reference the purchase date with their statement date.

### The Confusion This Creates

Three terms that PH bank apps use interchangeably (but mean different things):

| Term | What it means | When users see it |
|------|--------------|------------------|
| **Outstanding Balance** | Running total of all charges (current + past unpaid) | Always visible in app |
| **Total Balance Due** | What was on your last statement — what you owe now | Visible after statement date |
| **Unbilled/Pending** | Charges after last statement date — not yet billed | Sometimes visible, sometimes not |

Real r/PHCreditCards question (Sept 2024): *"Bakit may sobra kahit lagi akong nagbabayad in full bago mag due date?"* (Why is there still a remaining balance even though I always pay in full before the due date?)

The answer: they were paying "Outstanding Balance" (includes unbilled) when they should be paying "Total Balance Due" (last statement). The bank apps don't explain this clearly.

### Why Manual Entry Is Justified

Because bank apps are delayed, a user-entered transaction log can actually be **more accurate than the bank app** in the short term:

- User swipes at 3 PM → bank app shows nothing for 24–72 hours
- User logs it in Falcly → immediately reflected in projected balance and cycle assignment
- Falcly answers "will this land on my October or November bill?" immediately

This isn't a workaround — it's a genuine capability gap that Falcly fills.

---

## 2. What We're Building

A lightweight, cycle-aware transaction layer. **Not** an expense tracker. Not a budgeting tool. Purely for payment intelligence.

### The Core Mental Model

Every transaction a user makes belongs to exactly one of four states:

```
┌─────────────────────────────────────────────────────────┐
│  PREVIOUS CYCLE                                          │
│  Already billed. Part of your current statement.         │
│  You owe this now.                                       │
├─────────────────────────────────────────────────────────┤
│  CURRENT CYCLE  ◄── today is here                        │
│  Transactions after last statement date.                 │
│  Will appear on your NEXT bill.                          │
├─────────────────────────────────────────────────────────┤
│  NEXT CYCLE                                              │
│  Transactions after statement close date.                │
│  Won't appear until the bill after next.                 │
├─────────────────────────────────────────────────────────┤
│  EXCLUDED                                                │
│  Refunds, promos, rewards redemptions.                   │
│  Don't count toward balance.                             │
└─────────────────────────────────────────────────────────┘
```

Falcly automatically assigns every logged transaction to one of these buckets based on:
- Transaction date
- Card's statement close date
- Card's due date

The user never has to think about which bucket — they just log the amount and merchant, Falcly does the classification. But they can override it if needed.

---

## 3. Feature Specification

### 3.1 Transaction Log Entry

**What users enter (minimal):**
- Amount (required)
- Merchant / description (optional but encouraged)
- Date (defaults to today, editable)
- Card (required — which card was used)

**What Falcly auto-fills:**
- Cycle bucket (Current / Next / Previous) — based on date vs statement close date
- Impact on projected balance — immediately reflected in SAFE/CAUTION/RISKY
- "Lands on" label — "This will appear on your [Month] [Year] statement"

**What users can optionally add:**
- Is this an installment? (opens installment split flow)
- Mark as excluded (refunds, promos)
- Notes

### 3.2 Cycle Classification Logic

```
Given: transaction_date, card.statementDay, card.dueDayOffset

cycle_start = first day of current billing cycle
cycle_end = statement close date (= cycle_start + statementDay logic)
next_cycle_end = cycle_end + ~30 days

if transaction_date < cycle_start:
  → PREVIOUS CYCLE (already billed)

if cycle_start ≤ transaction_date ≤ cycle_end:
  → CURRENT CYCLE (will appear on next statement)

if transaction_date > cycle_end:
  → NEXT CYCLE (won't appear until statement after next)
```

**Edge case: same-day as statement close**
- If `transaction_date == cycle_end` → CURRENT CYCLE (conservative, same as the RISKY engine)
- Shown with amber warning: "Closes today — this charge lands on this bill"

### 3.3 Transaction Views

**View 1 — By Cycle (default)**
```
📋 BDO Everyday Mastercard

CURRENT CYCLE  (Sep 5 – Oct 5)
───────────────────────────────
Oct 2  Grab Food         ₱450
Oct 1  Watsons           ₱1,200
Sep 28 Lazada            ₱3,500
────────────────────────────
       Subtotal          ₱5,150
       + Previous unpaid ₱2,000
       Projected bill    ₱7,150 ⚠️

NEXT CYCLE  (Oct 6+)
───────────────────────────────
Oct 6  Netflix           ₱619
────────────────────────────
       Won't bill until Nov

PREVIOUS CYCLE  (Due Oct 20)
───────────────────────────────
       Statement balance ₱2,000
       Due: Oct 20, 2026
       [Pay Now]
```

**View 2 — Chronological (all transactions)**
Standard list, sortable by date. Cycle badge on each item (CURRENT / NEXT / PREV).

**View 3 — What to Pay (payment summary)**
Focused view — see section 3.4.

### 3.4 Payment Education Layer

This is the "what and when to pay" screen. Not a dashboard — a clear, actionable answer.

```
💳 What You Owe — BDO Everyday Mastercard

┌──────────────────────────────────┐
│  PAY BY OCT 20                   │
│  ₱2,000.00                       │
│  ← Your September statement      │
│                                  │
│  Pay this in full to avoid       │
│  3%/month interest               │
└──────────────────────────────────┘

COMING NEXT (Nov 5 statement)
Projected: ₱7,150
Based on ₱5,150 current cycle spend
+ ₱2,000 if unpaid from this month

  ₱5,150  Current cycle transactions
+ ₱2,000  Unpaid from previous cycle
─────────
  ₱7,150  Projected November bill

[View Transactions]  [Update Balance]
```

**Key education elements:**
- Always shows what's due NOW vs what's coming NEXT — never conflated
- Explains *why* the number is what it is (line-item breakdown)
- If carrying balance: shows interest cost explicitly (₱X at 3%/mo)
- If paid in full: shows ₱0 interest in green
- Plain language: "Pay this by [date] to avoid interest"

### 3.5 Staleness & Trust Signals

Since transactions are manually entered, trust is critical:

- Each transaction shows how it was entered: `🖊 Manual` vs (future) `📱 Auto-detected`
- "Last updated" timestamp on the transaction list
- If no transactions logged in 5+ days: soft nudge "Have you made any purchases lately? Tap to log."
- Never claims to be connected to the bank — always framed as "your log, your data"

---

## 4. User Education Flows

### 4.1 First Transaction — Teachable Moment

When a user logs their first transaction, show a one-time explainer:

```
📚 How Falcly organizes your transactions

Your credit card has a billing cycle — a start and end date.
Transactions made before the cutoff appear on your NEXT bill.
Transactions made after the cutoff appear on the bill after that.

Falcly automatically assigns each purchase to the right cycle,
so you always know what's coming and what you owe right now.

[Got it]
```

### 4.2 "Lands On" Inline Education

Every transaction entry shows:

```
₱1,200 — Watsons
Oct 1, 2026

📅 Lands on your October statement
   (closes Oct 5 · due Oct 20)
```

For transactions near statement close:
```
⚠️ Oct 4 — 1 day before cutoff
This will land on your October bill.
Consider waiting until Oct 6 to keep it off this statement.
```

### 4.3 Payment Due Notification (Phase 2)

Push notification 5 days before due date:

```
💳 BDO payment due in 5 days

Pay ₱2,000 by Oct 20 to avoid interest.
You've spent ₱5,150 so far this cycle — that hits your November bill.

[View breakdown]
```

---

## 5. What This Is NOT

To keep scope clean:

| ❌ Not building | ✅ What we're building |
|----------------|----------------------|
| Expense categories (food, transport, etc.) | Cycle bucket classification only |
| Spending analytics / charts | Payment-focused summary |
| Budget tracking | Balance projection |
| Receipt scanning | Manual amount + merchant entry |
| Bank connection / sync | Manual log + Phase 2 SMS parsing |
| Financial advice | "Here's what you owe and when" |

The north star: **every screen answers a payment question, not a spending question.**

---

## 6. How This Connects to the Existing Engine

The transaction layer feeds directly into the existing decision engine:

```
Current engine:
  projected_balance = outstanding_balance + pending + installments + subscriptions + proposed_swipe

Updated engine:
  projected_balance = outstanding_balance
                    + sum(current_cycle_transactions)   ← NEW
                    + sum(pending_unlogged)              ← existing
                    + installments_monthly
                    + subscriptions_this_cycle
                    + proposed_swipe
```

If a user has logged transactions, those become the source of truth for current-cycle spend. If they haven't logged anything, the engine falls back to the existing balance-only model (same as today).

**No breaking change** — the transaction layer is additive. Users who don't log transactions still get the full SAFE/CAUTION/RISKY experience.

---

## 7. Data Model

```typescript
interface Transaction {
  id: string;
  cardId: string;
  amount: number;                    // always positive; direction from type
  type: 'purchase' | 'payment' | 'refund' | 'fee' | 'installment_amortization';
  merchant: string;
  date: number;                      // timestamp (user-entered, defaults to now)
  cycleLabel: 'previous' | 'current' | 'next' | 'excluded'; // auto-assigned, overridable
  statementMonth: string;            // 'YYYY-MM' — which statement this belongs to
  isManual: boolean;                 // true = user entered; false = auto-detected (Phase 2)
  notes?: string;
  createdAt: number;
  updatedAt: number;
}
```

**Storage:** Same as existing card data — Firestore offline cache, local-first. Transactions sync to cloud for Pro users (same as cards).

**Indexing:** Query by `cardId + statementMonth` for cycle view. Query by `cardId + date range` for chronological view.

---

## 8. Tier Gating

| Feature | Free | Pro | Pro+ |
|---------|------|-----|------|
| Log transactions (up to 2 cards) | ✅ | ✅ | ✅ |
| Cycle auto-classification | ✅ | ✅ | ✅ |
| "Lands on" label | ✅ | ✅ | ✅ |
| Payment education screen | ✅ | ✅ | ✅ |
| Transaction history (full) | Last 30 days | Unlimited | Unlimited |
| Multi-month cycle view | Current only | ✅ | ✅ |
| Auto-detect from notifications | ❌ | ❌ | ✅ (Phase 2) |

Free tier gets the full cycle-aware transaction log for their 2 cards — this is core value, not a gated feature. History limit (30 days) nudges toward Pro without breaking core utility.

---

## 9. Phase Rollout

**Phase 1 (MVP add-on):**
- Manual transaction entry (amount, merchant, date, card)
- Auto cycle classification
- "Lands on" label per transaction
- Cycle view (grouped by current/next/previous)
- Payment summary screen ("what to pay, when")
- Integration with decision engine (logged transactions feed projected balance)

**Phase 2:**
- Android notification listener → auto-detect transactions from BDO/BPI/Metrobank push notifications
- Duplicate detection (user logs manually + auto-detect fires for same transaction)
- Transaction edit/delete

**Phase 3:**
- NL query: "What did I spend on BDO this cycle?" → AI reads transaction log and answers
- Statement reconciliation: compare logged transactions vs actual statement when it arrives

---

## 10. Open Questions

1. **How does the user know their balance is stale after logging transactions?**
   The existing balance field represents what the bank says. Logged transactions are additive on top. Do we show "bank balance + your logged transactions = Falcly's projected balance"? Or do we ask users to start from ₱0 and log everything? Needs UX decision.

2. **Payments — do we log those too?**
   If user makes a payment to BDO, do they log it? This would make the balance self-updating. Probably yes (type: 'payment') — but need to think through how payments interact with cycle math.

3. **Installment split on entry**
   When user logs "₱36,000 laptop on 0% for 12 months" — do they enter ₱36,000 once and Falcly splits it, or ₱3,000/month? The existing installment model expects monthly amounts. Need to decide if we add a "split this purchase" flow on transaction entry.

4. **Previous cycle balance source of truth**
   The "previous cycle" section shows what was on the last statement. Today this comes from the manually entered `outstandingBalance`. With transactions, should the previous cycle balance be derived from logged transactions + payments? Or always manual? Important to resolve before building the payment summary screen.

5. **Free tier history limit**
   30 days feels right for free, but if a user's billing cycle is 30 days, they might just barely see one full cycle. Consider 45 days for free (one full cycle + buffer) vs unlimited for Pro.
