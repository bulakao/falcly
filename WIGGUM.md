# Wiggum Run Log — Falcly Phase 1

Tracking findings, issues, and things to review after wiggum completes.

## Run 1 (10 iterations, 10/29 stories)

### Stories completed
- CL-01 through CL-07 (Core Loop)
- CA-01 through CA-03 (Cash Awareness)

### Findings to review
- Decision engine (`utils/decisionEngine.ts`) was built incrementally across CL-01, CL-03, CL-04, CL-05 — may need consolidation
- Swipe Impact uses `netAvailableCash` which gracefully shows "Not set" until cash/income inputs exist — verify this UX
- Staleness utils extracted to `utils/staleness.ts` — shared across home + card detail
- User profile store (`store/userStore.ts`) created in CA-01, extended in CA-02/CA-03 — check for consistency
- `computeNetAvailableCash()` includes income only when payday ≤ due date — verify edge cases (payday on due date, end-of-month)
- No Firebase/Firestore integration yet — all data is in Zustand + AsyncStorage

---

## Run 2 (10 iterations, 22/29 stories)

### Stories completed
- CA-04 (Net available cash display)
- DE-01 through DE-05 (Decision Engine) — note: DE-02, DE-03 were already implemented, just marked passing
- CM-01, CM-02 (Card Management)
- OB-01, OB-02 (Onboarding)
- MO-01, MO-02 (Monetization — paywall + trial)

### Findings to review
- DE-02/DE-03 were already done from CL-01 — wiggum recognized and skipped, but batched 3 stories in one iteration (DE-02 + DE-03 + DE-04). Verify all acceptance criteria actually pass
- `projectFutureCycles()` added for DE-05 — complex projection logic, needs manual review
- Card types extended with `pendingTransactions`, `installments`, `subscriptions`, `annualFee` fields — check if edit form exposes all of these properly
- Subscription store (`store/subscriptionStore.ts`) created with free/pro tiers — uses local state only, no RevenueCat yet
- Trial logic (`startTrial`/`isTrialActive`/`checkTrialExpiry`) is local-only — will need RevenueCat integration for production
- Onboarding flow: `app/onboarding.tsx` + `app/onboarding-result.tsx` — verify routing works from empty state
- Three Zustand stores now: cardStore, userStore, subscriptionStore — all persisted via AsyncStorage

---

## Run 3 (7 iterations, 29/29 stories — COMPLETE)

### Stories completed
- MO-03, MO-04 (Monetization — Pro upgrade + graceful expiry)
- DP-01 through DP-03 (Data & Privacy — offline, security, CSV export)
- AQ-01 (PostHog analytics)
- AQ-02 (Firebase Crashlytics)

### Findings to review
- `purchasePro(plan)` simulates RevenueCat — needs real RevenueCat SDK integration for production
- MO-04 graceful expiry: cards 3+ become read-only — verify this actually restricts editing in the UI
- DP-01 offline: verify all core features work with airplane mode on a real device
- DP-02 secure storage: using Firebase SDK native encryption — verify no balances/limits leak in debug logs
- DP-03 CSV export: verify file sharing works on both iOS and Android
- AQ-01 PostHog: initialized on EU region, opt-out toggle in settings — verify events actually fire
- AQ-02 Crashlytics: verify source maps upload via EAS Build, confirm crash reports appear in Firebase console

---

## Global findings across all runs

### Architecture
- **3 Zustand stores** (cardStore, userStore, subscriptionStore) — all persisted via AsyncStorage, no Firebase/Firestore yet
- **Decision engine** (`utils/decisionEngine.ts`) grew organically across 10+ stories — likely needs refactoring/cleanup
- **No tests written** — wiggum focused on implementation, not test coverage
- **No Firebase integration** — everything is local AsyncStorage despite Firebase being the intended data layer

### Must-do before launch
1. Integrate RevenueCat (currently simulated) — PK-01 parked
2. ~~Wire up real PostHog project~~ — parked
3. ~~Verify Crashlytics source maps via EAS Build~~ — gone (replaced by PostHog, which is parked)
4. Add test coverage for decision engine (pure functions, easy to test)
5. Manual QA on real devices (iOS + Android)
6. Review all screens for accessibility (color-only indicators, screen reader support)

## Run 4 (9 commits, OB-03 through OB-09)

### Stories completed
- OB-03 (Welcome screen with value prop)
- OB-04 (Separate sign-up and sign-in screens)
- OB-05 (Bank picker + day picker on card entry)
- OB-06 (Onboarding state machine + auto-trigger gate)
- OB-07 (Onboarding trial paywall screen)
- OB-08 (Push notification permission screen)
- OB-09 (Onboarding funnel analytics)

### Findings to review
- Auth still uses Supabase (not @react-native-firebase/auth as CLAUDE.md states) — sign-up screen maps Firebase error codes but actual auth calls go through Supabase; will need migration
- `expo-notifications` is not in package.json — onboarding-notifications.tsx uses a dynamic require with fallback; install the package before testing notification permissions on device
- Bank picker uses horizontal ScrollView with colored circle badges — no bank logo assets, uses initial letter as fallback
- Onboarding state persisted via AsyncStorage (4th Zustand store: onboardingStore) — matches pattern of other stores
- Sign-in screen "Don't have an account?" links to /welcome (not /sign-up directly) per spec
- onboarding-result.tsx now routes to /onboarding-paywall instead of / after enrichment save/skip
- Trial paywall auto-skips for trial/pro/pro_plus users via useEffect check

