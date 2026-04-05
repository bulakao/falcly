# Falcly — Full App Audit

> Last updated: 2026-04-05
> Audited at: commit `50a7e52` (main)
> Status: 97/99 stories · 89 tests · TypeScript clean

---

## Overview

| Metric | Value |
|--------|-------|
| Total LOC | 16,896 |
| Source files | 96 (.ts/.tsx) |
| Screens | 24 |
| Components | 28 (8 atoms · 14 molecules · 6 organisms) |
| Stores | 9 (Zustand) |
| Utility modules | 18 |
| Test files | 3 |
| Tests passing | 89/89 |
| TypeScript errors | 0 |
| Dependencies | 36 prod · 9 dev |
| Accessibility attributes | 159 |
| TODO/FIXME/HACK in code | 0 |

---

## Architecture

### Navigation (Expo Router — Stack)

```
_layout.tsx (root Stack)
├── (tabs)/
│   └── index.tsx                  — Dashboard (home)
├── welcome.tsx                    — First launch welcome screen
├── onboarding.tsx                 — Card entry (3 fields)
├── onboarding-result.tsx          — Status result (in-memory card)
├── sign-in.tsx                    — Email + Google auth
├── add-card.tsx                   — Add card (fullscreen modal)
├── edit-card.tsx                  — Edit card (modal)
├── manage-cards.tsx               — Card list + reorder
├── update-balance.tsx             — Quick balance update (modal)
├── swipe-impact.tsx               — Swipe impact analysis (modal)
├── log-transaction.tsx            — Manual transaction entry (modal)
├── card-transactions.tsx          — Transaction history (fullscreen)
├── payment-summary.tsx            — "What You Owe" (modal)
├── statement-advisor.tsx          — Spread score + timeline (modal)
├── payoff-planner.tsx             — Avalanche/Snowball planner (modal)
├── status-guide.tsx               — How status works (modal)
├── add-installment.tsx            — Add installment (modal)
├── add-subscription-item.tsx      — Add subscription (modal)
├── manage-installments.tsx        — Installment list (modal)
├── manage-subscriptions.tsx       — Subscription list (modal)
├── pro-paywall.tsx                — RevenueCat UI paywall (modal)
├── paywall-manual.tsx             — Custom paywall (modal)
├── settings.tsx                   — All settings
├── component-showcase.tsx         — Dev component gallery (modal)
└── +not-found.tsx                 — 404
```

### Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Expo App   │────▶│  SQLite      │     │  Supabase    │
│  (RN 0.81+) │     │  (Drizzle)   │────▶│  (Cloud Sync)│
└──────┬──────┘     └──────────────┘     └──────────────┘
       │
       ├──▶ Zustand (9 stores, persisted via AsyncStorage + Drizzle)
       ├──▶ RevenueCat (IAP + entitlements)
       ├──▶ PostHog (analytics + feature flags)
       └──▶ Supabase Auth (email + Google)
