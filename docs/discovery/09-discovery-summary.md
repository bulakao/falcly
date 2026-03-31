# Falcly — Discovery Summary

> **Date:** 2026-03-30

---

## One-Line Brief

**Falcly is the first app that answers "Is it safe to use this card right now — and can I afford the consequences?" — a question 14M+ Filipino cardholders and 175M+ US cardholders ask every month, with no good tool to answer it.**

---

## What We Know

- **Global personal finance app market:** $1.4B–$25.8B (2026, varies by scope), growing 15–25% CAGR
- **Philippines fintech market:** $1.16B (2025), growing at 16.75% CAGR → $4.66B by 2034
- **PH credit cards in force:** 13.9M (March 2024 CCAP) — 29% receivables growth YoY
- **PH Gen Z cardholders:** doubled from 9% to 22%+ of new originations (2019–2023)
- **PH BNPL users:** 28.4M by end-2024, 40% YoY jump — credit culture accelerating
- **PH consumer loan growth:** 24.1% in Feb 2025, outpacing business loans at 11.2%
- **Zero existing apps** solve billing cycle timing intelligence — globally or in PH
- **Zero existing apps** combine installment tracking + subscription tracking + payment planning + cycle intelligence in one place (confirmed across YNAB, Monarch, Copilot, CardPointers, Debt Payoff Planner, all PH apps)
- **Mint shutdown (March 2024):** displaced 3.6M users; no migration app covered billing cycles
- **Android = 85% of PH smartphones** → Google Play is primary distribution
- **YNAB/Monarch/Copilot explicitly don't track billing cycles** — confirmed by users and support docs
- **r/PHCreditCards** full of people manually tracking cutoff dates — clear pain signal
- **BSP Open Finance Framework** in sandbox phase — future bank API access possible
- **CardPointers** now $90/yr, **MaxRewards** $54–108/yr, **Kudos** free — all rewards-focused, zero timing features

---

## Current Prototype

A fully functional HTML prototype (`../index.html`) with:
- Credit card dashboard with visual card components (bank, last 4, network, color, status dot)
- "Best card to use today" recommendation with scoring algorithm
- Billing cycle Gantt chart (60-day timeline, all cards, due dates, today marker)
- Safe-to-swipe indicator (SAFE/CAUTION/RISKY with reasoning)
- Utilization tracking with 30%/50%/80% thresholds
- Key dates, balances, projections, cash awareness, rates & fees
- Data persistence via `data.json` with 2 test cards (BPI Petron ₱256K limit, UB Rewards ₱15K)
- Add/edit/remove cards with full modal form
- PH defaults (2% monthly interest, 5% min payment, ₱500 floor)

---

## Decision Logic

**Core question:** "Is it safe to use this card right now — and can I afford the consequences?"

See [13-decision-logic.md](13-decision-logic.md) for the full specification. Summary:

- **Swipe Impact Analysis:** Enter a proposed spend → Falcly projects your next statement, compares against net available cash, and shows your payoff plan with interest cost if carrying a balance.
- **Flexible Horizon:** Projects as far forward as the data is reliable — not a fixed window. 12-month installment? Shows 12 months of impact. Annual fee in 4 months? Surfaces it.
- **RISKY/CAUTION/SAFE** determined by net available cash vs. minimum payment, utilization thresholds, days to statement, and cash buffer after payoff.
- **Best Card Scoring:** Score = utilization% + days penalty + status penalty + cash coverage penalty. Lowest-scoring SAFE card wins.

---

## Market Opportunity Scores

### Global Market: 7.5 / 10

| Factor | Score | Notes |
|--------|-------|-------|
| Market size | 8/10 | $2B+ TAM, 175M+ US cardholders, 3.9 cards avg |
| Problem clarity | 9/10 | Validated pain on Reddit, forums, review sites |
| Competition | 7/10 | White space exists; indirect competitors strong but different category |
| Willingness to pay | 7/10 | $5–$15/mo validated by YNAB/Monarch/CardPointers benchmarks |
| Distribution difficulty | 6/10 | US market crowded; requires SEO/Reddit organic |
| Timing | 8/10 | Mint shutdown + Gen Z entering credit = window open |

### Philippines Market: 8.5 / 10

