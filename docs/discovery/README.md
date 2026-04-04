# Discovery Docs — Falcly

> **Last Updated:** 2026-04-04
> **Status:** Launch Ready (97/99 stories passing)

## Current State

**Falcly** — Credit card billing cycle intelligence app. "Is it safe to swipe right now?"

- **Platform:** React Native (Expo CNG), Android-first
- **Stack:** SQLite + Drizzle (local-first), Supabase Auth, RevenueCat, Zustand
- **Tests:** 89 passing (decision engine + statement advisor + payoff planner)
- **Stories:** 97/99 passing

### What's Done

- ✅ Core decision engine (SAFE/CAUTION/RISKY)
- ✅ Swipe impact analysis
- ✅ Multi-card management
- ✅ Cash flow awareness (multi-payday)
- ✅ Transaction logging
- ✅ Cloud sync (Supabase)
- ✅ Statement Advisor (spread analysis, timeline, wiki)
- ✅ Card Overlay System (tips, alerts, contextual wiki)
- ✅ Onboarding flow
- ✅ RevenueCat integration (real IAP)
- ✅ Payoff Planner (avalanche/snowball)
- ✅ Accessibility audit

### Parked (Phase 2)

- 🅿️ P2-01: SMS listener (auto-detect transactions) — requires Kotlin module
- 🅿️ P2-03: NL queries (AI advisor) — Gemini API integration

---

## Structure

### 1-research/ ✅ COMPLETE

Market research, competitors, ICP, regulatory landscape.

- Pre-launch research done March 2026
- PH-first market focus validated

### 2-strategy/ ✅ COMPLETE

Pricing, monetization, GTM, financial projections.

- Freemium model: Free (2 cards) → Pro ($4.99/mo) → Pro+ ($9.99/mo)
- Card overlay system = monetization surface for free tier
- PH launch first, then global

### 3-technical/ ✅ COMPLETE

Decision logic, tech stack, AI layer, payment intelligence.

- Decision engine: 8 conditions, priority-ordered
- Local-first SQLite, cloud backup via Supabase
- AI layer deferred to Phase 2+

### 4-design/ ✅ COMPLETE

UX patterns, branding, accessibility, onboarding.

- Black-forward premium aesthetic
- SAFE (green) / CAUTION (amber) / RISKY (red)
- Accessibility audit complete

### 5-launch/ 📝 IN PROGRESS

Keywords, landing page, marketing assets, user stories.

- Keywords researched
- Landing page brief ready
- App store assets TODO
- User stories in prd.json (99 total)

---

## Key Files

| File                               | Purpose                           | Status       |
| ---------------------------------- | --------------------------------- | ------------ |
| `1-research/01-brief.md`           | Project brief + discovery summary | ✅            |
| `1-research/03-competitors.md`     | Competitor deep dive              | ✅            |
| `2-strategy/11-monetization.md`    | Revenue model, overlays           | ✅            |
| `3-technical/20-decision-logic.md` | SAFE/CAUTION/RISKY spec           | ✅            |
| `3-technical/21-tech-stack.md`     | Full stack decisions              | ✅            |
| `4-design/30-ux-patterns.md`       | UX principles                     | ✅            |
| `5-launch/43-user-stories.md`      | Original stories                  | See prd.json |

---

## Related Docs

- `../prd.json` — 99 user stories with pass/fail status
- `../prd.md` — Full PRD markdown
- `../PAYOFF.md` — Debt payoff strategies research
- `../archive/` — Completed specs (sync, statement advisor, etc.)
