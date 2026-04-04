# PostHog Strategy — Falcly

> Last updated: 2026-04-05
> Project: https://us.posthog.com/project/230963
> Dashboard: https://us.posthog.com/project/230963/dashboard/1430992

---

## Free Tier Limits (Monthly)

Know your budget — PostHog is generous but usage-based after free:

| Product | Free Allowance | After Free Tier |
|---------|---------------|-----------------|
| Product Analytics | 1M events | $0.00005/event |
| Session Replay (web) | 5K recordings | $0.005/recording |
| **Session Replay (mobile)** | **2.5K recordings** | **$0.01/recording** |
| Feature Flags | 1M requests | $0.0001/request |
| Experiments | Billed with feature flags | — |
| Surveys | 1,500 responses | $0.10/response |
| Error Tracking | 100K exceptions | $0.00037/exception |
| Data Warehouse | 1M rows | $0.000015/row |

**Falcly estimate at 1K users:** ~50K events/mo + ~500 mobile replays → comfortably free.
**At 10K users:** ~500K events/mo + ~2K replays → still free.
**At 50K users:** ~2.5M events/mo → ~$75/mo. Set billing limits per product.

> **Tip:** Set billing limits in PostHog dashboard → Settings → Billing. Never get surprised.

---

## ✅ Already Integrated (Phase 0)

### Events Tracked

| Event | Description | File |
|-------|-------------|------|
| `onboarding_welcome_viewed` | Welcome screen displayed | `app/welcome.tsx` |
| `onboarding_get_started_tapped` | Taps "Get Started" | `app/welcome.tsx` |
| `onboarding_card_entry_completed` | Submits first card | `app/onboarding.tsx` |
| `onboarding_first_status_viewed` | Sees SAFE/CAUTION/RISKY | `app/onboarding-result.tsx` |
| `onboarding_signup_completed` | Signs up during onboarding | `app/sign-in.tsx` |
| `user_signed_in` | Email or Google sign-in | `app/sign-in.tsx` |
| `user_signed_up` | New account created | `app/sign-in.tsx` |
| `user_signed_out` | Signs out | `app/settings.tsx` |
| `card_added` | Card added (manual or onboarding) | `app/add-card.tsx`, `app/sign-in.tsx` |
| `swipe_check_performed` | Checks if safe to swipe | `utils/analytics.ts` |
| `pro_paywall_viewed` | Paywall presented | `app/pro-paywall.tsx` |
| `pro_paywall_dismissed` | Cancelled paywall | `app/pro-paywall.tsx` |
| `pro_paywall_purchased` | Purchased via paywall | `app/pro-paywall.tsx` |
| `pro_purchase_completed` | Purchased via manual paywall | `app/paywall-manual.tsx` |
| `pro_conversion_started` | Pro upgrade initiated | `utils/analytics.ts` |
| `pro_converted` | Pro plan activated | `utils/analytics.ts` |
| `screen_viewed` | Expo Router screen tracking | `app/_layout.tsx` |

### Funnels Built