| Factor | Score | Notes |
|--------|-------|-------|
| Market size | 7/10 | 13.9M cards, growing fast — smaller than US but accessible |
| Problem clarity | 10/10 | Cutoff confusion endemic; r/PHCreditCards validates daily |
| Competition | 10/10 | No PH-specific competitor exists — completely open |
| Willingness to pay | 7/10 | Lower ARPU (₱149–199/mo) but large volume potential |
| Distribution difficulty | 9/10 | Android-first; TikTok/Facebook/Reddit easy organic reach |
| Timing | 9/10 | Credit card adoption accelerating + Gen Z entering market |

---

## Feature Domains

Falcly addresses two distinct but deeply connected problems:

### Domain 1: Cycle Intelligence *(Phase 1 — MVP)*
*"Is it safe to use this card right now — and can I afford the consequences?"*
- Safe-to-swipe indicator (SAFE / CAUTION / RISKY)
- Billing cycle timeline and Gantt chart
- Statement balance projection
- Days-to-statement countdown
- Utilization tracking with thresholds
- Cash-aware decision logic
- Payment timing recommendations

#### Swipe Impact Analysis *(key differentiator — no competitor has this)*
When a user checks a card, they can enter a proposed spend amount. Falcly then:
- Projects what the next statement balance will be (outstanding + pending + installments + subscriptions + proposed swipe)
- Calculates net available cash: liquid cash + income before due date - committed expenses - auto-payments - subscriptions this cycle
- Runs the user's payoff strategy against that cash figure
- Shows the result: how long to pay off, what method, and what interest it would cost if carrying a balance

**No app anywhere does this.** The user sees: "If you swipe ₱5,000, your next bill is ₱18,500. At your fixed ₱15,000/month strategy, you'll carry ₱3,500 at 2%/mo = ₱70 interest."

#### Flexible Horizon Projection *(data-driven, not a fixed window)*
Falcly projects forward as far as fixed known events exist — not a hardcoded 2-month window:
- **Known:** Current cycle — full detail
- **Predictable:** Future cycles with known fixed events (installments, subscriptions, annual fees)
- **Uncertain:** Beyond known events — signal only (On Track / At Risk / Unknown)

Annual fee due in 4 months? Surfaces it 4 months out. 12-month installment? Shows the full 12-month impact. No fabricated projections — certainty fades naturally as the horizon extends.

### Domain 2: Payment Intelligence *(Phase 2)*
*"How do I manage and pay off what I owe?"*
- **Installment tracking** — fixed monthly obligations from BDO/BPI/Metrobank/RCBC installment plans; committed against available credit
- **Subscription / recurring charge tracking** — Netflix ₱619, Spotify ₱179, iCloud, gym, insurance; tied to billing day and cycle calendar
- **Annual fee reminders** — 30-day advance notice; waiver window optimization
- **Auto-payment awareness** — committed cash outflows; net available cash = liquid cash minus all auto-pays due
- **Payment planning** — avalanche (highest rate first) and snowball (lowest balance first); payoff timeline with interest projections ("at ₱5,000/month, debt-free in 8 months, ₱3,200 in interest")
- **Cycle-committed scoring** — safe-to-swipe now accounts for upcoming subscriptions and installments, not just current balance

**Why this matters:** Expanding from Cycle Intelligence to Payment Intelligence means Falcly is no longer just a timing tool — it's the credit card command center. The addressable use case doubles: from "should I swipe?" to "how do I manage my total credit card situation?"

---

## Top 3 Opportunities

1. **Philippines first-mover:** Zero competition, endemic pain, 14M+ addressable cards, Android-first distribution. Falcly can own the PH credit card timing market before anyone else shows up. Payment Intelligence deepens retention — users who track installments and payoff plans check in daily, not just when swiping.

2. **Post-Mint vacuum (US):** 3.6M displaced users. Monarch/YNAB captured the budgeters, but nobody captured the billing cycle + payment intelligence segment. Content marketing + Reddit + ASO can capture this organically.

3. **"Cheaper than one late fee" positioning:** One prevented late fee ($25–$41 US, ₱500–₱1,500 PH) pays for months of subscription. Payment Intelligence adds a second ROI hook: *"Falcly's avalanche planner saved me ₱18,000 in interest."*