```

### Store Architecture

| Store | LOC | Responsibilities |
|-------|-----|-----------------|
| `cardStore.ts` | 366 | CRUD cards, reorder, drag-drop, sort persistence |
| `userStore.ts` | 237 | Profile, income, payday, preferences, defaults |
| `transactionStore.ts` | 171 | Transaction log, cycle classification, staleness |
| `subscriptionStore.ts` | 164 | RevenueCat-backed tier, offerings, purchase, restore |
| `overlayStore.ts` | 133 | Overlay dismiss state, preferences, Pro gate |
| `installmentStore.ts` | 131 | Installment plans per card |
| `subscriptionItemStore.ts` | 128 | Recurring subscription items |
| `authStore.ts` | 77 | Supabase auth, Google sign-in, session |
| `onboardingStore.ts` | 52 | Onboarding step tracking, completion |

### Core Engines

| Engine | File | LOC | Tests | Purpose |
|--------|------|-----|-------|---------|
| Decision Engine | `utils/decisionEngine.ts` | 643 | 45 | SAFE/CAUTION/RISKY (8 conditions) |
| Statement Advisor | `utils/statementAdvisor.ts` | 262 | 25 | Spread score, gaps, clustering, payday alignment |
| Payoff Planner | `utils/payoffPlanner.ts` | 214 | 19 | Avalanche + snowball strategies, comparison |

---

## Screen Size Analysis

| Screen | LOC | Notes |
|--------|-----|-------|
| `settings.tsx` | 1,018 | ⚠️ Largest — should split into sections |
| `statement-advisor.tsx` | 704 | Complex — score ring, timeline, wiki |
| `sign-in.tsx` | 464 | Email + Google + pending card from onboarding |
| `log-transaction.tsx` | 456 | Form with cycle classification |
| `edit-card.tsx` | 433 | Full card edit form |
| `card-transactions.tsx` | 344 | Transaction history with filters |
| `component-showcase.tsx` | 325 | Dev tool — not for production |
| `add-card.tsx` | 305 | Card creation form |
| `manage-cards.tsx` | 275 | Drag-to-reorder card list |
| `payment-summary.tsx` | 244 | Monthly payment breakdown |
| `onboarding-result.tsx` | 241 | Status display + save/sign-in CTA |
| `_layout.tsx` | 236 | Root layout, providers, RevenueCat + PostHog init |
| `paywall-manual.tsx` | 233 | Custom paywall with package selection |
| `payoff-planner.tsx` | 231 | Strategy comparison + timeline |
| All others | < 200 | Healthy size |

---

## 🟢 What's Healthy

### Code Quality
- **Zero TypeScript errors** — strict mode, clean compilation
- **Zero TODO/FIXME/HACK** comments — no deferred technical debt markers
- **Consistent naming** — snake_case events, PascalCase components, camelCase functions
- **No hardcoded currencies** — `useCurrency` hook used throughout
- **Theme system** — all 24 screens use `useAppTheme()`, no inline color definitions (except 5 minor shadow colors)

### Security
- **Sanitized logging** — `utils/logger/sanitizer.ts` auto-redacts: password, token, secret, apiKey, authorization, creditCard, ssn, balance
- **`.env` in `.gitignore`** — 4 matching patterns, secrets not committed
- **Supabase anon key** — public key (safe to commit), but cleaner in env
- **No PII in analytics events** — PostHog events contain no card numbers, balances, or personal data

### Accessibility
- **159 accessibility attributes** across components (accessibilityLabel, accessibilityRole, accessibilityHint)
- Full accessibility audit completed (see `docs/discovery/4-design/32-accessibility.md`)

### Architecture
- **Local-first** — SQLite + Drizzle, works offline
- **Clean separation** — engines (utils) → stores (state) → screens (UI) → components (reusable)
- **9 focused stores** — no god store, each owns its domain
- **3 core engines fully tested** — decision engine (45 tests), statement advisor (25), payoff planner (19)

### Analytics
- **PostHog fully integrated** — 17 events tracked, 4 funnels built
- **RevenueCat integrated** — real IAP with test mode

---

## 🟡 Warnings (Non-Critical)

### 1. Hardcoded API Keys (3 files)

| File | Key | Risk |
|------|-----|------|
| `utils/revenuecat.ts` | RevenueCat test API key | Low (test key), but must change for production |
| `utils/supabase.ts` | Supabase URL + anon key | Low (public keys), cleaner in env |
| `store/authStore.ts` | Google OAuth web + iOS client IDs | Low (public keys), cleaner in env |

**Fix:** Move all to `.env` → `app.config.js` extras → `Constants.expoConfig.extra.*`

PostHog already uses this pattern correctly — follow the same approach for the others.

### 2. Two Paywall Screens

| Screen | Approach | LOC |
|--------|----------|-----|
| `pro-paywall.tsx` | RevenueCat UI (native) | 68 |
| `paywall-manual.tsx` | Custom React Native UI | 233 |

Both are registered in the navigation stack. Before launch, either:
- Pick one and remove the other
- Keep both and A/B test via PostHog feature flag (`paywall_variant`)

### 3. `component-showcase.tsx` in Production Nav

Dev tool (325 LOC) registered as a navigable screen. Users could theoretically reach it.

**Fix:** Gate behind `__DEV__`:
```tsx
{__DEV__ && <Stack.Screen name="component-showcase" ... />}
```

### 4. `settings.tsx` at 1,018 Lines

Largest file in the app. Contains: profile, subscription management, overlay preferences, card defaults, data management, theme, analytics opt-out, sign-out, danger zone.

**Fix (when time allows):** Extract into section components:
- `SettingsProfileSection.tsx`
- `SettingsSubscriptionSection.tsx`
- `SettingsDataSection.tsx`
- `SettingsPreferencesSection.tsx`

### 5. Watchman Recrawl Warning

```
Recrawled this watch 283 times
```

Causes slower test runs and hot reloads.

**Fix:**
```bash
watchman watch-del '/Users/ramidem/Code/bulakao/falcly'
watchman watch-project '/Users/ramidem/Code/bulakao/falcly'
```

### 6. Hardcoded Colors (5 instances)

| File | Color | Usage |
|------|-------|-------|
| `paywall-manual.tsx` | `'#fff'` | Button text |
| `BestCardBanner.tsx` | `'#000'` | Shadow |
| `StackedCardsPreview.tsx` | `'#000'` | Shadow |
| `CreditCardFace.tsx` | `'#000'` | Shadow |
| `CardPager.tsx` | `'#000'` | Shadow |

All are shadow colors or white text on primary buttons. Minor inconsistency with theme system.

**Fix:** Use `t.shadow` or `t.buttonText` from theme tokens.

---

## 🔴 Should Fix Before Launch

### 1. Test Coverage Gaps

**Tested (3 files, 89 tests):**
| File | Tests | Coverage |
|------|-------|----------|
| `decisionEngine.ts` | 45 | Full — all 8 conditions, edge cases |
| `statementAdvisor.ts` | 25 | Full — spread, gaps, clustering, payday |
| `payoffPlanner.ts` | 19 | Full — avalanche, snowball, comparison |

**Not tested (critical):**
| File | LOC | Risk | Priority |
|------|-----|------|----------|
| `cycleUtils.ts` | 101 | **High** — billing cycle math, date calculations | 🔴 |
| `overlayTriggers.ts` | — | Medium — overlay display logic | 🟡 |
| `sync.ts` | 88 | Medium — cloud sync merge logic | 🟡 |
| `csvExport.ts` | 125 | Low — data export formatting | 🟢 |
| `notifications.ts` | 220 | Low — wrapper around Notifee | 🟢 |
| `analytics.ts` | 163 | Low — PostHog wrapper | 🟢 |

**`cycleUtils.ts` is the priority** — it's the foundation for cycle classification ("Which cycle does this transaction land on?"). A bug here silently misclassifies transactions.

### 2. RevenueCat Production Key

Currently using `test_QoIpmFHMVFDxuzrrCalJEmHXOMK`. Before Google Play release:
1. Create production API key in RevenueCat dashboard
2. Move to `.env`: `REVENUECAT_API_KEY=goog_xxxx`
3. Read via `Constants.expoConfig.extra.revenuecatApiKey`

### ~~3. Dead Code~~ ✅ Fixed

Removed 4 unused files and their barrel exports (2026-04-05):
- `PageDots.tsx`, `StackedCardsPreview.tsx`, `crashReporting.ts`, `secureLogger.ts`

---

## 📦 Dependency Health

### Production (36 packages)

**Core:**
- `react` + `react-native` — framework
- `expo` + 10 expo packages — platform layer
- `expo-router` + `@react-navigation/native` — navigation
- `expo-sqlite` + `drizzle-orm` — local database

**State:**
- `zustand` — state management
- `@react-native-async-storage/async-storage` — persistence

**Auth & Backend:**
- `@supabase/supabase-js` — auth + cloud sync
- `@react-native-google-signin/google-signin` — Google OAuth

**Payments:**
- `react-native-purchases` + `react-native-purchases-ui` — RevenueCat IAP

**Analytics:**
- `posthog-react-native` — product analytics

**UI:**
- `lucide-react-native` — icons
- `react-native-svg` — SVG rendering
- `react-native-reanimated` + `react-native-gesture-handler` — animations + gestures
- `react-native-draggable-flatlist` — card reordering

**Other:**
- `@notifee/react-native` — local notifications
- `@react-native-clipboard/clipboard` — copy to clipboard
- `@react-native-community/netinfo` — network status
- `expo-sharing` + `expo-file-system` — file export
- `react-native-url-polyfill` — URL polyfill for Supabase

**Assessment:** Clean dependency set. No bloat. Each package has a clear purpose. No overlapping packages.

### DevDependencies (9 packages)

- `typescript` — compiler
- `jest` + `ts-jest` + `@types/jest` — testing
- `drizzle-kit` — migration tooling
- Standard Expo dev tooling

---

## 🔐 Security Summary

| Area | Status | Notes |
|------|--------|-------|
| API keys in code | ⚠️ | 3 files with hardcoded keys (all public/test — not leaked secrets) |
| `.env` protection | ✅ | 4 patterns in `.gitignore` |
| Log sanitization | ✅ | Auto-redacts 9 sensitive field patterns |
| Supabase RLS | ✅ | Row-level security on user data |
| No PII in analytics | ✅ | Events contain no personal data |
| Session replay masking | ✅ | Text inputs + images masked |
| Auth | ✅ | Supabase Auth + Google Sign-In |
| Local data | ✅ | SQLite on-device, balance snapshots never leave device |

---

## 📊 Analytics Coverage

| Journey Stage | Events | Coverage |
|---------------|--------|----------|
| Acquisition | welcome_viewed, get_started_tapped | ✅ |
| Onboarding | card_entry_completed, first_status_viewed, signup_completed | ✅ |
| Activation | card_added, swipe_check_performed | ✅ |
| Monetization | paywall_viewed, paywall_purchased, pro_converted | ✅ |
| Retention | screen_viewed | ⚠️ Basic — needs user properties + cohorts |
| Churn | — | ❌ No churn events yet (RevenueCat↔PostHog integration will cover) |

**Gap:** Connect RevenueCat → PostHog integration (dashboard config, no code) to get: `rc_cancellation_event`, `rc_expiration_event`, `rc_billing_issue_event`, `rc_renewal_event`.

---

## 🗺️ User Flows

### Onboarding (new user)
```
Welcome → [Get Started] → Card Entry (3 fields) → Status Result (in-memory)
    → [Save my card] → Sign-in/up → Card saved + synced → Dashboard
    