---

## Run 5 (6 commits, TL-01 through TL-08)

### Stories completed
- TL-01 (Log a transaction — store, schema, migration, modal screen)
- TL-02 (Cycle auto-classification + "Lands on" label)
- TL-03 (Cycle-grouped transaction view)
- TL-04 (Near-cutoff transaction warning)
- TL-05 (Payment summary screen — "What You Owe")
- TL-06 (Transaction engine integration — projected balance now includes current-cycle tx sum)
- TL-07 (Log a payment — type selector, auto-assign to previous cycle)
- TL-08 (Exclude a transaction — long-press Alert with Exclude/Include/Delete)

### New files created
- `store/transactionStore.ts` — Zustand + Drizzle/SQLite persistence for transactions
- `utils/cycleUtils.ts` — classifyTransactionCycle, getLandsOnLabel, getStatementMonth, daysUntilClose, formatCycleDateRange
- `app/log-transaction.tsx` — modal screen for logging purchases/payments/refunds
- `app/card-transactions.tsx` — full-screen cycle-grouped transaction list
- `app/payment-summary.tsx` — modal showing current bill due + projected next bill
- `db/schema/local.ts` — added `transactions` table with card_id + statement_month indexes
- `drizzle/0001_shallow_power_man.sql` — migration for transactions table

### Modified files
- `utils/decisionEngine.ts` — added `currentCycleTxSum` param to `projectedStatementBalance()` (defaults to 0 for backward compat) + `computeCurrentCycleTxSum()` helper
- `app/_layout.tsx` — registered 3 new routes + loads transactions on boot

### Findings to review
- Transaction store uses Drizzle/SQLite (5th Zustand store), consistent with cardStore pattern
- `projectedStatementBalance()` accepts optional `currentCycleTxSum` param — callers (SwipeImpactPanel, CardPager, etc.) currently pass 0 implicitly; integrate with UI when ready
- Payment type auto-assigns `cycleLabel: 'previous'` — correct for most cases but edge case when payment is for future cycle is not handled
- No entry points added to home screen or card detail yet — screens are registered but need navigation buttons wired in
- "Lands on" label uses `getCycleDates()` from decisionEngine which determines cycle based on the transaction date context — verify edge cases around month boundaries

---

## Run 6 — Statement Advisor Batch 1

### Stories completed
- SD-01 (analyzeSpread engine)
- SD-02 (Statement Advisor screen — score + timeline)
- SD-03 (Issues list + recommendations)
- SD-04 (Timing guide + bank reference + wiki)

### New files
- utils/statementAdvisor.ts
- app/statement-advisor.tsx
- constants/wikiCards.ts
- __tests__/statementAdvisor.test.ts

### Findings
- Spread score algorithm uses circular 30-day month (normalizes day 31 to 30) — consistent with gap/clustering logic
- `as never` cast needed for router.push('/statement-advisor') in settings — Expo Router typed routes regenerate at build time
- Wiki cards (W-01 through W-13) stored as constants, not database — suitable for static educational content
- 25 new tests added for statement advisor engine, all passing alongside existing 45 decision engine tests (70 total)
- Bank reference table is hardcoded PH-specific data — will need localization if expanding to other markets

---

## Run 7 — Statement Advisor Batch 2 (Card Overlay System)

### Stories completed
- SD-05 (CardOverlay component + queue system)
- SD-06 (Overlay preferences in Settings)
- SD-07 (Contextual wiki delivery)

### New files
- types/overlay.ts
- store/overlayStore.ts
- components/molecules/CardOverlay.tsx
- utils/overlayTriggers.ts

### Modified files
- store/userStore.ts — no changes needed (overlay prefs live in overlayStore)
- store/subscriptionStore.ts — tier downgrade resets overlay prefs
- app/settings.tsx — Card Tips & Alerts section with Pro-gated toggles
- components/organisms/CardPager.tsx — overlay integration + contextual wiki triggers
- components/organisms/SwipeImpactPanel.tsx — contextual triggers on amount entry
- components/organisms/AllCardsOverview.tsx — portfolio-level overlay rendering
- components/molecules/index.ts — CardOverlay barrel export

### Findings
- Overlay prefs stored in overlayStore (Zustand + AsyncStorage) rather than userStore (Drizzle/SQLite) to avoid schema migration
- CardOverlay positioned absolute on top of CreditCardFace — matches card dimensions via container bounds
- Wiki deduplication uses wikiId+cardId prefix matching against dismissedIds
- Pre-existing lint warning in SwipeImpactPanel (react-hooks/exhaustive-deps for transactions) — not introduced by this batch
- 70 existing tests continue to pass (no new tests needed — overlay system is UI-only with no pure business logic to unit test)

---

## TODO

- [ ] Set up RevenueCat project + integrate SDK (replace simulated purchase logic in subscriptionStore) — parked
- [ ] ~~Set up PostHog project~~ — parked (taking Crashlytics with it)
- [ ] ~~Install expo-notifications~~ — using notifee (already installed)
- [ ] ~~Migrate auth from Supabase to @react-native-firebase/auth~~ — staying on Supabase