4. **Swipe Impact Analysis + Flexible Horizon = the most actionable credit card tool ever built. No competitor is close.** Every other app tells you what you owe. Falcly tells you what swiping right now will actually cost you — and exactly how to recover.

---

## Top 3 Risks

1. **Feature creep:** The temptation to add budgeting, expense tracking, or rewards optimization would dilute the core value. Falcly must stay focused on timing intelligence.

2. **Bank API dependency (future):** SMS/email parsing is a fragile data source. Long-term value requires bank API integration (BSP Open Finance when available, Plaid for US). This adds complexity but is critical for Phase 2+.

3. **Low PH ARPU:** At ₱149–199/mo, Falcly needs volume. 100K paid users at ₱199/mo = ~$346K/mo. Free tier must convert at 3–5%+.

---

## Features Roadmap

### Phase 1 — MVP (Prototype → Native App)
*Cycle Intelligence — the core timing product*
- React Native (Expo) — port prototype logic
- Manual card entry with all current fields
- Safe-to-swipe indicator per card
- Best card recommendation
- Billing cycle timeline + Gantt chart
- Utilization tracking with thresholds
- Key dates (statement, due date, countdowns)
- Cash awareness (liquid cash, income)
- Payment logging
- Push notification reminders
- Data export/import
- Free: 2 cards / Standard: 5 / Premium: 10

### Phase 2 — Payment Intelligence *(new domain)*
*Adds the "how do I pay this off?" layer — see [10-payment-intelligence.md](10-payment-intelligence.md)*
- **Installment tracker** — add BDO/BPI/Metrobank/RCBC installments by name, amount, term, months remaining
- **Subscription tracker** — recurring charges with billing day; committed spend overlay on cycle Gantt
- **Annual fee reminders** — per-card, 30-day advance notice, waiver window flagging
- **Auto-payment awareness** — type (min/full/fixed), amount, day; net cash calculation subtracts auto-pays
- **Cash-flow warnings** — "Auto-pay of ₱8,000 hits Thursday; you have ₱6,500 available"
- **Payoff calculator** — single card: minimum / fixed / full / aggressive timelines with interest projections
- **Multi-card payoff planner** — avalanche vs. snowball comparison; debt-free date; total interest paid
- **Cycle-committed safe-to-swipe** — enhanced scoring that includes installments + subscriptions due before statement date
- SMS/email statement parsing (Android first)
- Smart alerts (installment completion, subscription price changes, annual fee due)

### Phase 3 — Platform
- AI-assisted transaction detection and projected statement balance
- Workspace (household cards, shared income)
- Web companion app
- Bank API integration (BSP Open Finance / Plaid)
- Multi-currency (OFW users)

---

## Technical Stack

- **Framework:** React Native with Expo
- **Platforms:** Android (primary — 85% PH) + iOS
- **Data:** Local-first (on-device, no server-side card data for MVP)
- **AI:** Cloud NLP for SMS/email parsing (Phase 2)
- **Auth:** Email + password, biometric
- **Payments:** In-app purchase (Google Play / App Store)

---

## Key Metrics Targets

| Metric | Month 6 | Month 12 |
|--------|---------|----------|
| Downloads | 50K | 200K |
| Active users | 10K | 50K |
| Paid users | 500 | 3K |
| Conversion rate | 3–5% | 5–7% |
| Retention (Day 30) | 40% | 50% |

---

## Recommended Next Steps

1. **Build MVP** — React Native (Expo), port prototype logic, manual card entry
2. **Launch PH first** — Google Play, r/PHCreditCards, TikTok PH
3. **Validate with 1,000 PH users** — measure engagement, conversion, retention
4. **Soft-launch US** — Product Hunt, r/CreditCards, blog content
5. **Add AI features after validation** — SMS parsing, projections, smart alerts (Phase 2)
6. **Don't build:** budgeting, expense categorization, rewards optimization, or bank connections in v1

---

*This document synthesizes findings from the full Falcly discovery package (01–10). See [00-BRIEF.md](00-BRIEF.md) for the quick reference. Payment Intelligence section added 2026-03-30 — see [10-payment-intelligence.md](10-payment-intelligence.md) for full research.*
