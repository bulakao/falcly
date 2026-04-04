# Falcly Finance Fields — Research & Implementation Plan

> Started as a review of "Cash on Hand" terminology. Expanded to include multi-payday support.

---

## Background

Falcly has a concept called "cash on hand" (`cashOnHand` in `store/userStore.ts`) that works alongside `monthlyIncome`, `payday`, and `committedExpenses` to determine if a user can afford their minimum card payments.

The core calculation lives in `utils/decisionEngine.ts` in `computeNetAvailableCash()`:
```
fundsAvailable + (monthly income adjusted for payday timing) - committedExpenses = netAvailableCash
```

This `netAvailableCash` is compared against each card's minimum payment to determine SAFE/CAUTION/RISKY status.

---

## Problems Identified

### 1. Terminology is confusing
- **"Cash on Hand"** implies pocket/physical cash. Users don't know if they should enter their full bank balance or just what they've set aside for bills. Most Filipino users have multiple accounts — the field needs to feel inclusive of all accessible funds.
- **"Committed Monthly Expenses"** is corporate jargon. Nobody calls their rent "committed expenses."
- **"Cash on hand can't cover the minimum payment"** in the status guide inherits the confusing term.

### 2. Single payday doesn't reflect PH reality
Semi-monthly pay (e.g. 15th and 30th) is the PH standard. The current engine only supports one payday date, so it underestimates available income for most Filipino users.

---

## Decisions

### Terminology
- `Cash on Hand` → **`Funds Available`**
  - Rationale: Neutral, inclusive of all accounts, not confused with card balance or payment amount. Sets up the output label "Available to Pay" as a natural result of the engine's work.
- `Committed Monthly Expenses` → **`Fixed Monthly Expenses`**
  - Rationale: Plain English, same meaning, less jargon.
- Keep `Monthly Income`, `Payday (day of month)` — already clear.
- Internal variable rename (`cashOnHand` → `fundsAvailable`) deferred to a separate cleanup commit.

### Multi-payday
- Support up to **2 payday dates** — covers semi-monthly (PH standard) without over-engineering.
- Income split **evenly** per payday (monthly income ÷ number of paydays). No per-payday amount fields yet — covers 90% of cases.
- Second payday is **optional** — blank means single payday, backward compatible.
- Global users with one payday: no change needed, Second Payday is just left blank.

---

## Implementation Plan

### Part 1 — Multi-Payday Engine

**`utils/decisionEngine.ts`**

Update `computeNetAvailableCash` signature:
```ts
// Before
computeNetAvailableCash(
  cashOnHand: number | null,
  monthlyIncome: number | null,
  payday: number | null,
  card: Card,
  committedExpenses: number | null,
  today?: Date,
): number | null

// After
computeNetAvailableCash(
  fundsAvailable: number | null,
  monthlyIncome: number | null,
  paydays: number[],          // [] = no paydays, [15] = single, [15, 30] = semi-monthly
  card: Card,
  committedExpenses: number | null,
  today?: Date,
): number | null
```

New income logic:
```ts
if (monthlyIncome !== null && paydays.length > 0) {
  const { dueDate } = getCycleDates(card, today);
  const dueDayOfMonth = dueDate.getDate();
  const tranche = monthlyIncome / paydays.length;
  for (const pd of paydays) {
    if (pd <= dueDayOfMonth) net += tranche;
  }
}
```

Edge cases:
- Empty `paydays` → income never added (same as current null behavior)
- Single payday → `tranche = monthlyIncome` → identical to today (backward compat)
- Both paydays after due date → income not added (correct)
- Duplicate payday values → validate in UI, treat as single

**`store/userStore.ts`**

Add `payday2` field and helper:
```ts
payday2: number | null;
setPayday2: (day: number | null) => void;

// Helper — builds paydays array for engine calls
getPaydays: () => number[]
// impl: return [payday, payday2].filter((d): d is number => d !== null)
```

Update all callers of `computeNetAvailableCash` to pass `getPaydays()`.

**`db/schema/local.ts`**

```ts
payday2: integer('payday2'),  // nullable
```

**`drizzle/0005_multi_payday.sql`** (new migration)
```sql
ALTER TABLE profile ADD COLUMN payday2 INTEGER;
```

---

### Part 2 — UI Changes

**`components/molecules/FinanceCard.tsx`**

Label changes:
- `Cash on Hand` → `Funds Available`
- Caption: `Your accessible funds across all accounts — used as the starting point for payment calculations.`
- `Committed Monthly Expenses` → `Fixed Monthly Expenses`
- Caption: `Regular fixed costs (rent, utilities, subscriptions) deducted before calculating what's available.`
- Section hint: `Helps Falcly calculate if you can cover your card payments.`

Add Second Payday field below existing Payday:
```
Payday (day of month)
[ 15 ]

Second Payday  (optional)
[ 30 ]    ← placeholder "e.g. 30", blank = not set
```

