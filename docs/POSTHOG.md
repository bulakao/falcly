# PostHog Strategy — Falcly

> Last updated: 2026-04-05
> Project: https://us.posthog.com/project/230963
> Dashboard: https://us.posthog.com/project/230963/dashboard/1430992

---

## ✅ Already Integrated

| Event | Description |
|-------|-------------|
| `onboarding_welcome_viewed` | Welcome screen displayed |
| `onboarding_get_started_tapped` | Taps "Get Started" |
| `onboarding_card_entry_completed` | Submits first card |
| `onboarding_first_status_viewed` | Sees SAFE/CAUTION/RISKY |
| `onboarding_signup_completed` | Signs up during onboarding |
| `user_signed_in` | Email or Google sign-in |
| `user_signed_up` | New account created |
| `user_signed_out` | Signs out |
| `card_added` | Card added (manual or onboarding) |
| `swipe_check_performed` | Checks if safe to swipe |
| `pro_paywall_viewed` | Paywall presented |
| `pro_paywall_dismissed` | Cancelled paywall |
| `pro_paywall_purchased` | Purchased via paywall |
| `pro_conversion_started` | Pro upgrade initiated |
| `pro_converted` | Pro plan activated |
| `screen_viewed` | Expo Router screen tracking |

**Funnels built:**
- Onboarding: welcome → get started → card entry → first status → signup
- Pro conversion: paywall viewed → purchased
- Cards added & sign-ups over time
- Swipe checks by status breakdown

---

## 🔜 Pre-Launch

### 1. Feature Flags — Remote Kill Switches
- **What:** Set up flags in PostHog, check them in-app at runtime
- **Why:** Remotely toggle features, roll out to % of users, kill broken features without a store update
- **Flags to create:**
  - `payoff_planner_enabled` — gate payoff planner screen
  - `overlay_settings_enabled` — gate overlay config in settings
  - `paywall_variant` — `revenuecat` | `manual` (A/B test later)
  - `session_replay_enabled` — control replay recording
- **Effort:** ~30 min — just plumbing, features stay on by default
- **No new features needed** — flags wrap existing code paths

### 2. Session Replays (Mobile)
- **What:** Record user sessions natively on Android
- **Why:** Watch real users go through onboarding, see confusion points
- **How:** PostHog has native mobile session replay — configure in dashboard + enable in SDK
- **Effort:** ~15 min

### 3. Retention Insight
- **What:** "Of users who signed up Day 0, how many returned Day 1, 3, 7, 30?"
- **Why:** THE most important metric for a daily-use app
- **How:** One insight in PostHog dashboard (retention type, cohort by signup date)
- **Effort:** 5 min — dashboard config only

---

## 📊 Post-Launch (First 2 Weeks)

### 4. User Properties for Segmentation
Track as user properties (set on identify + update on change):
- `card_count` — number of active cards
- `tier` — free / pro
- `days_since_signup`
- `has_carried_balance` — boolean
- `statement_advisor_views` — count
- `most_common_status` — SAFE / CAUTION / RISKY

**Enables:** "Pro conversion rate for users with 3+ cards" type queries

### 5. Cohort Analysis
- 1 card vs 2+ cards — who converts to Pro?
- Saw RISKY status vs always SAFE — who retains better?
- Users who opened payoff planner — did they convert?

### 6. Paywall A/B Test
- Feature flag `paywall_variant` → `revenuecat` | `manual`
- Measure: conversion rate, time to purchase, plan mix (monthly vs yearly vs lifetime)
- Need ~500 paywall views for statistical significance

---

## 🔮 When You Have Users

### 7. Sean Ellis Survey
- In-app: "How disappointed would you be if Falcly disappeared?"
- Very / Somewhat / Not really / N/A
- Target: >40% "Very disappointed" = product-market fit signal
- PostHog Surveys feature — no code needed

### 8. Push Notification Analytics
- Track: notification_sent, notification_opened, notification_dismissed
- Tie to retention: do users who enable notifications retain better?

### 9. Revenue Attribution (Full Funnel)
- Tie PostHog events → RevenueCat purchases
- Full picture: install → onboard → first swipe → Day 7 → Pro conversion
- Use RevenueCat webhook → PostHog API for server-side events

---

## Reference

- PostHog React Native docs: https://posthog.com/docs/libraries/react-native
- Feature flags: https://posthog.com/docs/feature-flags
- Session replay (mobile): https://posthog.com/docs/session-replay/mobile
- Surveys: https://posthog.com/docs/surveys
