# Falcly — Discovery Brief

> **"Is it safe to use my card right now?"**
> Last updated: 2026-03-30

---

## What is Falcly?

Falcly is a credit card timing and payment intelligence app — the first tool that answers *"Is it safe to use my card right now?"* with cycle-aware, cash-aware, deterministic logic. It is NOT a budgeting app, expense tracker, or rewards optimizer.

**Domain:** falcly.com — ✅ Acquired (~$11/yr, Porkbun)

---

## Current State

A fully functional HTML prototype (`index.html`) exists with: credit card dashboard, "best card to use today" recommendation with scoring algorithm, billing cycle Gantt chart, safe-to-swipe indicator (SAFE/CAUTION/RISKY), utilization tracking, cycle timeline, key dates, balances & projections, cash awareness, and card rates/fees. Data loads from `data.json` with 2 test cards (BPI Petron, UB Rewards). PH defaults baked in (₱ currency, 2% interest, ₱500 min payment floor).

---

## Decision Logic

**Core question:** "Is it safe to use this card right now — and can I afford the consequences?"

### Safe-to-Swipe (with Swipe Impact Analysis)
When user checks a card (with or without a proposed spend amount), Falcly projects:
- Projected statement balance = outstanding + pending + installments + subscriptions + proposed swipe
- Net available cash = liquid cash + income before due date - committed expenses - auto-payments - subscriptions this cycle
- Payoff plan based on user's strategy (full / minimum / fixed / aggressive / avalanche / snowball)

Output: SAFE / CAUTION / RISKY + explanation of why + what carrying a balance would cost in interest.

### Flexible Horizon (not a fixed 2-month window)
Falcly projects as far forward as the data is reliable:
- **Known:** Current cycle — full detail
- **Predictable:** Future cycles with known fixed events (installments, subscriptions, annual fees)
- **Uncertain:** Beyond known events — signal only (On Track / At Risk / Unknown)

The horizon extends naturally based on what's in the system. A 12-month installment shows 12 months of impact. An annual fee due in 4 months surfaces 4 months out. No fabricated projections.

### RISKY triggers (first match wins)
- Net available cash < minimum payment
- Proposed swipe exceeds credit limit
- Days to statement ≤ 2
- Utilization > 80%
- Net available cash < projected balance (on full-pay strategy)

### CAUTION triggers
- Will carry balance to next month
- Days to statement ≤ 7
- Utilization > 50%
- Cash buffer < 20% after payoff

### Best Card Scoring (multi-card)
Score = utilization% + days penalty + status penalty + cash coverage penalty. Lowest-scoring SAFE card wins.

---

## Discovery Documents

| # | Document | What It Covers |
|---|----------|---------------|
| 01 | [Market Research](01-market-research.md) | TAM/SAM/SOM, key regions (PH primary, US secondary), growth drivers, market timing |
| 02 | [Competitor Deep Dive](02-competitor-deep-dive.md) | CardPointers, MaxRewards, YNAB, Monarch, Copilot, Kudos, GCash/Maya, bank apps — none have billing cycle intelligence |
| 03 | [Feature Matrix](03-feature-matrix.md) | Feature-by-feature comparison — Falcly owns the entire billing cycle column |
| 04 | [Ideal Customer Profile](04-icp.md) | 5 personas: Multi-Card Filipino Pro, US Rewards Maximizer, OFW Family Manager, Gen Z First-Timer, Post-Mint Budgeter |
| 05 | [Keywords & SEO/ASO](05-keywords-seo-aso.md) | PH keywords are goldmine (zero competition). US keywords moderate competition. ASO recommendations included. |
| 06 | [Pricing Validation](06-pricing-validation.md) | Free / $9.99 Standard / $19.99 Premium. PH: ₱149–199/mo. "Cheaper than one late fee." |
| 07 | [Go-to-Market](07-go-to-market.md) | PH first (Google Play, r/PHCreditCards, TikTok), US second (Reddit, Product Hunt, SEO). 12-month timeline. |
| 08 | [Regulatory Landscape](08-regulatory-landscape.md) | No BSP license needed. NPC registration required. COPPA age gate. Light regulatory path. |
| 09 | [Discovery Summary](09-discovery-summary.md) | Opportunity scores (PH 8.5/10, Global 7.5/10), risks, roadmap, metrics, tech stack, next steps |
| 10 | [Payment Intelligence](10-payment-intelligence.md) | Installment tracking, subscription tracking, payment planning strategies, auto-payments |
| 11 | [Branding](11-branding.md) | Name rationale, domain, color system (light/dark), typography, voice & tone |
| 12 | [Financial Projections](12-financial-projections.md) | MRR/MAU scenarios PH Year 1 + US Year 2, 100-user milestone, combined ARR |
| 13 | [Decision Logic](13-decision-logic.md) | Full input model, swipe impact analysis, flexible horizon, SAFE/CAUTION/RISKY conditions, multi-card scoring |

---

## Key Numbers

| Metric | Value |
|--------|-------|
| PH credit cards in force | 13.9M (March 2024, growing 20%+ YoY) |
| PH fintech market | $1.16B (2025) → $4.66B by 2034 |
| US credit card holders | 175M+, average 3.9 cards |
| Mint shutdown displaced | 3.6M users (March 2024) |
| Direct competitors with billing cycle intelligence | 0 |
| PH Android market share | 85% |

---

## Pricing

| Plan | US | PH | Max Cards |
|------|----|----|-----------|
| Free | $0 | ₱0 | 2 |
| Pro | $4.99/mo or $39.99/yr | ₱149/mo or ₱999/yr | Unlimited |

---

## Roadmap

**Phase 1 — MVP:** React Native (Expo), manual card entry, safe-to-swipe, best card recommendation, Gantt chart, utilization, reminders, data export. Free/Standard/Premium tiers.

**Phase 2 — Payment Intelligence:** Installment tracking, subscription tracking, annual fee reminders, payment planning (avalanche/snowball/minimum/full), auto-payment awareness, cash-dependent payoff projections, SMS/email parsing, push notifications.

**Phase 3 — Platform:** Workspace (household cards), web app, bank API integration, multi-currency.

---

## Tech Stack

React Native (Expo) · Android primary (85% PH) + iOS · Local-first data · Cloud NLP for Phase 2 · Email + biometric auth · In-app purchase

---

## Bottom Line

PH market scores 8.5/10 opportunity. Zero competition in billing cycle intelligence — globally. The window is open. Build MVP, launch PH first via Google Play + r/PHCreditCards + TikTok, validate with 1,000 users, then expand to US.