| Funnel | Steps | Dashboard Link |
|--------|-------|---------------|
| Onboarding | welcome → get started → card entry → first status → signup | [Link](https://us.posthog.com/project/230963/insights/VBbLj2zr) |
| Pro Conversion | paywall viewed → purchased | [Link](https://us.posthog.com/project/230963/insights/IHCO6AhP) |
| Cards & Sign-ups | Cards added + sign-ups over time | [Link](https://us.posthog.com/project/230963/insights/gtnqRvY3) |
| Swipe by Status | SAFE/CAUTION/RISKY breakdown | [Link](https://us.posthog.com/project/230963/insights/tPkw5gFW) |

---

## 🔜 Phase 1: Pre-Launch

### 1. Feature Flags — Remote Kill Switches

**What:** Check PostHog feature flags at runtime. Configure in dashboard. No code changes to toggle.

**Why:**
- Remotely enable/disable features without app store update
- Roll out to 10% → 50% → 100% progressively
- Kill broken features instantly
- Run A/B tests on features and paywall variants

**Flags to Create:**

| Flag Key | Type | Default | Purpose |
|----------|------|---------|---------|
| `payoff_planner_enabled` | boolean | true | Gate payoff planner screen |
| `overlay_settings_enabled` | boolean | true | Gate overlay config in settings |
| `paywall_variant` | multivariate | `revenuecat` | A/B: `revenuecat` vs `manual` paywall |
| `session_replay_enabled` | boolean | true | Control replay recording |
| `statement_advisor_enabled` | boolean | true | Gate statement advisor |
| `onboarding_variant` | multivariate | `default` | Future: test onboarding flows |

**Implementation:**

```typescript
// utils/featureFlags.ts
import { usePostHog } from 'posthog-react-native';

export function useFeatureFlag(flag: string, fallback: boolean = true): boolean {
  const posthog = usePostHog();
  return posthog?.getFeatureFlag(flag) ?? fallback;
}

// Usage in any screen:
const payoffEnabled = useFeatureFlag('payoff_planner_enabled');
if (!payoffEnabled) return <FeatureDisabledScreen />;
```

**Effort:** ~30 min (plumbing only, all features stay ON by default)

---

### 2. Session Replay — Mobile

**What:** Record user sessions on Android/iOS. Watch real users navigate your app.

**Why:**
- See where users get confused in onboarding
- Watch paywall interactions (did they read? scroll? bounce?)
- Debug UI issues without reproduction steps
- Pair with funnel drop-offs: "Show me replays of users who dropped at step 3"

**Setup:**

```typescript
// In PostHogProvider options (app/_layout.tsx):
{
  enableSessionReplay: true,
  sessionReplayConfig: {
    maskAllTextInputs: true,      // Mask credit card numbers, balances
    maskAllImages: true,           // Mask screenshots
    captureLog: true,              // Android Logcat
    captureNetworkTelemetry: true, // iOS network metrics
    throttleDelayMs: 1000,         // Reduce performance impact
    // Start with 50% sampling, increase if needed:
    // sampleRate: 0.5,
  },
}
```

**Privacy:**
- All text inputs masked by default (critical — card numbers, balances)
- All images masked
- Password fields always masked regardless of settings
- Only wireframe mode on mobile (no pixel-perfect screenshots unless explicitly enabled)

**Free tier:** 2,500 mobile recordings/month. At 1K users that's ~2.5 sessions per user.

**Effort:** ~15 min

---

### 3. Retention Insight (Dashboard Only)

**What:** Cohort retention curve — "Of users who signed up Day 0, how many returned?"

**Why:** THE most important metric for a daily-use app like Falcly. If Day 7 retention < 20%, nothing else matters.

**Setup in Dashboard:**
1. New Insight → Retention
2. Cohort: `user_signed_up` event
3. Return event: Any event (or `screen_viewed`)
4. Period: Day, Week, Month
5. Save to dashboard

**Benchmarks (mobile apps):**
| Period | Good | Great | Exceptional |
|--------|------|-------|-------------|
| Day 1 | 25% | 40% | 60%+ |
| Day 7 | 15% | 25% | 40%+ |
| Day 30 | 8% | 15% | 25%+ |

**Effort:** 5 min — dashboard config only

---

## 📊 Phase 2: First 2 Weeks Post-Launch

### 4. User Properties for Segmentation

Set these as person properties (via `posthog.identify()` or `posthog.capture()` with `$set`):

| Property | Type | When to Set | Why |
|----------|------|-------------|-----|
| `card_count` | number | On card add/remove | Segment by engagement level |
| `tier` | string | On subscription change | Free vs Pro behavior |
| `signup_date` | date | On signup | Cohort analysis |
| `has_carried_balance` | boolean | On first balance carry | Risk/engagement signal |
| `most_seen_status` | string | On swipe check | SAFE users vs RISKY users |
| `statement_advisor_views` | number | On advisor open | Feature engagement depth |
| `payoff_planner_views` | number | On planner open | Pro feature interest |
| `overlay_interactions` | number | On overlay dismiss/tap | Engagement with tips |
| `onboarding_completed` | boolean | On onboarding complete | Activation milestone |
| `first_swipe_check_date` | date | On first swipe check | Time-to-value tracking |

**Implementation:**

```typescript
posthog.identify(userId, {
  card_count: cards.length,
  tier: 'free',
  signup_date: new Date().toISOString(),
});

// Update on change:
posthog.capture('card_added', {
  $set: { card_count: newCount },
});
```

**Queries this enables:**
- "Pro conversion rate for users with 3+ cards"
- "Retention of users who carried a balance vs always clear"
- "Feature usage by tier"

---

### 5. RevenueCat ↔ PostHog Integration

**What:** RevenueCat sends subscription events directly to PostHog server-side. No client code needed.

**Why:** Full revenue attribution in PostHog. See the complete journey: install → onboard → swipe check → Pro conversion → renewal/churn.

**Setup:**
1. Go to RevenueCat Dashboard → Integrations → PostHog
2. Enter PostHog Project API key
3. Configure event names (use defaults)
4. Enable for both sandbox and production

**Events RevenueCat sends automatically:**

| Event | Description |
|-------|-------------|
| `rc_initial_purchase_event` | New subscription purchased |
| `rc_trial_started_event` | Free trial started |
| `rc_trial_converted_event` | Trial → paid conversion |
| `rc_trial_cancelled_event` | Trial cancelled (won't convert) |
| `rc_renewal_event` | Subscription renewed |
| `rc_cancellation_event` | Subscription cancelled |
| `rc_billing_issue_event` | Payment failed |
| `rc_expiration_event` | Subscription expired |
| `rc_non_subscription_purchase_event` | One-time purchase (lifetime) |
| `rc_product_change_event` | Plan change (monthly → yearly) |

**Revenue tracking:** All events include `revenue` (in USD) and `currency` fields.

**User matching:** Set `$posthogUserId` attribute in RevenueCat to match PostHog's distinct_id. Already done if you use `Purchases.logIn(userId)` with the same ID as `posthog.identify(userId)`.

**Subscription status attribute:** RevenueCat automatically updates `rc_subscription_status` on the PostHog person profile: `active`, `trial`, `cancelled`, `expired`, `grace_period`, etc.

**Effort:** 10 min — dashboard config only, no code.

---

### 6. Cohort Analysis

Build these cohorts to segment behavior:

| Cohort | Definition | Purpose |
|--------|-----------|---------|
| Power Users | 3+ cards, used app 5+ days/week | Retention benchmark |
| At-Risk Free | 1 card, no swipe check in 7 days | Re-engagement target |
| Pro Candidates | Free, 2+ cards, hit card limit wall | Conversion optimization |
| Balance Carriers | `has_carried_balance = true` | High-value segment (need payoff planner) |
| Onboarding Dropoffs | Started onboarding, never signed up | Funnel optimization |
| Churned Pro | Was Pro, now expired | Win-back campaigns |

---

### 7. Key Dashboards to Build

| Dashboard | Insights | Cadence |
|-----------|----------|---------|
| **Daily Pulse** | DAU, new signups, swipe checks, Pro conversions | Daily |
| **Onboarding Health** | Funnel completion rate, drop-off points, time to complete | Daily (first month) |
| **Revenue** | MRR, trial starts, conversions, churn, plan mix | Weekly |
| **Feature Usage** | Statement advisor views, payoff planner opens, overlay interactions | Weekly |
| **Retention** | Day 1/7/30 retention curves, cohort comparison | Weekly |

---

## 🔮 Phase 3: When You Have Users (500+)

### 8. A/B Experiments

**Experiment ideas (in priority order):**

| Experiment | Variants | Primary Metric | Secondary |
|------------|----------|---------------|-----------|
| Paywall design | RevenueCat vs custom | Conversion rate | Revenue per user |
| Pricing | $4.99 vs $3.99 vs $5.99 | Revenue per user | Conversion rate |
| Onboarding length | 3-field vs 5-field | Completion rate | Day 7 retention |
| Status explanation | Short vs detailed | Swipe check frequency | Day 7 retention |
| Card limit | 2 free vs 3 free | Pro conversion rate | Retention |
| Annual nudge | Show annual first vs monthly first | Annual plan % | Total revenue |

**How experiments work in PostHog:**
1. Create experiment in dashboard
2. It auto-creates a feature flag
3. Check flag in code → show variant
4. PostHog measures statistical significance automatically
5. Need ~500 users per variant for significance (1000 total for 2-variant test)

**Implementation:**

```typescript
const variant = posthog.getFeatureFlag('pricing-experiment');
// variant = 'control' | 'lower' | 'higher'

const price = variant === 'lower' ? '$3.99' : variant === 'higher' ? '$5.99' : '$4.99';
```

---

### 9. In-App Surveys

**Survey templates to deploy:**

| Survey | When to Show | Question |
|--------|-------------|----------|
| **Sean Ellis (PMF)** | Day 14, Pro or Free | "How disappointed would you be if Falcly disappeared?" Very / Somewhat / Not at all |
| **NPS** | Day 30, active users | "How likely are you to recommend Falcly?" 0-10 |
| **Feature Request** | After payoff planner use | "What would make this more useful?" Open text |
| **Churn Exit** | On cancellation | "Why are you cancelling?" Multiple choice |
| **Onboarding** | After first week | "Was setup easy?" 1-5 stars |

**PMF benchmark:** >40% "Very disappointed" = product-market fit signal. Below 40% = iterate.

**Setup:** All configured in PostHog dashboard → Surveys. No code needed for basic surveys. For custom-styled surveys, use the surveys API.

---

### 10. Error Tracking

**What:** PostHog can track JS errors and crashes natively.

**Why:** Know about crashes before users complain. Correlate errors with session replays.

**Events:**
- `$exception` — auto-captured JS errors
- Custom: `error_occurred` with `error_type`, `screen`, `card_count`

**Free tier:** 100K exceptions/month — more than enough.

---

### 11. Push Notification Analytics

When push notifications are implemented:

| Event | Properties | Purpose |
|-------|-----------|---------|
| `notification_sent` | `type`, `card_id` | Delivery tracking |
| `notification_opened` | `type`, `card_id`, `time_to_open` | Engagement |
| `notification_dismissed` | `type` | Non-engagement |

**Key question:** Do users who enable notifications retain better?

---

## 📐 Event Naming Convention

Follow `object_verb` pattern consistently:

```
✅ card_added, swipe_check_performed, pro_paywall_viewed
❌ addCard, SwipeCheck, ProPaywallViewed
```

**Rules:**
- Lowercase snake_case always
- `object_verb` format (noun first)
- Required properties on every event: `screen`, `tier`
- Version events if payload changes: add `event_version: 2`

---

## 🔒 Privacy Checklist

- [x] Text inputs masked in session replay
- [x] Images masked in session replay
- [x] No credit card numbers in event properties
- [x] No passwords in event properties
- [x] No PII in event names
- [ ] Add opt-out toggle in settings (analytics_opt_out already exists)
- [ ] Honor "Do Not Track" preference
- [ ] Privacy policy mentions PostHog analytics
- [ ] GDPR: support data deletion requests (PostHog has API for this)

---

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Falcly App  │────▶│   PostHog    │◀────│  RevenueCat  │
│ (RN SDK)     │     │  (Cloud US)  │     │ (Webhook)    │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                     ┌──────┴──────┐
                     │  Dashboard  │
                     │  Insights   │
                     │  Replays    │
                     │  Flags      │
                     │  Surveys    │
                     └─────────────┘
```

**Data flow:**
1. App → PostHog: User events, screen views, feature flag checks
2. RevenueCat → PostHog: Subscription events, revenue, status changes
3. PostHog: Merges both streams, ties to user identity

---

## 📚 Reference Links

| Resource | URL |
|----------|-----|
| PostHog React Native SDK | https://posthog.com/docs/libraries/react-native |
| Feature Flags (RN) | https://posthog.com/docs/feature-flags/installation/react-native |
| Session Replay (RN) | https://posthog.com/docs/session-replay/installation/react-native |
| Experiments (RN) | https://posthog.com/docs/experiments/installation/react-native |
| Surveys | https://posthog.com/docs/surveys |
| RevenueCat ↔ PostHog | https://www.revenuecat.com/docs/integrations/third-party-integrations/posthog |
| Pricing | https://posthog.com/pricing |
| SaaS Analytics Guide | https://bixtech.ai/posthog-for-saas-a-practical-guide-to-product-analytics-and-event-tracking/ |
| Agent Skill | `.claude/skills/integration-expo/SKILL.md` |

---

## 💡 Quick Wins Checklist

Pre-launch (30 min total):
- [ ] Wire up feature flags (plumbing)
- [ ] Enable mobile session replay
- [ ] Create retention insight in dashboard
- [ ] Set billing limits per product

First 2 weeks:
- [ ] Connect RevenueCat → PostHog integration (10 min, dashboard only)
- [ ] Add user properties to `posthog.identify()`
- [ ] Build cohorts (Onboarding dropoffs, Pro candidates, At-risk free)
- [ ] Create Daily Pulse dashboard

When you have 500+ users:
- [ ] Run first A/B experiment (paywall variant)
- [ ] Deploy Sean Ellis survey (PMF signal)
- [ ] Analyze retention by cohort (carried balance vs always clear)
