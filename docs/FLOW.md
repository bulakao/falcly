# Falcly — App Flow

> Last updated: 2026-04-05
> Status: Audited + optimized. Reflects actual implementation.

---

## Overview

Two entry paths from the Welcome screen:
1. **Free path** — try the app with one card, no account required until save
2. **Pro path** — buy Pro upfront, then create account to secure the purchase

Both paths converge at the Dashboard. Account creation is mandatory before reaching it.

---

## Flow Diagram

```
Install
  │
  ▼
┌─────────────────────────────────────────────────────┐
│                   Welcome Screen                    │
│  ┌──────────────┐           ┌─────────────────────┐ │
│  │ Get Started  │           │ Unlock Pro features │ │
│  └──────────────┘           └─────────────────────┘ │
│  Already have account? → Sign In                    │
└──────────────┬──────────────────────┬───────────────┘
               │                      │
               ▼                      ▼
     ┌──────────────────┐    ┌────────────────────┐
     │   FREE PATH      │    │    PRO PATH        │
     └──────────────────┘    └────────────────────┘
               │                      │
               ▼                      ▼
     ┌──────────────────┐    ┌────────────────────┐
     │  Onboarding      │    │  Paywall           │
     │  (3 fields)      │    │  (monthly/yearly/  │
     │                  │    │   lifetime)        │
     └────────┬─────────┘    └────────┬───────────┘
              │                       │
              ▼                       │ Purchase
     ┌──────────────────┐             │ success
     │  Status Result   │             │
     │  (in-memory card)│             ▼
     │                  │    ┌────────────────────┐
     │  [Save my card]  │    │  Sign-in / Create  │
     └────────┬─────────┘    │  Account           │
              │              │  (fromPaywall=true) │
              ▼              └────────┬───────────┘
     ┌──────────────────┐            │
     │  Sign-in /       │            │ Auth success
     │  Create Account  │◄───────────┘
     │  (fromOnboarding │
     │   =true,         │
     │   pendingCard)   │
     └────────┬─────────┘
              │
              │ Auth success
              │ → save pending card
              │ → onboarding.complete()
              │ → identifyUser(supabase_id)  ← aliases RC anon → real user
              ▼
     ┌──────────────────────────────┐
     │         Dashboard            │
     │  (isOnboardingComplete=true) │
     └──────────────────────────────┘
```

---

## Screen-by-Screen

### 1. Welcome Screen (`/welcome`)

**Purpose:** First impression. Two doors — free or Pro.

| Element | Action | Destination |
|---------|--------|-------------|
| Get Started | Start free onboarding | `/onboarding` |
| Unlock Pro features | Open paywall | `/paywall-manual` |
| Already have an account? | Go to sign-in | `/sign-in` |

**Gate:** Layout redirects here if `isOnboardingComplete === false` and user is on an unknown screen.

---

### 2. Onboarding (`/onboarding`)

**Purpose:** Collect one card's data. No account needed yet.

**Fields:** Card name, credit limit, outstanding balance, statement day, due day offset.

**On submit:** → `/onboarding-result` with card data as route params (in-memory, not saved yet).

---

### 3. Onboarding Result (`/onboarding-result`)

**Purpose:** Show the user their card's SAFE/CAUTION/RISKY status. First taste of the product.

**Displays:** Status badge, credit utilization bar, billing timeline.

**CTA:** "Save my card" → `/sign-in?fromOnboarding=true&pendingCard=<json>`

> No "skip" option. The only way forward is to save (and create an account).
> This is intentional — the card should be persisted, not lost.

---

### 4. Paywall (`/paywall-manual`)

**Purpose:** Convert visitors to Pro subscribers.

**Plans:** Monthly · Yearly (BEST VALUE, auto-selected) · Lifetime

**Trial:** Pulled dynamically from RevenueCat `introPrice` — shows "X-day free trial" only if configured in Play Console / App Store Connect. Falls back to "Subscribe Now".

**Savings %:** Computed live from `product.price` — no hardcoded values.

