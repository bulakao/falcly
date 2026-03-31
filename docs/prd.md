# Falcly — Product Requirements Document

> Version: 1.3
> Date: 2026-03-31
> Status: Active

---

## 1. Overview

**One-liner:** Falcly is a credit card timing and payment intelligence app that answers one question instantly: *"Is it safe to use my card right now?"*

**Core question it answers:** "Is it safe to swipe — and can I afford the consequences?"

**What Falcly is NOT:**
- Not a budgeting app (it doesn't track categories or monthly spending)
- Not an expense tracker (it doesn't log every purchase)
- Not a bank app (it doesn't connect to bank accounts or initiate payments)
- Not a rewards optimizer (it doesn't chase points or miles)

Falcly is a **billing cycle intelligence tool** — it knows where you are in your billing cycle, what you owe, what's coming in, and tells you whether swiping today is safe or risky.

**Platform:** Android-first (85% of PH market), iOS parity at launch

**Domain:** falcly.com ✅ (acquired, ~$11/yr via Porkbun)

---

## 2. Problem Statement

### Who Has the Problem

Filipino credit card holders — estimated 13.9 million cards in force as of March 2024, growing 20%+ YoY — regularly face confusion around billing cycle timing. On r/PHCreditCards, the most frequently recurring questions are: "Is my cutoff tomorrow?", "Can I still swipe or will this hit next month's bill?", and "Which card should I use today?" These aren't asked by financially irresponsible people; they're asked by competent professionals who lack the right tool.

Secondary market: US cardholders (175M+, avg. 3.9 cards), especially the estimated 400K–700K Mint refugees who specifically wanted billing cycle tracking and found no adequate replacement after Mint shut down in March 2024.

### What the Problem Is

- **Billing cycle confusion:** Users don't know their statement close date, or know it but can't quickly calculate how many days remain
- **Swipe anxiety:** Making a purchase near statement close can spike utilization, land on an unexpected bill, or push a balance into carry territory
- **Multi-card complexity:** Users with 3+ cards across BDO, BPI, RCBC, and UnionBank have overlapping cycles with no single view
- **Unplanned debt:** Swiping without knowing the cash coverage consequences creates revolving balances at 3%/month (36% annual effective rate)
- **Installment blindness:** 0% installment promos feel "free" but represent committed monthly outflows that reduce effective available credit each cycle

### Why Existing Solutions Fail

| App | What it does | What it misses |
|-----|-------------|----------------|
| YNAB | Excellent budgeting and debt tracking | Zero billing cycle awareness — cannot answer "safe to swipe today?" |
| Monarch Money | Comprehensive budgeting (Mint replacement) | No cycle timeline, no swipe impact analysis, no PH support |
| CardPointers / MaxRewards | Rewards optimization | No payment timing intelligence whatsoever |
| Bank apps (BDO, BPI, etc.) | Shows one card's balance | No cycle-aware decision logic, no multi-card view, no net cash calculation |
| GCash / Maya | PH e-wallet and credit lines | Walled garden — cannot manage other bank cards |
| Spreadsheets | Custom tracking | Manual, fragile, no real-time math |

Not one app — globally — answers "is it safe to swipe right now?" with cycle-aware, cash-aware logic. This gap is Falcly's to own.

### Cost of the Problem

- PH revolving receivables grew **+29% YoY** (CCAP 2024), indicating increasing balance-carrying behavior
- BSP interest rate cap is **3%/month** (raised from 2% in Feb 2023) — 36% effective annual rate
- Standard minimum payment: **5% of outstanding or ₱500**, whichever is higher
- Average PH late payment fee: **₱500–₱1,500**
- One avoided late fee covers 3–10 months of Falcly Pro subscription

---

## 3. Solution

### Two-Layer Architecture

Falcly is built on two complementary layers:

**Layer 1 — Deterministic Engine (always on, offline-capable):**
Pure math. Given the same inputs, always produces the same output. Runs entirely on-device with no internet required. This is the layer users trust — it never drifts, never hallucinates, and handles financial data with the precision it deserves.

**Layer 2 — AI Augmentation (opt-in, Phase 2+):**
AI serves the engine; it never replaces it. In Phase 2, AI acts as a data extractor (reading bank SMS/notifications to reduce manual entry friction). In Phase 3, AI adds decision enhancement (contextual spend ceiling, pattern recognition, natural language queries). The rule: **AI can suggest. Only math can decide.**

### What Falcly Does That No Other App Does

1. **Billing cycle intelligence (SAFE/CAUTION/RISKY):** Instant status for each card based on days to statement, utilization, cash coverage, and proposed spend. Eight conditions evaluated in priority order — first match wins.

2. **Swipe Impact Analysis:** Enter a proposed spend amount → Falcly projects your next statement balance, net available cash, payoff timeline, and interest cost in real time. Recalculates live as you type.

3. **Net available cash calculation:** Not gross income. Not credit limit. What you can actually put toward the bill: liquid cash + income arriving before due date − committed expenses − auto-payments − subscriptions this cycle.

4. **Flexible horizon projection:** Projects as far forward as data is reliable — 6-month installment? Shows 6 months of impact. Annual fee in 4 months? Surfaces it 4 months out. No fabricated projections beyond known events.

5. **Payment intelligence (Phase 2):** Installment tracking tied to billing cycles, subscription-to-cycle mapping, payoff strategy comparison (avalanche vs. snowball vs. minimum), interest cost projections.

6. **AI as data extractor (Phase 2) and advisor (Phase 3):** Android notification listener auto-detects bank transactions; conversational queries answer "Can I buy this today?" — all grounded in the deterministic engine.

---

## 4. Personas

### Ria — The Multi-Card Filipino Professional (Primary)

Ria is 28, lives in Makati, earns ₱60K/month, and carries 3 cards: BDO for everyday spend, BPI for installment purchases, and RCBC for gasoline. She's financially competent and pays her balances in full most months — but near the end of each billing cycle she freezes up, unsure whether swiping for a work dinner will spike her utilization or land on the wrong bill. She opens r/PHCreditCards to ask "can I still swipe on my BPI today?" She knows the concept of cutoff dates but can't hold three overlapping cycles in her head simultaneously. Ria is Falcly's core user — she doesn't need budgeting, she needs a trusted one-tap answer.

**Primary JTBD:** "Tell me which card is safe to use right now, so I can swipe with confidence and not accidentally carry a balance."

### Beth — The OFW Family Manager

Beth is 42, currently based in Riyadh working as a nurse. She holds two PH-issued cards (BPI and UnionBank) and uses them for online purchases for her family back in Pampanga. Her remittance arrives mid-month; her statement closes at end of month. This timing mismatch creates anxiety — she doesn't know if she has room to swipe between remittance and statement close. She's not a power user; she wants a simple answer. Two cards, clear status, no complexity.

**Primary JTBD:** "Confirm my cards are safe to use before my remittance arrives, so I don't accidentally carry a balance that eats into what I'm sending home."

### Marcus — The US Rewards Maximizer (Year 2)

Marcus is 34, lives in Austin, earns $110K/year, and carries 6 cards — Chase Sapphire, Amex Gold, Citi Double Cash, Capital One Venture, Discover, and a store card. He maximizes rewards but tracks billing cycles in a spreadsheet. His pain: he once triggered a credit score hit because a large purchase landed right before a statement close and pushed his utilization to 78%. He wants a tool that shows him exactly where each card stands in the cycle, which one to use for a given purchase, and how to avoid utilization spikes. He'd pay $9.99/month easily.

**Primary JTBD:** "Show me which card to use for each purchase, factoring in cycle timing and utilization impact, so I maximize rewards without damaging my credit score."

---

## 5. User Stories

### Core Loop (P1)

**CL-01: Add a credit card**
As Ria, I want to add a credit card with my statement day and credit limit, so that I can see my billing cycle status immediately.
- Card form accepts: bank name, credit limit, outstanding balance, statement day, due day offset
- After saving, card appears in card list with SAFE/CAUTION/RISKY badge
- Status is calculated immediately from entered data without requiring a reload

**CL-02: See SAFE/CAUTION/RISKY status**
As Ria, I want to open the app and instantly see SAFE, CAUTION, or RISKY for each card, so that I know at a glance whether it's safe to swipe today.
- Home screen shows status for all cards within 1 second of opening
- Status is displayed with three channels: color + icon + text label (never color alone)
- Each status shows a one-line reason (e.g., "14 days to statement · 28% utilization")

**CL-03: Check Swipe Impact for a specific amount**
As Ria, I want to enter a proposed spend amount and see how it affects my next statement, so that I can decide whether to swipe or wait.
- Amount input opens numeric keyboard immediately with quick-amount chips (₱500, ₱1K, ₱2K, ₱5K)
- Status badge, projected statement balance, available cash, and payoff plan update in real time as I type
- Carried balance amount and estimated interest cost are shown if full payoff is not possible

**CL-04: See which card to use today (Best Card)**
As Ria, I want to see a "best card to use today" recommendation, so that I don't have to compare cards manually.
- Home screen shows a single best-card recommendation as the hero element
- Best card is the lowest-scoring SAFE card per the multi-card scoring algorithm (see `13-decision-logic.md`)
- If no SAFE card exists, shows lowest-scoring CAUTION card with a clear warning

**CL-05: View billing cycle timeline**
As Ria, I want to see a visual timeline of my billing cycle, so that I know exactly how far I am from statement close and due date.
- Timeline shows: cycle start → today → statement close → due date with labeled markers
- Today marker is visually prominent; statement close changes color at ≤7 days (amber) and ≤2 days (crimson)
- Multi-card Gantt view shows all cards sorted by urgency (closest statement first)

**CL-06: Update my balance**
As Ria, I want to update my outstanding balance with a single tap, so that my status stays accurate after I make purchases.
- "Update balance" action is accessible from the card detail screen and from the staleness warning
- Single numeric field; saves immediately on confirm
- Timestamps the update and clears the staleness warning

**CL-07: See data freshness warning**
As Ria, I want to see a warning when my balance data is stale, so that I don't trust a SAFE status based on outdated information.
- Inline timestamp shows "Balance updated X days ago" on each card
- At 5+ days stale: amber ⚠️ warning appears with "Tap to update" CTA
- At 10+ days stale: status badge is replaced by a staleness indicator rather than SAFE/CAUTION/RISKY

---

### Cash Awareness (P1)

**CA-01: Set liquid cash on hand**
As Ria, I want to enter how much liquid cash I have available, so that Falcly can calculate whether I can actually pay my bill.
- Cash on hand field is accessible from the profile/settings screen and prompted during onboarding
- Net available cash is recalculated immediately when the value changes
- Value is timestamped and shown as "Cash updated X days ago"

**CA-02: Set monthly income and payday**
As Ria, I want to enter my monthly income and the day it arrives, so that Falcly knows whether my income lands before my card due date.
- Profile settings accepts: monthly income (number) + payday (day of month, 1–31)
- `income_before_due_date` flag is correctly computed: true if payday ≤ due date
- Income is included in net available cash calculation only if payday precedes the due date

**CA-03: Set monthly committed expenses**
As Beth, I want to enter my total committed monthly expenses (rent, utilities, loans), so that Falcly deducts them from my available cash before projecting payoff capacity.
- Single number field for total committed monthly expenses (not itemized)
- Deducted from net available cash in all projections
- Shown as a line item in the Swipe Impact breakdown: "Committed expenses: −₱X,XXX"

**CA-04: See net available cash**
As Ria, I want to see my net available cash figure, so that I know exactly how much I can put toward my card bill.
- Net available cash is shown in the Swipe Impact screen and card detail view
- Formula: liquid cash + (income if payday before due date) − committed expenses − auto-payments − subscriptions this cycle
- Labeled clearly as "Available to pay" — not "income" or "balance"

---

### Monetization (P1)

**MO-01: Try Pro free for 14 days**
As Ria, I want to start a free 14-day Pro trial without being charged upfront, so that I can experience all Pro features before deciding to subscribe.
- Trial is presented at the card 3 paywall trigger and in the payoff planner entry point
- "Try Free for 14 Days" is the primary CTA; monthly and annual plan details shown below
- RevenueCat handles trial mechanics; payment method is required but not charged for 14 days

**MO-02: Upgrade to Pro**
As Ria, I want to upgrade to Pro after my trial, so that I can keep managing all my cards with payment planning.
- Paywall clearly shows: annual plan (₱83/mo, billed ₱999/yr) as primary CTA with "Save 44%" badge
- Monthly plan (₱149/mo) shown as secondary option
- "Less than one late payment fee" copy appears beneath the price
- RevenueCat entitlement `pro` is checked on app launch and gates Pro features

**MO-03: Add 3rd card (paywall trigger)**
As Ria, I want to be prompted to upgrade when I try to add a 3rd card, so that I understand what Pro unlocks before committing.
- Hard paywall appears when user attempts to add card #3 on Free tier
- Paywall shows feature list: unlimited cards, payment planning, installment tracking, AI alerts
- Existing 2 cards remain fully functional; user is not locked out
- Trial CTA is available on the paywall screen

---

### Notifications (P2)

**NO-01: Statement closing reminder**
As Ria, I want a push notification 7 days and 2 days before my statement closes, so that I'm careful about swiping near the cutoff.
- Notification sent at 7 days: "[Card Name] closes in 7 days. ₱X,XXX projected."
- Notification sent at 2 days: "CAUTION: [Card Name] closes in 2 days. Review before swiping."
- Timing configurable per card in notification settings (7/3/1 day options)

**NO-02: Due date reminder**
As Beth, I want a push notification before my payment due date, so that I never miss a payment.
- Notifications at 5 days and 1 day before due date
- Copy includes card name and amount due: "[Card Name] due in 5 days. ₱X,XXX to pay."
- Critical alert (iOS) for 1-day reminder is available as opt-in

**NO-03: Data staleness nudge**
As Ria, I want a notification when my balance data is more than 5 days old, so that I'm reminded to update it for accurate status.
- Single notification fired when any card balance exceeds 5 days without update
- Copy: "Your [Card Name] balance is 5 days old. Update for accurate status."
- Does not fire repeatedly; only once per staleness window

**NO-04: Upcoming subscription alert**
As Ria, I want a notification 2 days before a recurring charge hits my card, so that I'm aware of upcoming committed spend.
- Notification sent 2 days before each tracked subscription billing day
- Copy: "[Service Name] ₱X,XXX hits your [Card Name] in 2 days."
- Only fires for subscriptions the user has manually added to their tracking list

---

### Payment Planning (P2)

**PP-01: Add an installment**
As Ria, I want to add an installment plan (e.g., laptop on BPI SIP), so that Falcly factors my monthly installment commitment into my safe-to-swipe calculation.
- Installment form: name, merchant, card, total amount, monthly amount, total months, start date
- Monthly installment amount is added to projected statement balance as a committed outflow
- Installment appears in card detail view with months remaining and progress bar

**PP-02: Add a subscription**
As Ria, I want to add a recurring subscription charge (e.g., Netflix ₱619/month), so that Falcly counts it as committed spend when projecting my statement balance.
- Subscription form: name, card, amount, billing day, frequency (monthly/annual)
- Subscriptions due before statement close are included in projected statement balance
- Subscription list visible in card detail with next billing date

**PP-03: Choose a payoff strategy**
As Ria, I want to select my preferred payoff strategy (full/minimum/avalanche/snowball), so that Falcly shows me a realistic payoff plan based on how I actually pay.
- Strategy selector shows six options as horizontal pill tabs: Full, Minimum, Fixed, Aggressive, Avalanche, Snowball
- Selecting a strategy immediately recalculates payoff timeline and interest cost
- One-line tooltip explains each strategy on tap

**PP-04: See payoff timeline**
As Ria, I want to see a month-by-month payoff timeline for my card balance, so that I know exactly when I'll be debt-free and how much interest I'll pay.
- Payoff screen shows: months to clear, total interest paid, monthly payment amount
- Comparison table shows minimum vs. fixed vs. full payoff side-by-side
- Interest cost shown in amber to communicate cost of carrying

**PP-05: See interest cost if carrying balance**
As Ria, I want to see exactly how much interest I'll pay if I can't fully pay off my statement, so that I can make an informed decision before I swipe.
- Interest calculation: carried balance × monthly rate × months
- Shown inline in Swipe Impact screen: "Carried ₱X,XXX → ₱X interest (2%/mo)"
- Full payoff path shows ₱0 interest in green to contrast

---

### AI Features (P2–P3)

**AI-01: Auto-detect transaction from notification**
As Ria, I want Falcly to automatically detect bank transactions from my phone's push notifications, so that I don't have to manually update my balance after every purchase.
- Android `NotificationListenerService` listens for transactions from BDO, BPI, Metrobank, Maya, GCash
- Extracted fields (amount, merchant, card) are shown to user as a draft card before being saved
- User taps "Confirm" before any extracted data affects the SAFE/CAUTION/RISKY engine

**AI-02: Natural language status query**
As Marcus, I want to ask "Can I use my Amex for a ₱15,000 laptop today?" in plain text and get an instant answer, so that I don't have to navigate through screens to do a swipe check.
- Text input field accepts natural language queries
- Falcly parses intent, fetches relevant card data from SQLite, and responds with SAFE/CAUTION/RISKY + explanation
- Response always includes the deterministic status badge — AI provides language, math provides status

---

### Scenario Testing

Seven core scenarios the engine must handle correctly:

| # | Scenario | Expected Output |
|---|----------|----------------|
| 1 | After statement (fresh cycle, low balance) | SAFE |
| 2 | Near statement date (within 2–5 days) | CAUTION or RISKY |
| 3 | High utilization (>80%) | RISKY |
| 4 | Low cash (projected balance exceeds estimated cash) | Escalate to RISKY |
| 5 | Multi-card — pick best | Rank by utilization + days to statement |
| 6 | Installment-heavy card | CAUTION |
| 7 | Pre-statement zero balance | CAUTION (timing risk even with no balance) |

### Anti-Stories (What Users Do NOT Want)

- Manual expense tracking
- Complex financial dashboards
- Inputting every transaction
- Delayed value (setup-heavy apps)
- Generic, vague advice

**Implication:** Must feel instant, simple, and actionable. The core promise must work in under 60 seconds.

### Key Moments (When Users Open the App)

1. Before making a purchase
2. When a bill feels unexpectedly high
3. Near statement date
4. After receiving salary
5. When choosing between cards

**Implication:** App must load fast and answer immediately. Every screen earns its existence by answering one question.

> Full user stories by persona, acceptance criteria, edge cases by persona: see `15-user-stories.md`

---

## 6. MVP Scope

| P1 — Ship (Weeks 1–8) | P2 — Next (Months 3–6) | P3 — Later (Month 6+) |
|-----------------------|------------------------|----------------------|
| Manual card entry (up to 2 free, unlimited Pro) | Installment tracking | Conversational NL queries (Gemini Nano) |
| SAFE/CAUTION/RISKY status engine | Subscription/recurring charge tracking | Spending pattern recognition |
| Swipe Impact Analysis | Annual fee reminders | Cross-card reward optimization |
| Net available cash calculation | Payment planning (avalanche/snowball/full/minimum) | Statement date arbitrage advice |
| Best Card recommendation | Payoff timeline & interest cost visualizer | On-device AI (Gemini Nano / Apple Foundation Models) |
| Billing cycle Gantt timeline | Android notification listener (bank SMS/push) | US App Store expansion |
| Data freshness timestamps + staleness warnings | Gmail/email statement parsing | Household/shared card management |
| Multi-card scoring | OCR receipt / statement scanner | Bank API integration (when available in PH) |
| Free + Pro IAP via RevenueCat | Local push notifications (Notifee) | iOS widget with AI-powered status |
| 14-day free trial | Subscription auto-detection from notification history | Web companion app |
| Hard paywall at card 3 | Payoff coaching advisor | |
| Cash on hand, income, payday, committed expenses | Subscription committed spend overlay on Gantt | |
| Onboarding (3-field minimum: statement day, limit, balance) | Multi-card payoff planner view | |
| Dark mode primary + light mode | Anomaly detection (balance spike, subscription price change) | |
| PostHog analytics + Sentry crash reporting | PostHog dashboards + A/B paywall experiments | |
| Basic export (CSV) | Proactive due date + statement notifications | |

**Free tier (P1):** 2 cards, SAFE/CAUTION/RISKY, Swipe Impact, billing cycle timeline, best card recommendation, basic reminders, export.

**Pro (P1):** Unlimited cards, full multi-month timeline, cash-aware projections. Pro also unlocks all P2 features as they ship.

---

## 7. Decision Engine Spec (Summary)

> Full specification in `13-decision-logic.md`

### Input Model

**Card-level inputs:** credit limit, outstanding balance, available credit, pending transactions, statement day, due day offset, monthly interest rate, min payment %, annual fee + month, auto-pay settings, installments list, subscriptions list.

**User-level inputs:** liquid cash on hand, monthly income, payday (day of month), monthly committed expenses, payoff strategy preference, fixed payoff amount.

### Net Available Cash Formula

```
net_available_cash =
  liquid_cash_on_hand
  + (payday ≤ due_date ? monthly_income : 0)
  - monthly_committed_expenses
  - sum(auto_payments_due_before_statement)
  - sum(subscriptions_hitting_this_cycle)
```

### Projected Statement Balance Formula

```
projected_statement_balance =
  outstanding_balance
  + sum(pending_transactions)
  + sum(installments_monthly_amount)
  + sum(subscriptions_this_cycle)
  + proposed_swipe_amount         # 0 if no amount entered
  + annual_fee (if due this cycle)
```

### SAFE/CAUTION/RISKY Logic (First Match Wins)

**RISKY conditions:**
1. `net_available_cash < minimum_payment` → "You won't be able to make the minimum payment."
2. `proposed_swipe pushes projected_balance > credit_limit` → "This would exceed your credit limit."
3. `days_to_statement ≤ 2` → "Statement closes in {n} day(s) — charge will hit this bill."
4. `utilization > 0.80` → "Utilization above 80%."
5. `net_available_cash < projected_statement_balance AND strategy = full` → "You can't fully pay off the projected statement (₱{gap} short)."

**CAUTION conditions:**
6. `net_available_cash < projected_statement_balance AND strategy ≠ minimum` → "You'll carry ₱{carried} at {rate}%/mo = ₱{interest} interest."
7. `days_to_statement ≤ 7` → "{n} days to statement — charge lands on this bill."
8. `utilization > 0.50` → "Utilization at {pct}% — approaching high threshold."
9. `net_available_cash < projected_statement_balance × 1.2` → "Paying this off will leave you with less than 20% cash buffer."

**SAFE:** None of the above conditions met.

### Flexible Horizon Projection

Projects forward cycle by cycle for as long as fixed events exist:
- **Known:** Current cycle — full detail
- **Predictable:** Future cycles with known installments, subscriptions, annual fees
- **Uncertain:** Beyond last known fixed event — signal only (On Track / At Risk / Unknown)

No cycle is fabricated beyond known data. Certainty fades visually as the horizon extends.

### Multi-Card Best Card Scoring

```
score =
  utilization × 100
  + (days_to_stmt ≤ 2 ? 200 : days_to_stmt ≤ 7 ? 50 : 0)
  + (status == RISKY ? 300 : status == CAUTION ? 100 : 0)
  + (net_available_cash < projected_balance ? 150 : 0)
```

Best card = lowest-scoring SAFE card. If no SAFE card exists, show lowest-scoring CAUTION card with warning.

---

## 8. Technical Architecture

> Full specification in `16-tech-stack.md`

### Core Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Expo CNG (React Native 0.81+, New Architecture on) | No committed `ios/`/`android/` — generated by EAS Build via config plugins |
| Navigation | Expo Router v6 (file-based) | `app/` folder convention; typed routes + deep linking built-in |
| Local storage + sync | `@react-native-firebase/firestore` | LevelDB-backed offline persistence; cloud sync path built-in |
| State | Zustand v5 | UI state only (~3KB); Firestore offline cache is source of truth |
| IAP | RevenueCat v8 (`react-native-purchases`) | Handles Play Billing v5+ compliance, cross-platform entitlements |
| Notifications | @notifee/react-native v9+ | Full Android channel support, iOS critical alerts |
| Analytics | PostHog Cloud v3 (EU region) | RA 10173 friendly; 1M events/mo free |
| Crash reporting | Firebase Crashlytics | Native Android/iOS symbolication; same Firebase ecosystem |
| CI/CD | EAS Build + EAS Update | Cloud builds for iOS and Android; OTA JS updates; no Mac or Fastlane required |

### Firebase Setup (CNG)

```bash
npx expo install @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/crashlytics
```

Add to `app.json` plugins: `@react-native-firebase/app`, `@react-native-firebase/crashlytics`. Place `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) in project root — EAS Build picks them up automatically.

**Offline persistence enabled at init:**
```typescript
firestore().settings({ persistence: true, cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED });
```

### Phase 2 Additions

- Firebase Auth — enables cloud sync for Pro users (Firestore security rules gate per UID)
- Custom Kotlin `NotificationListenerService` as a **local Expo module** in `modules/sms-reader/` — config plugin automates `AndroidManifest.xml`; reads bank push notifications (BDO, BPI, Metrobank, Maya, GCash)
- TypeScript regex parser per bank — deterministic, unit-tested against real PH bank notification samples

### Phase 3 Additions

- Gemini Nano via ML Kit GenAI APIs (Android, Pixel 9+ / Samsung S25)
- Apple Foundation Models (iOS 18.1+)
- Gemini 2.0 Flash cloud fallback (opt-in only)

### Data Privacy Architecture

Firestore offline cache holds all card data locally. Cloud sync (Pro, Phase 2) syncs card config, installments, subscriptions — but **balance snapshots never leave the device** (enforced via Firestore security rules that block writes to the `/snapshots/` subcollection). Notification parse results stay on-device. Every AI feature requires explicit opt-in.

---

## 9. Design System

> Full specification in `11-branding.md` + `17-ux-patterns.md`

### Typography

| Use | Typeface |
|-----|----------|
| Headlines | DM Sans Bold |
| Body | Inter Regular |
| Numbers / amounts | JetBrains Mono |

### Colors

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Background | `#F8F9FA` | `#0A0A0A` (true black) |
| Surface | `#FFFFFF` | `#141414` / `#1C1C1C` |
| Primary text | `#0D0D0D` | `#F0F0F0` |
| Secondary text | `#4A4A4A` | `#888888` |
| Accent | `#F5A623` (falcon amber) | `#F5A623` |
| **SAFE** | `#2ECC71` (emerald) | `#2ECC71` |
| **CAUTION** | `#F39C12` (amber) | `#F39C12` |
| **RISKY** | `#E74C3C` (crimson) | `#E74C3C` |

**Dark mode is primary.** Light mode is supported but dark mode is the brand identity.

### Status Indicator Rule

SAFE/CAUTION/RISKY must always be communicated through **three simultaneous channels:**
1. **Color** (emerald / amber / crimson)
2. **Icon** (✓ checkmark / ⚠ warning triangle / ✕ stop circle)
3. **Text label** ("SAFE" / "CAUTION" / "RISKY" in DM Sans Bold)

Never color alone — 8% of males have red-green colorblindness (deuteranopia).

### Key UX Principles

- **One answer per screen:** Every primary screen has a hero status element. Detail is available on tap, never imposed.
- **Progressive disclosure:** Layer 1 (glance) → Layer 2 (tap) → Layer 3 (deep dive)
- **Confidence transparency:** Every status based on stale data shows ⚠️ + timestamp
- **Deterministic, not probabilistic:** "RISKY. Statement closes in 2 days." — never "You might want to be careful."
- **Android-first:** Material Design 3 component base, bottom navigation bar, back button Android conventions, tested on mid-range PH devices (Samsung Galaxy A series, Realme, Xiaomi)
- **Currency format:** ₱X,XXX (no decimals in compact views; minus sign not hyphen for negative)

### Onboarding Flow

**Goal:** Show value in 60 seconds — demo first, card setup second.

```
1. Splash:       "Know before you swipe." → [Get Started]
2. Card Entry:   Bank name (picker) + statement day + credit limit
3. Balance:      "What's your current balance?" (approximate is fine)
4. First Answer: Full-screen SAFE/CAUTION/RISKY — value delivered immediately
5. Enrichment:   "Add cash on hand for a more accurate picture" (skippable)
```

**Rules:**
- Paywall does NOT appear during onboarding — value moment must come first
- 3 fields minimum to get first answer (statement day + credit limit + balance)
- Everything else (due date offset, interest rate, installments, cash on hand) captured progressively

---

## 10. Monetization

> Full specification in `18-monetization.md`

### Pricing

| Plan | US | PH | Max Cards |
|------|----|----|-----------|
| Free | $0 | ₱0 | 2 |
| Pro Monthly | $4.99/mo | ₱149/mo | Unlimited |
| Pro Annual | $39.99/yr ($3.33/mo) | ₱999/yr (₱83/mo) | Unlimited |

Annual plan is the primary CTA — 44% savings in PH, 33% in US. Annual subscribers churn at ~5% vs. 15–40% for monthly.

### Feature Gating

**Free (keep generous):** 2 cards, SAFE/CAUTION/RISKY, Swipe Impact, Gantt timeline (current cycle), utilization tracker, statement + due date reminders, best card recommendation, CSV export.

**Pro (gate multi-card power features):** Unlimited cards, full multi-month timeline, payment planning (avalanche/snowball/fixed/aggressive), installment tracking, subscription tracking, annual fee reminders, cash-aware payoff projections, AI features (Phase 2+), priority notification timing.

**Critical:** Do NOT gate the core SAFE/CAUTION/RISKY logic or reminders for the 2 free cards. The core promise must work on Free. Crippling core features kills word of mouth.

### Paywall Triggers

| Trigger | Context | Type | Priority |
|---------|---------|------|----------|
| Add 3rd card | User is clearly multi-card | Hard | #1 Primary |
| After 14-day trial expiry | Time-based | Hard | #2 Always |
| Open payoff planner (Free) | Feature-gated discovery | Soft | #3 |
| 7-day engagement (daily user) | Behavioral upsell | Soft | #4 |
| After onboarding (optional) | High-intent early moment | Soft | #5 |

**Hard paywalls** (card 3, post-trial): block the action, require upgrade to continue.
**Soft paywalls** (feature discovery, behavioral): show what Pro unlocks, allow dismiss.
Paywall **never** appears on first launch or before the first card is added.

### Free Trial

14-day free trial with payment method required. RevenueCat handles mechanics across iOS and Android. On trial expiry: cards 3+ become read-only, data preserved for 90 days, soft banner prompts reactivation. The app is never bricked.

### Unit Economics

| Metric | US Pro user | PH Pro user |
|--------|------------|------------|
| Gross revenue (monthly) | $4.99 | ₱149 (~$2.62) |
| After 15% store cut | $4.24 | $2.23 |
| After RevenueCat (1%), AI, infra | ~$4.14 | ~$2.15 |
| **Net margin** | **~83%** | **~82%** |

Break-even: 1 paying PH Pro user covers all Year 1 fixed costs (~$135/yr). Revenue is near-pure profit from month 1.

---

## 11. Success Metrics

### North Star
**DAU/MAU ratio** — stickiness. Do users check Falcly daily? A high DAU/MAU means users have built the habit of checking before they swipe. Target: ≥30% DAU/MAU by Month 3.

### Leading Indicators

| Metric | Description | Target |
|--------|-------------|--------|
| Cards added per new user | Depth of engagement on first session | ≥1.5 cards |
| Status checks per session | Core habit forming | ≥2 checks/session |
| Swipe Impact uses per DAU | Key differentiating feature adoption | ≥1 use/DAU |
| Trial start rate | Paywall conversion funnel entry | ≥40% of users hitting paywall |

### Lagging Indicators

| Metric | Description | Target |
|--------|-------------|--------|
| Trial → Pro conversion | Defines monetization effectiveness | ≥25% |
| Monthly churn | Subscription health | <5% |
| MRR growth rate | Business momentum | Month-over-month positive |

### Growth Milestones

| Milestone | Target Date |
|-----------|-------------|
| 100 total users | Week 2–3 post-launch |
| 1,000 MAU | Month 3 |
| 100 Pro users | Month 3 |
| ₱93,870 MRR (PH baseline) | Month 12 |
| Combined PH + US ARR $140K | End of Year 2 |

---

## 12. Go-to-Market (Summary)

> Full strategy in `07-go-to-market.md`

### PH Launch (Phase 1)

- **Google Play first** — 85% of PH smartphone market is Android
- **r/PHCreditCards** (261K members) — provide genuine value in threads 4–6 weeks pre-launch; announce app when it solves a real thread question
- **Facebook Groups** — PH credit card and personal finance groups; OFW groups for Beth persona
- **TikTok PH finance niche** — "Why your credit card timing matters" educational content; one video/week minimum
- Zero paid ads until 10K downloads or $5K MRR

### US Expansion (Phase 3, Month 12+)

- ProductHunt launch (target Top 5 Finance, Tuesday–Thursday)
- Reddit r/CreditCards + r/personalfinance
- SEO: own "credit card billing cycle tracker" keyword
- Mint refugee outreach via r/mintuit

### ASO Keywords (PH)

Own: "credit card cutoff date tracker Philippines", "safe to swipe credit card", "billing cycle reminder app Philippines" — zero competition, high intent.

### Referral Program

"Give 1 month free, get 1 month free" — implemented via RevenueCat promo codes. Triggered after 7 days of Pro usage.

---

## 13. Timeline

| Phase | Timeline | Scope |
|-------|----------|-------|
| **Phase 1 — MVP** | Weeks 1–8 | Core loop, SAFE/CAUTION/RISKY engine, Swipe Impact, cash awareness (liquid cash, income, committed expenses), best card recommendation, Gantt timeline, Free + Pro IAP (RevenueCat), 14-day trial, hard paywall at card 3, onboarding (3-field minimum) |
| **Phase 2 — Intelligence** | Weeks 9–20 (Months 3–6) | Payment planning (avalanche/snowball/fixed/aggressive), installment tracking, subscription tracking, annual fee reminders, payoff timeline visualizer, Android notification listener (BDO/BPI/Metrobank/Maya/GCash), local push notifications (Notifee), data staleness nudges, subscription auto-detection |
| **Phase 3 — AI + US** | Month 6+ | Conversational AI (Gemini Nano on-device + cloud fallback), spending pattern recognition, cross-card reward optimization, statement date arbitrage advice, US App Store launch, ProductHunt launch |

---

## 14. Open Questions

The following decisions need resolution before or during development:

1. **iOS Minimum Version:** What's the minimum iOS version target? iOS 16 covers ~93% of active devices; iOS 17+ enables newer APIs. Decision needed before Xcode setup.

2. **Payday Edge Cases:** What happens when payday is the same day as the due date? Does income count toward net available cash? Current spec assumes `payday ≤ due_date` = income included. Need explicit handling for same-day.

3. **Currency Localization for Year 2:** When Marcus (US persona) uses the app, should the engine switch to USD defaults (e.g., 24.99% APR instead of 2%/month, CFPB minimum payment rules)? Is US support truly parity or does it need a separate ruleset?

4. **Pending Transactions:** Phase 1 spec lists "pending transactions" as a manual input. How does the UX expose this — as a separate list, or as part of the balance entry? Needs UX decision before card data model is finalized.

5. **Data Deletion Policy:** 90-day retention after Pro expiry is stated. What happens at 91 days — silent deletion or explicit warning + user confirmation? Need legal + UX alignment.

6. **NPC Registration Timing:** Philippines Data Privacy Act (RA 10173) requires NPC registration for cloud features. Phase 1 is local-only (lighter burden). Trigger for registration: when does Supabase sync go live?

7. **Annual Fee Waiver Tracking:** Should Falcly track whether an annual fee is "pending waiver request" to exclude it from projections? Or always include it until confirmed waived?

8. **Onboarding Skip Rate:** What's the acceptable drop-off rate at the "cash on hand" optional step in onboarding? If >40% skip it, consider removing it from onboarding entirely and surfacing later.

9. **RevenueCat Entitlement on First Install:** How should the app behave if RevenueCat is unavailable (offline, API error) at launch? Fail open (grant free features) or fail closed (show error)?

10. **Multi-Currency Support:** Beth (OFW) remits in SAR but her cards are PH-issued in PHP. The engine works in one currency. Is there a use case for converting SAR income to PHP for the net cash calculation? Phase 1 answer is no — but clarify for Beth's persona story.