Add live hint when two paydays are set:
> "Income split evenly: ₱20,000 on the 15th, ₱20,000 on the 30th"

**`app/status-guide.tsx`**

```
// Before
"Cash on hand can't cover the minimum payment"

// After
"Not enough funds available to cover the minimum payment"
```

**`components/organisms/SwipeImpactPanel.tsx`**

```
// Before
<BreakdownRow label="Cash on hand" ... />

// After
<BreakdownRow label="Funds available" ... />
```

---

### Part 3 — Ancillary

**`utils/csvExport.ts`**
- Add `payday2` to `UserProfile` interface
- Update profile CSV rows: `Cash on Hand` → `Funds Available`, `Committed Expenses` → `Fixed Expenses`
- Add `Second Payday` row (blank if not set)

**`app/(tabs)/index.tsx`** and **`app/swipe-impact.tsx`**
- Pass `getPaydays()` instead of `payday` to all `computeNetAvailableCash` calls

---

## Files Touched

| File | Change |
|------|--------|
| `utils/decisionEngine.ts` | Update `computeNetAvailableCash` signature + income loop |
| `store/userStore.ts` | Add `payday2`, `setPayday2`, `getPaydays()` |
| `db/schema/local.ts` | Add `payday2` column to profile |
| `drizzle/0005_multi_payday.sql` | New migration |
| `components/molecules/FinanceCard.tsx` | Second Payday field + all label changes |
| `components/organisms/SwipeImpactPanel.tsx` | Update `Cash on hand` → `Funds available` |
| `app/(tabs)/index.tsx` | Pass `getPaydays()` to engine callers |
| `app/swipe-impact.tsx` | Pass `getPaydays()` to engine callers |
| `app/status-guide.tsx` | Fix RISKY rule label |
| `utils/csvExport.ts` | Add payday2, update labels |

---

## What's NOT in this pass

- Per-payday income amounts (even split covers 90% of cases — revisit later)
- More than 2 paydays
- Internal variable rename (`cashOnHand` → `fundsAvailable`) — separate cleanup commit
- `netAvailableCash` / `computeNetAvailableCash` keep their names (internal only, still accurate)

---

## Estimated effort

~45–60 min. Engine change is most sensitive — needs manual test after.

---

## Why Each Field Matters — Scenarios

All scenarios use the same baseline unless noted:
> **Funds Available:** ₱5,000 | **Monthly Income:** ₱30,000 | **Fixed Expenses:** ₱15,000 | **Card due date:** 25th

---

**Scenario 1 — Payday timing changes the verdict**

> Payday: 20th. Engine: 20 ≤ 25 → income counted.
> Net = ₱5,000 + ₱30,000 - ₱15,000 = **₱20,000** → SAFE

> Same person, payday on the 28th. Engine: 28 > 25 → income NOT counted.
> Net = ₱5,000 - ₱15,000 = **-₱10,000** → RISKY

Without the payday field, the app can't tell these two people apart. Same income, same balance, completely different situation.

---

**Scenario 2 — Second payday rescues a RISKY verdict (PH standard case)**

> Paydays: 1st + 15th. Due date: 20th. Income: ₱30,000 → ₱15,000 per tranche.
> 1st ≤ 20 → +₱15,000 ✓ | 15th ≤ 20 → +₱15,000 ✓
> Net = ₱5,000 + ₱30,000 - ₱15,000 = **₱20,000** → SAFE

> Same person modeled as single payday on the 30th:
> 30 > 20 → income not counted.
> Net = ₱5,000 - ₱15,000 = **-₱10,000** → RISKY ← wrong verdict

This is the PH standard case. Single payday breaks it for most Filipino users paid semi-monthly.

---

**Scenario 3 — Fixed expenses reveal you're actually broke**

> Funds: ₱25,000. No expenses set.
> Net = ₱25,000 → SAFE (looks fine)

> Add Fixed Expenses: ₱22,000 (rent ₱15k + car loan ₱5k + utilities ₱2k)
> Net = ₱25,000 - ₱22,000 = **₱3,000**
> Minimum payment: ₱3,500 → RISKY

Without expenses, Falcly thinks you're flush. With them, it sees you're one minimum payment away from missing.

---

**Scenario 4 — All fields working together**

> Funds: ₱3,000 | Income: ₱40,000 | Paydays: 15th + 30th | Expenses: ₱18,000 | Due: 22nd
> 15th ≤ 22 → +₱20,000 ✓ | 30th > 22 → not counted ✗
> Net = ₱3,000 + ₱20,000 - ₱18,000 = **₱5,000**
> Minimum payment: ₱4,200 → CAUTION (can cover minimum, not full balance)

Each field added precision. Without any of them, the app would have seen ₱3,000 and returned RISKY — when the user is actually fine.

---

**The pattern:** each field closes a gap in the engine's picture. Remove any one and you get false verdicts — either false RISKY (scaring someone who's fine) or false SAFE (missing someone who's actually in trouble).