**On purchase success:**
- If user **not logged in** → mandatory sign-in: `router.replace('/sign-in?fromPaywall=true')`
- If user **already logged in** → `router.replace('/')` (dashboard)

**On restore success:** Same logic as purchase — route to sign-in if no account, dashboard if logged in.

**Gate:** Exempt from layout's onboarding redirect (listed in `onboardingScreens`).

---

### 5. Sign-in / Create Account (`/sign-in`)

**Purpose:** Authenticate + tie everything to a real user.

**Modes:** Email signup · Email login · Google Sign-In

**Params:**

| Param | Source | Effect |
|-------|--------|--------|
| `fromOnboarding=true` | Onboarding result | Saves `pendingCard` to DB after auth, calls `onboarding.complete()` |
| `fromPaywall=true` | Paywall purchase | Calls `onboarding.complete()`, skips card save |
| `pendingCard=<json>` | Onboarding result | Card data to persist after signup |

**MergePrompt:** If user signs in (not up) with a pending card from onboarding — asks whether to keep local card or discard. Prevents duplicate cards.

**On success:** `navigateAfterAuth()` → `router.replace('/')` → Dashboard

**RevenueCat alias:** Handled in `_layout.tsx` via auth state listener:
```
authUser changes → identifyUser(authUser.id) → RC aliases anon → real user ID
```
This fires automatically on every signup/login. Pro purchase is transferred.

---

### 6. Dashboard (`/`)

**Purpose:** Main app experience.

**Gate:** Layout redirects to `/welcome` if `isOnboardingComplete === false`.

---

## Layout Guard (`_layout.tsx`)

```ts
// Screens exempt from redirect
const onboardingScreens = [
  'welcome',
  'onboarding',
  'onboarding-result',
  'sign-in',
  'paywall-manual',   // ← exempt so Pro path works from welcome
];

if (!isOnboardingComplete && !onOnboardingScreen) → router.replace('/welcome')
if (isOnboardingComplete && onOnboardingScreen)   → router.replace('/')
```

---

## RevenueCat Identity Flow

```
App start
  └── RC initialized with anonymous ID ($RCAnonymousID:xxx)

User purchases (anon)
  └── Purchase tied to anon RC ID
  └── Backed by Apple ID / Google account (restore works)

User signs up / logs in
  └── _layout.tsx auth listener fires
  └── identifyUser(supabase_uuid) called
  └── RC aliases: anon ID → supabase UUID
  └── Pro entitlement now on real user ID ✅

User restores purchases
  └── RC calls store (Apple/Google)
  └── Receipt returned for current Apple ID / Google account
  └── Entitlements updated on current RC user
  └── Works even without a Falcly account (tied to store account)
```

---

## What Was Removed / Cleaned Up

| Item | Status | Reason |
|------|--------|--------|
| `pro-paywall.tsx` (RevenueCat native template) | ✅ Deleted | Consolidated to `paywall-manual.tsx` |
| Hardcoded `Save 33%` label | ✅ Fixed | Now computed from live prices |
| Hardcoded `14-day trial` | ✅ Fixed | Now from `introPrice` on package |
| Hardcoded RevenueCat API key | ✅ Fixed | Moved to `.env` + `app.config.js` |
| `router.back()` after purchase | ✅ Fixed | Now `router.replace('/')` or sign-in |
| Optional account after purchase | ✅ Fixed | Mandatory sign-in after Pro purchase |
| "See more Pro features" CTA copy | ✅ Fixed | "Unlock Pro features" |

---

## Open Questions / Future

- [ ] Should "Save my card" on onboarding-result have a "Skip for now" option? Currently no — forces account creation to preserve data. Revisit if drop-off is high.
- [ ] Pricing experiment (RevenueCat Experiments) — test $6.99/mo vs $4.99/mo after 200+ users
- [ ] Post-purchase onboarding — after Pro purchase + signup, show a "here's what you unlocked" screen before dashboard
- [ ] iOS App Store launch — replicate Play Console localized pricing in App Store Connect
