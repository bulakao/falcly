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
1. Replace AsyncStorage with Firestore offline persistence
2. Integrate RevenueCat (currently simulated)
3. Wire up real PostHog project
4. Verify Crashlytics source maps via EAS Build
5. Add test coverage for decision engine (pure functions, easy to test)
6. Manual QA on real devices (iOS + Android)
7. Review all screens for accessibility (color-only indicators, screen reader support)

## TODO

- [ ] Set up RevenueCat project + integrate SDK (replace simulated purchase logic in subscriptionStore)
- [ ] Set up PostHog project (EU region) + add real API key to analytics.ts
