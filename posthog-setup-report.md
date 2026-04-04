<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Falcly. The PostHog client is now configured via `expo-constants` (reading from `app.config.js` extras, populated by `.env`), with a `PostHogProvider` wrapping the app in `app/_layout.tsx` for autocapture and screen tracking. User identification (`posthog.identify`) is called on every sign-in and sign-up, and `posthog.reset()` is called on sign-out.

| Event | Description | File |
|---|---|---|
| `onboarding_welcome_viewed` | Welcome screen is displayed | `app/welcome.tsx` |
| `onboarding_get_started_tapped` | User taps "Get Started" | `app/welcome.tsx` |
| `onboarding_card_entry_completed` | User submits their first card in onboarding | `app/onboarding.tsx` |
| `onboarding_first_status_viewed` | User sees their first SAFE/CAUTION/RISKY result | `app/onboarding-result.tsx` |
| `onboarding_signup_completed` | User signs up during or after onboarding | `app/sign-in.tsx` |
| `user_signed_in` | User successfully signs in (email or Google) | `app/sign-in.tsx` |
| `user_signed_up` | User creates a new account with email | `app/sign-in.tsx` |
| `user_signed_out` | User signs out from settings | `app/settings.tsx` |
| `card_added` | Card added (manual or onboarding) | `app/add-card.tsx`, `app/sign-in.tsx` |
| `swipe_check_performed` | User checks if it's safe to swipe | `utils/analytics.ts` |
| `pro_paywall_viewed` | RevenueCat paywall is presented | `app/pro-paywall.tsx` |
| `pro_paywall_dismissed` | User cancels the paywall | `app/pro-paywall.tsx` |
| `pro_paywall_purchased` | User purchases via RevenueCat paywall | `app/pro-paywall.tsx` |
| `pro_purchase_completed` | User purchases via manual paywall | `app/paywall-manual.tsx` |
| `pro_conversion_started` | Pro upgrade flow initiated | `utils/analytics.ts` |
| `pro_converted` | Pro plan activated | `utils/analytics.ts` |
| `screen_viewed` | Manual screen tracking (Expo Router pathname) | `app/_layout.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/230963/dashboard/1430992
- **Onboarding funnel** (welcome → get started → card entry → first status → signup): https://us.posthog.com/project/230963/insights/VBbLj2zr
- **Pro paywall conversion** (viewed → purchased): https://us.posthog.com/project/230963/insights/IHCO6AhP
- **Cards added & sign-ups over time**: https://us.posthog.com/project/230963/insights/gtnqRvY3
- **Swipe checks by status** (SAFE/CAUTION/RISKY breakdown): https://us.posthog.com/project/230963/insights/tPkw5gFW

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-expo/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