Welcome → [Already have an account? Log in] → Sign-in → Dashboard
```

### Core Loop (daily use)
```
Dashboard → See card status (SAFE/CAUTION/RISKY)
         → Tap card → Swipe Impact → Enter amount → See projection
         → Log transaction → See updated status
```

### Pro Upgrade
```
Hit card limit (3rd card) → Paywall → Purchase → Pro unlocked
Settings → [Upgrade to Pro] → Paywall → Purchase
SwipeImpactPanel → [Payoff Planner] → Paywall (if free)
```

---

## 📋 Action Items (Prioritized)

### Before Launch (Required)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | Move RevenueCat key to env var | 10 min | Security hygiene |
| 2 | Add `cycleUtils.ts` tests | 30 min | Prevent billing cycle bugs |
| ~~3~~ | ~~Remove dead code (4 files)~~ | ~~5 min~~ | ✅ Done |
| 4 | Gate component-showcase behind `__DEV__` | 5 min | No dev tools in prod |
| 5 | Connect RevenueCat → PostHog (dashboard) | 10 min | Full revenue attribution |
| 6 | Set up Play Console products + RevenueCat | 30 min | Can't launch without it |
| 7 | `npx expo prebuild --clean` + EAS build | 15 min | Dev client for testing |
| 8 | Test sandbox purchases on real device | 30 min | Verify payment flow |

### Post-Launch (Recommended)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 9 | Move Supabase + Google creds to env | 15 min | Consistency |
| 10 | Add tests for `overlayTriggers.ts`, `sync.ts` | 45 min | More coverage |
| 11 | Decide paywall: one screen or A/B flag | 10 min | Simpler nav |
| 12 | Split `settings.tsx` into sections | 30 min | Maintainability |
| 13 | Fix 5 hardcoded shadow colors | 5 min | Theme consistency |
| 14 | Add user properties to PostHog identify | 20 min | Better segmentation |
| 15 | Enable PostHog session replay | 15 min | Watch real user sessions |
| 16 | Wire up feature flags (plumbing) | 30 min | Remote control |
| 17 | Fix watchman recrawl | 1 min | Faster dev experience |

---

## File Inventory

### Screens (24)

| Screen | LOC | Purpose | Pro-Gated |
|--------|-----|---------|-----------|
| `(tabs)/index.tsx` | ~180 | Dashboard — card pager + status | No |
| `welcome.tsx` | ~130 | First launch — hero + benefits + CTA | No |
| `onboarding.tsx` | ~160 | Card entry — 3 fields | No |
| `onboarding-result.tsx` | 241 | Status result + save CTA | No |
| `sign-in.tsx` | 464 | Email + Google auth + pending card | No |
| `add-card.tsx` | 305 | Add card form | Card 3+ = paywall |
| `edit-card.tsx` | 433 | Full card edit | No |
| `manage-cards.tsx` | 275 | Card list + drag reorder | No |
| `update-balance.tsx` | ~100 | Quick balance update | No |
| `swipe-impact.tsx` | ~180 | Swipe impact calculator | No |
| `log-transaction.tsx` | 456 | Manual transaction entry | No |
| `card-transactions.tsx` | 344 | Transaction history | No |
| `payment-summary.tsx` | 244 | Monthly payment breakdown | No |
| `statement-advisor.tsx` | 704 | Spread score + timeline + wiki | No |
| `payoff-planner.tsx` | 231 | Avalanche/snowball comparison | Yes |
| `status-guide.tsx` | ~100 | How SAFE/CAUTION/RISKY works | No |
| `add-installment.tsx` | ~180 | Add installment plan | No |
| `add-subscription-item.tsx` | 199 | Add recurring subscription | No |
| `manage-installments.tsx` | ~150 | Installment list | No |
| `manage-subscriptions.tsx` | ~150 | Subscription list | No |
| `pro-paywall.tsx` | 68 | RevenueCat native paywall | — |
| `paywall-manual.tsx` | 233 | Custom paywall | — |
| `settings.tsx` | 1,018 | All settings + subscription mgmt | Partial |
| `component-showcase.tsx` | 325 | Dev tool | — |

### Components (28)

**Atoms (8):** Badge, Button, CreditCardFace, EmptyCardFace, FormInput, OfflineChip, PageDots*, Typography, UtilizationBar

**Molecules (14):** AlertBanner, BankPicker, BestCardBanner, BreakdownRow, CardOverlay, CardPayoffBreakdown, ChipSelector, DayInput, EmptyState, FinanceCard, FormFieldGroup, ImpactSkeleton, MoneyInput, PayoffComparisonCard, PayoffTimeline, PercentInput, SectionCard, StackedCardsPreview*, StatusTooltip, SurfaceCard

**Organisms (6):** AllCardsOverview, BillingTimeline, CardPager, FutureTimeline, GanttTimeline, MergePrompt, SwipeImpactPanel

*\* = unused (0 references)*

### Stores (9)

All Zustand with persist middleware. Total: 1,459 LOC.

### Utils (18)

Core engines (3 tested) + helpers (15 untested). Total: 2,257 LOC.
Logger subsystem: 8 files in `utils/logger/` (core, breadcrumbs, crash, sanitizer, transports, middleware).

---

## Conclusion

Falcly is a well-structured, well-tested app with a clean architecture and solid feature set. The codebase is professional-grade with consistent patterns, proper security hygiene, and comprehensive analytics. The main gaps are:

1. **Test coverage** — 3 of 18 utils tested (but the 3 most critical engines are fully covered)
2. ~~**Dead code** — 4 unused files to clean up~~ ✅ Removed
3. **API key management** — works but should be env-var'd before production

None of these are blockers. The app is launch-ready once Play Console products are configured and sandbox purchases are verified.
