# 20 — Onboarding Discovery

> Status: Draft  
> Date: 2026-04-01  
> Scope: First-install flow, sign-up/sign-in, card entry, trial paywall placement, push permissions  
> Related docs: 17-ux-patterns.md, 18-monetization.md, 15-user-stories.md

---

## 1. Research Summary

### Industry Data (RevenueCat 2024/2025)

- 77% of users abandon an app within the first 3 days of installation
- Day 1 retention: Android 22.6%, iOS 25.6%
- Industry average trial conversion: ~37.3%
- **Onboarding paywalls account for ~50% of trial starts** — the highest-converting placement, because motivation is highest immediately after install
- Apps that show value *before* the paywall convert significantly better than those that gate everything upfront
- Key principle: the first 3–7 days determine whether a user will stick. Onboarding must deliver the "aha" moment in this window.

### Hard vs Soft Paywall

| Model | Pros | Cons |
|-------|------|------|
| Hard paywall (trial required before use) | Simple funnel, easy to A/B test, high initial conversion | High early churn, feels hostile |
| Soft paywall (free tier + gated features) | Better retention, word of mouth, users feel in control | Lower initial conversion, complex product surface |
| **Hybrid (Falcly's model)** | Value first → paywall after → free tier fallback | Requires careful sequencing |

**Recommendation:** Show value immediately (first status, no account required ideally), then ask for sign-up, then show trial paywall after the value moment. Always preserve "Continue with Free" — never trap users.

### Onboarding Paywall Placement Options

From RevenueCat data:
```
A: welcome → onboarding → home → paywall       = 2% trial opt-in
B: welcome → paywall → onboarding → home        = higher conversion but hostile
C: welcome → onboarding → paywall → home        = best balance (Falcly's approach)
```

Option C — show paywall after the value moment, within the onboarding flow — is the recommended placement for Falcly.

---

## 2. Current State Audit

### What Exists
- `app/sign-in.tsx` — combined sign-in + sign-up + forgot password
- `app/onboarding.tsx` — 3-field card entry (statement day as free text, limit, balance)
- `app/onboarding-result.tsx` — first status result + optional cash enrichment
- `app/_layout.tsx` — auth guard: unauthenticated → sign-in, authenticated → app

### What's Broken / Missing

| Issue | Impact |
|-------|--------|
| No splash/welcome screen | Users land on sign-in with no context on what Falcly does |
| Sign-up and sign-in are the same screen | Confusing for new users — they don't know which to pick |
| Onboarding is a route (`/onboarding`), not auto-triggered | New users after sign-up aren't guaranteed to see it |
| Bank name is hardcoded as "My Card" | Poor first impression; no real bank context |
| Statement day is a free-text number field | Error-prone; a picker is faster and less frustrating |
| No onboarding paywall | ~50% of trial starts happen during onboarding — we're missing all of them |
| No push notification permission ask | Best time to ask is after value moment; we never ask |
| No onboarding funnel tracking | No PostHog events per step — can't optimize what we can't measure |

---

## 3. Proposed Onboarding Flows

### Flow A — First Install (New User)

```
┌─────────────────────────────────────────────────────┐
│  Screen 1: Welcome                                   │
│                                                      │
│  🦅                                                  │
│  "Know before you swipe."                            │
│  "Falcly tells you if it's safe to use your          │
│   credit card — before you swipe."                   │
│                                                      │
│  ✓ SAFE / CAUTION / RISKY per card                   │
│  ✓ Which cycle each purchase lands on                │
│  ✓ Exactly what to pay and when                      │
│                                                      │
│  [Get Started]                                       │
│  Already have an account? Sign in                    │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│  Screen 2: Create Account                            │
│                                                      │
│  Email + Password                                    │
│  ─── or ───                                          │
│  [Continue with Google]                              │
│                                                      │
│  "Already have an account? Sign in"                  │
│                                                      │
│  Fine print: "By continuing, you agree to our        │
│  Terms of Service and Privacy Policy."               │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│  Screen 3: Add Your First Card                       │
│                                                      │
│  "Let's set up your first card."                     │
│  "We just need 3 things."                            │
│                                                      │
│  Bank  [BDO ▾]  (picker: BDO/BPI/Metrobank/         │
│                  RCBC/UnionBank/Security Bank/Other) │
│                                                      │
│  Statement Day  [5 ▾]  (day picker 1–31)            │
│                                                      │
│  Credit Limit  ₱ [________]                         │
│                                                      │
│  Current Balance  ₱ [________]                      │
│  "Approximate is fine — you can update anytime"      │
│                                                      │
│  [See My Status →]                                   │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│  Screen 4: First Status (value moment)               │
│                                                      │
│  ✓  SAFE                                             │
│  "14 days to statement · 28% utilization"            │
│                                                      │
│  "This is your billing cycle status."                │
│  "Falcly will show this every time before            │
│   you swipe."                                        │
│                                                      │
│  [Continue]                                          │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│  Screen 5: Enrichment (optional, skippable)          │
│                                                      │
│  "Want a more accurate picture?"                     │
│                                                      │
│  Cash on hand  ₱ [________]                         │
│  Payday  [15th of the month ▾]                      │
│                                                      │
│  [Save]  /  [Skip for now]                           │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│  Screen 6: Trial Paywall (soft, dismissible)         │
│                                                      │
│  "You're on the free plan."                          │
│  2 cards · Full status engine · Basic reminders      │
│                                                      │
│  ─────── Start a 30-Day Free Trial ───────           │
│  Unlimited cards · Payment planning                  │
│  Installment tracking · Priority alerts              │
│                                                      │
│  [Start Free Trial]  (primary CTA)                   │
│  [Continue with Free]  (ghost/secondary)             │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│  Screen 7: Push Notifications (if not yet granted)   │
│                                                      │
│  🔔                                                  │
│  "Never miss a payment"                              │
│  "Get notified before your statement closes          │
│   and before your bill is due."                      │
│                                                      │
│  [Turn on Notifications]                             │
│  [Not now]                                           │
│                                                      │
│  → triggers native OS permission dialog              │
└─────────────────────────────────────────────────────┘
          ↓
          Home screen
```

### Flow B — Returning User (Sign In)

```
Welcome Screen → "Already have an account? Sign in"
  → Sign In screen (email/Google)
  → Home screen directly (no onboarding)
```

### Flow C — Add Card 2+ (Post-Onboarding)

```
Home → [+] Add Card → Card form modal (same fields as Screen 3)
  → If Free user adding card 3: hard paywall (existing behavior)
  → If Pro/Trial: card added, back to home
```

---

## 4. Screen-by-Screen Spec

### Screen 1: Welcome

**Purpose:** Communicate value before asking for anything. User should understand what Falcly does in 5 seconds.

- Falcly wordmark + falcon logo
- Headline: "Know before you swipe."
- Subheadline: "Falcly tells you if it's safe to use your credit card — before you swipe."
- 3 benefit chips (icon + label):
  - `✓ SAFE/CAUTION/RISKY per card`
  - `📅 Which cycle each purchase lands on`
  - `💳 Exactly what to pay and when`
- Primary CTA: `[Get Started]`
- Secondary: `Already have an account? Sign in` (text link)
- No skip option — this screen sets the stage

**PostHog event:** `onboarding_welcome_viewed`, `onboarding_get_started_tapped`, `onboarding_sign_in_tapped`

---

### Screen 2: Create Account

**Purpose:** Collect identity for cloud sync and RevenueCat. Keep friction minimal.

- Title: "Create your account"
- Email + Password fields
- Divider: "or"
- `[Continue with Google]` button
- Toggle: "Already have an account? Sign in" → navigates to sign-in screen (not replace, push — so back button works)
- Fine print: ToS + Privacy Policy links (required for App Store / Play Store compliance)
- Validation: email format, password ≥ 6 chars
- Error states: Firebase auth errors surfaced inline (not just Alert)

**PostHog event:** `onboarding_signup_started`, `onboarding_signup_completed` (with method: email/google)

---

### Screen 3: Add First Card

**Purpose:** Minimum viable data to get a useful answer. 3 required fields, no more.

**Fields:**
- **Bank** — horizontal scroll picker or modal picker:
  - BDO · BPI · Metrobank · RCBC · UnionBank · Security Bank · Chinabank · EastWest · Other
  - Each shown with bank logo (or colored initial badge as fallback)
- **Statement Day** — wheel/drum picker, 1–31, labeled "The day your billing cycle closes each month"
- **Credit Limit** — numeric input, ₱ prefix, formatted with commas
- **Current Balance** — numeric input, ₱ prefix, helper text: "Approximate is fine — you can update anytime"

**Optional (collapsed by default, expandable):**
- Nick name / card label (e.g., "BDO Everyday")
- Last 4 digits (for identification only — never stored as sensitive)

**Validation:** Statement day 1–31, credit limit > 0, balance ≥ 0 and ≤ credit limit.

**PostHog event:** `onboarding_card_entry_started`, `onboarding_card_entry_completed` (with bank_name, has_balance: bool)

---

### Screen 4: First Status

**Purpose:** The value moment. User sees SAFE/CAUTION/RISKY for the first time. This is the "aha."

- Full-screen hero status badge (SAFE/CAUTION/RISKY) — large, centered
- One-line reason beneath badge
- Contextual one-liner: "This is your billing cycle status. Falcly calculates this from your statement date and current balance."
- Dismissible tooltip explaining the three tiers (shown first time only)
- Primary CTA: `[Continue]`

**No paywall here.** Let the value moment breathe.

**PostHog event:** `onboarding_first_status_viewed` (with status: SAFE/CAUTION/RISKY)

---

### Screen 5: Enrichment (Optional)

**Purpose:** Progressively capture cash context without blocking the value moment.

- Title: "Want a more accurate picture?"
- Subtext: "Falcly uses your cash on hand and income to calculate if you can actually pay your next bill."
- Cash on hand field (₱, numeric)
- Payday field (day of month picker)
- CTA: `[Save and Continue]` / `[Skip for now]` (both same weight — don't guilt-trip the skip)

**PostHog event:** `onboarding_enrichment_viewed`, `onboarding_enrichment_completed` (with has_cash: bool, has_payday: bool), `onboarding_enrichment_skipped`

---

### Screen 6: Onboarding Paywall

**Purpose:** Capture trial starts at peak intent — right after the user has seen value.

- Title: "You're on the free plan"
- Free tier summary (2 cards, core status engine, basic reminders)
- Divider: "Unlock everything with a 30-day free trial"
- Pro features list (4 items max):
  - Unlimited cards
  - Payment planning (avalanche/snowball)
  - Installment & subscription tracking
  - Priority billing cycle alerts
- Primary CTA: `[Start Free Trial]` — bold, full-width
- Secondary CTA: `[Continue with Free]` — ghost button, same size as primary (important: not tiny)
- Fine print: "Payment method required. No charge for 30 days. Cancel anytime."
- **Does NOT show Pro+ here** — keep it simple. Pro+ upsell happens later in-app.

**PostHog event:** `onboarding_paywall_viewed`, `onboarding_trial_started`, `onboarding_paywall_dismissed`

---

### Screen 7: Push Notifications

**Purpose:** Capture notification permission while motivation is high (user just saw value).

- Show ONLY if permission not already granted
- Icon: 🔔
- Title: "Never miss a payment"
- Body: "Get notified before your statement closes and when your bill is due."
- Primary CTA: `[Turn on Notifications]` → triggers native OS permission dialog
- Secondary: `[Not now]` — always available, no guilt
- If user taps "Not now": note in user store, surface again after 7 days in settings

**PostHog event:** `onboarding_notifications_screen_viewed`, `onboarding_notifications_granted`, `onboarding_notifications_declined`

---

## 5. Onboarding State Machine

Track onboarding progress in a lightweight store so partial completions can resume:

```typescript
type OnboardingStep =
  | 'welcome'
  | 'signup'
  | 'card_entry'
  | 'first_status'
  | 'enrichment'
  | 'paywall'
  | 'notifications'
  | 'complete';

interface OnboardingStore {
  step: OnboardingStep;
  isComplete: boolean;
  setStep: (step: OnboardingStep) => void;
  complete: () => void;
}
```

- Persisted via AsyncStorage — if user closes app mid-onboarding, they resume at last step
- After `complete`, never shown again
- Auth guard in `_layout.tsx` checks: if authenticated AND `!isComplete` → route to `/onboarding`

---

## 6. Sign-In Screen (Returning Users)

Separate from sign-up. Accessed from welcome screen "Already have an account?" link.

- Title: "Welcome back"
- Email + Password
- `[Forgot password?]` link
- Divider: "or"
- `[Continue with Google]`
- Footer: "Don't have an account? Sign up" → back to welcome/sign-up

**Error states (inline, not Alert):**
- `auth/user-not-found` → "No account found with this email."
- `auth/wrong-password` → "Incorrect password. Try again or reset it."
- `auth/too-many-requests` → "Too many attempts. Please wait a moment."
- `auth/invalid-email` → "Check your email format."

---

## 7. Card Entry: Bank Picker

Banks to include in picker (PH-first):

| Display Name | Slug | Color |
|---|---|---|
| BDO | bdo | `#003087` |
| BPI | bpi | `#D42027` |
| Metrobank | metrobank | `#003366` |
| RCBC | rcbc | `#008744` |
| UnionBank | unionbank | `#F7941D` |
| Security Bank | security_bank | `#E31837` |
| Chinabank | chinabank | `#CC0000` |
| EastWest | eastwest | `#002855` |
| Other | other | (neutral gray) |

Each bank entry shows:
- Colored circle badge with bank initial (or logo if assets available)
- Bank name
- Selected state: checkmark + highlighted

---

## 8. Tier Gating in Onboarding

| Screen | Free | Trial | Pro | Pro+ |
|--------|------|-------|-----|------|
| Welcome | ✅ | ✅ | ✅ | ✅ |
| Sign Up / Sign In | ✅ | ✅ | ✅ | ✅ |
| Card Entry (first card) | ✅ | ✅ | ✅ | ✅ |
| First Status | ✅ | ✅ | ✅ | ✅ |
| Enrichment | ✅ | ✅ | ✅ | ✅ |
| Onboarding Paywall | ✅ (shown) | skip | skip | skip |
| Push Notifications | ✅ | ✅ | ✅ | ✅ |

Trial/Pro/Pro+ users skip the onboarding paywall screen entirely.

---

## 9. Analytics Funnel

PostHog funnel to track onboarding conversion:

```
Install
  → onboarding_welcome_viewed
    → onboarding_get_started_tapped
      → onboarding_signup_completed
        → onboarding_card_entry_completed
          → onboarding_first_status_viewed
            → onboarding_paywall_viewed
              → onboarding_trial_started       ← conversion event
              → onboarding_paywall_dismissed   ← free tier entry
```

Drop-off at each step tells us where to optimize. Most expected drop-off: signup step and paywall step.

---

## 10. Open Questions

1. **Guest mode?** Should users be able to add a card and see status without signing up, with a "save your data" prompt later? Guest-first onboarding can reduce signup friction and may increase retention. Risk: users never convert to accounts.

2. **Bank logo assets** — Do we have logo SVGs for each bank, or use colored initial badges? Initial badges are safer legally and ship faster.

3. **Statement day picker UX** — Wheel/drum picker vs. a 31-day grid (like a calendar row)? Wheel is native on iOS but can be hard to use. Grid is more explicit and less error-prone.

4. **Onboarding paywall — require payment method or not?** RevenueCat trial mechanics require a payment method upfront (standard App Store behavior). This adds friction at Screen 6. Consider: test a variant where the paywall is shown but payment method is deferred (soft trial, honor system) vs hard trial (card required).

5. **Notification permission timing** — Screen 7 (end of onboarding) vs. Screen 4 (right after first status). Right after the value moment (Screen 4) may convert better than after the paywall (Screen 7) — worth A/B testing.
