# Falcly — Discovery Brief

> **"Is it safe to use my card right now?"**
> Last updated: 2026-04-05

---

## What is Falcly?

Falcly is a credit card billing cycle intelligence app — the first tool that answers *"Is it safe to use my card right now?"* with cycle-aware, cash-aware, deterministic logic. It is NOT a budgeting app, expense tracker, or rewards optimizer.

**Domain:** falcly.com — ✅ Acquired (~$11/yr, Porkbun)

---

## Current State (April 2026)

### Implementation Status
- **Stories:** 97/99 passing
- **Tests:** 89 passing (decision engine + statement advisor + payoff planner)
- **Platform:** React Native (Expo CNG), Android-first, iOS parity
- **Stack:** SQLite + Drizzle (local-first), Supabase Auth, RevenueCat, Zustand

### What's Built
| Feature | Status |
|---------|--------|
| Core decision engine (SAFE/CAUTION/RISKY) | ✅ Complete |
| Swipe impact analysis | ✅ Complete |
| Multi-card management | ✅ Complete |
| Cash flow awareness (multi-payday) | ✅ Complete |
| Transaction logging | ✅ Complete |
| Cloud sync (Supabase) | ✅ Complete |
| Statement Advisor | ✅ Complete |
| Card Overlay System | ✅ Complete |
| Onboarding flow | ✅ Complete |
| RevenueCat IAP integration | ✅ Complete |
| Payoff Planner (Avalanche + Snowball) | ✅ Complete |
| Accessibility | ✅ Audited |

### Parked (Phase 2)
| Story | Description | Notes |
|-------|-------------|-------|
| P2-01 | SMS listener (auto-detect transactions) | Requires Kotlin native module |
| P2-03 | NL queries (AI advisor) | Gemini API — Phase 3 |

---

## Decision Logic

**Core question:** "Is it safe to use this card right now — and can I afford the consequences?"

### SAFE/CAUTION/RISKY Engine
8 conditions evaluated in priority order (first match wins):

**RISKY triggers:**
1. Net available cash < minimum payment
2. Proposed swipe exceeds credit limit
3. Days to statement ≤ 2
4. Utilization > 80%

**CAUTION triggers:**
5. Will carry balance to next month (strategy != minimum)
6. Days to statement ≤ 7
7. Utilization > 50%

**SAFE:**
8. All else

### Swipe Impact Analysis
Real-time projection when user enters an amount:
- Projected statement balance
- Net available cash (payday-aware)
- Minimum payment
- Carried balance + interest if applicable

### Best Card Scoring
Score = utilization% + days penalty + status penalty. Lowest-scoring SAFE card wins.

---

## Features

### Statement Advisor (SD-01 through SD-07)
- **Spread Score:** 0–100 rating of card portfolio timing
- **Gap Analysis:** Dead zones (14+ days with no reset)
- **Clustering Detection:** Cards too close together
- **Payday Alignment:** Cards should close 2–5 days after payday
- **Timeline Visualization:** 30-day view with all cards marked
- **In-App Wiki:** W-01 through W-13 educational cards

### Card Overlay System
- Dismissible overlays on card face
- 7 content types: alert, advisory, tip, statement, wiki, promo, affiliate
- Priority queue (alerts highest, affiliates lowest)
- Contextual triggers (e.g., show W-04 when swiping close to statement)
- Free tier: overlays always on (monetization surface)
- Pro tier: full control

### Cloud Sync (SC-01 through SC-07)
- Upload on sign-in
- Restore on reinstall
- Merge prompt on conflict
- Guest data warning banner

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

## Pricing (Implemented)

| Plan | Monthly | Annual | Cards | Overlays |
|------|---------|--------|-------|----------|
| Free | $0 | $0 | 2 | Always on |
| Pro | $4.99 | $39.99 | Unlimited | Configurable |
| Pro+ | $9.99 | $79.99 | Unlimited + Priority | Full control |

---

## Target Users

### Primary: Multi-Card Filipino Professional
- 2–4 credit cards
- Semi-monthly pay (15th & 30th)
- Responsible but occasionally surprised by statements
- Uses GCash/Maya but no billing cycle tools

### Secondary: Post-Mint US User
- Displaced by Mint shutdown (March 2024)
- Wants simple tool, not full budgeting suite
- 3.9 cards average

### Tertiary: First-Time Credit Card User
- Just got their first card
- Needs education on billing cycles
- In-app wiki serves this persona

---

## Market Position

**What Falcly is:**
- Billing cycle intelligence
- "Safe to swipe" signal
- Cash flow timing
- Statement date optimizer

**What Falcly is NOT:**
- Budgeting app (not YNAB)
- Expense tracker (not Mint)
- Rewards optimizer (not CardPointers)
- Bank aggregator (no account linking)

**Differentiator:** No competitor has billing cycle intelligence. They all optimize rewards or track spending. Falcly is the only app that tells you *which card to use today* based on where you are in your billing cycle.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo CNG (React Native 0.81+, New Architecture) |
| Language | TypeScript (strict) |
| State | Zustand (persisted via AsyncStorage + Drizzle) |
| Database | expo-sqlite + Drizzle ORM |
| Auth | Supabase Auth + Google Sign-In |
| Testing | Jest + ts-jest |
| Analytics | (parked — PostHog) |
| Payments | RevenueCat (integrated ✅) |

---

## Roadmap

### Phase 1 ✅ COMPLETE
Core loop, decision engine, multi-card, transactions, sync, statement advisor, overlays, RevenueCat IAP, payoff planner (avalanche + snowball).

**Credit Score Optimized** payoff strategy evaluated and deferred — Card Overlays already nudge utilization per card. Revisit post-launch if users request it.

### Phase 2 (Next)
- Launch to Google Play (PH)
- Set up products in Play Console + RevenueCat dashboard
- User feedback collection

### Phase 3 (Future)
- P2-01: SMS listener (Android)
- P2-03: AI advisor (Gemini)
- iOS App Store launch
- US market expansion

---

## Discovery Summary

### Opportunity Score: 8.5/10 (PH)

| Factor | Score | Notes |
|--------|-------|-------|
| Market Size | 7 | 13.9M cards, growing 20% YoY |
| Problem Clarity | 9 | "Which card?" is universal |
| Competition | 10 | Zero direct competitors |
| WTP Signal | 7 | "Cheaper than one late fee" resonates |
| Distribution | 8 | Reddit, TikTok, ASO — no gatekeepers |
| Timing | 9 | Post-Mint, fintech boom, card growth |

### Top 3 Opportunities
1. **PH first-mover:** No billing cycle tool exists for Filipino market
2. **Mint refugees:** 3.6M displaced users seeking alternatives
3. **Card overlay monetization:** Educational content + affiliates = revenue without subscriptions

### Top 3 Risks
1. **RevenueCat integration:** Can't monetize until real payments work
2. **User acquisition:** Need to prove organic growth before paid
3. **Retention:** Daily utility required to justify subscription

### Recommended Next Steps
1. ✅ Complete Phase 1 (done)
2. ✅ Integrate RevenueCat (PK-01 done)
3. ✅ Payoff Planner — Avalanche + Snowball (P2-02 done)
4. ⏳ Set up products in Play Console + RevenueCat dashboard
5. ⏳ Launch to Google Play (PH)
6. ⏳ Collect user feedback, iterate
7. ⏳ Expand to iOS, then US
